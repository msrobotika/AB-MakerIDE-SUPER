"""Read-only CLI audit. No installs, serial connection or upload."""

import argparse
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server
from ab_makeride.toolchain import arduino_cli

parser = argparse.ArgumentParser()
parser.add_argument("--output", type=Path, required=True)
args = parser.parse_args()
catalog = server.board_catalog(refresh=True)
fallback = server._boards_from_installed_cores()
actual = {b["fqbn"] for b in catalog["boards"]}
recovered = {b["fqbn"] for b in fallback}
cores = server._cli_json(["core", "list", "--json"])
data = cores.get("data") or {}
platforms = data.get("platforms", []) if isinstance(data, dict) else data
result = {
    "scope": "Read-only CLI and installed boards.txt; no serial connection or upload.",
    "executable": arduino_cli(),
    "version": server.command_result(["arduino-cli", "version"]),
    "installed_cores": [
        {"id": p.get("id"), "installed_version": p.get("installed_version")}
        for p in platforms
        if isinstance(p, dict)
    ],
    "catalog_ok": catalog["ok"],
    "catalog_error": catalog["error"],
    "catalog_source": catalog["source"],
    "catalog_count": len(actual),
    "fallback_count": len(recovered),
    "exact_fqbn_match": actual == recovered,
    "catalog_fqbn_sha256": hashlib.sha256("\n".join(sorted(actual)).encode()).hexdigest(),
    "only_fallback": sorted(recovered - actual),
    "missing_fallback": sorted(actual - recovered),
    "scan": server.scan_ports(diagnostics=True),
    "page1": server.installed_board_search("", page=1, limit=40),
    "page2": server.installed_board_search("", page=2, limit=40),
}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(
    json.dumps(
        {
            k: result[k]
            for k in ("catalog_count", "fallback_count", "exact_fqbn_match", "catalog_ok")
        }
    )
)
sys.exit(not (catalog["ok"] and actual == recovered))
