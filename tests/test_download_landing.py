"""Regression gate: discoverable public and development downloads."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ZIP_RC4 = (
    "https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/download/"
    "v1.0.0-rc.4/AB-MakerIDE-SUPER-1.0.0-rc.4-IA-actualizada.zip"
)
SOURCE = "https://github.com/msrobotika/AB-MakerIDE-SUPER/archive/refs/heads/main.zip"
FILES = ["README.md", "README.en.md", "docs/DESCARGAS_Y_VERSIONES.md"]

for filename in FILES:
    content = (ROOT / filename).read_text(encoding="utf-8")
    assert ZIP_RC4 in content, f"RC4 link missing in {filename}"
    assert SOURCE in content, f"Source link missing in {filename}"
    assert "ScreenLab" in content, f"ScreenLab not discoverable in {filename}"
    assert ".exe" in content or ".msi" in content, f"No installer warning in {filename}"
    assert "RC4" in content, f"Public RC4 scope missing in {filename}"

index = (ROOT / "docs/README.md").read_text(encoding="utf-8")
install = (ROOT / "docs/INSTALACION.md").read_text(encoding="utf-8")
rc4 = (ROOT / "docs/RC4_PUBLICACION.md").read_text(encoding="utf-8")
assert "DESCARGAS_Y_VERSIONES.md" in index
assert "INICIAR_WINDOWS.bat" in install
assert "RC4" in rc4

print("Public and development download documentation: PASS")
