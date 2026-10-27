"""Regression gate: visible download links and public-vs-development scope."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ZIP_RC4 = "https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/download/v1.0.0-rc.4/AB-MakerIDE-SUPER-1.0.0-rc.4-IA-actualizada.zip"
SOURCE = "https://github.com/msrobotika/AB-MakerIDE-SUPER/archive/refs/heads/main.zip"
FILES = ["README.md", "README.en.md", "docs/DESCARGAS_Y_VERSIONES.md"]

for filename in FILES:
    text = (ROOT / filename).read_text(encoding="utf-8")
    assert ZIP_RC4 in text, f"RC4 direct ZIP link missing in {filename}"
    assert SOURCE in text, f"development source download missing in {filename}"
    assert "ScreenLab" in text, f"development feature not discoverable in {filename}"
    assert ".exe" in text or ".msi" in text, f"installer limitation missing in {filename}"
    assert "RC4" in text, f"public release scope missing in {filename}"
assert "DESCARGAS_Y_VERSIONES.md" in (ROOT / "docs/README.md").read_text(encoding="utf-8")
assert "INICIAR_WINDOWS.bat" in (ROOT / "docs/INSTALACION.md").read_text(encoding="utf-8")
assert "RC4" in (ROOT / "docs/RC4_PUBLICACION.md").read_text(encoding="utf-8")
print("Landing links, release separation, development features and installer disclosure: PASS")
