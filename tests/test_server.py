"""Hardware-free regression tests for AB MakerIDE's local bridge."""
import http.client
import importlib.util
import json
from pathlib import Path
import threading
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("abmaker_server", ROOT / "server.py")
ide = importlib.util.module_from_spec(spec)
import sys
sys.modules["abmaker_server"] = ide
spec.loader.exec_module(ide)


class CoreTests(unittest.TestCase):
    def test_micropython_good_syntax(self):
        r = ide.check_python_syntax("from machine import Pin\nled = Pin(2, Pin.OUT)\n")
        self.assertTrue(r["ok"])
        self.assertEqual(r["mode"], "syntax_only")

    def test_micropython_syntax_error(self):
        r = ide.check_python_syntax("while True\n pass")
        self.assertFalse(r["ok"])
        self.assertEqual(r["line"], 1)

    def test_no_empty_code(self):
        with self.assertRaises(ValueError):
            ide.check_code("  ")

    def test_limit_code_size(self):
        with self.assertRaises(ValueError):
            ide.check_code("x" * (ide.MAX_CODE + 1))

    def test_invalid_fqbn(self):
        for text in ["", "esp32", "esp32:esp32:esp32 --bad", "../abc"]:
            with self.subTest(text=text), self.assertRaises(ValueError):
                ide.check_fqbn(text)

    def test_fqbn_valid(self):
        ide.check_fqbn("esp32:esp32:esp32s3")

    def test_port_not_in_detection(self):
        with patch.object(ide, "scan_ports", return_value=[]):
            with self.assertRaisesRegex(ValueError, "no aparece"):
                ide.check_port("COM3")

    def test_port_in_detection(self):
        with patch.object(ide, "scan_ports", return_value=[{"port": "COM7"}]):
            ide.check_port("COM7")

    def test_port_rejects_injection(self):
        with self.assertRaises(ValueError):
            ide.check_port("COM3; rm -rf /")

    def test_compile_no_cli_returns_not_ok(self):
        with patch.object(ide, "arduino_cli", return_value=None), patch.object(ide.shutil, "which", return_value=None):
            result = ide.compile_cpp("void setup(){}\nvoid loop(){}", "esp32:esp32:esp32")
            self.assertFalse(result["ok"])
            self.assertIn("no instalado", result["output"])

    def test_compile_uses_real_command_and_real_code(self):
        calls = []
        def fake_command(args, **kw):
            calls.append(args)
            sketch = Path(args[-1])
            self.assertTrue(sketch.exists())
            self.assertEqual((sketch / "sketch.ino").read_text(), "void setup(){}\nvoid loop(){}")
            return {"ok": True, "exit_code": 0, "output": "COMPILADO"}
        with patch.object(ide.shutil, "which", return_value="/bin/arduino-cli"), patch.object(ide, "command_result", fake_command):
            result = ide.compile_cpp("void setup(){}\nvoid loop(){}", "esp32:esp32:esp32")
        self.assertTrue(result["ok"])
        self.assertEqual(result["stage"], "compile")
        self.assertEqual(calls[0][:3], ["arduino-cli", "compile", "--fqbn"])

    def test_upload_compiles_then_uploads(self):
        calls = []
        def fake_command(args, **kw):
            calls.append(args)
            return {"ok": True, "exit_code": 0, "output": "OK"}
        with patch.object(ide.shutil, "which", return_value="arduino-cli"), \
             patch.object(ide, "scan_ports", return_value=[{"port": "COM7"}]), \
             patch.object(ide, "command_result", fake_command):
            r = ide.compile_cpp("void setup(){}\nvoid loop(){}", "esp32:esp32:esp32", port="COM7")
        self.assertTrue(r["ok"])
        self.assertEqual(r["stage"], "upload")
        self.assertEqual([c[1] for c in calls], ["compile", "upload"])
        self.assertIn("--input-dir", calls[1])

    def test_upload_does_not_execute_if_compile_fails(self):
        calls = []
        def fake_command(args, **kw):
            calls.append(args)
            return {"ok": False, "exit_code": 1, "output": "GCC ERROR"}
        with patch.object(ide.shutil, "which", return_value="arduino-cli"), \
             patch.object(ide, "scan_ports", return_value=[{"port": "COM7"}]), \
             patch.object(ide, "command_result", fake_command):
            r = ide.compile_cpp("broken", "esp32:esp32:esp32", port="COM7")
        self.assertFalse(r["ok"])
        self.assertEqual(len(calls), 1)

    def test_micropython_missing_tool_is_failure(self):
        with patch.object(ide, "scan_ports", return_value=[{"port": "COM5"}]), patch.object(ide, "arduino_cli", return_value=None), patch.object(ide.shutil, "which", return_value=None):
            r = ide.micropython_action("print('ok')", "COM5", deploy=True)
        self.assertFalse(r["ok"])
        self.assertEqual(r["stage"], "dependencies")

    def test_micropython_run_does_not_overwrite_flash(self):
        calls = []
        def fake_command(args, **kw):
            calls.append(args)
            return {"ok": True, "exit_code": 0, "output": "OK"}
        with patch.object(ide, "scan_ports", return_value=[{"port": "COM5"}]), \
             patch.object(ide.shutil, "which", return_value="mpremote"), \
             patch.object(ide, "command_result", fake_command):
            r = ide.micropython_action("print('ok')", "COM5", deploy=False)
        self.assertTrue(r["ok"])
        self.assertIn("--no-follow", calls[0])
        self.assertNotIn("cp", calls[0])

    def test_micropython_deploy_uses_main_py(self):
        calls = []
        def fake_command(args, **kw):
            calls.append(args)
            return {"ok": True, "exit_code": 0, "output": "OK"}
        with patch.object(ide, "scan_ports", return_value=[{"port": "COM5"}]), \
             patch.object(ide.shutil, "which", return_value="mpremote"), \
             patch.object(ide, "command_result", fake_command):
            r = ide.micropython_action("print('ok')", "COM5", deploy=True)
        self.assertTrue(r["ok"])
        self.assertEqual(calls[0][-1], ":main.py")

    def test_serial_starts_disconnected(self):
        s = ide.SerialBridge()
        self.assertFalse(s.status()["connected"])
        with self.assertRaises(ValueError):
            s.write("hello")

    def test_serial_ring_buffer(self):
        s = ide.SerialBridge()
        s._emit("linea 1")
        s._emit("linea 2")
        r = s.status(1)
        self.assertEqual(len(r["messages"]), 1)
        self.assertEqual(r["messages"][0]["text"], "linea 2")

    def test_scan_empty_without_tools(self):
        with patch.object(ide, "arduino_cli", return_value=None), patch.object(ide.shutil, "which", return_value=None):
            r = ide.scan_ports()
            self.assertIsInstance(r, list)

    def test_scan_arduino_cli_json(self):
        data = {"detected_ports": [{"port": {"address": "COM8", "label": "USB Serial"},
                "matching_boards": [{"name": "ESP32", "fqbn": "esp32:esp32:esp32"}]}]}
        with patch.object(ide.shutil, "which", return_value="arduino-cli"), \
             patch.object(ide, "command_result", return_value={"ok": True, "output": json.dumps(data)}):
            r = ide.scan_ports()
        self.assertIn("COM8", [x["port"] for x in r])
        self.assertEqual([x for x in r if x["port"] == "COM8"][0]["boards"][0]["fqbn"], "esp32:esp32:esp32")


class APITests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ide.ThreadingHTTPServer(("127.0.0.1", 0), ide.IDEHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(3)

    def call(self, method, path, data=None, headers=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=10)
        h = dict(headers or {})
        if method == "POST":
            h.setdefault("X-AB-Session", ide.SESSION_KEY)
        if data is not None:
            h.setdefault("Content-Type", "application/json")
            body = json.dumps(data)
        else:
            body = None
        conn.request(method, path, body, headers=h)
        resp = conn.getresponse()
        raw = resp.read()
        result = json.loads(raw) if path.startswith("/api") else raw.decode()
        code = resp.status
        conn.close()
        return code, result

    def test_health(self):
        code, result = self.call("GET", "/api/health")
        self.assertEqual(code, 200)
        self.assertEqual(result["version"], "1.0.0-rc.3")

    def test_serves_html(self):
        code, result = self.call("GET", "/")
        self.assertEqual(code, 200)
        self.assertIn("AB MakerIDE", result)

    def test_cannot_upload_without_explicit_confirmation(self):
        status, data = self.call("POST", "/api/upload", {"lang": "cpp", "port": "COM3", "code": "bad"})
        self.assertEqual(status, 400)
        self.assertFalse(data["ok"])
        self.assertIn("confirmación", data["error"])

    def test_cross_site_requests_blocked(self):
        status, _ = self.call("POST", "/api/serial/stop", {}, headers={"Origin": "https://attacker.invalid"})
        self.assertEqual(status, 403)

    def test_host_header_blocked(self):
        status, _ = self.call("GET", "/api/health", headers={"Host": "attacker.invalid"})
        self.assertEqual(status, 403)

    def test_bad_json_rejected(self):
        status, _ = self.call("POST", "/api/verify", {"lang": "evil", "code": "x"})
        self.assertEqual(status, 400)

    def test_python_verify_endpoint(self):
        status, result = self.call("POST", "/api/verify", {"lang": "py", "code": "print(1)"})
        self.assertEqual(status, 200)
        self.assertTrue(result["ok"])
        self.assertEqual(result["mode"], "syntax_only")


if __name__ == "__main__":
    unittest.main()
