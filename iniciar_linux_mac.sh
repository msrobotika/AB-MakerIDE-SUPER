#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
export PYTHONUTF8=1
export AB_MAKERIDE_DATA_DIR="${AB_MAKERIDE_DATA_DIR:-$PWD/.makeride-data}"
if [[ -x .venv/bin/python ]]; then
  exec .venv/bin/python launch.py "$@"
fi
exec python3 launch.py "$@"
