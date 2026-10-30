"""Exercise the offline distribution checker with synthetic, untrusted archives."""

import hashlib
from pathlib import Path
import tempfile
import unittest
import zipfile

from scripts.audit_distribution import audit_zip


class DistributionArchiveTests(unittest.TestCase):
    def audit_fixture(self, remove=(), add=None, tamper=None, traversal=False, directories=()):
        files = {
            "README.md": b"Independent tool",
            "README.en.md": b"Independent tool",
            "LICENSE": b"MIT License",
            "VERSION": b"1.0.0-rc.4\n",
            "THIRD_PARTY_NOTICES.md": b"Arduino CLI external GPLv3",
            ".specify/UPSTREAM_LICENSE": b"MIT License\nCopyright GitHub, Inc.",
            ".specify/UPSTREAM.md": b"GitHub original code provenance",
            "examples/defensa_orbital/defensa_orbital.ino": b'#include "DefensaOrbital.h"',
            "examples/defensa_orbital/DefensaOrbital.h": b"class DefensaOrbital {};",
            "examples/defensa_orbital/CYDFrame.h": b"class CYDFrame {};",
        }
        for path in remove:
            files.pop(path)
        files.update(add or {})
        lines = [
            "AB MakerIDE SUPER 1.0.0-rc.4 / SHA-256 manifest",
            "Format: HASH  PATH (relative to package root; manifest excludes itself)",
            "",
        ]
        lines.extend(
            hashlib.sha256(content).hexdigest() + "  " + path
            for path, content in sorted(files.items())
        )
        files["MANIFEST_SHA256.txt"] = ("\n".join(lines) + "\n").encode("utf-8")
        if tamper:
            files[tamper] = b"tampered after manifest generated"
        with tempfile.TemporaryDirectory() as folder:
            filename = Path(folder) / "test.zip"
            with zipfile.ZipFile(filename, "w", zipfile.ZIP_DEFLATED) as archive:
                for directory in directories:
                    archive.writestr("MakerIDE/" + directory.rstrip("/") + "/", b"")
                for path, content in files.items():
                    archive.writestr("MakerIDE/" + path, content)
                if traversal:
                    archive.writestr("MakerIDE/../../escape", b"attack")
            return audit_zip(filename)

    def test_valid_archive(self):
        self.assertTrue(self.audit_fixture()["passed"])

    def test_missing_notice_blocked(self):
        self.assertFalse(self.audit_fixture(remove=("THIRD_PARTY_NOTICES.md",))["passed"])

    def test_sha_tampering_blocked(self):
        self.assertFalse(self.audit_fixture(tamper="README.md")["passed"])

    def test_arduino_cli_binary_blocked(self):
        self.assertFalse(self.audit_fixture(add={"bin/arduino-cli.exe": b"fake"})["passed"])

    def test_old_game_name_blocked(self):
        self.assertFalse(
            self.audit_fixture(add={"examples/cyd_space_invaders/old.ino": b"x"})["passed"]
        )

    def test_zip_traversal_blocked(self):
        self.assertFalse(self.audit_fixture(traversal=True)["passed"])

    def test_windows_case_alias_blocked(self):
        report = self.audit_fixture(add={"readme.md": b"different file"})
        self.assertFalse(report["passed"])
        self.assertTrue(any("Windows" in error for error in report["errors"]))

    def test_windows_ancestor_case_alias_blocked(self):
        report = self.audit_fixture(add={"Examples/other.txt": b"different directory spelling"})
        self.assertFalse(report["passed"])

    def test_file_directory_conflict_blocked_in_both_orders(self):
        pairs = [("assets", b"file"), ("assets/icon.svg", b"icon")]
        for entries in (pairs, list(reversed(pairs))):
            with self.subTest(entries=entries):
                self.assertFalse(self.audit_fixture(add=dict(entries))["passed"])

    def test_consistent_explicit_directories_allowed(self):
        self.assertTrue(
            self.audit_fixture(directories=("examples", "examples/defensa_orbital"))["passed"]
        )


if __name__ == "__main__":
    unittest.main()
