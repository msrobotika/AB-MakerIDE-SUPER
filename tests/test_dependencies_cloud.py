"""v0.5 security, dependency recommendations and cloud boundaries; no device required."""

import http.client
import importlib.util
import json
from pathlib import Path
import threading
import unittest
from unittest.mock import patch
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from ab_makeride import dependency_advisor
from ab_makeride import cloud_agent

spec = importlib.util.spec_from_file_location("ab05server", ROOT / "server.py")
mod = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = mod
spec.loader.exec_module(mod)


class AdvisorTests(unittest.TestCase):
    def test_known_missing_and_builtin(self):
        x = dependency_advisor.summarize(
            '#include <SPI.h>\n#include <DHT.h>\n#include "Adafruit_GFX.h"\n',
            ["Adafruit GFX Library"],
            fqbn="esp32:esp32:esp32",
        )
        self.assertEqual(len(x["recommendations"]), 2)
        self.assertEqual(
            {r["name"]: r["installed"] for r in x["recommendations"]},
            {"DHT sensor library": False, "Adafruit GFX Library": True},
        )
        self.assertNotIn("SPI.h", x["unknown_headers"])

    def test_comments_do_not_create_dependencies(self):
        x = dependency_advisor.summarize(
            "// #include <DHT.h>\n/* #include <ESP32Servo.h> */\n#include <Arduino.h>"
        )
        self.assertFalse(x["recommendations"])

    def test_unknown_is_not_installed_without_proof(self):
        x = dependency_advisor.summarize("#include <SuperCustom.h>")
        self.assertEqual(x["unknown_headers"], ["SuperCustom.h"])

    def test_compiler_missing_header_support(self):
        x = dependency_advisor.summarize(
            "void setup(){}", error_output="fatal error: FastLED.h: No such file or directory"
        )
        self.assertEqual(x["recommendations"][0]["name"], "FastLED")
        self.assertEqual(x["recommendations"][0]["source"], "error real del compilador")

    def test_identifies_secrets_without_echoing(self):
        secret = "mywifi-password123"
        cleaned, num = dependency_advisor.redact_secrets('const char* PASSWORD = "' + secret + '";')
        self.assertEqual(num, 1)
        self.assertNotIn(secret, cleaned)
        x = dependency_advisor.summarize('const char* PASSWORD = "' + secret + '";')
        self.assertTrue(x["warnings"])

    def test_wifi_positional_secret_redacted(self):
        source = 'WiFi.begin("Casa", "superpassword123");'
        masked, count = dependency_advisor.redact_secrets(source)
        self.assertEqual(count, 1)
        self.assertNotIn("superpassword123", masked)

    def test_esp32_input_only_pin_warning(self):
        x = dependency_advisor.summarize(
            "const int out=34; pinMode(out, OUTPUT);", fqbn="esp32:esp32:esp32"
        )
        self.assertTrue(any("solo entrada" in text for text in x["warnings"]))

    def test_ideaspark_gpio_conflict_warning(self):
        x = dependency_advisor.summarize(
            "#include <Adafruit_ST7789.h>\ndigitalWrite(2,HIGH);", fqbn="esp32:esp32:esp32"
        )
        self.assertTrue(any("IdeaSpark" in text for text in x["warnings"]))

    def test_hardware_warnings(self):
        x = dependency_advisor.summarize("digitalWrite(2, HIGH);", fqbn="esp32:esp32:esp32")
        self.assertIn("GPIO", x["warnings"][0])

    def test_reject_massive_payload(self):
        with self.assertRaises(ValueError):
            dependency_advisor.summarize("a" * 300001)


class ApiSafety(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = mod.ThreadingHTTPServer(("127.0.0.1", 0), mod.IDEHandler)
        cls.t = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.t.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.t.join(3)

    def call(self, method, path, obj=None, headers=None):
        c = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        h = {"Content-Type": "application/json", **(headers or {})}
        c.request(method, path, body=json.dumps(obj) if obj is not None else None, headers=h)
        r = c.getresponse()
        s = r.status
        d = json.loads(r.read())
        c.close()
        return s, d

    def test_external_js_csp(self):
        c = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        c.request("GET", "/")
        r = c.getresponse()
        body = r.read().decode("utf-8")
        csp = r.headers["Content-Security-Policy"]
        c.close()
        self.assertEqual(r.status, 200)
        self.assertIn("script-src 'self';", csp)
        self.assertIn('<script src="/app.js"></script>', body)
        self.assertNotIn("<script>", body)

    def test_dynamic_js_allowed_from_same_origin(self):
        c = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        c.request("GET", "/frontend/editor.js")
        r = c.getresponse()
        body = r.read()
        c.close()
        self.assertEqual(r.status, 200)
        self.assertIn(b"X-AB-Session", body)

    def test_token_required(self):
        st, _ = self.call("POST", "/api/libraries/install", {"name": "FastLED", "confirm": True})
        self.assertEqual(st, 403)

    def test_session_obtainable_same_origin(self):
        st, info = self.call("GET", "/api/session")
        self.assertEqual(st, 200)
        self.assertEqual(info["csrf"], mod.SESSION_KEY)

    def test_invalid_session_denied(self):
        st, _ = self.call(
            "POST", "/api/ai/config", {"provider": "local"}, {"X-AB-Session": "INVALID"}
        )
        self.assertEqual(st, 403)

    def test_cross_origin_not_allowed_even_with_token(self):
        st, _ = self.call(
            "POST",
            "/api/ai/reset",
            {},
            {"X-AB-Session": mod.SESSION_KEY, "Origin": "https://evil.example"},
        )
        self.assertEqual(st, 403)

    def test_bad_install_name_blocked_before_tool(self):
        with patch.object(mod, "command_result", side_effect=AssertionError("No execution")):
            st, _ = self.call(
                "POST",
                "/api/libraries/install",
                {"name": "FastLED;del C:", "confirm": True},
                {"X-AB-Session": mod.SESSION_KEY},
            )
        self.assertEqual(st, 400)

    def test_advisor_is_read_only(self):
        with patch.object(mod, "libraries_list", return_value={"ok": True, "libraries": []}):
            st, result = self.call(
                "POST",
                "/api/advisor/check",
                {"code": "#include <DHT.h>\nvoid setup() {}", "fqbn": "esp32:esp32:esp32"},
                {"X-AB-Session": mod.SESSION_KEY},
            )
        self.assertEqual(st, 200)
        self.assertFalse(result["verified"])
        self.assertEqual(result["recommendations"][0]["action"], "suggest_install")

    def test_read_only_library_lookup_injection_denied(self):
        for q in ("x;rm -rf", "../foo", "--help", "x\nanything"):
            st, _ = self.call(
                "POST", "/api/libraries/search", {"query": q}, {"X-AB-Session": mod.SESSION_KEY}
            )
            self.assertEqual(st, 400)

    def test_clear_ai_keys(self):
        a = cloud_agent.AgentService()
        a.configure("google", "gemma-4-31b-it", "fake-key")
        self.assertTrue(a.status()["configured"]["google"])
        a.clear_keys()
        self.assertFalse(a.status()["configured"]["google"])
        self.assertEqual(a.status()["provider"], "local")

    def test_gemini_model_and_key_use_google_api_without_tools(self):
        service = cloud_agent.AgentService()
        service.configure("google", "gemini-3.8-flash", "fake-private-gemini-key")
        requests = []

        class Response:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                pass

            def read(self, *args):
                return json.dumps(
                    {"candidates": [{"content": {"parts": [{"text": "CONEXION OK"}]}}]}
                ).encode()

        def endpoint(request, **kwargs):
            requests.append(request)
            return Response()

        with patch.object(cloud_agent, "urlopen", endpoint):
            result = service.chat("Responde exactamente: CONEXION OK", test=True)
        self.assertEqual(result["text"], "CONEXION OK")
        self.assertIn("/models/gemini-3.8-flash:generateContent", requests[0].full_url)
        self.assertNotIn("fake-private-gemini-key", requests[0].full_url)
        self.assertEqual(
            {key.lower(): value for key, value in requests[0].headers.items()}["x-goog-api-key"],
            "fake-private-gemini-key",
        )
        self.assertNotIn("tools", json.loads(requests[0].data))


if __name__ == "__main__":
    unittest.main()
