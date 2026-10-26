"""Source-level regression hints, independent of formatting and module boundaries.

These checks complement the real-browser suites; they do not prove UI behavior.
"""

import re


def frontend_text(root):
    files = [root / "app.js", *sorted((root / "frontend").glob("*.js"))]
    return "\n".join(path.read_text(encoding="utf-8") for path in files)


def compact(text):
    return re.sub(r"\s+", "", text.replace("context.", ""))
