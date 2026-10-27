"""Regression gate: direct public download URLs and honest installer scope."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WINDOWS_SETUP = (
    "https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/download/"
    "windows-test-dev-025dd26e85/AB-MakerIDE-SUPER-Windows-x64-dev-025dd26e85-Setup.exe"
)
ZIP_RC4 = (
    "https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/download/"
    "v1.0.0-rc.4/AB-MakerIDE-SUPER-1.0.0-rc.4-IA-actualizada.zip"
)
SOURCE = "https://github.com/msrobotika/AB-MakerIDE-SUPER/archive/refs/heads/main.zip"
FILES = ["README.md", "README.en.md", "docs/DESCARGAS_Y_VERSIONES.md"]

for filename in FILES:
    content = (ROOT / filename).read_text(encoding="utf-8")
    assert WINDOWS_SETUP in content, f"Setup.exe URL missing from {filename}"
    assert ZIP_RC4 in content, f"Historical RC4 link missing in {filename}"
    assert SOURCE in content, f"Source link missing in {filename}"
    assert "ScreenLab" in content, f"ScreenLab not discoverable in {filename}"
    assert "RC4" in content, f"Historical RC4 scope missing in {filename}"
    assert "TEST" in content, f"Installer warning or edition missing in {filename}"

index = (ROOT / "docs/README.md").read_text(encoding="utf-8")
install = (ROOT / "docs/INSTALACION.md").read_text(encoding="utf-8")
rc4 = (ROOT / "docs/RC4_PUBLICACION.md").read_text(encoding="utf-8")
assert "DESCARGAS_Y_VERSIONES.md" in index
assert WINDOWS_SETUP in install
assert "INICIAR_WINDOWS.bat" in install
assert "RC4" in rc4

print("Windows installer, historical RC4 and current-source landing: PASS")
