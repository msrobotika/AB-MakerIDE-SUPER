"""Bounded project snapshots for local agent export and continuation."""
import io
import json
import os
import re
import stat
from pathlib import Path
import zipfile
from pathlib import PurePosixPath

MAX_PROJECT_BYTES = 8_000_000
MAX_PROJECT_FILES = 128
EXTENSIONS = {'.ino', '.h', '.hpp', '.c', '.cpp', '.py', '.json', '.md', '.txt', '.csv', '.png', '.bmp'}


def is_link_or_reparse(path: Path) -> bool:
    """Include Windows junctions/reparse points, also on Python 3.10/3.11."""
    try:
        info = path.lstat()
    except FileNotFoundError:
        return False
    return (stat.S_ISLNK(info.st_mode)
            or bool(getattr(info, 'st_file_attributes', 0) & 1024)
            or (stat.S_ISREG(info.st_mode) and info.st_nlink > 1))


def plain_directory(path: Path, *, create: bool = False) -> Path:
    """Reject existing redirected ancestors before creating/reading a store.

    This blocks static links/junctions. It is not an OS sandbox against another
    process with the same user's permissions changing paths concurrently.
    """
    path = Path(os.path.abspath(path))
    for parent in reversed((path, *path.parents)):
        if is_link_or_reparse(parent):
            raise ValueError('La carpeta de datos contiene un enlace o unión de carpetas.')
        if parent.exists() and not parent.is_dir():
            raise ValueError('La ruta de datos no es una carpeta.')
    if create:
        path.mkdir(parents=True, exist_ok=True)
    if not path.is_dir():
        raise ValueError('No se encuentra la carpeta de datos.')
    return path


def validate_project_files(files: dict[str, bytes]) -> None:
    if not isinstance(files, dict) or len(files) > MAX_PROJECT_FILES:
        raise ValueError('Archivos auxiliares no válidos.')
    total = 0
    seen = set()
    for name, data in files.items():
        if (not isinstance(name, str) or not name or len(name) > 240
                or re.search(r'[<>:"\\|?*\x00-\x1f\x7f]', name)
                or PurePosixPath(name).is_absolute()
                or any(part in ('', '.', '..') or part.endswith((' ', '.'))
                       or re.fullmatch(r'(?i:CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])(?:\..*)?', part)
                       for part in name.split('/'))
                or not isinstance(data, bytes)):
            raise ValueError('Ruta o contenido de archivo auxiliar no válido.')
        canonical = name.casefold()
        if canonical in seen:
            raise ValueError('Archivos auxiliares duplicados por mayúsculas/minúsculas.')
        seen.add(canonical)
        total += len(data)
        if total > MAX_PROJECT_BYTES:
            raise ValueError('Los archivos auxiliares superan 8 MB.')
    for name in seen:
        if any(parent.as_posix() in seen for parent in PurePosixPath(name).parents if parent.as_posix() != '.'):
            raise ValueError('Un archivo auxiliar no puede ser también una carpeta.')


def collect_project(workspace: Path, root: Path) -> dict[str, bytes]:
    root = plain_directory(root)
    workspace = plain_directory(workspace)
    if workspace.parent != root:
        raise ValueError('Carpeta de proyecto no válida.')
    files = {}
    total = 0
    directories = 0
    for folder, dirs, names in os.walk(workspace, followlinks=False):
        directories += 1
        if directories > 64:
            raise ValueError('El proyecto supera el límite de carpetas exportables.')
        dirs[:] = sorted(d for d in dirs if not d.startswith('.') and d not in ('build', 'node_modules', '__pycache__', 'venv')
                         and not is_link_or_reparse(Path(folder) / d)
                         and (Path(folder) / d).resolve().is_relative_to(workspace.resolve()))
        for name in sorted(names):
            path = Path(folder) / name
            lower = name.lower()
            if (name.startswith('.') or is_link_or_reparse(path) or not path.is_file()
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
    validate_project_files(files)
    return files


def project_archive(snapshot: dict, files: dict[str, bytes]) -> bytes:
    validate_project_files(files)
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
