#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
export PYTHONUTF8=1
exec python3 prepare_windows.py
