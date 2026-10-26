"""v0.9.3: pruebas locales. No se emula una placa física ni una cuenta Codex real."""

from frontend_source import frontend_text, compact

from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch
from ab_makeride import agent_runtime as a


class ObservabilityTests(unittest.TestCase):
    def test_evidence_detected_from_actual_tool_style_logs(self):
        with TemporaryDirectory() as t:
            j = a.AgentJob("id", "codex", "total", Path(t), "sketch.ino", "void loop() {}")
            j.emit("Device signature = 1E 95 0F (ATmega328P)")
            j.emit("Sketch uses 930 bytes (2%) of program storage space.")
            j.emit("930 bytes of flash verified")
            evidence = j.snapshot()["evidence"]
            self.assertTrue(all(evidence.values()), evidence)
            self.assertEqual(
                len([x for x in j.snapshot()["events"] if x.get("kind") == "milestone"]), 3
            )

    def test_no_fabricated_evidence_from_generic_agent_success(self):
        with TemporaryDirectory() as t:
            j = a.AgentJob("id", "codex", "supervisado", Path(t), "sketch.ino", "")
            j.success = True
            j.emit(
                "Finalicé satisfactoriamente el análisis de código. No he compilado ni grabado nada."
            )
            self.assertFalse(any(j.snapshot()["evidence"].values()))

    def test_failed_upload_does_not_mark_flash_verified(self):
        with TemporaryDirectory() as t:
            j = a.AgentJob("id", "codex", "total", Path(t), "sketch.ino", "")
            j.emit("Writing 930 bytes to flash")
            j.emit("Failed uploading: exit status 2")
            self.assertFalse(j.snapshot()["evidence"]["flash_verified"])

    def test_evidence_ansi_cleaned_and_not_invented(self):
        self.assertEqual(a.evidence_from_output("\x1b[33mSketch uses 930 bytes (2%)"), "compiled")
        self.assertIsNone(a.evidence_from_output("Compilación iniciada ..."))

    def test_workspace_context_records_manual_port_without_asserting_chip(self):
        with TemporaryDirectory() as t:
            mgr = a.AgentJobManager(Path(t) / "sessions")
            with (
                patch.object(a.shutil, "which", return_value="/no/cli"),
                patch.object(mgr, "_work", return_value=None),
            ):
                res = mgr.start(
                    provider="codex",
                    mode="consultar",
                    prompt="Analiza el código",
                    code="void setup(){}",
                    lang="cpp",
                    fqbn="arduino:avr:uno",
                    port="COM4",
                    confirmed=True,
                )
            ctx = (Path(res["workspace"]) / "MAKERIDE_CONTEXT.txt").read_text(encoding="utf-8")
            self.assertIn("COM4", ctx)
            self.assertIn("NO detección inequívoca", ctx)

    def test_bad_com_port_rejected(self):
        with TemporaryDirectory() as t:
            mgr = a.AgentJobManager(Path(t) / "sessions")
            with self.assertRaisesRegex(ValueError, "Puerto"):
                mgr.start(
                    provider="codex",
                    mode="consultar",
                    prompt="Analiza este proyecto",
                    code="void setup(){}",
                    lang="cpp",
                    fqbn="arduino:avr:uno",
                    port="COM4;exit",
                    confirmed=True,
                )

    def test_ui_contains_collapsed_log_and_stages(self):
        base = Path(__file__).resolve().parents[1]
        html = (base / "index.html").read_text(encoding="utf-8")
        js = frontend_text(base)
        for stage in ("board_signature", "compiled", "flash_verified"):
            self.assertIn('data-evidence="' + stage + '"', html)
        self.assertIn('id="agentRawLog"', html)
        self.assertIn(compact("function appendAgentEvent"), compact(js))
        self.assertIn(compact("port:state.port"), compact(js))
        self.assertIn(compact("resetAgentStages();switchPane"), compact(js))


if __name__ == "__main__":
    unittest.main()
