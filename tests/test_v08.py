"""Regresiones para migración 0.5→0.8, visualización honesta y selección de placas.
No equivale a prueba de USB, compilación Arduino ni hardware físico.
"""
import json
import http.client
import threading
import unittest
from pathlib import Path
import server

ROOT = Path(__file__).resolve().parents[1]
JS = (ROOT / 'app.js').read_text(encoding='utf-8')
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')


class Upgrade08Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = server.ThreadingHTTPServer(('127.0.0.1', 0), server.IDEHandler)
        cls.thread = threading.Thread(target=cls.srv.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        cls.srv.server_close()
        cls.thread.join(3)

    def get(self, path, headers=None):
        c = http.client.HTTPConnection('127.0.0.1', self.srv.server_port, timeout=5)
        c.request('GET', path, headers=headers or {})
        r = c.getresponse()
        result = (r.status, dict(r.getheaders()), r.read())
        c.close()
        return result

    def test_health_is_new_version(self):
        status, headers, data = self.get('/api/health')
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(data)['version'], '1.0.0-rc.2')
        self.assertEqual(headers.get('Cache-Control'), 'no-store')

    def test_session_host_origin_restrictions(self):
        status, _, _ = self.get('/api/session', {'Host': 'attacker.invalid'})
        self.assertEqual(status, 403)
        status, _, _ = self.get('/api/session', {'Origin': 'https://example.org'})
        self.assertEqual(status, 403)

    def test_example_routes_deliver_real_files(self):
        for file in ('uno_r3_diagnostico.ino', 'esp32cam_ai_thinker_test.ino'):
            with self.subTest(file=file):
                status, headers, data = self.get('/examples/' + file)
                self.assertEqual(status, 200)
                self.assertEqual(data, (ROOT / 'examples' / file).read_bytes())
                self.assertIn('text/plain', headers['Content-Type'])

    def test_no_arbitrary_file_access(self):
        status, _, _ = self.get('/server.py')
        self.assertEqual(status, 404)

    def test_version_visible_frontend(self):
        self.assertIn('by MS ROBOTIKA', HTML)
        self.assertIn('AB MakerIDE 1.0.0-rc.2</span>', HTML)
        self.assertIn('AB MakerIDE v1.0.0-rc.2 SUPER · by MS Robotika', JS)

    def test_migration_backup_preserves_prior_key(self):
        self.assertIn("const SAVEKEY='ab-makeride-project-v2'", JS)
        self.assertIn("const MIGRATION_BACKUP='ab-makeride-backup-antes-v09'", JS)
        self.assertIn('!localStorage.getItem(MIGRATION_BACKUP)', JS)
        self.assertIn('restoreMigrationBackup', JS)
        self.assertIn('¿Recuperar la copia? Exporta primero el trabajo actual.', JS)

    def test_usb_label_alone_cannot_overwrite_board_profile(self):
        self.assertNotIn('state.fqbn=selected.boards[0].fqbn', JS)
        # Automatic selection now uses the dedicated, bounded identification
        # endpoint; USB bridge names alone still cannot identify a board.
        self.assertIn("request('/api/boards/identify'", JS)

    def test_failed_job_does_not_show_fake_100_percent(self):
        self.assertIn("bar.style.width=d.success?'100%'", JS)
        self.assertIn("bar.classList.add(d.success?'success':'failed')", JS)
        self.assertIn("else $('#buildMeter').removeAttribute('aria-valuenow')", JS)

    def test_uno_assistant_uses_builtin_led(self):
        self.assertIn("const pin=isUno?'LED_BUILTIN':'2'", JS)
        self.assertIn('Arduino Uno R3 tradicional usa Arduino C++', JS)

    def test_explicit_hardware_confirmation_is_retained(self):
        self.assertIn('GRABAR firmware REAL en ${state.port}', JS)
        self.assertIn("confirm:action==='upload'", JS)
        self.assertIn("if d.get('confirm') is not True:", (ROOT/'server.py').read_text(encoding='utf-8'))

if __name__ == '__main__':
    unittest.main()
