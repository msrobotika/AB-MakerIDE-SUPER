"""Explicit, allowlisted Maker MCP presets. No processes or downloads here."""

from __future__ import annotations

import os

from .mcp_bridge import validate_config

REA_VERSION = "6.8.0"
REA_PACKAGE = f"rea-agents@{REA_VERSION}"


def _rea():
    """The command is only a proposed MCP registration, not an installation."""
    return {
        "command": "npx.cmd" if os.name == "nt" else "npx",
        "args": ["-y", REA_PACKAGE, "mcp"],
    }


def _preset(preset_id):
    if preset_id != "rea":
        raise ValueError("MCP Maker desconocido o sin adaptador auditado.")
    return _rea()


def change_preset(current, preset_id, action):
    """Merge/remove only exact known registrations; preserve unrelated credentials."""
    original = validate_config(current)
    if action not in ("add", "remove"):
        raise ValueError("Acción de catálogo MCP no autorizada.")
    expected = _preset(preset_id)
    servers = dict(original["mcpServers"])
    present = servers.get(preset_id)

    if action == "add":
        if present is not None and present != expected:
            raise ValueError(
                "Ya existe un MCP con ese nombre y otra configuración. "
                "No se sobrescribirá."
            )
        servers[preset_id] = expected
    elif present is not None:
        if present != expected:
            raise ValueError(
                "Este MCP está personalizado. No se eliminará desde el catálogo."
            )
        del servers[preset_id]

    return validate_config({"mcpServers": servers})
