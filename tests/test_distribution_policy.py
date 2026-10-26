"""Packaging/trademark regression checks, NOT legal certification."""

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class DistributionPolicy(unittest.TestCase):
    def test_current_arcade_example_uses_own_names(self):
        folder = ROOT / "examples" / "defensa_orbital"
        sketch = folder / "defensa_orbital.ino"
        code = sketch.read_text(encoding="utf-8") + (folder / "DefensaOrbital.h").read_text(
            encoding="utf-8"
        )
        self.assertTrue((folder / "CYDFrame.h").is_file())
        self.assertIn('#include "DefensaOrbital.h"', code)
        self.assertIn("class DefensaOrbital", code)
        self.assertIn("DefensaOrbital game;", code)
        self.assertNotIn("SpaceInvaders", code)
        self.assertNotIn("SPACEINVADERS", code)
        self.assertFalse((ROOT / "examples" / "cyd_space_invaders").exists())

    def test_no_bundled_arduino_cli_binary(self):
        toolchain = (ROOT / "ab_makeride" / "toolchain.py").read_text(encoding="utf-8")
        self.assertIn("shutil.which", toolchain)
        self.assertIn("AB_MAKERIDE_ARDUINO_CLI", toolchain)
        for path in ROOT.rglob("*"):
            if any(p in (".git", ".venv", "node_modules") for p in path.parts):
                continue
            if path.is_file():
                self.assertNotIn(path.name.lower(), ("arduino-cli", "arduino-cli.exe"))

    def test_notices_and_upstream_license(self):
        notice = (ROOT / "THIRD_PARTY_NOTICES.md").read_text(encoding="utf-8")
        self.assertIn("GPL-3.0", notice)
        self.assertIn("GitHub Spec Kit", notice)
        upstream = (ROOT / ".specify" / "UPSTREAM_LICENSE").read_text(encoding="utf-8")
        self.assertIn("Copyright GitHub, Inc.", upstream)
        self.assertIn("MIT License", (ROOT / "LICENSE").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
