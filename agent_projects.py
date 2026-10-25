"""Bounded project snapshots for local agent export and continuation."""
import io
import json
import os
from pathlib import Path
import zipfile
from pathlib import PurePosixPath

MAX_PROJECT_BYTES = 8_000_000
MAX_PROJECT_FILES = 128
EXTENSIONS = {'.ino', '.h', '.hpp', '.c', '.cpp', '.py', '.json', '.md', '.txt', '.csv', '.png', '.bmp'}


def validate_project_files(files: dict[str, bytes]) -> None:
    if not isinstance(files, dict) or len(files) > MAX_PROJECT_FILES:
        raise ValueError('Archivos auxiliares no válidos.')
    total = 0
    for name, data in files.items():
        if (not isinstance(name, str) or not name or '\\' in name or ':' in name
                or PurePosixPath(name).is_absolute() or '..' in PurePosixPath(name).parts
                or not isinstance(data, bytes)):
            raise ValueError('Ruta o contenido de archivo auxiliar no válido.')
        total += len(data)
        if total > MAX_PROJECT_BYTES:
            raise ValueError('Los archivos auxiliares superan 8 MB.')


def collect_project(workspace: Path, root: Path) -> dict[str, bytes]:
    if workspace.is_symlink() or workspace.resolve().parent != root.resolve():
        raise ValueError('Carpeta de proyecto no válida.')
    files = {}
    total = 0
    directories = 0
    for folder, dirs, names in os.walk(workspace, followlinks=False):
        directories += 1
        if directories > 64:
            raise ValueError('El proyecto supera el límite de carpetas exportables.')
        dirs[:] = sorted(d for d in dirs if not d.startswith('.') and d not in ('build', 'node_modules', '__pycache__', 'venv')
                         and not (Path(folder) / d).is_symlink()
                         and (Path(folder) / d).resolve().is_relative_to(workspace.resolve()))
        for name in sorted(names):
            path = Path(folder) / name
            lower = name.lower()
            if (name.startswith('.') or path.is_symlink() or not path.is_file()
                    or not path.resolve().is_relative_to(workspace.resolve())
                    or path.suffix.lower() not in EXTENSIONS
                    or lower == 'makeride_context.txt'
                    or any(word in lower for word in ('secret', 'credential', '.original.', '_anterior.'))):
                continue
            if len(files) >= MAX_PROJECT_FILES or total + path.stat().st_size > MAX_PROJECT_BYTES:
                raise ValueError('El proyecto supera 128 archivos u 8 MB; no se exporta una copia incompleta.')
            with path.open('rb') as source:
                data = source.read(MAX_PROJECT_BYTES - total + 1)
            total += len(data)
            if total > MAX_PROJECT_BYTES:
                raise ValueError('El proyecto cambió durante la lectura; supera 8 MB.')
            files[path.relative_to(workspace).as_posix()] = data
    return files


def project_archive(snapshot: dict, files: dict[str, bytes]) -> bytes:
    main = snapshot['file_name']
    if main not in files:
        raise ValueError('No se encuentra el archivo principal del proyecto.')
    buffer = io.BytesIO()
    folder = 'sketch' if main.endswith('.ino') else 'project'
    metadata = {key: snapshot.get(key) for key in ('job_id', 'provider', 'mode', 'fqbn', 'port', 'outcome')}
    metadata['target_note'] = 'FQBN y puerto declarados; no prueban identidad ni presencia del hardware.'
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, data in files.items():
            archive.writestr(folder + '/' + name, data)
        archive.writestr(folder + '/MAKERIDE_EXPORT.json', json.dumps(metadata, ensure_ascii=False, indent=2))
    return buffer.getvalue()
