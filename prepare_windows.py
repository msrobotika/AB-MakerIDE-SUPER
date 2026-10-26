"""Cross-platform preparation of this copy's private .venv."""

import os
from pathlib import Path
import subprocess
import sys
import venv

ROOT = Path(__file__).resolve().parent


def main():
    launcher = "INICIAR_WINDOWS.bat" if os.name == "nt" else "bash iniciar_linux_mac.sh"
    preparation = "PREPARAR_WINDOWS.bat" if os.name == "nt" else "bash preparar_linux_mac.sh"
    if sys.version_info < (3, 10):
        print("Necesitas Python 3.10 o posterior. No se ha instalado nada.")
        return 2
    target = ROOT / ".venv"
    # Do not follow an existing link or overwrite an unrelated folder.
    linked = target.is_symlink() or (
        target.exists() and bool(getattr(target.lstat(), "st_file_attributes", 0) & 1024)
    )
    if linked:
        print("La carpeta .venv es un enlace. Se conserva y no se instala nada.")
        return 2
    if target.exists() and not (target / "pyvenv.cfg").is_file():
        print("La carpeta .venv ya existe y no es un entorno Python. Se conserva sin cambios.")
        return 2
    print("Preparando dependencias opcionales en " + str(target))
    print("Se necesita Internet. No se modifica el Python global ni se instala firmware.")
    try:
        if not target.exists():
            venv.EnvBuilder(with_pip=True).create(str(target))
        python = target / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
        if not python.is_file():
            print(
                "El entorno existente está incompleto. Se conserva; consulta docs/INSTALACION.md."
            )
            return 2
        run = subprocess.run(
            [str(python), "-m", "pip", "install", "-r", str(ROOT / "requirements.txt")],
            cwd=ROOT,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        if run.returncode:
            print(
                f"No se completó la instalación. Revisa la red y vuelve a ejecutar {preparation}. Los proyectos se conservan."
            )
            return run.returncode
        print(f"Preparación terminada. Abre {launcher} para usar este entorno.")
        return 0
    except (OSError, subprocess.SubprocessError) as error:
        print("No se completó la preparación: " + str(error))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
