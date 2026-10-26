"""Check active Spec Kit delivery artifacts; never execute declared evidence.

This is a repository-specific consistency gate, not a Spec Kit certification or
proof that a test was run. CI executes the tests independently.
"""

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess

REQUIRED_DOCUMENTS = (
    "spec.md",
    "plan.md",
    "tasks.md",
    "analysis.md",
    "checklists/requirements.md",
    "convergence.md",
)
TECHNICAL_SUFFIXES = {
    ".ino",
    ".h",
    ".hpp",
    ".c",
    ".cpp",
    ".py",
    ".js",
    ".cjs",
    ".mjs",
    ".html",
    ".css",
    ".json",
    ".toml",
    ".yml",
    ".yaml",
    ".bat",
    ".sh",
}
PLACEHOLDERS = re.compile(
    r"NEEDS CLARIFICATION|TODO(?:\(|:)|TKTK|\[FEATURE NAME\]|\[PROJECT_NAME\]|\[DATE\]|\[###"
)


def technical(name):
    path = PurePosixPath(name)
    return path.parts[0] not in {".specify", ".agents", "specs"} and (
        path.suffix.lower() in TECHNICAL_SUFFIXES
        or path.name == "VERSION"
        or path.name.startswith("requirements")
    )


def safe_path(root, name, *, exists=True):
    if (
        not isinstance(name, str)
        or not name
        or re.search(r"[\\:\x00-\x1f]", name)
        or PurePosixPath(name).is_absolute()
        or any(part in {"", ".", ".."} for part in name.split("/"))
    ):
        raise ValueError("ruta relativa no válida")
    current = root
    for part in name.split("/"):
        current = current / part
        try:
            info = current.lstat()
        except FileNotFoundError:
            continue
        if (
            stat.S_ISLNK(info.st_mode)
            or getattr(info, "st_file_attributes", 0) & 1024
            or (stat.S_ISREG(info.st_mode) and info.st_nlink > 1)
        ):
            raise ValueError("ruta con enlace: " + name)
    if not current.resolve().is_relative_to(root):
        raise ValueError("ruta fuera del repositorio")
    if exists and not current.is_file():
        raise ValueError("archivo o evidencia ausente: " + name)
    return current


def read_text(root, name):
    path = safe_path(root, name)
    if path.stat().st_size > 1_000_000:
        raise ValueError("documento demasiado grande: " + name)
    text = path.read_text(encoding="utf-8")
    if not text.strip():
        raise ValueError("documento vacío: " + name)
    return text


def read_json(root, name):
    try:
        data = json.loads(read_text(root, name))
    except json.JSONDecodeError:
        raise ValueError("JSON no válido: " + name) from None
    if not isinstance(data, dict) or data.get("schema_version") != 1:
        raise ValueError("schema_version no válido: " + name)
    return data


def changed_paths(root, base):
    if not re.fullmatch(r"[a-fA-F0-9]{40}", base):
        raise ValueError("base Git no válida: se exige SHA completo")
    if base == "0" * 40:
        return None
    try:
        output = subprocess.check_output(
            ["git", "diff", "--name-only", "-z", base, "--"],
            cwd=root,
            stderr=subprocess.DEVNULL,
            timeout=30,
        )
    except (OSError, subprocess.SubprocessError):
        raise ValueError("no se puede comparar la base Git solicitada") from None
    return {name for name in output.decode("utf-8").split("\0") if name and technical(name)}


def validate(root, base=None):
    root = Path(root).resolve()
    result = {
        "passed": False,
        "feature": None,
        "requirements": 0,
        "changed_files_checked": 0,
        "base_compared": False,
        "errors": [],
    }
    try:
        config = read_json(root, ".specify/memory/quality-gate.json")
        feature = config.get("feature")
        if not isinstance(feature, str) or not re.fullmatch(r"specs/[a-z0-9][a-z0-9-]*", feature):
            raise ValueError("la mejora activa debe estar bajo specs/")
        result["feature"] = feature
        documents = {}
        for name in REQUIRED_DOCUMENTS:
            text = read_text(root, feature + "/" + name)
            if PLACEHOLDERS.search(text):
                raise ValueError("documento pendiente de aclaración: " + name)
            documents[name] = text
        for name in ("tasks.md", "checklists/requirements.md"):
            boxes = re.findall(r"^\s*[-*] \[([^\]]*)\]", documents[name], re.M)
            if not boxes or any(box.lower() != "x" for box in boxes):
                raise ValueError("casillas abiertas o ausentes: " + name)
        requirements = re.findall(r"^- \*\*(FR-\d{3,})\*\*:", documents["spec.md"], re.M)
        if not requirements or len(set(requirements)) != len(requirements):
            raise ValueError("requisitos ausentes o duplicados en spec.md")
        record = read_json(root, feature + "/verification.json")
        if record.get("convergence") != "converged":
            raise ValueError("convergencia incompleta")
        rows = record.get("requirements")
        if not isinstance(rows, list):
            raise ValueError("lista de requisitos no válida")
        seen = set()
        for row in rows:
            if not isinstance(row, dict):
                raise ValueError("requisito no válido")
            key = row.get("id")
            if not isinstance(key, str) or key not in requirements or key in seen:
                raise ValueError("requisito desconocido o duplicado")
            seen.add(key)
            if (
                row.get("result") != "passed"
                or not isinstance(row.get("notes"), str)
                or not row["notes"].strip()
            ):
                raise ValueError("resultado o explicación pendientes: " + key)
            evidence = row.get("evidence")
            if not isinstance(evidence, list) or not evidence:
                raise ValueError("evidencias ausentes: " + key)
            for name in evidence:
                safe_path(root, name)
        if seen != set(requirements):
            raise ValueError(
                "requisitos sin verificación: " + ", ".join(sorted(set(requirements) - seen))
            )
        result["requirements"] = len(requirements)
        hashes = record.get("changed_files")
        if not isinstance(hashes, dict) or not hashes:
            raise ValueError("changed_files debe contener huellas técnicas")
        for name, expected in hashes.items():
            path = safe_path(root, name, exists=expected != "deleted")
            if not technical(name):
                raise ValueError("archivo no técnico en changed_files: " + name)
            if expected == "deleted":
                if path.exists():
                    raise ValueError("archivo declarado eliminado aún existe: " + name)
            elif (
                not isinstance(expected, str)
                or not re.fullmatch(r"[a-f0-9]{64}", expected)
                or hashlib.sha256(path.read_bytes()).hexdigest() != expected
            ):
                raise ValueError("huella desactualizada o no válida: " + name)
        result["changed_files_checked"] = len(hashes)
        if base is not None:
            changed = changed_paths(root, base)
            if changed is not None:
                result["base_compared"] = True
                missing = changed - set(hashes)
                if missing:
                    raise ValueError(
                        "archivos técnicos sin cobertura: " + ", ".join(sorted(missing))
                    )
        result["passed"] = True
    except (OSError, ValueError, UnicodeError) as error:
        result["errors"].append(str(error))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = validate(Path(__file__).resolve().parents[1], args.base)
    if args.json:
        print(json.dumps(result, ensure_ascii=False))
    else:
        print("Spec Kit delivery: " + ("PASS" if result["passed"] else "FAIL"))
        print("Base Git comparada: " + str(result["base_compared"]))
        for message in result["errors"]:
            print(message)
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
