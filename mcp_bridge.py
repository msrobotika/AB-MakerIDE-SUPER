"""Explicit MCP configuration for CLI agents. Validation never starts a server."""
from __future__ import annotations

import json
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import urlsplit

from agent_projects import is_link_or_reparse, plain_directory

MAX_CONFIG = 64_000


def validate_config(value) -> dict:
    if not isinstance(value, dict) or set(value) != {'mcpServers'}:
        raise ValueError('Usa un objeto JSON con mcpServers.')
    servers = value['mcpServers']
    if not isinstance(servers, dict) or len(servers) > 16:
        raise ValueError('Se admiten hasta 16 servidores MCP.')
    result = {}
    for name, item in servers.items():
        if not isinstance(name, str) or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]{0,47}', name):
            raise ValueError('Nombre MCP inválido: usa letras, números, guion o guion bajo.')
        if not isinstance(item, dict):
            raise ValueError('Cada servidor MCP debe ser un objeto.')
        remote = 'url' in item
        allowed = {'url', 'type', 'headers'} if remote else {'command', 'args', 'env', 'type'}
        if set(item) - allowed:
            raise ValueError('Campo MCP no compatible. Consulta docs/MCP.md.')
        entry = {}
        if remote:
            url = item['url']
            if not isinstance(url, str) or len(url) > 2048 or any(ord(c) < 32 for c in url):
                raise ValueError('URL MCP inválida.')
            try:
                parsed = urlsplit(url)
                port = parsed.port
            except ValueError as error:
                raise ValueError('URL MCP inválida.') from error
            if (parsed.scheme not in ('https', 'http') or not parsed.hostname or parsed.username
                    or parsed.password or parsed.fragment or parsed.query
                    or (parsed.scheme == 'http' and parsed.hostname not in ('127.0.0.1', 'localhost', '::1'))):
                raise ValueError('MCP HTTP necesita HTTPS o localhost, sin credenciales ni parámetros en la URL.')
            if item.get('type', 'http') != 'http':
                raise ValueError('Esta integración admite Streamable HTTP o stdio.')
            entry = {'type': 'http', 'url': url}
            headers = item.get('headers', {})
            if not isinstance(headers, dict) or len(headers) > 16:
                raise ValueError('Cabeceras MCP inválidas.')
            for key, text in headers.items():
                if (not isinstance(key, str) or not re.fullmatch(r'[A-Za-z][A-Za-z0-9-]{0,63}', key)
                        or key.lower() in ('host', 'origin', 'content-length')
                        or not isinstance(text, str) or len(text) > 4096 or any(ord(c) < 32 for c in text)):
                    raise ValueError('Cabecera MCP inválida.')
            if headers:
                entry['headers'] = dict(headers)
        else:
            command, args, env = item.get('command'), item.get('args', []), item.get('env', {})
            if (item.get('type', 'stdio') != 'stdio' or not isinstance(command, str)
                    or not command.strip() or len(command) > 1024 or any(ord(c) < 32 for c in command)):
                raise ValueError('Indica un ejecutable MCP; sus argumentos van en una lista separada.')
            if not isinstance(args, list) or len(args) > 64 or any(not isinstance(a, str) or len(a) > 4096 or '\x00' in a for a in args):
                raise ValueError('args debe ser una lista de textos, sin interpolación de shell.')
            if not isinstance(env, dict) or len(env) > 32:
                raise ValueError('Variables MCP inválidas.')
            for key, text in env.items():
                if (not isinstance(key, str) or not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]{0,63}', key)
                        or not isinstance(text, str) or len(text) > 4096 or '\x00' in text):
                    raise ValueError('Variable MCP inválida.')
            entry = {'command': command, 'args': list(args)}
            if env:
                entry['env'] = dict(env)
        result[name] = entry
    normalized = {'mcpServers': result}
    if len(json.dumps(normalized).encode('utf-8')) > MAX_CONFIG:
        raise ValueError('Configuración MCP demasiado grande.')
    return normalized


class MCPSettings:
    def __init__(self, path: Path):
        self.path = path

    def load(self):
        if not self.path.exists():
            return {'mcpServers': {}}
        plain_directory(self.path.parent)
        if is_link_or_reparse(self.path) or self.path.stat().st_size > MAX_CONFIG:
            raise ValueError('Archivo de configuración MCP no seguro.')
        try:
            return validate_config(json.loads(self.path.read_text('utf-8')))
        except (UnicodeError, ValueError) as error:
            raise ValueError('Configuración MCP guardada no válida; reemplázala desde el panel.') from error

    def status(self):
        value = self.load()
        return {'ok': True, 'servers': [{'name': name, 'transport': 'http' if 'url' in item else 'stdio'}
                                       for name, item in value['mcpServers'].items()],
                'connection_tested': False}

    def save(self, value):
        value = validate_config(value)
        plain_directory(self.path.parent, create=True)
        if is_link_or_reparse(self.path):
            raise ValueError('La configuración MCP no puede ser un enlace.')
        fd, tmp = tempfile.mkstemp(prefix='.mcp-', dir=self.path.parent)
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as stream:
                json.dump(value, stream, ensure_ascii=False)
            os.replace(tmp, self.path)
        finally:
            if os.path.exists(tmp):
                os.unlink(tmp)
        return self.status()


def _toml(value):
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=True)
    if isinstance(value, list):
        return '[' + ', '.join(_toml(x) for x in value) + ']'
    if isinstance(value, dict):
        return '{' + ', '.join(_toml(k) + ' = ' + _toml(v) for k, v in value.items()) + '}'
    raise ValueError('Valor MCP no compatible.')


def prepare_run(provider, config, private_dir: Path):
    """Return CLI arguments and private environment. Never launch the MCP itself."""
    servers = validate_config(config)['mcpServers']
    if provider == 'claude_code':
        path = private_dir / 'claude-mcp.json'
        path.write_text(json.dumps({'mcpServers': servers}), encoding='utf-8')
        return ['--mcp-config', str(path), '--strict-mcp-config'], {}
    if provider != 'codex':
        raise ValueError('MCP necesita un agente CLI compatible.')
    arguments, environment = [], {}
    for index, (name, item) in enumerate(servers.items()):
        entry = {key: item[key] for key in ('command', 'args', 'url') if key in item}
        entry['required'] = True
        entry['default_tools_approval_mode'] = 'approve'
        # Tokens stay out of process arguments and project exports.
        if item.get('headers'):
            mapping = {}
            for count, (header, secret) in enumerate(item['headers'].items()):
                key = f'AB_MCP_{index}_HEADER_{count}'
                mapping[header] = key
                environment[key] = secret
            entry['env_http_headers'] = mapping
        if item.get('env'):
            entry['env_vars'] = list(item['env'])
            for key, text in item['env'].items():
                if key in environment and environment[key] != text:
                    raise ValueError('Dos servidores MCP definen la misma variable con valores distintos.')
                environment[key] = text
        arguments += ['--config', 'mcp_servers.' + name + '=' + _toml(entry)]
    return arguments, environment
