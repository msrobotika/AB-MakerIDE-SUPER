"""Catalog permissions, safe merging and REA provenance. No package execution."""

import os
import tomllib
import unittest

from ab_makeride.mcp_catalog import REA_PACKAGE, change_preset
from ab_makeride.mcp_bridge import prepare_run


class MakerMCPCatalogTests(unittest.TestCase):
    def test_rea_is_opt_in_and_version_pinned(self):
        value = change_preset({"mcpServers": {}}, "rea", "add")
        item = value["mcpServers"]["rea"]
        if os.name == "nt":
            self.assertEqual(item["command"], "cmd.exe")
            self.assertEqual(item["args"], ["/d", "/c", "npx", "-y", REA_PACKAGE, "mcp"])
        else:
            self.assertEqual(item["command"], "npx")
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

    def test_context7_preserves_remote_url_and_requires_consent(self):
        saved = change_preset({"mcpServers": {}}, "context7", "add")
        self.assertEqual(
            saved["mcpServers"]["context7"],
            {"type": "http", "url": "https://mcp.context7.com/mcp"},
        )
        flags, environment = prepare_run("codex", saved, None)
        config = tomllib.loads("\n".join(flags[1::2]))
        self.assertEqual(
            config["mcp_servers"]["context7"]["default_tools_approval_mode"], "prompt"
        )
        self.assertEqual(environment, {})

    def test_playwright_is_pinned_and_runs_isolated(self):
        config = change_preset({"mcpServers": {}}, "playwright", "add")
        entry = config["mcpServers"]["playwright"]
        self.assertIn("@playwright/mcp@0.0.83", entry["args"])
        self.assertIn("--headless", entry["args"])
        self.assertIn("--isolated", entry["args"])
        self.assertNotIn("@latest", " ".join(entry["args"]))
        self.assertEqual(
            change_preset(config, "playwright", "remove"), {"mcpServers": {}}
        )

    def test_preset_never_overwrites_custom_context7_key(self):
        existing = {
            "mcpServers": {
                "context7": {
                    "url": "https://mcp.context7.com/mcp",
                    "headers": {"Authorization": "Bearer private-example"},
                }
            }
        }
        with self.assertRaisesRegex(ValueError, "sobrescribirá"):
            change_preset(existing, "context7", "add")
        with self.assertRaisesRegex(ValueError, "personalizado"):
            change_preset(existing, "context7", "remove")

    def test_reject_unverified_catalog_entries(self):
        for candidate in ("kicad", "espressif_docs", "../rea", "serial", ""):
            with self.subTest(candidate=candidate):
                with self.assertRaises(ValueError):
                    change_preset({"mcpServers": {}}, candidate, "add")

    def test_reject_unsupported_action(self):
        with self.assertRaisesRegex(ValueError, "Acción"):
            change_preset({"mcpServers": {}}, "rea", "launch")

    def test_codex_keeps_per_call_approval_default(self):
        value = change_preset({"mcpServers": {}}, "rea", "add")
        flags, secrets = prepare_run("codex", value, None)
        data = tomllib.loads("\n".join(flags[1::2]))
        self.assertEqual(data["mcp_servers"]["rea"]["default_tools_approval_mode"], "prompt")
        self.assertEqual(secrets, {})


if __name__ == "__main__":
    unittest.main()
