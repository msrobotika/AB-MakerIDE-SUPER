"""Resolve the local Arduino CLI without changing PATH or global configuration."""

import os
from pathlib import Path
import shutil


def arduino_cli():
    override = os.environ.get("AB_MAKERIDE_ARDUINO_CLI")
    if override:
        return override if Path(override).is_file() else None
    executable = shutil.which("arduino-cli")
    if executable:
        return executable
    if os.name == "nt":
        candidate = (
            Path(os.environ.get("ProgramFiles", r"C:\Program Files"))
            / "Arduino CLI"
            / "arduino-cli.exe"
        )
        if candidate.is_file():
            return str(candidate)
    return None
