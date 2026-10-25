"""Local startup checks. Uses only the standard library; never installs tools."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import shutil
import socket
import sys
import tempfile

ROOT = Path(__file__).resolve().parent

def diagnose(root=ROOT, port=8770):
    root = Path(root)
    data = Path(os.path.abspath(os.environ.get('AB_MAKERIDE_DATA_DIR') or root / '.makeride-data'))
    checks = []
    def check(name, ok, message, required=True):
        checks.append(dict(name=name, ok=bool(ok), message=message, required=required))
    check('python', sys.version_info >= (3, 10), 'Python 3.10 o posterior; actual: ' + sys.version.split()[0])
    required = ['server.py', 'app.js', 'index.html', 'activity.js', 'simulator.js', 'board_trials.js',
                'jobs.py', 'agent_runtime.py', 'toolchain.py', 'agent_projects.py',
                'cloud_agent.py', 'hardware_lab.py', 'dependency_advisor.py', 'VERSION']
    missing = [name for name in required if not (root / name).is_file()]
    check('files', not missing, 'Carpeta de programa completa.' if not missing else 'Faltan archivos: ' + ', '.join(missing))
    try:
        for parent in (data, *data.parents):
            if parent.is_symlink() or (parent.exists() and getattr(parent.lstat(), 'st_file_attributes', 0) & 1024):
                raise OSError('La ruta de datos contiene un enlace o unión de carpetas.')
        data.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryFile(dir=str(data)) as probe:
            probe.write(b'MakerIDE startup check')
        check('data', True, 'Datos y sesiones: ' + str(data))
    except OSError as error:
        check('data', False, 'No se puede escribir en la carpeta de datos: ' + str(error))
    if not isinstance(port, int) or isinstance(port, bool) or not 1 <= port <= 65535:
        check('port', False, 'El puerto debe estar entre 1 y 65535.')
    else:
        try:
            with socket.socket() as probe:
                if hasattr(socket, 'SO_EXCLUSIVEADDRUSE'):
                    probe.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
                probe.bind(('127.0.0.1', port))
            check('port', True, 'Puerto local disponible: ' + str(port))
        except OSError:
            check('port', False, 'El puerto ' + str(port) + ' está ocupado o no disponible. No se ha cerrado ningún programa. Revisa si ya tienes MakerIDE abierto.')
    # Resolve from this extracted source, without importing the hardware server.
    previous = list(sys.path)
    try:
        sys.path.insert(0, str(root))
        from toolchain import arduino_cli
        cli = arduino_cli()
    except ImportError:
        cli = None
    finally:
        sys.path[:] = previous
    check('arduino', bool(cli), 'Arduino CLI disponible.' if cli else 'Arduino CLI ausente: puedes usar el editor y el simulador. Instálalo para compilar Arduino.', False)
    serial = importlib.util.find_spec('serial') is not None
    mpremote = bool(shutil.which('mpremote'))
    check('serial', serial, 'Monitor serie disponible.' if serial else 'Monitor serie no disponible. Ejecuta PREPARAR_WINDOWS.bat para instalar las dependencias opcionales en esta carpeta.', False)
    check('micropython', mpremote, 'Herramienta MicroPython disponible.' if mpremote else 'mpremote no disponible. Ejecuta PREPARAR_WINDOWS.bat para activar MicroPython; no se instala firmware automáticamente.', False)
    return dict(ok=all(item['ok'] for item in checks if item['required']), checks=checks,
                data_dir=str(data), version=(root / 'VERSION').read_text(encoding='utf-8').strip() if (root / 'VERSION').is_file() else 'desconocida',
                scope='Diagnóstico local; no abre puertos serie, no graba hardware ni configura cuentas de IA.')

def main(argv=None):
    parser = argparse.ArgumentParser(description='Arranque local de AB MakerIDE')
    parser.add_argument('--port', type=int, default=8770)
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--check', action='store_true', help='Comprobar sin iniciar servidor ni abrir navegador')
    parser.add_argument('--json', action='store_true', help='Informe JSON (solo con --check)')
    args = parser.parse_args(argv)
    # Private process environment only, so the selected Python and its mpremote agree.
    scripts = str(Path(sys.executable).parent)
    os.environ['PATH'] = scripts + os.pathsep + os.environ.get('PATH', '')
    report = diagnose(port=args.port)
    if args.json:
        if not args.check:
            parser.error('--json requiere --check')
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print('AB MakerIDE SUPER ' + report['version'])
        for check in report['checks']:
            print(('OK' if check['ok'] else 'ERROR' if check['required'] else 'OPCIONAL') + ' · ' + check['message'])
    if not report['ok']:
        return 2
    if args.check:
        return 0
    os.environ['AB_MAKERIDE_DATA_DIR'] = report['data_dir']
    import server
    sys.argv = [str(ROOT / 'server.py'), '--port', str(args.port)] + (['--no-browser'] if args.no_browser else [])
    server.main()
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
