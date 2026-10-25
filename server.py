#!/usr/bin/env python3
"""AB MakerIDE local bridge. All hardware actions are explicit, never simulated."""
from __future__ import annotations

import argparse
import ast
from collections import deque
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import mimetypes
import os
from pathlib import Path
import re
import secrets
import hmac
import shutil
import subprocess
import sys
import tempfile
import threading
from urllib.parse import parse_qs, urlsplit
import webbrowser
from jobs import JobManager, clean_terminal
from cloud_agent import AgentService
from hardware_lab import public_profiles, check as check_hardware, inspect_sketch
from dependency_advisor import summarize, redact_secrets
from agent_runtime import AgentJobManager
from toolchain import arduino_cli

ROOT = Path(__file__).resolve().parent
MAX_BODY = 512 * 1024
MAX_CODE = 300_000
FQBN_RE = re.compile(r"^[a-zA-Z0-9_.-]+:[a-zA-Z0-9_.-]+:[a-zA-Z0-9_.-]+$")
LIB_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 _./+()'-]{0,120}$")
PORT_RE = re.compile(r"^(?:COM[1-9][0-9]{0,3}|/dev/(?:tty[A-Za-z0-9_.-]+|cu\.[A-Za-z0-9_.-]+)|/dev/serial/by-id/[A-Za-z0-9_.-]+)$", re.IGNORECASE)
CATALOG_TTL = 180
CATALOG_LOCK = threading.Lock()
CATALOG_CACHE = {"until": 0., "result": None}
CORE_ID_RE = re.compile(r"^[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+$")


def _cli_json(arguments: list[str], timeout: int = 40) -> dict:
    """Consultas sin shell. Evita truncar el JSON: listall puede superar 100 KB."""
    executable = arduino_cli()
    if not executable:
        return {"ok": False, "error": "Arduino CLI no está disponible", "data": None}
    try:
        p = subprocess.run([executable, *arguments], capture_output=True,
                           text=True, encoding='utf-8', errors='replace', timeout=timeout,
                           creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        if p.returncode:
            return {"ok": False, "error": clean_terminal(p.stderr or p.stdout)[-1000:], "data": None}
        if len(p.stdout.encode("utf-8")) > 48_000_000:
            return {"ok": False, "error": "Arduino CLI devolvió más de 48 MB. Refina la búsqueda por modelo.", "data": None}
        return {"ok": True, "error": "", "data": json.loads(p.stdout)}
    except (OSError, subprocess.TimeoutExpired, ValueError, TypeError) as e:
        return {"ok": False, "error": str(e)[:500], "data": None}


def _normalize_boards(payload) -> list[dict]:
    """Admite formatos Arduino CLI antiguos y actuales; sin inventar FQBN."""
    entries = payload if isinstance(payload, list) else (payload.get('boards', []) if isinstance(payload, dict) else [])
    if not isinstance(entries, list):
        return []
    choices = {}
    for b in entries:
        if not isinstance(b, dict):
            continue
        fqbn = b.get('fqbn', '')
        if not isinstance(fqbn, str) or not FQBN_RE.fullmatch(fqbn):
            continue
        name = b.get('name') or fqbn
        if not isinstance(name, str):
            name = fqbn
        platform = b.get('platform') or {}
        vendor = platform.get('name', '') if isinstance(platform, dict) else ''
        choices[fqbn] = {'fqbn': fqbn, 'name': name[:180], 'platform': str(vendor)[:120]}
    return sorted(choices.values(), key=lambda b: (b['name'].casefold(), b['fqbn']))




def _boards_from_installed_cores(data_dir: Path | None = None) -> list[dict]:
    """Fail-safe: enumerate actual installed boards.txt files, never static guesses.

    This is useful if CLI listall returns invalid/empty JSON or times out.
    Only boards with a named definition and a syntactically valid FQBN are shown.
    """
    roots = []
    if data_dir is not None:
        roots.append(Path(data_dir))
    else:
        override = os.environ.get('ARDUINO_DIRECTORIES_DATA')
        if override:
            roots.append(Path(override))
        else:
            configured = _cli_json(['config', 'get', 'directories.data', '--json'])
            value = configured.get('data')
            if isinstance(value, dict):
                value = value.get('directories.data')
            if isinstance(value, str) and value.strip():
                roots.append(Path(value.strip()))
        local = os.environ.get('LOCALAPPDATA') if not roots else None
        if local:
            roots.append(Path(local) / 'Arduino15')
        if not roots:
            roots.append(Path.home() / 'Library' / 'Arduino15' if sys.platform == 'darwin' else Path.home() / '.arduino15')
    found = {}
    for base in roots:
        parent = base / 'packages'
        if not parent.is_dir():
            continue
        # Bounded enumeration; avoid accidental path traversal or enormous trees.
        for vendor in list(parent.iterdir())[:256]:
            if not vendor.is_dir() or not re.fullmatch(r'[A-Za-z0-9_.-]+', vendor.name):
                continue
            hardware = vendor / 'hardware'
            if not hardware.is_dir():
                continue
            for architecture in list(hardware.iterdir())[:128]:
                if not architecture.is_dir() or not re.fullmatch(r'[A-Za-z0-9_.-]+', architecture.name):
                    continue
                versions = sorted(list(architecture.iterdir())[:64], key=lambda p: tuple((0, int(x)) if x.isdigit() else (1, x) for x in re.findall(r'\d+|\D+', p.name)), reverse=True)
                for version in versions:
                    boardfile = version / 'boards.txt'
                    if not version.is_dir() or not boardfile.is_file():
                        continue
                    try:
                        if boardfile.stat().st_size > 4_000_000:
                            continue
                        lines = boardfile.read_text('utf-8', errors='replace').splitlines()
                        hidden = {m[1] for line in lines if (m := re.match(r'^\s*([A-Za-z0-9_-]+)\.hide\s*=', line))}
                        for line in lines:
                            match = re.match(r'^\s*([A-Za-z0-9_-]+)\.name\s*=\s*(.*?)\s*$', line)
                            if not match or not match[2] or match[2].startswith('#'):
                                continue
                            board_id, name = match.groups()
                            if board_id in hidden:
                                continue
                            fqbn = f'{vendor.name}:{architecture.name}:{board_id}'
                            if not FQBN_RE.fullmatch(fqbn):
                                continue
                            found[fqbn] = {'fqbn': fqbn, 'name': name[:180],
                                           'platform': f'{vendor.name}:{architecture.name} (núcleo local)'}
                        break  # Do not mix retired definitions from older installed versions.
                    except (OSError, UnicodeError):
                        continue
    return sorted(found.values(), key=lambda row: (row['name'].casefold(), row['fqbn']))


def board_catalog(*, refresh=False) -> dict:
    import time
    with CATALOG_LOCK:
        if not refresh and CATALOG_CACHE['result'] is not None and time.monotonic() < CATALOG_CACHE['until']:
            return CATALOG_CACHE['result']
        r = _cli_json(['board', 'listall', '--json'], timeout=45)
        choices = _normalize_boards(r['data']) if r['ok'] else []
        warning = ''
        source = 'arduino-cli board listall'
        if not choices:
            # Fallback grounded in the installed core definitions, not guesses.
            choices = _boards_from_installed_cores()
            if choices:
                source = 'boards.txt de núcleos instalados (recuperación)'
                warning = (r['error'] or 'Arduino CLI no devolvió modelos; recuperados del núcleo instalado.')[:400]
        result = {'ok': bool(choices), 'boards': choices,
                  'error': '' if choices else (r['error'] or 'El catálogo está vacío. Comprueba los núcleos instalados.'),
                  'warning': warning, 'source': source, 'scope': 'installed_cores',
                  'count': len(choices)}
        CATALOG_CACHE.update(until=time.monotonic() + (CATALOG_TTL if choices else 12), result=result)
        return result


def _catalog_page(items: list[dict], page: int = 1, limit: int = 40) -> dict:
    """Window over a local catalog; never return thousands of options to a selector."""
    if not isinstance(page, int) or not isinstance(limit, int) or page < 1 or page > 100000 or limit < 1 or limit > 50:
        raise ValueError('Paginación no válida')
    total = len(items)
    start = (page - 1) * limit
    return {'boards': items[start:start + limit], 'total': total,
            'page': page, 'limit': limit, 'pages': (total + limit - 1)//limit}


def installed_board_search(query: str = '', *, page: int = 1, limit: int = 40) -> dict:
    """Search *installed* board definitions; independent of Boards Manager downloads."""
    if not isinstance(query, str) or len(query) > 80 or any(ord(c) < 32 for c in query):
        raise ValueError('Búsqueda no válida')
    q = query.strip().casefold()
    catalog = board_catalog()
    results = [b for b in catalog['boards']
               if not q or q in (b['name']+' '+b['fqbn']+' '+b.get('platform','')).casefold()]
    page_result = _catalog_page(results, page, limit)
    return {'ok': catalog['ok'], **page_result, 'source': catalog['source'],
            'error': catalog['error'], 'warning': catalog.get('warning','')}


def board_search(query: str, *, page: int = 1, limit: int = 40) -> dict:
    """Explicit Boards Manager search. Query is an argument, never a shell string."""
    if not isinstance(query, str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9 ._+/-]{1,59}', query):
        raise ValueError('Búsqueda no válida; usa nombre, fabricante o modelo.')
    _catalog_page([], page, limit)  # Validate pagination before invoking subprocess.
    r = _cli_json(['board', 'search', query, '--json'], timeout=45)
    if not r['ok']:
        return {'ok': False, **_catalog_page([], page, limit), 'error': r['error']}
    entries = r['data'] if isinstance(r['data'], list) else (r['data'].get('boards', []) if isinstance(r['data'], dict) else [])
    if not isinstance(entries, list):
        return {'ok': False, **_catalog_page([], page, limit), 'error': 'Arduino CLI devolvió un catálogo inválido.'}
    installed = {b['fqbn'] for b in board_catalog()['boards']}
    result = {}
    for b in entries:
        if not isinstance(b, dict) or not FQBN_RE.fullmatch(str(b.get('fqbn',''))):
            continue
        platform = b.get('platform') or {}
        if not isinstance(platform, dict): platform = {}
        core = platform.get('id', '')
        result[b['fqbn']] = {'fqbn': b['fqbn'], 'name': str(b.get('name') or b['fqbn'])[:180],
                           'core': core if isinstance(core, str) and CORE_ID_RE.fullmatch(core) else '',
                           'installed': b['fqbn'] in installed,
                           'platform': str(platform.get('name') or '')[:120]}
    rows = sorted(result.values(), key=lambda row: (not row['installed'], row['name'].casefold(),row['fqbn']))
    return {'ok': True, **_catalog_page(rows, page, limit), 'source': 'arduino-cli board search'}



def command_result(args: list[str], *, timeout: int = 150, cwd: str | None = None) -> dict:
    """Safe subprocess invocation: never uses shell=True."""
    if args and args[0] == 'arduino-cli':
        args = [arduino_cli() or 'arduino-cli', *args[1:]]
    try:
        process = subprocess.run(args, capture_output=True, text=True, encoding="utf-8",
                                 errors="replace", timeout=timeout, cwd=cwd,
                                 creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        output = (process.stdout or "") + ("\n" + process.stderr if process.stderr else "")
        return {"ok": process.returncode == 0, "exit_code": process.returncode,
                "output": clean_terminal(output.strip())[-100_000:], "command": args[:1] + ["…"]}
    except FileNotFoundError:
        return {"ok": False, "exit_code": None,
                "output": f"Herramienta no instalada o fuera del PATH: {args[0]}", "command": args[:1]}
    except subprocess.TimeoutExpired as e:
        return {"ok": False, "exit_code": None,
                "output": f"Tiempo de espera agotado ({timeout} s). Revisa la conexión.\n{str(e.stdout or '')[-3000:]}", "command": args[:1]}
    except OSError as e:
        return {"ok": False, "exit_code": None,
                "output": f"Error ejecutando herramienta: {e}", "command": args[:1]}


def installed_tools() -> dict:
    try:
        import serial  # noqa: F401
        pyserial = True
    except ImportError:
        pyserial = False
    return {"arduino_cli": bool(arduino_cli()),
            "mpremote": bool(shutil.which("mpremote")), "pyserial": pyserial,
            "python": sys.version.split()[0]}


def scan_ports(*, diagnostics=False):
    found: dict[str, dict] = {}
    errors = []
    try:
        from serial.tools import list_ports
        for p in list_ports.comports():
            found[p.device] = {"port": p.device, "name": p.description,
                               "vid": f"{p.vid:04X}" if p.vid is not None else None,
                               "pid": f"{p.pid:04X}" if p.pid is not None else None,
                               "boards": [], "serial_number": getattr(p, "serial_number", None)}
    except (ImportError, OSError) as exc:
        if not isinstance(exc, ImportError): errors.append('Enumeración serie: ' + str(exc)[:300])
        pass
    # Puertos reales enumerados por Windows cuando pyserial/CLI no los muestran.
    # Registrar COM no implica reconocer la placa conectada.
    if sys.platform == "win32":
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DEVICEMAP\SERIALCOMM") as registry:
                index = 0
                while True:
                    try:
                        _, port, _ = winreg.EnumValue(registry, index)
                    except OSError:
                        break
                    index += 1
                    if isinstance(port, str) and PORT_RE.fullmatch(port):
                        found.setdefault(port, {"port": port, "name": "Puerto COM de Windows (modelo desconocido)",
                                                "vid": None, "pid": None, "boards": [], "serial_number": None})
        except (ImportError, OSError):
            pass
    if arduino_cli():
        result = command_result(["arduino-cli", "board", "list", "--json", "--discovery-timeout", "3s"], timeout=20)
        if result["ok"]:
            try:
                data = json.loads(result["output"])
                entries = data if isinstance(data, list) else data.get("detected_ports", [])
                for entry in entries:
                    obj = entry.get("port", {})
                    port = obj.get("address") or obj.get("port")
                    if not isinstance(port, str) or not PORT_RE.fullmatch(port):
                        continue
                    boards = entry.get("matching_boards", entry.get("boards", [])) or []
                    item = found.setdefault(port, {"port": port, "name": obj.get("label", port),
                                                   "vid": None, "pid": None, "boards": [], "serial_number": None})
                    props = obj.get("properties", {}) or {}
                    item["serial_number"] = item.get("serial_number") or props.get("serialNumber")
                    item["vid"] = item.get("vid") or props.get("vid")
                    item["pid"] = item.get("pid") or props.get("pid")
                    item["boards"] = [{"name": b.get("name", "Desconocida"),
                                        "fqbn": b.get("fqbn", "")} for b in boards if b.get("fqbn")]
                    if not item["name"] or item["name"] == item["port"]:
                        item["name"] = obj.get("label", port)
            except (ValueError, AttributeError, TypeError) as exc:
                errors.append('Respuesta de detección inválida: ' + str(exc)[:300])
        else:
            errors.append('Arduino CLI: ' + result.get('output', 'Detección fallida')[-600:])
    else:
        errors.append('Arduino CLI no está disponible; detección parcial del sistema.')
    ports = sorted(found.values(), key=lambda v: v["port"])
    return {'ports': ports, 'scan_ok': not errors, 'scan_errors': errors} if diagnostics else ports


def check_port(port: str) -> None:
    if not isinstance(port, str) or not PORT_RE.fullmatch(port):
        raise ValueError("Puerto serie no permitido.")
    if port not in {p["port"] for p in scan_ports()}:
        raise ValueError("El puerto no aparece en los dispositivos detectados. Pulsa 'Buscar placas'.")


def check_fqbn(fqbn: str) -> None:
    if not isinstance(fqbn, str) or not FQBN_RE.fullmatch(fqbn):
        raise ValueError("FQBN inválido. Ejemplo: esp32:esp32:esp32")


def check_code(code: str) -> None:
    if not isinstance(code, str) or not code.strip() or len(code) > MAX_CODE:
        raise ValueError("El código está vacío o supera el límite de tamaño.")


def check_python_syntax(code: str) -> dict:
    check_code(code)
    try:
        ast.parse(code)
        return {"ok": True, "output": "Sintaxis Python válida. No comprueba firmware ni APIs MicroPython.",
                "mode": "syntax_only"}
    except SyntaxError as e:
        return {"ok": False, "output": f"Error de sintaxis, línea {e.lineno}: {e.msg}",
                "line": e.lineno, "mode": "syntax_only"}


def compile_cpp(code: str, fqbn: str, *, port: str | None = None) -> dict:
    """When port is provided, compiles and uploads in one isolated workspace."""
    check_code(code)
    check_fqbn(fqbn)
    if port:
        check_port(port)
    if not arduino_cli():
        return {"ok": False, "output": "Arduino CLI no instalado. Consulta README.md.",
                "stage": "dependencies"}
    with tempfile.TemporaryDirectory(prefix="ab-makeride-") as workspace:
        root = Path(workspace)
        sketch = root / "sketch"
        sketch.mkdir()
        (sketch / "sketch.ino").write_text(code, encoding="utf-8")
        build = root / "build"
        build.mkdir()
        first = command_result(["arduino-cli", "compile", "--fqbn", fqbn,
                                "--output-dir", str(build), str(sketch)], timeout=240)
        if not first["ok"] or not port:
            return {**first, "stage": "compile", "real": True}
        second = command_result(["arduino-cli", "upload", "-p", port,
                                 "--fqbn", fqbn, "--input-dir", str(build),
                                 str(sketch)], timeout=160)
        return {**second, "stage": "upload", "real": True,
                "output": ("COMPILACIÓN REAL:\n" + first["output"] + "\n\nCARGA REAL:\n" + second["output"])[-100_000:]}


def micropython_action(code: str, port: str, *, deploy: bool) -> dict:
    check_code(code)
    check_port(port)
    checked = check_python_syntax(code)
    if not checked["ok"]:
        return checked
    if not shutil.which("mpremote"):
        return {"ok": False, "stage": "dependencies", "output": "mpremote no instalado. Ejecuta: python -m pip install mpremote"}
    with tempfile.TemporaryDirectory(prefix="ab-makeride-py-") as workspace:
        file = Path(workspace) / "main.py"
        file.write_text(code, encoding="utf-8")
        # run --no-follow executes from RAM without overwriting the board's main.py.
        # fs cp writes to the device; the UI must explicitly confirm this action.
        args = (["mpremote", "connect", port, "fs", "cp", str(file), ":main.py"] if deploy else
                ["mpremote", "connect", port, "run", "--no-follow", str(file)])
        return {**command_result(args, timeout=90), "stage": "deploy" if deploy else "run", "real": True}


@dataclass
class SerialMessage:
    id: int
    text: str


class SerialBridge:
    def __init__(self):
        self._serial = None
        self._thread = None
        self._lock = threading.RLock()
        self._messages: deque[SerialMessage] = deque(maxlen=1200)
        self._counter = 0
        self.port = None
        self.baud = None

    def _emit(self, text: str):
        with self._lock:
            self._counter += 1
            self._messages.append(SerialMessage(self._counter, text))

    def start(self, port: str, baud: int) -> dict:
        check_port(port)
        if baud not in (9600, 19200, 38400, 57600, 74880, 115200, 230400, 460800, 921600):
            raise ValueError("Baudrate no compatible.")
        try:
            import serial
        except ImportError as e:
            raise ValueError("Falta pyserial: python -m pip install pyserial") from e
        self.close()
        try:
            conn = serial.Serial(port, baudrate=baud, timeout=.2, write_timeout=2)
        except (OSError, serial.SerialException) as e:
            raise ValueError(f"No se pudo abrir {port}: {e}") from e
        with self._lock:
            self._serial = conn
            self.port, self.baud = port, baud
        self._emit(f"[Sistema] Conexión serie real: {port} a {baud} baudios")
        self._thread = threading.Thread(target=self._reader, args=(conn,), daemon=True)
        self._thread.start()
        return self.status()

    def _reader(self, conn):
        while conn.is_open:
            try:
                data = conn.readline()
                if data:
                    self._emit(data.decode("utf-8", errors="replace").rstrip("\r\n"))
            except Exception as e:
                self._emit(f"[Sistema] Error de lectura serie: {e}")
                break

    def write(self, text: str) -> dict:
        if not isinstance(text, str) or len(text) > 2048:
            raise ValueError("Mensaje serie inválido.")
        with self._lock:
            if self._serial is None or not self._serial.is_open:
                raise ValueError("Monitor serie desconectado.")
            self._serial.write(text.encode("utf-8"))
        return {"ok": True}

    def close(self):
        with self._lock:
            if self._serial is not None:
                try:
                    self._serial.close()
                except Exception:
                    pass
            self._serial = None
            self.port, self.baud = None, None

    def status(self, since: int = 0):
        with self._lock:
            connected = self._serial is not None and self._serial.is_open
            messages = [asdict(m) for m in self._messages if m.id > since]
            return {"ok": True, "connected": connected, "port": self.port if connected else None,
                    "baud": self.baud if connected else None, "messages": messages[-300:],
                    "last_id": self._counter}


SERIAL = SerialBridge()
HARDWARE_LOCK = threading.Lock()
DATA_ROOT = Path(os.environ.get('AB_MAKERIDE_DATA_DIR', ROOT / '.makeride-data'))
JOBS = JobManager(HARDWARE_LOCK, DATA_ROOT / 'BuildSessions')
AGENT = AgentService()
AGENT_JOBS = AgentJobManager(DATA_ROOT / 'AgentWorkspaces')
SESSION_KEY = secrets.token_urlsafe(32)


def libraries_list() -> dict:
    if not arduino_cli():
        return {"ok": False, "output": "Arduino CLI no instalado", "libraries": []}
    result = command_result(["arduino-cli", "lib", "list", "--format", "json"], timeout=40)
    if not result["ok"]:
        return {**result, "libraries": []}
    try:
        data = json.loads(result["output"])
        if isinstance(data, dict):
            data = data.get("installed_libraries", data.get("libraries", []))
        return {"ok": True, "libraries": data if isinstance(data, list) else []}
    except ValueError:
        return {"ok": False, "libraries": [], "output": result["output"]}


class IDEHandler(BaseHTTPRequestHandler):
    server_version = "ABMakerIDE/1.0.0-rc.1"

    def log_message(self, fmt, *args):
        print("[MakerIDE] " + fmt % args)

    def _trusted_request(self) -> bool:
        host = self.headers.get("Host", "")
        try:
            addr = host.split(":", 1)[0].lower()
        except Exception:
            return False
        if addr not in ("127.0.0.1", "localhost"):
            return False
        origin = self.headers.get("Origin")
        if origin:
            try:
                parsed = urlsplit(origin)
                if parsed.hostname not in ("127.0.0.1", "localhost") or parsed.port != self.server.server_port:
                    return False
            except ValueError:
                return False
        if self.command == "POST" and self.headers.get("Sec-Fetch-Site") == "cross-site":
            return False
        return True

    def _json(self, status: int, data: dict):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", "default-src 'none'")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        try:
            self.wfile.write(payload)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass  # Browser reload/disconnect: never alter the underlying task.

    def _post_data(self):
        if "application/json" not in self.headers.get("Content-Type", ""):
            raise ValueError("Content-Type debe ser application/json")
        try:
            n = int(self.headers.get("Content-Length", "0"))
        except ValueError as e:
            raise ValueError("Content-Length incorrecto") from e
        if n <= 0 or n > MAX_BODY:
            raise ValueError("Petición demasiado grande o vacía")
        data = json.loads(self.rfile.read(n))
        if not isinstance(data, dict):
            raise ValueError("Se esperaba un objeto JSON")
        return data

    def do_GET(self):
        if not self._trusted_request():
            return self._json(403, {"ok": False, "error": "Acceso restringido al equipo local"})
        parsed = urlsplit(self.path)
        if parsed.path == "/api/health":
            return self._json(200, {"ok": True, "name": "AB MakerIDE · MS Robotika", "version": "1.0.0-rc.1", "mode": "local-real", "capabilities": ["agent-project-export", "agent-project-continuation", "agent-editor-open"]})
        if parsed.path == "/api/session":
            return self._json(200, {"ok": True, "csrf": SESSION_KEY})
        if parsed.path == "/api/diagnostics":
            return self._json(200, {"ok": True, "tools": installed_tools()})
        if parsed.path == "/api/hardware/profiles":
            return self._json(200, public_profiles())
        if parsed.path == "/api/boards":
            qs = parse_qs(parsed.query)
            catalog = board_catalog(refresh=qs.get('refresh', ['0'])[0] == '1')
            # Initial payload intentionally bounded: the searchable catalog lives server-side.
            # The saved selected board is permitted when present in the installed catalog.
            initial = catalog['boards'][:60]
            selected = qs.get('selected', [''])[0]
            if selected and FQBN_RE.fullmatch(selected) and not any(b['fqbn']==selected for b in initial):
                selected_board = next((b for b in catalog['boards'] if b['fqbn']==selected), None)
                if selected_board: initial.append(selected_board)
            return self._json(200, {"ok": True, **scan_ports(diagnostics=True), "choices": initial,
                                    "catalog_ok": catalog['ok'], "catalog_error": catalog['error'],
                                    "catalog_source": catalog['source'], "catalog_warning": catalog.get('warning',''),
                                    "catalog_count": len(catalog['boards']), "catalog_paged": True})
        if parsed.path == '/api/board-catalog/installed':
            qs = parse_qs(parsed.query)
            try:
                return self._json(200, installed_board_search(qs.get('query',[''])[0],
                                    page=int(qs.get('page',['1'])[0]), limit=int(qs.get('limit',['40'])[0])))
            except ValueError as error:
                return self._json(400, {'ok': False, 'error': str(error)})
        if parsed.path == '/api/board-catalog/search':
            qs = parse_qs(parsed.query)
            try:
                return self._json(200, board_search(qs.get('query', [''])[0],
                                    page=int(qs.get('page',['1'])[0]), limit=int(qs.get('limit',['40'])[0])))
            except ValueError as error:
                return self._json(400, {'ok': False, 'error': str(error)})
        if parsed.path == "/api/ai/status":
            return self._json(200, AGENT.status())
        if parsed.path == "/api/agents/status":
            return self._json(200, AGENT_JOBS.status_overview())
        if parsed.path == '/api/agents/history':
            return self._json(200, {'ok': True, 'recent': AGENT_JOBS.history(12)})
        if parsed.path == '/api/agents/project.zip':
            job_id = parse_qs(parsed.query).get('id', [''])[0]
            try:
                payload = AGENT_JOBS.export_project(job_id)
            except (ValueError, OSError) as error:
                return self._json(400, {'ok': False, 'error': str(error)})
            self.send_response(200)
            self.send_header('Content-Type', 'application/zip')
            self.send_header('Content-Disposition', f'attachment; filename="MakerIDE-{job_id[:8]}.zip"')
            self.send_header('Content-Length', str(len(payload)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.end_headers()
            self.wfile.write(payload)
            return
        if parsed.path == "/api/agents/poll":
            q = parse_qs(parsed.query)
            try:
                since = int(q.get('since', ['0'])[0])
                return self._json(200, AGENT_JOBS.get(q.get('id', [''])[0], since))
            except (ValueError, TypeError) as err:
                return self._json(400, {'ok': False, 'error': str(err)})
        if parsed.path == "/api/jobs/status":
            args = parse_qs(parsed.query)
            try:
                since = max(0, int(args.get('since', ['0'])[0]))
                return self._json(200, JOBS.status(args.get('id', [''])[0], since))
            except ValueError as e:
                return self._json(400, {'ok': False, 'error': str(e)})
        if parsed.path == "/api/libraries":
            return self._json(200, libraries_list())
        if parsed.path == "/api/serial/poll":
            try:
                since = max(0, int(parse_qs(parsed.query).get("since", ["0"])[0]))
            except ValueError:
                since = 0
            return self._json(200, SERIAL.status(since))
        if parsed.path in ('/examples/Blink_Uno.ino', '/examples/uno_r3_diagnostico.ino',
                           '/examples/esp32cam_ai_thinker_test.ino', '/examples/ideaspark_19_st7789.ino',
                           '/examples/ideaspark_114_st7789.ino', '/examples/ideaspark_114_radar.ino'):
            source = (ROOT / parsed.path.lstrip('/')).read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Content-Length', str(len(source)))
            self.end_headers()
            return self.wfile.write(source)
        if parsed.path in ('/simulator.js', '/app.js', '/activity.js'):
            raw = (ROOT / parsed.path.lstrip('/')).read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Content-Length', str(len(raw)))
            self.end_headers()
            return self.wfile.write(raw)
        if parsed.path not in ("/", "/index.html"):
            return self._json(404, {"ok": False, "error": "Recurso desconocido"})
        data = (ROOT / "index.html").read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if not self._trusted_request():
            return self._json(403, {"ok": False, "error": "Origen no permitido"})
        # A malicious tab on a foreign origin cannot read the per-run token.
        # This prevents blind HTML form/JS requests from writing firmware, changing
        # providers, or installing libraries even when Origin headers are absent.
        if not hmac.compare_digest(self.headers.get('X-AB-Session', ''), SESSION_KEY):
            return self._json(403, {'ok': False, 'error': 'Sesión local no autorizada. Recarga MakerIDE.'})
        try:
            d = self._post_data()
            p = urlsplit(self.path).path
            if p == "/api/agents/start":
                result = AGENT_JOBS.start(
                    provider=d.get('provider'), mode=d.get('mode'),
                    prompt=d.get('prompt'), code=d.get('code'),
                    lang=d.get('lang'), fqbn=d.get('fqbn'),
                    confirmed=d.get('confirm'), full_consent=d.get('full_consent', ''), port=d.get('port', ''),
                    parent_job_id=d.get('parent_job_id', ''),
                )
            elif p == "/api/agents/cancel":
                result = AGENT_JOBS.cancel(d.get('job_id'))
            elif p == "/api/hardware/check":
                result = check_hardware(d.get('profile', ''), d.get('connections', []), wifi=d.get('wifi', False))
            elif p == "/api/hardware/sketch":
                result = inspect_sketch(d.get('profile', ''), d.get('code'))
            elif p == "/api/advisor/check":
                code = d.get('code')
                check_code(code)
                check_fqbn(d.get('fqbn', 'esp32:esp32:esp32'))
                # Installed libs data is never supplied by the browser.
                inv = libraries_list()
                installed = []
                if inv.get('ok'):
                    installed = [(x.get('library', x) or {}).get('name', '') for x in inv.get('libraries', []) if isinstance(x, dict)]
                result = summarize(code, installed, fqbn=d.get('fqbn', ''), error_output=d.get('diagnostics', '')[:10000] if isinstance(d.get('diagnostics', ''), str) else '')
                result['inventory_available'] = bool(inv.get('ok'))
                if not inv.get('ok'):
                    for r in result['recommendations']:
                        r['installed'] = None
                        r['action'] = 'check_installation'
            elif p == "/api/ai/reset":
                result = AGENT.clear_keys()
            elif p == "/api/ai/config":
                result = AGENT.configure(d.get('provider'), d.get('model', ''), d.get('key', ''))
            elif p == "/api/ai/chat":
                result = AGENT.chat(d.get('prompt'), code=d.get('code', ''),
                                    lang=d.get('lang', 'cpp'), fqbn=d.get('fqbn', ''),
                                    test=d.get('test', False) is True)
            elif p == '/api/jobs/start':
                if d.get('lang') != 'cpp':
                    raise ValueError('Progreso asíncrono disponible solo para C++ por ahora.')
                code, fqbn = d.get('code'), d.get('fqbn')
                check_code(code)
                check_fqbn(fqbn)
                port = d.get('port') if d.get('action') == 'upload' else None
                if d.get('action') not in ('compile', 'upload'):
                    raise ValueError('Acción desconocida.')
                if d.get('action') == 'upload':
                    if d.get('confirm') is not True:
                        raise ValueError('La grabación requiere confirmación explícita.')
                    check_port(port)
                    SERIAL.close()
                if not arduino_cli():
                    raise ValueError('Arduino CLI no instalado o fuera de PATH.')
                project_id = d.get('agent_project_id', '')
                project_files = AGENT_JOBS.project_files(project_id)[1] if project_id else {}
                result = JOBS.start(code, fqbn, port, upload_speed=d.get('upload_speed', 115200), retry_slow=d.get('retry_slow', False), request_id=d.get('request_id'), project_files=project_files, agent_project_id=project_id)
            elif p == '/api/jobs/cancel':
                result = JOBS.cancel(d.get('job_id', ''))
            elif p == '/api/libraries/search':
                query = d.get('query', '')
                if not isinstance(query, str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9 +._-]{1,65}', query):
                    raise ValueError('Búsqueda inválida. Solo nombre de librería, sin comandos.')
                result = command_result(['arduino-cli', 'lib', 'search', query, '--no-color'], timeout=45)
            elif p == '/api/terminal/command':
                action = d.get('action')
                commands = {
                    'version': ['arduino-cli', 'version'],
                    'ports': ['arduino-cli', 'board', 'list'],
                    'cores': ['arduino-cli', 'core', 'list'],
                    'libraries': ['arduino-cli', 'lib', 'list'],
                    'esp32_details': ['arduino-cli', 'board', 'details', '-b', 'esp32:esp32:esp32'],
                }
                if action not in commands:
                    raise ValueError('Comando no permitido. Usa los comandos guiados.')
                with HARDWARE_LOCK:
                    result = command_result([*commands[action], '--no-color'], timeout=30)
            elif p == '/api/terminal/install-core':
                core = d.get('core')
                if d.get('confirm') is not True:
                    raise ValueError('Instalar núcleos requiere confirmación explícita.')
                if not isinstance(core, str) or not CORE_ID_RE.fullmatch(core):
                    raise ValueError('Identificador de núcleo no permitido.')
                if core not in ('esp32:esp32', 'arduino:avr', 'esp8266:esp8266'):
                    response = _cli_json(['core', 'search', core, '--json'])
                    platforms = response['data'] if isinstance(response['data'], list) else (
                        response['data'].get('platforms', []) if isinstance(response['data'], dict) else [])
                    if not response['ok'] or not any(isinstance(p, dict) and p.get('id') == core for p in platforms):
                        raise ValueError('Este núcleo no consta en el índice de Arduino CLI.')
                if d.get('confirm') is not True:
                    raise ValueError('Instalar núcleos requiere confirmación explícita.')
                with HARDWARE_LOCK:
                    result = command_result(['arduino-cli', 'core', 'install', core, '--no-color'], timeout=1200)
            elif p == "/api/verify":
                lang = d.get("lang", "cpp")
                if lang == "py":
                    result = check_python_syntax(d.get("code"))
                elif lang == "cpp":
                    with HARDWARE_LOCK:
                        result = compile_cpp(d.get("code"), d.get("fqbn"))
                else:
                    raise ValueError("Lenguaje desconocido")
            elif p == "/api/upload":
                if d.get("confirm") is not True:
                    raise ValueError("La grabación requiere confirmación explícita.")
                with HARDWARE_LOCK:
                    SERIAL.close()
                    if d.get("lang") == "cpp":
                        result = compile_cpp(d.get("code"), d.get("fqbn"), port=d.get("port"))
                    elif d.get("lang") == "py":
                        result = micropython_action(d.get("code"), d.get("port"), deploy=True)
                    else:
                        raise ValueError("Lenguaje desconocido")
            elif p == "/api/micropython/run":
                with HARDWARE_LOCK:
                    SERIAL.close()
                    result = micropython_action(d.get("code"), d.get("port"), deploy=False)
            elif p == "/api/libraries/install":
                name = d.get("name", "")
                if not isinstance(name, str) or not LIB_RE.fullmatch(name):
                    raise ValueError("Nombre de librería no permitido")
                if d.get("confirm") is not True:
                    raise ValueError("Instalar librería requiere confirmación")
                with HARDWARE_LOCK:
                    result = command_result(["arduino-cli", "lib", "install", name], timeout=240)
            elif p == "/api/serial/start":
                with HARDWARE_LOCK:
                    result = SERIAL.start(d.get("port"), int(d.get("baud", 115200)))
            elif p == "/api/serial/stop":
                SERIAL.close()
                result = {"ok": True}
            elif p == "/api/serial/send":
                result = SERIAL.write(d.get("text", ""))
            else:
                return self._json(404, {"ok": False, "error": "Acción no encontrada"})
            return self._json(200, result)
        except (ValueError, TypeError, json.JSONDecodeError) as e:
            return self._json(400, {"ok": False, "error": str(e)})
        except Exception as e:
            self.log_message("Error interno: %s", type(e).__name__)
            return self._json(500, {"ok": False, "error": f"Error interno: {type(e).__name__}"})


def main():
    parser = argparse.ArgumentParser(description="AB MakerIDE · MS Robotika — puente local")
    parser.add_argument("--port", type=int, default=8770)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), IDEHandler)
    except OSError as exc:
        print(f"No se ha podido abrir el puerto {args.port}: {exc}", file=sys.stderr, flush=True)
        print("Comprueba si hay otro MakerIDE abierto. Cierra el servidor anterior y reintenta.", file=sys.stderr, flush=True)
        raise SystemExit(2)
    print(f"AB MakerIDE v1.0.0-rc.1 SUPER (LOCAL) → http://127.0.0.1:{args.port}", flush=True)
    print("No se usan placas simuladas como si fueran reales.", flush=True)
    if not args.no_browser:
        threading.Timer(.6, lambda: webbrowser.open(f"http://127.0.0.1:{args.port}")).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nCerrando MakerIDE…")
    finally:
        SERIAL.close()
        server.server_close()


if __name__ == "__main__":
    main()
