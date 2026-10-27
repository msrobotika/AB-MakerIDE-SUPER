"""Windows standalone entrypoint: keep user data outside the uninstallable program folder."""
import os
from pathlib import Path

if not os.environ.get("AB_MAKERIDE_DATA_DIR"):
    local = os.environ.get("LOCALAPPDATA")
    if local:
        data_home = Path(local)
    else:
        data_home = Path.home() / "AppData" / "Local"
    os.environ["AB_MAKERIDE_DATA_DIR"] = str(data_home / "MS Robotika" / "AB MakerIDE SUPER")

from launch import main

if __name__ == "__main__":
    raise SystemExit(main())
