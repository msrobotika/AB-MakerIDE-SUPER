"""RC1 regressions; temporary files and mocked upload, no hardware operations."""

import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
from ab_makeride import agent_runtime as ar
from ab_makeride import jobs
import server
from ab_makeride import toolchain


class RC1Tests(unittest.TestCase):
    def tearDown(self):
        server.CATALOG_CACHE.update(until=0, result=None)

    def test_resolver_explicit_path_does_not_change_path(self):
        with tempfile.TemporaryDirectory() as d:
            cli = Path(d) / "arduino-cli.exe"
            cli.touch()
            before = os.environ.get("PATH")
            with patch.dict(os.environ, {"AB_MAKERIDE_ARDUINO_CLI": str(cli)}):
                self.assertEqual(toolchain.arduino_cli(), str(cli))
            self.assertEqual(os.environ.get("PATH"), before)

    def test_invalid_explicit_cli_is_not_silently_replaced(self):
        with patch.dict(os.environ, {"AB_MAKERIDE_ARDUINO_CLI": "Z:/missing.exe"}):
            self.assertIsNone(toolchain.arduino_cli())

    def test_configured_data_directory_used_for_recovery(self):
        with tempfile.TemporaryDirectory() as d:
            board = Path(d) / "packages/vendor/hardware/arch/2/boards.txt"
            board.parent.mkdir(parents=True)
            board.write_text("device.name=Local device\n")
            with (
                patch.dict(os.environ, {"ARDUINO_DIRECTORIES_DATA": ""}),
                patch.object(server, "_cli_json", return_value={"ok": True, "data": d}),
            ):
                self.assertEqual(
                    server._boards_from_installed_cores()[0]["fqbn"], "vendor:arch:device"
                )

    def test_scan_failure_exposed_even_when_windows_has_ports(self):
        with (
            patch.object(server, "arduino_cli", return_value="fake"),
            patch.object(
                server, "command_result", return_value={"ok": False, "output": "discovery timeout"}
            ),
        ):
            result = server.scan_ports(diagnostics=True)
        self.assertFalse(result["scan_ok"])
        self.assertIn("discovery timeout", result["scan_errors"][0])

    def test_invalid_scan_json_is_visible(self):
        with (
            patch.object(server, "arduino_cli", return_value="fake"),
            patch.object(server, "command_result", return_value={"ok": True, "output": "not json"}),
        ):
            self.assertFalse(server.scan_ports(diagnostics=True)["scan_ok"])

    def test_empty_catalog_error_never_claims_success(self):
        self.assertEqual(server._normalize_boards({"boards": None}), [])
        with patch.object(server, "_cli_json", return_value={"ok": True, "data": {"boards": None}}):
            self.assertFalse(server.board_search("Uno")["ok"])
        with (
            patch.object(
                server, "_cli_json", return_value={"ok": False, "data": None, "error": "timeout"}
            ),
            patch.object(server, "_boards_from_installed_cores", return_value=[]),
        ):
            result = server.installed_board_search("")
        self.assertFalse(result["ok"])
        self.assertIn("timeout", result["error"])

    def test_boards_txt_hides_internal_definitions_and_nested_name_properties(self):
        with tempfile.TemporaryDirectory() as d:
            folder = Path(d) / "packages/v/hardware/a/1"
            folder.mkdir(parents=True)
            (folder / "boards.txt").write_text(
                "normal.name=Board\nhidden.name=Hidden\nhidden.hide=true\nnormal.debug.custom.name=Debug UI\n"
            )
            self.assertEqual(
                [b["fqbn"] for b in server._boards_from_installed_cores(Path(d))], ["v:a:normal"]
            )

    def test_boards_txt_does_not_mix_old_versions(self):
        with tempfile.TemporaryDirectory() as d:
            for version, definition in [
                ("1.9", "old.name=Retired"),
                ("1.10", "current.name=Current"),
            ]:
                folder = Path(d) / "packages/v/hardware/a" / version
                folder.mkdir(parents=True)
                (folder / "boards.txt").write_text(definition)
            self.assertEqual(
                [b["fqbn"] for b in server._boards_from_installed_cores(Path(d))], ["v:a:current"]
            )

    def test_codex_global_approval_flag_precedes_exec_without_model_override(self):
        command = ar.agent_command("codex", "consultar", "codex", Path("."))
        self.assertLess(command.index("--ask-for-approval"), command.index("exec"))
        self.assertNotIn("--model", command)
        self.assertNotIn("-m", command)

    def test_compile_survives_manager_restart_and_keeps_source(self):
        with tempfile.TemporaryDirectory() as d:
            mgr = jobs.JobManager(threading.Lock(), Path(d))
            with patch.object(mgr, "_run", return_value=0):
                entry = mgr.start("void setup(){}\nvoid loop(){}", "arduino:avr:uno")
                for _ in range(100):
                    result = mgr.status(entry["job_id"])
                    if not result["active"]:
                        break
                    time.sleep(0.01)
            result = jobs.JobManager(threading.Lock(), Path(d)).status(entry["job_id"])
            self.assertTrue(result["success"])
            self.assertEqual(result["exit_code"], 0)
            self.assertTrue((Path(d) / entry["job_id"] / "sketch.ino").is_file())

    def test_interrupted_compile_is_unknown_and_never_reexecuted(self):
        with tempfile.TemporaryDirectory() as d:
            folder = Path(d) / ("a" * 32)
            folder.mkdir()
            path = folder / "job.json"
            path.write_text(
                json.dumps({"id": "a" * 32, "active": True, "success": None, "lines": []})
            )
            before = path.read_bytes()
            mgr = jobs.JobManager(threading.Lock(), Path(d))
            result = mgr.status("a" * 32)
            self.assertFalse(result["active"])
            self.assertFalse(result["success"])
            self.assertEqual(result["stage"], "interrumpido")
            self.assertIsNone(result["exit_code"])
            self.assertEqual(path.read_bytes(), before)

    def test_repeated_request_reference_never_runs_twice(self):
        with tempfile.TemporaryDirectory() as d:
            mgr = jobs.JobManager(threading.Lock(), Path(d))
            with patch.object(mgr, "_worker") as worker:
                first = mgr.start("void setup(){}", "arduino:avr:uno", request_id="f" * 32)
                second = mgr.start("void setup(){}", "arduino:avr:uno", request_id="f" * 32)
                self.assertEqual(first, second)
                for _ in range(50):
                    if worker.called:
                        break
                    time.sleep(0.01)
                self.assertEqual(worker.call_count, 1)
            restarted = jobs.JobManager(threading.Lock(), Path(d))
            with patch.object(restarted, "_worker") as worker:
                self.assertEqual(
                    restarted.start("ignored", "arduino:avr:uno", request_id="f" * 32), first
                )
                worker.assert_not_called()

    def test_invalid_request_reference_rejected(self):
        mgr = jobs.JobManager(threading.Lock())
        for value in ("../x", "A" * 32, True):
            with self.assertRaises(ValueError):
                mgr.start("x", "arduino:avr:uno", request_id=value)

    def test_cancelled_upload_even_with_exit_zero_is_not_success(self):
        with tempfile.TemporaryDirectory() as d:
            lock = threading.Lock()
            lock.acquire()
            mgr = jobs.JobManager(lock, Path(d))
            job = jobs.Job("a" * 32, "upload")

            def run(job, args, timeout):
                if "upload" in args:
                    job.cancelled = True
                return 0

            with patch.object(mgr, "_run", side_effect=run) as run_mock:
                mgr._worker(job, "void setup(){}\nvoid loop(){}", "arduino:avr:uno", "COM999")
            self.assertEqual(run_mock.call_count, 2)
            self.assertFalse(job.ok)
            self.assertEqual(job.stage, "cancelado")

    def test_failed_upload_after_compile_zero_is_failure(self):
        lock = threading.Lock()
        lock.acquire()
        mgr = jobs.JobManager(lock)
        job = jobs.Job("a" * 32, "upload")
        with patch.object(mgr, "_run", side_effect=[0, 2]):
            mgr._worker(job, "void setup(){}\nvoid loop(){}", "arduino:avr:uno", "COM999")
        self.assertFalse(job.ok)
        self.assertEqual(job.exit_code, 2)

    def test_agent_exit_code_persisted_and_legacy_is_unknown(self):
        with tempfile.TemporaryDirectory() as d:
            folder = Path(d)
            (folder / "sketch.ino").write_text("void setup(){}")
            job = ar.AgentJob(
                "b" * 32,
                "codex",
                "consultar",
                folder,
                "sketch.ino",
                "",
                active=False,
                success=True,
                exit_code=0,
            )
            job.persist()
            recovered = ar.restore_journal(folder)
            self.assertEqual(recovered.snapshot()["exit_code"], 0)
            journal = folder / ar.JOURNAL_FILENAME
            data = json.loads(journal.read_text())
            data.pop("exit_code")
            journal.write_text(json.dumps(data))
            self.assertIsNone(ar.restore_journal(folder).snapshot()["exit_code"])

    def test_reading_interrupted_agent_never_modifies_original(self):
        with tempfile.TemporaryDirectory() as d:
            job = ar.AgentJob("b" * 32, "codex", "consultar", Path(d), "sketch.ino", "")
            job.persist()
            p = Path(d) / ar.JOURNAL_FILENAME
            before = p.read_bytes()
            result = ar.restore_journal(Path(d))
            self.assertTrue(result.interrupted)
            self.assertEqual(p.read_bytes(), before)

    def test_robot_reducer_node_regressions(self):
        result = subprocess.run(
            ["node", "--test", "tests/robot_status.test.cjs"], capture_output=True, text=True
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
