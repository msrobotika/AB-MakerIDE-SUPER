"""Startup filesystem/socket and controlled serial failures. No physical device."""

import contextlib
import io
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import threading
import time
import types
import unittest
from unittest.mock import patch
from urllib.request import urlopen
import launch
import prepare_windows
import server
from ab_makeride import jobs


class Connection:
    def __init__(self):
        self.is_open = True
        self.read_error = threading.Event()
        self.entered = threading.Event()
        self.hold = None
        self.write_error = False
        self.partial = False
        self.sent = []

    def readline(self):
        self.entered.set()
        if self.hold is not None:
            self.hold.wait(3)
        else:
            self.read_error.wait(0.01)
        if self.read_error.is_set():
            raise OSError("CONTROLLED USB removed")
        return b""

    def write(self, data):
        self.sent.append(data)
        if self.write_error:
            raise OSError("CONTROLLED write failure")
        return max(0, len(data) - 1) if self.partial else len(data)

    def close(self):
        self.is_open = False


def wait_for(check):
    deadline = time.monotonic() + 3
    while time.monotonic() < deadline:
        if check():
            return
        time.sleep(0.01)
    raise AssertionError("Controlled transition timed out")


class SerialRecovery(unittest.TestCase):
    def setUp(self):
        self.bridge = server.SerialBridge()
        self.connections = []
        self.calls = []

        def factory(*args, **kwargs):
            self.calls.append((args, kwargs))
            if not self.connections:
                raise OSError("CONTROLLED port busy")
            return self.connections.pop(0)

        self.enterContext(
            patch.dict(
                sys.modules, serial=types.SimpleNamespace(Serial=factory, SerialException=OSError)
            )
        )
        self.enterContext(patch.object(server, "scan_ports", return_value=[{"port": "COM999"}]))
        self.addCleanup(self.bridge.close)

    def connect(self, conn=None):
        conn = conn or Connection()
        self.connections.append(conn)
        self.bridge.start("COM999", 115200)
        self.assertTrue(conn.entered.wait(1))
        return conn

    def test_read_failure_closes_and_never_auto_reconnects(self):
        conn = self.connect()
        conn.read_error.set()
        wait_for(lambda: not self.bridge.status()["connected"])
        result = self.bridge.status()
        self.assertFalse(conn.is_open)
        self.assertIsNone(result["port"])
        self.assertIn("Lectura interrumpida", result["error"])
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(sum("Error de conexión" in item["text"] for item in result["messages"]), 1)

    def test_failed_send_disconnects_without_duplicate_write(self):
        conn = self.connect()
        conn.write_error = True
        with self.assertRaisesRegex(ValueError, "no se repite"):
            self.bridge.write("orden")
        self.assertFalse(self.bridge.status()["connected"])
        self.assertEqual(conn.sent, [b"orden"])
        with self.assertRaises(ValueError):
            self.bridge.write("orden")
        self.assertEqual(conn.sent, [b"orden"])

    def test_partial_send_is_unknown_and_not_retried(self):
        conn = self.connect()
        conn.partial = True
        with self.assertRaisesRegex(ValueError, "desconocido"):
            self.bridge.write("abc")
        self.assertFalse(conn.is_open)
        self.assertEqual(conn.sent, [b"abc"])

    def test_late_old_reader_failure_preserves_new_connection(self):
        old = Connection()
        old.hold = threading.Event()
        self.connect(old)
        new = self.connect()
        old.read_error.set()
        old.hold.set()
        time.sleep(0.05)
        self.assertTrue(self.bridge.status()["connected"])
        self.assertTrue(new.is_open)
        self.assertEqual(self.bridge.status()["error"], "")
        self.bridge.write("nuevo")
        self.assertEqual(new.sent, [b"nuevo"])

    def test_explicit_reconnect_clears_error(self):
        old = self.connect()
        old.read_error.set()
        wait_for(lambda: not self.bridge.status()["connected"])
        self.connect()
        self.assertEqual(self.bridge.status()["error"], "")
        self.assertEqual(len(self.calls), 2)

    def test_busy_port_has_actionable_error_and_no_connection(self):
        with self.assertRaisesRegex(ValueError, "ocupado o desconectado"):
            self.bridge.start("COM999", 115200)
        self.assertFalse(self.bridge.status()["connected"])
        self.assertEqual(len(self.calls), 1)

    def test_explicit_close_does_not_become_failure(self):
        conn = self.connect()
        self.bridge.close()
        time.sleep(0.04)
        self.assertFalse(conn.is_open)
        self.assertEqual(self.bridge.status()["error"], "")

    def test_port_closed_externally_does_not_remain_connected(self):
        conn = self.connect()
        conn.close()
        wait_for(lambda: not self.bridge.status()["connected"])
        self.assertTrue(self.bridge.status()["error"])


class StartupChecks(unittest.TestCase):
    def test_launcher_with_legacy_windows_output_encoding_starts_real_server(self):
        with tempfile.TemporaryDirectory() as temp:
            with socket.socket() as probe:
                probe.bind(("127.0.0.1", 0))
                port = probe.getsockname()[1]
            env = {
                **os.environ,
                "PYTHONIOENCODING": "cp1252",
                "PYTHONUTF8": "0",
                "AB_MAKERIDE_DATA_DIR": str(Path(temp) / "data"),
            }
            with (Path(temp) / "server.log").open("wb") as log:
                process = subprocess.Popen(
                    [
                        sys.executable,
                        str(launch.ROOT / "launch.py"),
                        "--no-browser",
                        "--port",
                        str(port),
                    ],
                    env=env,
                    stdout=log,
                    stderr=log,
                    creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
                )
                try:
                    health = None
                    for _ in range(100):
                        if process.poll() is not None:
                            break
                        try:
                            with urlopen(
                                f"http://127.0.0.1:{port}/api/health", timeout=0.25
                            ) as response:
                                health = json.load(response)
                            break
                        except OSError:
                            time.sleep(0.1)
                    self.assertIsNotNone(
                        health,
                        (Path(temp) / "server.log").read_bytes().decode("utf-8", errors="replace"),
                    )
                    self.assertTrue(health["ok"])
                finally:
                    if process.poll() is None:
                        process.terminate()
                        process.wait(10)
            self.assertNotIn(b"UnicodeEncodeError", (Path(temp) / "server.log").read_bytes())

    def setUp(self):
        self.temp = self.enterContext(tempfile.TemporaryDirectory())
        self.enterContext(patch.dict(os.environ, AB_MAKERIDE_DATA_DIR=self.temp))
        self.port_socket = socket.socket()
        self.port_socket.bind(("127.0.0.1", 0))
        self.port = self.port_socket.getsockname()[1]
        self.port_socket.close()

    def test_optional_tools_absent_do_not_block_editor(self):
        with (
            patch("ab_makeride.toolchain.arduino_cli", return_value=None),
            patch.object(launch.shutil, "which", return_value=None),
            patch.object(launch.importlib.util, "find_spec", return_value=None),
        ):
            result = launch.diagnose(port=self.port)
        self.assertTrue(result["ok"])
        self.assertTrue(
            all(
                not c["ok"] and not c["required"]
                for c in result["checks"]
                if c["name"] in ["arduino", "serial", "micropython"]
            )
        )

    def test_busy_tcp_port_is_reported_without_stopping_owner(self):
        with socket.socket() as owner:
            owner.bind(("127.0.0.1", 0))
            owner.listen()
            result = launch.diagnose(port=owner.getsockname()[1])
            self.assertFalse(result["ok"])
            self.assertNotEqual(owner.fileno(), -1)
            self.assertIn(
                "ocupado", next(c["message"] for c in result["checks"] if c["name"] == "port")
            )

    def test_unwritable_data_target_preserves_existing_file(self):
        target = Path(self.temp) / "datos"
        target.write_bytes(b"project sentinel")
        with patch.dict(os.environ, AB_MAKERIDE_DATA_DIR=str(target)):
            result = launch.diagnose(port=self.port)
        self.assertFalse(result["ok"])
        self.assertEqual(target.read_bytes(), b"project sentinel")

    def test_incomplete_extraction_is_explained(self):
        result = launch.diagnose(root=Path(self.temp) / "missing", port=self.port)
        self.assertFalse(result["ok"])
        self.assertIn(
            "server.py", next(c["message"] for c in result["checks"] if c["name"] == "files")
        )

    def test_unsupported_python_is_blocked_before_server_import(self):
        with patch.object(launch.sys, "version_info", (3, 9, 0)):
            result = launch.diagnose(port=self.port)
        self.assertFalse(result["ok"])

    def test_prepare_preserves_unrelated_venv_directory(self):
        target = Path(self.temp) / ".venv"
        target.mkdir()
        (target / "user.txt").write_bytes(b"keep")
        with (
            patch.object(prepare_windows, "ROOT", Path(self.temp)),
            patch.object(prepare_windows.subprocess, "run") as process,
            contextlib.redirect_stdout(io.StringIO()),
        ):
            self.assertEqual(prepare_windows.main(), 2)
        process.assert_not_called()
        self.assertEqual((target / "user.txt").read_bytes(), b"keep")


class ControlledProcessRecovery(unittest.TestCase):
    def test_cancel_real_child_releases_lock_and_keeps_project(self):
        with tempfile.TemporaryDirectory() as folder:
            lock = threading.Lock()
            manager = jobs.JobManager(lock, Path(folder))
            started = threading.Event()
            original = manager._run

            def run(job, args, timeout):
                if "compile" in args:
                    return 0
                # A real owned Python child, never an uploader or a hardware port.
                started.set()
                return original(
                    job,
                    [
                        sys.executable,
                        "-u",
                        "-c",
                        'import time; print("CONTROLLED WAIT",flush=True); time.sleep(30)',
                    ],
                    10,
                )

            code = "// PRESERVE PROJECT\nvoid setup(){}\nvoid loop(){}\n"
            with (
                patch.object(jobs, "arduino_cli", return_value=sys.executable),
                patch.object(manager, "_run", side_effect=run),
            ):
                entry = manager.start(code, "arduino:avr:uno", "COM999", request_id="9" * 32)
                self.assertTrue(started.wait(2))
                wait_for(lambda: manager._current.process is not None)
                child = manager._current.process
                try:
                    manager.cancel(entry["job_id"])
                    wait_for(lambda: not manager.status(entry["job_id"])["active"])
                    result = manager.status(entry["job_id"])
                    self.assertTrue(result["cancelled"])
                    self.assertFalse(result["success"])
                    self.assertIsNotNone(child.poll())
                    self.assertEqual(
                        (Path(folder) / entry["job_id"] / "sketch.ino").read_text(encoding="utf-8"),
                        code,
                    )
                    self.assertTrue(lock.acquire(blocking=False))
                    lock.release()
                finally:
                    if child.poll() is None:
                        child.terminate()
                        child.wait(5)
            recovered = jobs.JobManager(threading.Lock(), Path(folder))
            with patch.object(recovered, "_worker") as worker:
                duplicate = recovered.start(code, "arduino:avr:uno", "COM999", request_id="9" * 32)
                worker.assert_not_called()
                self.assertEqual(duplicate, entry)


if __name__ == "__main__":
    unittest.main()
