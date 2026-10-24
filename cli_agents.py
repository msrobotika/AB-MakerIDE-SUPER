"""Limited, opt-in bridge for external coding CLIs.

No files from the MakerIDE application or the user's projects are mounted into
its temporary working directory. The request supplies only redacted, explicitly
opted-in context through stdin. No shell interpolation, no direct editing.

Security note: a host-installed CLI is still a third-party program with access
subject to its own configuration and OS permissions. This is a constrained
integration, NOT an OS-level isolation boundary.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

TIMEOUT = 120
MAX_CAPTURE = 160_000


def command_available(provider: str) -> bool:
    names = {'codex': 'codex', 'claude_code': 'claude'}
    return bool(shutil.which(names[provider])) if provider in names else False


def _environment():
    """Avoid forwarding unrelated keys/credentials from the MakerIDE server."""
    permitted = (
        'PATH', 'PATHEXT', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'TEMP', 'TMP',
        'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'HOMEDRIVE',
        'HOMEPATH', 'LANG', 'LC_ALL', 'TERM', 'CODEX_HOME',
    )
    env = {key: os.environ[key] for key in permitted if key in os.environ}
    env['NO_COLOR'] = '1'
    env['CI'] = '1'
    return env


def _extract_codex(stdout: str) -> str:
    """Plain stdout from codex exec is its final response (not a JSONL log)."""
    return stdout.strip()


def _extract_claude(stdout: str) -> str:
    try:
        result = json.loads(stdout)
    except (ValueError, TypeError):
        raise ValueError('Claude Code no devolvió JSON válido.') from None
    if not isinstance(result, dict):
        raise ValueError('Claude Code devolvió un formato inesperado.')
    if result.get('is_error'):
        raise ValueError('Claude Code notificó un error; revisa su inicio de sesión y cuota.')
    response = result.get('result')
    if not isinstance(response, str) or not response.strip():
        raise ValueError('Claude Code no devolvió una respuesta de texto.')
    return response.strip()


def run_agent(provider: str, prompt: str) -> str:
    """Run a single read-only response in an empty temporary directory."""
    if provider not in ('codex', 'claude_code'):
        raise ValueError('Proveedor CLI inválido.')
    executable = shutil.which('codex' if provider == 'codex' else 'claude')
    if not executable:
        raise ValueError('No se encuentra el agente. Instala e inicia sesión en la CLI de Codex o Claude Code.')
    if not isinstance(prompt, str) or not (1 <= len(prompt) <= 35_000):
        raise ValueError('Prompt del agente demasiado grande o vacío.')
    with tempfile.TemporaryDirectory(prefix='ab-makeride-agent-') as tmp:
        if provider == 'codex':
            args = [executable, 'exec', '--ephemeral', '--sandbox', 'read-only',
                    '--skip-git-repo-check', '--ignore-user-config', '-']
        else:
            # No CLI tools: only text proposals, no filesystem or shell tools.
            # 'dontAsk' denies any tool that would otherwise request permission.
            args = [executable, '-p', '--output-format', 'json',
                    '--permission-mode', 'dontAsk', '--tools', '']
        try:
            result = subprocess.run(
                args, input=prompt, cwd=tmp, env=_environment(),
                text=True, encoding='utf-8', errors='replace',
                capture_output=True, timeout=TIMEOUT,
                creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
            )
        except subprocess.TimeoutExpired:
            raise ValueError('La consulta agotó el tiempo máximo de 120 s; revisa la CLI.') from None
        except OSError as exc:
            raise ValueError('No se pudo iniciar el agente local. Revisa la instalación de la CLI.') from exc
        if result.returncode:
            # Error text can contain sensitive echoes; don't send it to browser.
            raise ValueError(f'{provider}: la CLI falló (código {result.returncode}). Comprueba login y permisos en tu terminal.')
        if len(result.stdout) > MAX_CAPTURE:
            raise ValueError('Respuesta CLI demasiado grande.')
        text = _extract_codex(result.stdout) if provider == 'codex' else _extract_claude(result.stdout)
        if not text:
            raise ValueError('La CLI devolvió una respuesta vacía.')
        return text
