"""Auditable, non-fictional Arduino CLI jobs with live logs and cancellation."""
from __future__ import annotations
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
import os
import re
import subprocess
import tempfile
import threading
import time
import uuid
import json
import hashlib
from toolchain import arduino_cli
from agent_projects import validate_project_files

ANSI_RE = re.compile(r'\x1b\[[0-?]*[ -/]*[@-~]')
PERCENT_RE = re.compile(r'(?<!\d)(\d{1,3})\s*%')
ESP_SPEEDS = (115200, 230400, 460800, 921600)


def clean_terminal(value: str) -> str:
    return ANSI_RE.sub('', value).replace('\x00', '')


def extract_upload_percent(text: str) -> int | None:
    """Do not estimate: return only a literal percentage provided by uploader."""
    if not re.search(r'(?:writing\s+at|upload(?:ing)?\s+.*?\bprogress|\bflash\s+progress)', text, re.I):
        return None
    values = [int(m.group(1)) for m in PERCENT_RE.finditer(clean_terminal(text))]
    values = [n for n in values if 0 <= n <= 100]
    return values[-1] if values else None


@dataclass
class Job:
    id: str
    action: str
    started: float = field(default_factory=time.monotonic)
    stage: str = 'preparación'
    active: bool = True
    ok: bool | None = None
    cancelled: bool = False
    upload_progress: int | None = None
    error: str = ''
    exit_code: int | None = None
    upload_speed: int | None = None
    attempted_speeds: list[int] = field(default_factory=list)
    diagnosis: str = ''
    events: deque = field(default_factory=lambda: deque(maxlen=2000))
    sequence: int = 0
    process: subprocess.Popen | None = None
    lock: threading.RLock = field(default_factory=threading.RLock)
    journal: Path | None = None
    finished_elapsed: float | None = None
    source_sha256: str = ''
    agent_project_id: str = ''
    fqbn: str = ''
    _saved_at: float = 0

    def persist(self, force=False):
        if not self.journal or (not force and time.monotonic() - self._saved_at < 2):
            return
        with self.lock:
            data = self.snapshot()
            data['schema'] = 1
            tmp = self.journal.with_suffix('.tmp')
            try:
                tmp.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
                os.replace(tmp, self.journal)
                self._saved_at = time.monotonic()
            except OSError as exc:
                self.error = 'No se pudo guardar la sesión: ' + str(exc)[:200]

    def emit(self, message: str, *, from_tool: bool = False):
        with self.lock:
            for line in clean_terminal(message).splitlines():
                self.sequence += 1
                self.events.append({'id': self.sequence, 'text': line[:1500]})
                if self.stage == 'grabación' and from_tool:
                    p = extract_upload_percent(line)
                    if p is not None:
                        self.upload_progress = max(self.upload_progress or 0, p)
            self.persist()

    def snapshot(self, since: int = 0) -> dict:
        with self.lock:
            return dict(ok=True, id=self.id, action=self.action, active=self.active,
                        source_sha256=self.source_sha256, fqbn=self.fqbn, agent_project_id=self.agent_project_id,
                        success=self.ok, cancelled=self.cancelled, stage=self.stage,
                        progress=self.upload_progress if self.stage in ('grabación', 'reintento 115200', 'completado') else None,
                        elapsed=self.finished_elapsed if self.finished_elapsed is not None else round(time.monotonic()-self.started, 1),
                        error=self.error, exit_code=self.exit_code,
                        upload_speed=self.upload_speed, attempted_speeds=list(self.attempted_speeds), diagnosis=self.diagnosis,
                        lines=[e for e in self.events if e['id'] > since][-500:],
                        last_id=self.sequence)


class JobManager:
    def __init__(self, hardware_lock: threading.Lock, session_root: Path | None = None):
        self._guard = threading.Lock()
        self._hardware_lock = hardware_lock
        self._current: Job | None = None
        self.root = session_root

    def start(self, code: str, fqbn: str, port: str | None = None, *, upload_speed: int = 115200, retry_slow: bool = False, request_id: str | None = None, project_files: dict | None = None, agent_project_id: str = '') -> dict:
        project_files = {} if project_files is None else project_files
        validate_project_files(project_files)
        if not isinstance(agent_project_id,str) or (agent_project_id and not re.fullmatch(r'[a-f0-9]{32}', agent_project_id)):
            raise ValueError('Referencia de proyecto inválida.')
        if request_id is not None and (not isinstance(request_id,str) or not re.fullmatch(r'[a-f0-9]{32}',request_id)):
            raise ValueError('Referencia de operación inválida.')
        # A repeated HTTP submission must never repeat an upload/compile.
        if request_id:
            with self._guard:
                if self._current and self._current.id == request_id:
                    return {'ok': True, 'job_id': request_id}
                if self.root and (self.root / request_id / 'job.json').is_file():
                    return {'ok': True, 'job_id': request_id}
        if isinstance(upload_speed, bool) or upload_speed not in ESP_SPEEDS:
            raise ValueError('Velocidad de grabación no permitida.')
        if not isinstance(retry_slow, bool):
            raise ValueError('La opción de reintento debe ser booleana.')
        if port and not fqbn.startswith('esp32:esp32:') and (upload_speed != 115200 or retry_slow):
            raise ValueError('Ajustes de velocidad específicos de ESP32. Selecciona un ESP32.')
        if not self._hardware_lock.acquire(blocking=False):
            raise ValueError('Hay otra operación de hardware activa.')
        try:
            with self._guard:
                if self._current and self._current.active:
                    raise ValueError('Ya hay una operación en curso. Espera o cancela.')
                job = Job(id=request_id or uuid.uuid4().hex, action='upload' if port else 'compile')
                job.source_sha256 = hashlib.sha256(code.encode('utf-8')).hexdigest()
                job.fqbn = fqbn
                job.agent_project_id = agent_project_id
                if self.root:
                    folder = self.root / job.id
                    folder.mkdir(parents=True, exist_ok=False)
                    (folder / 'sketch.ino').write_text(code, encoding='utf-8')
                    for name, data in project_files.items():
                        if name == 'sketch.ino':continue
                        target = folder / 'project' / name
                        target.parent.mkdir(parents=True, exist_ok=True)
                        target.write_bytes(data)
                    (folder / 'target.json').write_text(json.dumps({'fqbn': fqbn, 'port': port}), encoding='utf-8')
                    job.journal = folder / 'job.json'
                    job.persist(force=True)
                self._current = job
            threading.Thread(target=self._worker, args=(job, code, fqbn, port, upload_speed, retry_slow), kwargs={'project_files':project_files}, daemon=True).start()
            return {'ok': True, 'job_id': job.id}
        except Exception:
            self._hardware_lock.release()
            raise

    def status(self, job_id: str, since: int = 0) -> dict:
        with self._guard:
            if self._current is None or job_id != self._current.id:
                if self.root and re.fullmatch(r'[a-f0-9]{32}', job_id):
                    path = self.root / job_id / 'job.json'
                    if path.is_file() and not path.is_symlink() and not path.parent.is_symlink():
                        data = json.loads(path.read_text('utf-8'))
                        if data.get('active'):
                            data.update(active=False, success=False, stage='interrumpido', exit_code=None,
                                        error='Servidor reiniciado durante la operación. Resultado desconocido; no se repite automáticamente.')
                        data['lines'] = [x for x in data.get('lines', []) if x['id'] > since]
                        return data
                raise ValueError('Operación no encontrada.')
            return self._current.snapshot(since)

    def cancel(self, job_id: str) -> dict:
        with self._guard:
            job = self._current
            if not job or job.id != job_id:
                raise ValueError('Operación no encontrada.')
        with job.lock:
            if job.active:
                job.cancelled = True
                job.emit('Cancelación solicitada por el usuario.')
                if job.process and job.process.poll() is None:
                    self._terminate(job.process)
        return job.snapshot()

    @staticmethod
    def _terminate(process: subprocess.Popen):
        try:
            if os.name == 'nt':
                subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                               timeout=8, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
            else:
                process.terminate()
        except (OSError, subprocess.TimeoutExpired):
            try:
                process.kill()
            except OSError:
                pass

    def _run(self, job: Job, args: list[str], timeout: int) -> int:
        job.emit('Ejecutando: ' + ' '.join(args[:4]) + ' …')
        flags = getattr(subprocess, 'CREATE_NO_WINDOW', 0)
        process = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                   text=True, encoding='utf-8', errors='replace', bufsize=1,
                                   creationflags=flags)
        with job.lock:
            job.process = process
        done = threading.Event()
        def reader():
            try:
                for line in process.stdout:
                    job.emit(line.rstrip('\r\n'), from_tool=True)
            finally:
                done.set()
        threading.Thread(target=reader, daemon=True).start()
        deadline = time.monotonic() + timeout
        try:
            while process.poll() is None:
                if job.cancelled or time.monotonic() >= deadline:
                    if not job.cancelled:
                        job.error = f'Tiempo límite de {timeout} s agotado.'
                    self._terminate(process)
                    break
                time.sleep(.12)
            try:
                rc = process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                rc = process.wait(timeout=3)
            if done.wait(timeout=3) and process.stdout is not None:
                process.stdout.close()
            return rc
        finally:
            with job.lock:
                job.process = None

    def _worker(self, job: Job, code: str, fqbn: str, port: str | None, upload_speed: int = 115200, retry_slow: bool = False, *, project_files: dict | None = None):
        try:
            with tempfile.TemporaryDirectory(prefix='ab-makeride-') as temp:
                root = Path(temp)
                sketch = root / 'sketch'
                sketch.mkdir()
                for name, data in (project_files or {}).items():
                    if name == 'sketch.ino':continue  # The current editor controls the main sketch.
                    target = sketch / name
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(data)
                (sketch / 'sketch.ino').write_text(code, encoding='utf-8')
                build = root / 'build'
                build.mkdir()
                job.stage = 'compilación'
                job.emit('Compilación real iniciada · porcentaje no disponible')
                is_esp = fqbn.startswith('esp32:esp32:')
                opts = ['--board-options', f'UploadSpeed={upload_speed}'] if port and is_esp else []
                executable = arduino_cli() or 'arduino-cli'
                rc = self._run(job, [executable, 'compile', '--fqbn', fqbn,
                                     *opts, '--no-color', '--output-dir', str(build), str(sketch)], 480)
                job.exit_code = rc
                if job.cancelled or rc != 0:
                    if not job.cancelled and not job.error:
                        job.error = 'El compilador devolvió un error. Revisa la consola.'
                    return
                job.emit('Compilación finalizada sin errores.')
                if port:
                    job.stage = 'grabación'
                    job.emit(f'Grabación real en {port}. Esperando salida del grabador…')
                    job.upload_speed = upload_speed if is_esp else None
                    if is_esp:
                        job.attempted_speeds.append(upload_speed)
                    rc = self._run(job, [executable, 'upload', '-p', port,
                                         '--fqbn', fqbn, *opts, '--no-color',
                                         '--input-dir', str(build), str(sketch)], 300)
                    job.exit_code = rc
                    if rc != 0 and not job.cancelled and is_esp and retry_slow and upload_speed != 115200:
                        tail = '\n'.join(e['text'] for e in list(job.events)[-35:]).lower()
                        recoverable = any(x in tail for x in (
                            'unable to verify flash chip connection', 'no more data to read',
                            'serial data stream stopped', 'failed to connect',
                            'timed out waiting for packet header', 'invalid head of packet'))
                        if recoverable:
                            job.stage = 'reintento 115200'
                            job.diagnosis = 'Comunicación USB inestable; probando velocidad conservadora.'
                            job.emit('⚠ Se detectó un fallo de enlace. Reintento autorizado a 115200 baudios.')
                            job.upload_progress = None
                            job.upload_speed = 115200
                            job.attempted_speeds.append(115200)
                            rc = self._run(job, [executable, 'upload', '-p', port,
                                                 '--fqbn', fqbn, '--board-options', 'UploadSpeed=115200',
                                                 '--no-color', '--input-dir', str(build), str(sketch)], 300)
                            job.exit_code = rc
                            job.stage = 'grabación'
                    if job.cancelled or rc != 0:
                        if not job.cancelled and not job.error:
                            job.error = 'Fallo real de grabación. Revisa cable USB, alimentación, BOOT y puerto.'
                            if not job.diagnosis:
                                job.diagnosis = 'Diagnóstico inicial: bajar velocidad de grabación a 115200 baudios.'
                        return
                job.ok = not bool(job.error)
                job.stage = 'completado'
                job.emit('✓ Operación finalizada correctamente por Arduino CLI.')
        except FileNotFoundError:
            job.error = 'Arduino CLI no está instalado o no está en PATH.'
            job.emit(job.error)
        except Exception as exc:
            job.error = f'Error local: {type(exc).__name__}: {exc}'
            job.emit(job.error)
        finally:
            if job.cancelled:
                job.ok = False
                job.stage = 'cancelado'
                job.emit('Operación cancelada. Verifica el estado del dispositivo antes de reintentar.')
            elif job.ok is not True:
                job.ok = False
                job.stage = 'error'
                job.emit('✕ Operación fallida. No se confirma grabación.')
            job.active = False
            job.finished_elapsed = round(time.monotonic() - job.started, 1)
            job.persist(force=True)
            self._hardware_lock.release()
