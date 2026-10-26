"""OS-backed protection for local AI settings; never fall back to plaintext."""

from __future__ import annotations

import base64
import ctypes
import json
import os
from pathlib import Path
import tempfile
import hashlib

from .agent_projects import is_link_or_reparse, plain_directory

WINDOWS = os.name == "nt"


def private_write(path: Path, data: bytes) -> None:
    plain_directory(path.parent, create=True)
    if is_link_or_reparse(path):
        raise ValueError("El archivo privado no puede ser un enlace.")
    fd, temporary = tempfile.mkstemp(prefix=".private-", dir=path.parent)
    try:
        os.chmod(temporary, 0o600)
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def _dpapi(data: bytes, *, decrypt: bool = False) -> bytes:
    from ctypes import wintypes

    class Blob(ctypes.Structure):
        _fields_ = [("size", wintypes.DWORD), ("data", ctypes.POINTER(ctypes.c_ubyte))]

    memory = ctypes.create_string_buffer(data)
    source = Blob(len(data), ctypes.cast(memory, ctypes.POINTER(ctypes.c_ubyte)))
    target = Blob()
    crypt = ctypes.WinDLL("crypt32", use_last_error=True)
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    # UI forbidden; user-bound DPAPI, never CRYPTPROTECT_LOCAL_MACHINE.
    if decrypt:
        method = crypt.CryptUnprotectData
        method.argtypes = [
            ctypes.POINTER(Blob),
            ctypes.c_void_p,
            ctypes.c_void_p,
            ctypes.c_void_p,
            ctypes.c_void_p,
            wintypes.DWORD,
            ctypes.POINTER(Blob),
        ]
        ok = method(ctypes.byref(source), None, None, None, None, 1, ctypes.byref(target))
    else:
        method = crypt.CryptProtectData
        method.argtypes = [
            ctypes.POINTER(Blob),
            wintypes.LPCWSTR,
            ctypes.c_void_p,
            ctypes.c_void_p,
            ctypes.c_void_p,
            wintypes.DWORD,
            ctypes.POINTER(Blob),
        ]
        ok = method(
            ctypes.byref(source),
            "AB MakerIDE AI settings",
            None,
            None,
            None,
            1,
            ctypes.byref(target),
        )
    method.restype = wintypes.BOOL
    if not ok:
        raise OSError("No se pudo proteger o abrir la configuración mediante DPAPI.")
    kernel.LocalFree.argtypes = [ctypes.c_void_p]
    kernel.LocalFree.restype = ctypes.c_void_p
    try:
        return ctypes.string_at(target.data, target.size)
    finally:
        kernel.LocalFree(target.data)


def _keyring():
    try:
        import keyring

        backend = keyring.get_keyring()
        # Reject plaintext/third-party fallback backends and fail-closed backends.
        supported = (
            "keyring.backends.macOS",
            "keyring.backends.SecretService",
            "keyring.backends.kwallet",
            "keyring.backends.Windows",
        )
        if backend.__class__.__module__ not in supported or backend.priority <= 0:
            return None
        return backend
    except (ImportError, RuntimeError, OSError):
        return None


class ProtectedSettings:
    def __init__(self, path: Path):
        self.path = path
        self.memory = None
        self.storage = "not-saved"

    def save(self, value: dict) -> bool:
        raw = json.dumps(value, ensure_ascii=False)
        if WINDOWS:
            encrypted = _dpapi(raw.encode("utf-8"))
            envelope = {
                "storage": "windows-dpapi",
                "payload": base64.b64encode(encrypted).decode("ascii"),
            }
        else:
            vault = _keyring()
            if vault is None:
                if self.path.exists():
                    plain_directory(self.path.parent)
                    if is_link_or_reparse(self.path) or self.path.stat().st_size > 500_000:
                        raise ValueError("Archivo de configuración privada no seguro.")
                    previous = json.loads(self.path.read_text("utf-8"))
                    if "mcpServers" in previous:
                        self.memory = None
                        self.storage = "legacy-unprotected"
                        raise ValueError(
                            "La configuración antigua sigue sin cifrar. Activa el llavero del sistema para migrarla; no se ha cargado ni reemplazado."
                        )
                self.memory = value
                self.storage = "memory-only"
                # Existing protected configuration is preserved; stale settings never
                # supersede this process's explicit RAM-only selection.
                return False
            reference = hashlib.sha256(str(self.path.resolve()).encode("utf-8")).hexdigest()
            vault.set_password("AB MakerIDE MCP", reference, raw)
            envelope = {"storage": "system-keyring", "reference": reference}
        private_write(self.path, json.dumps(envelope).encode("utf-8"))
        self.memory = value
        self.storage = envelope["storage"]
        return True

    def load(self) -> dict | None:
        if self.memory is not None:
            return self.memory
        if not self.path.exists():
            return None
        plain_directory(self.path.parent)
        if is_link_or_reparse(self.path) or self.path.stat().st_size > 500_000:
            raise ValueError("Archivo de configuración privada no seguro.")
        envelope = json.loads(self.path.read_text("utf-8"))
        storage = envelope.get("storage")
        if storage == "windows-dpapi" and WINDOWS:
            raw = _dpapi(base64.b64decode(envelope["payload"], validate=True), decrypt=True).decode(
                "utf-8"
            )
        elif storage == "system-keyring":
            vault = _keyring()
            if vault is None:
                raise ValueError(
                    "El llavero del sistema no está disponible; no se han expuesto los secretos."
                )
            raw = vault.get_password("AB MakerIDE MCP", envelope["reference"])
            if not raw:
                raise ValueError("El llavero no contiene esta configuración.")
        elif "mcpServers" in envelope:
            # Migrate the old user-controlled local record in place after protecting
            # it; never create a second plaintext backup or silently discard it.
            if not self.save(envelope):
                raise ValueError(
                    "Configuración antigua sin cifrar: configura un llavero seguro para migrarla."
                )
            return self.memory
        else:
            raise ValueError("La configuración privada no pertenece a este usuario o sistema.")
        self.memory = json.loads(raw)
        self.storage = storage
        return self.memory
