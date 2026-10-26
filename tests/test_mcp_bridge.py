"""MCP configuration/argument boundaries; no third-party server is executed."""

import json
from pathlib import Path
import tempfile
import sys
import time
import tomllib
import unittest
from unittest.mock import patch

from ab_makeride import agent_runtime as ar
from ab_makeride.mcp_bridge import MCPSettings, prepare_run, validate_config


class MCPBridgeTests(unittest.TestCase):
    def test_rejects_ambiguous_or_dangerous_schema(self):
        cases = [
            [],
            {},
            {"mcpServers": []},
            {"mcpServers": {"../a": {"command": "python"}}},
            {"mcpServers": {"a": {"url": "http://external.example/mcp"}}},
            {"mcpServers": {"a": {"url": "https://user:pass@example.com/mcp"}}},
            {"mcpServers": {"a": {"url": "https://example.com/mcp?token=secret"}}},
            {"mcpServers": {"a": {"url": "https://example.com", "command": "python"}}},
            {"mcpServers": {"a": {"command": "python", "args": "one two"}}},
            {"mcpServers": {"a": {"command": "python", "env": {"BAD=KEY": "x"}}}},
            {"mcpServers": {"a": {"url": "https://example.com", "headers": {"Origin": "x"}}}},
            {
                "mcpServers": {
                    "a": {"url": "https://example.com", "headers": {"Authorization": "x\r\ny"}}
                }
            },
        ]
        for case in cases:
            with self.subTest(case=case), self.assertRaises(ValueError):
                validate_config(case)

    def test_private_storage_summary_omits_credentials_and_url(self):
        with tempfile.TemporaryDirectory() as folder:
            settings = MCPSettings(Path(folder) / "settings" / "mcp.json")
            self.assertEqual(settings.status()["servers"], [])
            value = {
                "mcpServers": {
                    "docs": {
                        "url": "https://example.com/mcp",
                        "headers": {"Authorization": "Bearer private-example"},
                    }
                }
            }
            summary = settings.save(value)
            self.assertEqual(summary["servers"], [{"name": "docs", "transport": "http"}])
            self.assertFalse(summary["connection_tested"])
            self.assertNotIn("private-example", json.dumps(summary))
            self.assertNotIn("example.com", json.dumps(summary))
            self.assertEqual(
                settings.load()["mcpServers"]["docs"]["headers"],
                value["mcpServers"]["docs"]["headers"],
            )
            settings.save({"mcpServers": {}})
            self.assertEqual(settings.status()["servers"], [])

    def test_codex_toml_parses_and_secrets_are_only_in_environment(self):
        value = {
            "mcpServers": {
                "remote": {
                    "url": "http://127.0.0.1:8888/mcp",
                    "headers": {"Authorization": "Bearer private-example"},
                },
                "local": {
                    "command": "python",
                    "args": ["-m", "example", "literal; $(not-a-shell)"],
                    "env": {"PRIVATE_KEY": "second-private-example"},
                },
            }
        }
        with tempfile.TemporaryDirectory() as folder:
            args, env = prepare_run("codex", value, Path(folder))
        self.assertNotIn("private-example", " ".join(args))
        parsed = tomllib.loads("\n".join(args[i + 1] for i in range(0, len(args), 2)))
        self.assertEqual(parsed["mcp_servers"]["remote"]["default_tools_approval_mode"], "prompt")
        self.assertEqual(
            parsed["mcp_servers"]["remote"]["env_http_headers"]["Authorization"],
            "AB_MCP_0_HEADER_0",
        )
        self.assertEqual(parsed["mcp_servers"]["local"]["args"][-1], "literal; $(not-a-shell)")
        self.assertEqual(env["PRIVATE_KEY"], "second-private-example")

    def test_claude_uses_private_config_and_strict_scope(self):
        value = {"mcpServers": {"local": {"command": "python", "env": {"KEY": "private-example"}}}}
        with tempfile.TemporaryDirectory() as folder:
            args, env = prepare_run("claude_code", value, Path(folder))
            self.assertIn("--strict-mcp-config", args)
            self.assertNotIn("private-example", " ".join(args))
            stored = Path(args[1]).read_text()
            self.assertNotIn("private-example", stored)
            self.assertIn("${AB_MCP_0_ENV_0}", stored)
        self.assertEqual(env["AB_MCP_0_ENV_0"], "private-example")

    def test_explicit_mcp_is_never_enabled_in_consult_or_edit_only_mode(self):
        with tempfile.TemporaryDirectory() as folder:
            manager = ar.AgentJobManager(Path(folder))
            for mode in ("consultar", "supervisado"):
                with self.subTest(mode=mode), self.assertRaisesRegex(ValueError, "MCP"):
                    manager.start(
                        provider="codex",
                        mode=mode,
                        prompt="Consulta documentos",
                        code="",
                        lang="cpp",
                        fqbn="arduino:avr:uno",
                        confirmed=True,
                        mcp_config={"mcpServers": {"local": {"command": "python"}}},
                    )

    def test_mcp_config_never_enters_journal_or_export(self):
        with tempfile.TemporaryDirectory() as folder:
            manager = ar.AgentJobManager(Path(folder))
            config = {
                "mcpServers": {
                    "remote": {
                        "url": "https://example.com/mcp",
                        "headers": {"Authorization": "private-example"},
                    }
                }
            }
            with (
                patch.object(ar.shutil, "which", return_value="codex"),
                patch.object(ar.AgentJobManager, "_work"),
            ):
                manager.start(
                    provider="codex",
                    mode="autonomo",
                    prompt="Consulta documentación",
                    code="",
                    lang="cpp",
                    fqbn="arduino:avr:uno",
                    confirmed=True,
                    mcp_config=config,
                )
            job = manager._current
            job.result = "private-example"
            job.emit("private-example", from_tool=False)
            job.persist()
            journal = (job.workspace / ar.JOURNAL_FILENAME).read_text("utf-8")
            self.assertNotIn("private-example", journal)
            self.assertNotIn("example.com", journal)
            self.assertNotIn("private-example", json.dumps(job.snapshot()))
            job.active = False
            import zipfile
            import io

            with zipfile.ZipFile(io.BytesIO(manager.export_project(job.id))) as archive:
                self.assertFalse(any("mcp" in name.lower() for name in archive.namelist()))

    def test_conflicting_environment_is_rejected(self):
        with (
            tempfile.TemporaryDirectory() as folder,
            self.assertRaisesRegex(ValueError, "misma variable"),
        ):
            prepare_run(
                "codex",
                {
                    "mcpServers": {
                        "a": {"command": "a", "env": {"KEY": "one"}},
                        "b": {"command": "b", "env": {"KEY": "two"}},
                    }
                },
                Path(folder),
            )

    def test_mcp_failure_cannot_be_hidden_by_cli_exit_zero(self):
        self._structured_job(["failed"], False)

    def test_recovered_mcp_call_does_not_claim_firmware_verified(self):
        self._structured_job(["failed", "completed"], True)

    def _structured_job(self, statuses, expected):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            script = base / "fake_json_cli.py"
            events = [
                {
                    "type": "item.completed",
                    "item": {
                        "type": "mcp_tool_call",
                        "server": "docs",
                        "tool": "lookup",
                        "status": s,
                    },
                }
                for s in statuses
            ]
            events.append(
                {
                    "type": "item.completed",
                    "item": {
                        "type": "agent_message",
                        "text": "Sketch uses 500 bytes\nHash of data verified.",
                    },
                }
            )
            script.write_text(
                "import sys\nsys.stdin.read()\n"
                + "".join(
                    "print(" + repr(json.dumps(event)) + ",flush=True)\n" for event in events
                ),
                encoding="utf-8",
            )
            manager = ar.AgentJobManager(base / "jobs")
            with (
                patch.object(ar.shutil, "which", return_value=sys.executable),
                patch.object(
                    ar, "agent_command", return_value=[sys.executable, str(script), "--json"]
                ),
            ):
                entry = manager.start(
                    provider="codex",
                    mode="autonomo",
                    prompt="Consulta documentación",
                    code="",
                    lang="cpp",
                    fqbn="arduino:avr:uno",
                    confirmed=True,
                )
                for _ in range(150):
                    result = manager.get(entry["job_id"])
                    if not result["active"]:
                        break
                    time.sleep(0.02)
            self.assertFalse(result["active"])
            self.assertEqual(result["success"], expected, result)
            self.assertFalse(any(result["evidence"].values()), result)
            self.assertEqual(result["mcp_calls"]["docs/lookup"], statuses[-1])
            recovered = ar.AgentJobManager(base / "jobs").get(entry["job_id"])
            self.assertEqual(recovered["mcp_calls"], result["mcp_calls"])
            self.assertFalse(recovered["active"])
