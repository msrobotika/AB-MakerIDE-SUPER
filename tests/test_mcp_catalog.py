"""Catalog permissions, safe merging and REA provenance. No package execution."""

import os
import unittest

from ab_makeride.mcp_catalog import REA_PACKAGE, change_preset
from ab_makeride.mcp_bridge import prepare_run


class MakerMCPCatalogTests(unittest.TestCase):
    def test_rea_is_opt_in_and_version_pinned(self):
        value = change_preset({"mcpServers": {}}, "rea", "add")
        item = value["mcpServers"]["rea"]
        self.assertEqual(item["command"], "npx.cmd" if os.name == "nt" else "npx")
        self.assertEqual(item["args"], ["-y", REA_PACKAGE, "mcp"])
        self.assertNotIn("@latest", repr(value))

    def test_preserve_existing_servers_and_credentials(self):
        original = {
            "mcpServers": {
                "private": {
                    "url": "https://example.com/mcp",
                    "headers": {"Authorization": "secret-not-for-display"},
                }
            }
        }
        added = change_preset(original, "rea", "add")
        self.assertEqual(added["mcpServers"]["private"], original["mcpServers"]["private"])
        self.assertEqual(original.keys(), {"mcpServers"})
        self.assertEqual(len(original["mcpServers"]), 1)
        self.assertEqual(change_preset(added, "rea", "add"), added)
        removed = change_preset(added, "rea", "remove")
        self.assertEqual(removed, original)

    def test_never_overwrite_custom_rea(self):
        original = {"mcpServers": {"rea": {"command": "my-own-program"}}}
        with self.assertRaisesRegex(ValueError, "sobrescribirá"):
            change_preset(original, "rea", "add")
        with self.assertRaisesRegex(ValueError, "personalizado"):
            change_preset(original, "rea", "remove")

    def test_reject_unverified_catalog_entries(self):
        for candidate in ("kicad", "espressif_docs", "../rea", ""):
            with self.subTest(candidate=candidate):
                with self.assertRaises(ValueError):
                    change_preset({"mcpServers": {}}, candidate, "add")

    def test_reject_unsupported_action(self):
        with self.assertRaisesRegex(ValueError, "Acción"):
            change_preset({"mcpServers": {}}, "rea", "launch")

    def test_codex_keeps_per_call_approval_default(self):
        value = change_preset({"mcpServers": {}}, "rea", "add")
        flags, secrets = prepare_run("codex", value, None)
        self.assertIn('default_tools_approval_mode = "prompt"', " ".join(flags))
        self.assertEqual(secrets, {})


if __name__ == "__main__":
    unittest.main()
