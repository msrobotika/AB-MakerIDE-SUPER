"""Intent classification helpers; never grant CLI or hardware permissions."""

from __future__ import annotations

import re
import unicodedata


def requests_upload(prompt: str) -> bool:
    """Completion requirement only; never grants permissions to a CLI/tool."""
    text = "".join(
        c for c in unicodedata.normalize("NFKD", prompt.lower()) if not unicodedata.combining(c)
    )
    if re.search(
        r"\b(?:no|sin)\s+(?:(?:lo|la|el|que|se)\s+)*(?:sub(?:as|ir)|carg(?:ues|ar)|grab(?:es|ar)|flashe(?:es|ar))\b",
        text,
    ):
        return False
    return bool(
        re.search(
            r"\b(?:sube(?:lo|la)?|carga(?:lo|la)?|graba(?:lo|la)?|subir|cargar|grabar|upload|flashea(?:lo)?)\b",
            text,
        )
    )

