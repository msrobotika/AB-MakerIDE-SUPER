#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export AB_MAKERIDE_DATA_DIR="${AB_MAKERIDE_DATA_DIR:-$PWD/.makeride-data}"
python3 server.py --port 8770
