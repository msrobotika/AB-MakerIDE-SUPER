"""Inspect a MakerIDE ZIP offline before publication, without extracting files."""

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import stat
import zipfile

REQUIRED = {
    "README.md",
    "README.en.md",
    "LICENSE",
    "VERSION",
    "THIRD_PARTY_NOTICES.md",
    ".specify/UPSTREAM_LICENSE",
    ".specify/UPSTREAM.md",
    "MANIFEST_SHA256.txt",
    "examples/defensa_orbital/defensa_orbital.ino",
    "examples/defensa_orbital/DefensaOrbital.h",
    "examples/defensa_orbital/CYDFrame.h",
}
DIGEST = re.compile(r"[a-f0-9]{64}")


def audit_zip(path, expected_sha256=None):
    """Return a fail-closed summary of the exact downloaded archive."""
    path = Path(path)
    errors = []
    report = {"path": str(path), "passed": False, "errors": errors, "files": 0}
    try:
        h = hashlib.sha256()
        with path.open("rb") as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b""):
                h.update(block)
        report["sha256"] = h.hexdigest()
        if expected_sha256 and expected_sha256.lower() != h.hexdigest():
            errors.append("El SHA256 del ZIP no coincide con el esperado")
        with zipfile.ZipFile(path) as archive:
            infos = archive.infolist()
            if (
                not infos
                or len(infos) > 3000
                or sum(i.file_size for i in infos) > 256 * 1024 * 1024
            ):
                errors.append("ZIP vacio o con volumen excesivo")
            valid = []
            seen = set()
            for item in infos:
                name = item.filename
                if (
                    not name
                    or name.startswith("/")
                    or "\\" in name
                    or ":" in name
                    or any(p in ("", ".", "..") for p in name.rstrip("/").split("/"))
                    or item.flag_bits & 1
                ):
                    errors.append("Ruta insegura o elemento cifrado")
                    continue
                if (item.external_attr >> 16) & 0o170000 == stat.S_IFLNK:
                    errors.append("ZIP con enlace simbolico")
                    continue
                if name in seen:
                    errors.append("Ruta duplicada")
                    continue
                seen.add(name)
                valid.append((item, PurePosixPath(name).parts))
            roots = {parts[0] for _, parts in valid if parts}
            if len(roots) != 1:
                errors.append("Debe existir una sola carpeta raiz")
            root = next(iter(roots)) if len(roots) == 1 else None
            files = {
                "/".join(parts[1:]): item
                for item, parts in valid
                if root and len(parts) > 1 and parts[0] == root and not item.is_dir()
            }
            report["files"] = len(files)
            missing = sorted(REQUIRED - files.keys())
            if missing:
                errors.append("Documentos obligatorios ausentes: " + ", ".join(missing))
            if any(
                PurePosixPath(p).name.lower() in ("arduino-cli", "arduino-cli.exe") for p in files
            ):
                errors.append("Arduino CLI empaquetada: revisar licencia GPL")
            if any(p.startswith("examples/cyd_space_invaders/") for p in files):
                errors.append("Nombre historico del videojuego en ejemplos vigentes")
            if archive.testzip():
                errors.append("CRC fallido")
            if "VERSION" in files and "MANIFEST_SHA256.txt" in files:
                version = archive.read(files["VERSION"]).decode("utf-8").strip()
                lines = archive.read(files["MANIFEST_SHA256.txt"]).decode("utf-8").splitlines()
                if len(lines) < 4 or lines[0] != f"AB MakerIDE SUPER {version} / SHA-256 manifest":
                    errors.append("Version o cabecera del manifiesto incorrecta")
                recorded = {}
                for line in lines[3:]:
                    if "  " not in line:
                        errors.append("Entrada malformada de manifiesto")
                        continue
                    digest, name = line.split("  ", 1)
                    if not DIGEST.fullmatch(digest) or name in recorded:
                        errors.append("Huella invalida o duplicada")
                        continue
                    recorded[name] = digest
                if set(recorded) != set(files) - {"MANIFEST_SHA256.txt"}:
                    errors.append("Archivos y manifiesto interno diferentes")
                for name, digest in recorded.items():
                    if (
                        name in files
                        and hashlib.sha256(archive.read(files[name])).hexdigest() != digest
                    ):
                        errors.append("SHA256 interno erroneo: " + name)
            example = "examples/defensa_orbital/defensa_orbital.ino"
            if example in files:
                current = archive.read(files[example]).decode("utf-8")
                if "SpaceInvaders" in current or "SPACEINVADERS" in current:
                    errors.append("Identificador no vigente en el ejemplo")
            if "LICENSE" in files:
                if "MIT License" not in archive.read(files["LICENSE"]).decode("utf-8"):
                    errors.append("Falta MIT original")
            if ".specify/UPSTREAM_LICENSE" in files:
                if "Copyright GitHub, Inc." not in archive.read(
                    files[".specify/UPSTREAM_LICENSE"]
                ).decode("utf-8"):
                    errors.append("Falta atribucion Spec Kit")
    except (OSError, zipfile.BadZipFile, UnicodeError, ValueError, RuntimeError) as exc:
        errors.append(type(exc).__name__ + ": " + str(exc)[:160])
    report["passed"] = not errors
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", required=True, type=Path)
    parser.add_argument("--sha256", help="Huella oficial SHA256 del ZIP")
    args = parser.parse_args()
    if args.sha256 and not DIGEST.fullmatch(args.sha256.lower()):
        parser.error("--sha256 debe tener 64 caracteres hexadecimales")
    report = audit_zip(args.zip, args.sha256)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
