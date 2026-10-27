"""Build a standalone x64 Windows application with embedded CPython via PyInstaller.

Run from the repository root on a Windows x64 CI runner. No Arduino CLI or
vendor SDK is bundled or installed; no hardware accesses occur at build time.
"""

from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
DATA = [
    "launch.py",
    "server.py",
    "index.html",
    "app.js",
    "activity.js",
    "simulator.js",
    "board_trials.js",
    "VERSION",
    "README.md",
    "README.en.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "requirements.txt",
    "frontend",
    "examples",
    "docs",
    "ab_makeride",
]
UPSTREAM = ROOT / ".specify" / "UPSTREAM_LICENSE"


def main():
    if sys.platform != "win32" or sys.maxsize <= 2**32:
        raise SystemExit("El empaquetado requiere Windows x64.")
    for name in DATA:
        if not (ROOT / name).exists():
            raise SystemExit(f"Recurso requerido ausente: {name}")
    if not UPSTREAM.is_file():
        raise SystemExit("Falta la atribución de licencia de Spec Kit.")
    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onedir",
        "--console",
        "--contents-directory",
        ".",
        "--name",
        "AB-MakerIDE-SUPER",
        "--distpath",
        str(ROOT / "dist"),
        "--workpath",
        str(ROOT / "build" / "pyinstaller"),
        "--specpath",
        str(ROOT / "build"),
        "--paths",
        str(ROOT),
        "--hidden-import",
        "serial",
        "--hidden-import",
        "serial.tools.list_ports",
        "--collect-submodules",
        "keyring.backends",
    ]
    for name in DATA:
        source = ROOT / name
        destination = name if source.is_dir() else "."
        cmd += ["--add-data", f"{source};{destination}"]
    # The Windows distribution contains these runtimes; ship their actual license files.
    python_license = Path(sys.base_prefix) / "LICENSE.txt"
    if not python_license.is_file():
        raise SystemExit("Falta la licencia PSF del intérprete Python empaquetado.")
    cmd += ["--add-data", f"{python_license};third_party_licenses/python"]
    serial_license = ROOT / "installer" / "licenses" / "pyserial-LICENSE.txt"
    if not serial_license.is_file():
        raise SystemExit("Falta aviso legal de pyserial.")
    cmd += ["--add-data", f"{serial_license};third_party_licenses/pyserial"]
    cmd += ["--add-data", f"{UPSTREAM};.specify", str(ROOT / "installer" / "entrypoint.py")]
    subprocess.run(cmd, check=True, cwd=ROOT)
    exe = ROOT / "dist" / "AB-MakerIDE-SUPER" / "AB-MakerIDE-SUPER.exe"
    if not exe.is_file():
        raise SystemExit("PyInstaller no ha producido el ejecutable.")
    print(f"Ejecutable creado: {exe}")


if __name__ == "__main__":
    main()
