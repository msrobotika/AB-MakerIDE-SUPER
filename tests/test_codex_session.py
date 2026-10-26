import io
import json
from pathlib import Path
import tempfile
import types
import unittest

from ab_makeride.agent_runtime import AgentJob
from ab_makeride.codex_session import CodexSession


class CodexApprovalTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.job = AgentJob("a" * 32, "codex", "autonomo", Path(self.folder.name), "sketch.ino", "")
        self.pipe = io.StringIO()
        self.session = CodexSession(
            self.job, types.SimpleNamespace(stdin=self.pipe), "Controlled task"
        )

    def event(self):
        return {
            "id": 41,
            "method": "mcpServer/elicitation/request",
            "params": {
                "mode": "form",
                "serverName": "probe",
                "message": "Authorize probe?",
                "requestedSchema": {"type": "object", "properties": {}},
                "_meta": {"tool_params": {"query": "<img src=x onerror=alert(1)>"}},
            },
        }

    def test_mcp_waits_for_one_explicit_decision_and_replay_is_rejected(self):
        self.session.handle(self.event())
        self.assertEqual(self.pipe.getvalue(), "")
        pending = self.job.snapshot()["pending_approvals"]
        self.assertEqual(len(pending), 1)
        self.assertIn("<img", pending[0]["description"])  # UI must render as text.
        self.session.respond(pending[0]["id"], "allow")
        result = json.loads(self.pipe.getvalue())
        self.assertEqual(result, {"id": 41, "result": {"action": "accept", "content": {}}})
        self.assertEqual(self.job.pending_approvals, [])
        with self.assertRaises(ValueError):
            self.session.respond(pending[0]["id"], "allow")

    def test_reject_never_produces_a_grant(self):
        self.session.handle(self.event())
        identifier = self.job.pending_approvals[0]["id"]
        self.session.respond(identifier, "deny")
        self.assertEqual(
            json.loads(self.pipe.getvalue())["result"], {"action": "decline", "content": None}
        )

    def test_unsupported_sensitive_form_is_declined_without_a_prompt(self):
        event = self.event()
        event["params"]["requestedSchema"]["properties"] = {"password": {"type": "string"}}
        self.session.handle(event)
        self.assertFalse(self.job.pending_approvals)
        self.assertEqual(json.loads(self.pipe.getvalue())["result"]["action"], "decline")

    def test_event_translation_preserves_mcp_and_command_failures(self):
        output = self.session.handle(
            {
                "method": "item/completed",
                "params": {
                    "item": {
                        "type": "commandExecution",
                        "status": "completed",
                        "exitCode": 1,
                        "aggregatedOutput": "Hash of data verified.",
                    }
                },
            }
        )
        self.assertEqual(output[0]["item"]["exit_code"], 1)
        failed = self.session.handle(
            {
                "method": "turn/completed",
                "params": {"turn": {"status": "failed", "error": "Controlled failure"}},
            }
        )
        self.assertTrue(self.session.done.is_set())
        self.assertEqual(failed[0]["type"], "turn.failed")

    def test_init_does_not_select_a_model_or_expand_sandbox(self):
        self.session.start()
        self.session.handle({"id": 1, "result": {}})
        messages = [json.loads(line) for line in self.pipe.getvalue().splitlines()]
        request = messages[-1]
        self.assertEqual(request["method"], "thread/start")
        self.assertEqual(request["params"]["sandbox"], "workspace-write")
        self.assertNotIn("model", request["params"])
        self.assertTrue(request["params"]["ephemeral"])

    def test_command_approval_shows_the_complete_scope_before_acceptance(self):
        params = {
            "command": "python diagnostics.py",
            "cwd": "/project",
            "reason": "Read diagnostics",
            "additionalPermissions": {"network": True},
            "networkApprovalContext": {"host": "example.invalid"},
        }
        self.session.handle(
            {"id": 42, "method": "item/commandExecution/requestApproval", "params": params}
        )
        self.assertEqual(self.pipe.getvalue(), "")
        description = self.job.pending_approvals[0]["description"]
        for field in params:
            self.assertIn(field, description)

    def test_oversized_command_is_declined_instead_of_truncating_the_review(self):
        self.session.handle(
            {
                "id": 43,
                "method": "item/commandExecution/requestApproval",
                "params": {"command": "x" * 21000},
            }
        )
        self.assertEqual(self.job.pending_approvals, [])
        self.assertEqual(json.loads(self.pipe.getvalue())["result"], {"decision": "decline"})
