"""Explicit, allowlisted Maker MCP presets. No processes or downloads here."""

from __future__ import annotations

import os

from .mcp_bridge import validate_config

REA_VERSION = "6.8.0"
REA_PACKAGE = f"rea-agents@{REA_VERSION}"


def _rea():
    """The command is only a proposed MCP registration, not an installation."""
    return {
        "command": "cmd.exe" if os.name == "nt" else "npx",
        "args": ["/d", "/c", "npx", "-y", REA_PACKAGE, "mcp"]
        if os.name == "nt"
        else ["-y", REA_PACKAGE, "mcp"],
    }


def _context7():
    # Official remote endpoint; API key is optional but increases rate limits.
    # A custom entry with secrets is never overwritten by the preset.
    return {"type": "http", "url": "https://mcp.context7.com/mcp"}


def _playwright():
    # Isolated browser; no inherited login profile. Browser download is separate.
    package = "@playwright/mcp@0.0.83"
    args = ["-y", package, "--headless", "--isolated", "--browser=chromium"]
    if os.name == "nt":
        return {"command": "cmd.exe", "args": ["/d", "/c", "npx", *args]}
    return {"command": "npx", "args": args}


def _preset(preset_id):
    providers = {"rea": _rea, "context7": _context7, "playwright": _playwright}
    if preset_id not in providers:
        raise ValueError("MCP Maker desconocido o sin adaptador auditado.")
    return providers[preset_id]()


def change_preset(current, preset_id, action):
    """Merge/remove known registrations without editing unrelated credentials."""
    original = validate_config(current)
    if action not in ("add", "remove"):
        raise ValueError("Acción de catálogo MCP no autorizada.")
    expected = _preset(preset_id)
    servers = dict(original["mcpServers"])
    present = servers.get(preset_id)

    if action == "add":
        if present is not None and present != expected:
            raise ValueError(
                "Ya existe un MCP con ese nombre y otra configuración. No se sobrescribirá."
            )
        servers[preset_id] = expected
    elif present is not None:
        if present != expected:
            raise ValueError("Este MCP está personalizado. No se eliminará desde el catálogo.")
        del servers[preset_id]

    return validate_config({"mcpServers": servers})
