"""Bounded board identification. Never writes flash or infers a display from USB."""
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

from toolchain import arduino_cli

PORT = re.compile(r'(?:COM[1-9][0-9]{0,3}|/dev/(?:tty[A-Za-z0-9_.-]+|cu\.[A-Za-z0-9_.-]+)|/dev/serial/by-id/[A-Za-z0-9_.-]+)', re.I)


def esptool_command():
    installed = shutil.which('esptool')
    if installed:
        return [installed]
    roots = []
    configured = os.environ.get('ARDUINO_DIRECTORIES_DATA')
    if configured:
        roots.append(Path(configured))
    executable = arduino_cli()
    if executable and not roots:
        try:
            result = subprocess.run([executable, 'config', 'get', 'directories.data', '--json'], capture_output=True, text=True, timeout=6,
                                    creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
            import json
            data = json.loads(result.stdout)
            path = data.get('directories.data') if isinstance(data, dict) else data
            if result.returncode == 0 and isinstance(path, str):
                roots.append(Path(path))
        except (ValueError, OSError, subprocess.TimeoutExpired):
            pass
    if not roots:
        roots.append(Path(os.environ.get('LOCALAPPDATA', str(Path.home()))) / 'Arduino15' if os.name == 'nt'
                     else Path.home() / ('Library/Arduino15' if sys.platform == 'darwin' else '.arduino15'))
    for root in roots:
        parent = root / 'packages/esp32/tools/esptool_py'
        if not parent.is_dir():
            continue
        for folder in sorted(parent.iterdir(), key=lambda p: tuple(int(n) for n in re.findall(r'\d+', p.name)), reverse=True):
            for name in ('esptool.exe', 'esptool', 'esptool.py'):
                path = folder / name
                if path.is_file():
                    return [sys.executable, str(path)] if name.endswith('.py') else [str(path)]
    return None


def parse_chip(output):
    match = re.search(r'(?mi)^(?:Chip(?:\s+type)?\s*:\s*|Chip is\s+)(ESP(?:32|8266)[^\r\n]*)', output)
    if not match:
        return None
    chip = match.group(1).strip()[:140]
    family = chip.split()[0].upper()
    if family.startswith('ESP8266'):
        return chip, 'esp8266:esp8266:generic', 'ESP8266 genérico'
    for suffix in ('S2', 'S3', 'C2', 'C3', 'C5', 'C6', 'H2', 'P4'):
        if family.startswith('ESP32-' + suffix):
            return chip, 'esp32:esp32:esp32' + suffix.lower(), 'ESP32-' + suffix + ' Dev Module'
    if re.match(r'ESP32(?:$|-D[0-9]|-U[0-9]|-S0WD|-PICO)', family):
        return chip, 'esp32:esp32:esp32', 'ESP32 Dev Module'
    return None


def identify(ports, boards, requested_port=''):
    available = {p['port']: p for p in ports if isinstance(p.get('port'), str) and PORT.fullmatch(p['port'])}
    if requested_port and (not isinstance(requested_port, str) or requested_port not in available):
        raise ValueError('El puerto solicitado no está presente.')
    if not available:
        return {'ok': True, 'status': 'absent', 'message': 'No hay puertos USB presentes.'}
    if not requested_port and len(available) != 1:
        return {'ok': True, 'status': 'multiple', 'message': 'Hay varias placas: selecciona el puerto para identificar una.'}
    port = requested_port or next(iter(available))
    item = available[port]
    result = {'ok': True, 'port': port, 'status': 'unknown', 'fqbn': '', 'chip': '',
              'display_identified': False, 'commercial_model_identified': False,
              'message': 'Puerto detectado; modelo todavía sin identificar.'}
    # USB metadata can select a profile, but is never described as a chip probe.
    suggested = {b['fqbn']: b for b in item.get('boards', []) if b.get('fqbn') and any(c['fqbn'] == b['fqbn'] for c in boards)}
    if len(suggested) == 1:
        fqbn, board = next(iter(suggested.items()))
        result.update(status='profile', fqbn=fqbn, name=board.get('name', fqbn), source='arduino_cli_usb',
                      message='Perfil seleccionado según Arduino CLI/USB. Pantalla y revisión física sin comprobar.')
        return result
    tool = esptool_command()
    if not tool:
        result['message'] = 'Puerto seleccionado; falta esptool para consultar el chip ESP. Confirma el modelo o instala su núcleo.'
        return result
    # chip_id/--no-stub are accepted by esptool 4 and 5. No flasher stub is
    # uploaded, no memory is written. DTR/RTS may restart the connected board.
    args = [*tool, '--port', port, '--baud', '115200', '--no-stub', '--connect-attempts', '2', 'chip_id']
    try:
        proc = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=22,
                              creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        output = proc.stdout + '\n' + proc.stderr
    except (OSError, subprocess.TimeoutExpired):
        result['message'] = 'No se pudo consultar el chip; puede estar ocupado o requerir BOOT. No se ha grabado firmware.'
        return result
    chip = parse_chip(output) if proc.returncode == 0 else None
    if not chip:
        if 'could not open' in output.lower() or 'permissionerror' in output.lower():
            result.update(status='port_busy', message='Puerto ocupado por otro programa o desconectado. Cierra su monitor/ventana y pulsa actualizar; no se interrumpe ni se graba nada.')
            return result
        result['message'] = 'El puerto responde a la enumeración, pero no se confirmó un chip ESP. No se elige una placa por CH340/CP210x.'
        return result
    chip_name, fqbn, name = chip
    result.update(chip=chip_name, name=name, source='esptool_chip_query')
    if not any(board['fqbn'] == fqbn for board in boards):
        result.update(status='core_missing', suggested_fqbn=fqbn,
                      message='Chip identificado, pero falta su perfil instalado: ' + fqbn)
        return result
    result.update(status='identified', fqbn=fqbn,
                  message=chip_name + ': puerto y perfil seleccionados. La pantalla requiere su propio perfil físico.')
    return result
