"""Regression: device choices must recover from actual installed cores if CLI output fails."""
import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch
import server


class CatalogFallback096(unittest.TestCase):
    def tearDown(self):
        server.CATALOG_CACHE.update(until=0., result=None)

    def test_fallback_uses_real_installed_boards_txt(self):
        with tempfile.TemporaryDirectory() as d:
            base = Path(d)
            uno = base/'packages'/'arduino'/'hardware'/'avr'/'1.8.8'
            esp = base/'packages'/'esp32'/'hardware'/'esp32'/'3.3.12'
            uno.mkdir(parents=True); esp.mkdir(parents=True)
            (uno/'boards.txt').write_text('uno.name=Arduino Uno\nnano.name=Arduino Nano\n', 'utf-8')
            (esp/'boards.txt').write_text('esp32.name=ESP32 Dev Module\nesp32s3.name=ESP32S3 Dev Module\n', 'utf-8')
            result = server._boards_from_installed_cores(base)
            self.assertEqual({r['fqbn'] for r in result}, {'arduino:avr:uno','arduino:avr:nano','esp32:esp32:esp32','esp32:esp32:esp32s3'})
            with patch.dict(server.os.environ, {'ARDUINO_DIRECTORIES_DATA': str(base)}), patch.object(server, '_cli_json', return_value={'ok':False,'data':None,'error':'CLI timeout'}):
                catalog = server.board_catalog(refresh=True)
            self.assertTrue(catalog['ok'])
            self.assertEqual(catalog['count'], 4)
            self.assertIn('boards.txt', catalog['source'])
            self.assertIn('timeout', catalog['warning'])
            self.assertEqual(catalog['error'], '')

    def test_no_installed_boards_falls_back_to_explicit_error(self):
        with tempfile.TemporaryDirectory() as d, patch.object(server, '_boards_from_installed_cores', return_value=[]), patch.object(server, '_cli_json', return_value={'ok':False, 'data':None, 'error':'CLI unavailable'}):
            catalog = server.board_catalog(refresh=True)
            self.assertFalse(catalog['ok'])
            self.assertEqual(catalog['boards'], [])
            self.assertIn('unavailable', catalog['error'])

    def test_boards_file_ignores_metadata_and_injection(self):
        with tempfile.TemporaryDirectory() as d:
            b = Path(d)/'packages'/'arduino'/'hardware'/'avr'/'1.8.8'
            b.mkdir(parents=True)
            (b/'boards.txt').write_text('uno.name=Arduino Uno\nuno.build.mcu=atmega328p\n#fake.name=Fake\nfoo;bar.name=Unsafe\nother.name=\n', 'utf-8')
            names = server._boards_from_installed_cores(Path(d))
            self.assertEqual([x['fqbn'] for x in names], ['arduino:avr:uno'])

    def test_cli_success_still_preferred(self):
        with patch.object(server, '_cli_json', return_value={'ok':True, 'data':{'boards':[{'name':'Arduino Uno', 'fqbn':'arduino:avr:uno'}]},'error':''}), patch.object(server, '_boards_from_installed_cores', side_effect=AssertionError('not needed')):
            result = server.board_catalog(refresh=True)
            self.assertEqual(result['source'], 'arduino-cli board listall')
            self.assertEqual(result['count'],1)

    def test_ui_has_manual_catalog_reload_and_diagnostics(self):
        root=Path(__file__).resolve().parents[1]
        frontend=(root/'app.js').read_text('utf-8')
        html=(root/'index.html').read_text('utf-8')
        backend=(root/'server.py').read_text('utf-8')
        for element in ('id="catalogRefresh"', 'id="catalogSource"'):
            self.assertIn(element, html)
        for fragment in ('refreshCatalogFromCLI', 'catalog_warning', 'catalog_source'):
            self.assertIn(fragment, frontend)
        self.assertIn('"catalog_count": len(catalog[\'boards\'])', backend)

if __name__=='__main__': unittest.main()
