import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from ab_makeride.secret_store import ProtectedSettings, private_write


class SecretStoreTests(unittest.TestCase):
    @unittest.skipUnless(os.name == "nt", "Actual DPAPI runs only on Windows")
    def test_windows_roundtrip_and_migration_never_leave_plaintext(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "mcp.json"
            original = {
                "mcpServers": {
                    "docs": {
                        "url": "https://example.com/mcp",
                        "headers": {"Authorization": "private-fixture-token"},
                    }
                }
            }
            store = ProtectedSettings(path)
            self.assertTrue(store.save(original))
            self.assertNotIn(b"private-fixture-token", path.read_bytes())
            self.assertEqual(ProtectedSettings(path).load(), original)
            path.write_text(json.dumps(original), encoding="utf-8")
            self.assertEqual(ProtectedSettings(path).load(), original)
            self.assertNotIn(b"private-fixture-token", path.read_bytes())

    def test_missing_vault_is_ram_only_never_plaintext(self):
        with (
            tempfile.TemporaryDirectory() as folder,
            patch("ab_makeride.secret_store.WINDOWS", False),
            patch("ab_makeride.secret_store._keyring", return_value=None),
        ):
            path = Path(folder) / "mcp.json"
            store = ProtectedSettings(path)
            original = {
                "mcpServers": {"docs": {"command": "fixture", "env": {"TOKEN": "private-fixture"}}}
            }
            self.assertFalse(store.save(original))
            self.assertEqual(store.load(), original)
            self.assertFalse(path.exists())
            self.assertEqual(store.storage, "memory-only")

    def test_system_keyring_stores_reference_only(self):
        class Vault:
            def __init__(self):
                self.items = {}

            def set_password(self, service, key, value):
                self.items[(service, key)] = value

            def get_password(self, service, key):
                return self.items.get((service, key))

        vault = Vault()
        with (
            tempfile.TemporaryDirectory() as folder,
            patch("ab_makeride.secret_store.WINDOWS", False),
            patch("ab_makeride.secret_store._keyring", return_value=vault),
        ):
            path = Path(folder) / "mcp.json"
            original = {
                "mcpServers": {"docs": {"command": "fixture", "env": {"TOKEN": "private-fixture"}}}
            }
            ProtectedSettings(path).save(original)
            self.assertNotIn("private-fixture", path.read_text())
            self.assertEqual(ProtectedSettings(path).load(), original)
            self.assertEqual(path.stat().st_mode & 0o777, 0o600) if os.name != "nt" else None

    def test_unprotected_legacy_file_without_vault_stays_explicitly_blocked(self):
        with (
            tempfile.TemporaryDirectory() as folder,
            patch("ab_makeride.secret_store.WINDOWS", False),
            patch("ab_makeride.secret_store._keyring", return_value=None),
        ):
            path = Path(folder) / "mcp.json"
            path.write_text(json.dumps({"mcpServers": {}}))
            store = ProtectedSettings(path)
            for _ in range(2):
                with self.assertRaisesRegex(ValueError, "sin cifrar"):
                    store.load()
            self.assertIsNone(store.memory)

    @unittest.skipIf(os.name == "nt", "POSIX mode check")
    def test_private_files_have_mode_600(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "private.json"
            private_write(path, b"fixture")
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
