"""Catálogo dinámico Arduino CLI, puertos y seguridad; NO prueba hardware físico."""
import json
import threading
import unittest
from unittest.mock import patch
import server


class CatalogTests(unittest.TestCase):
    def setUp(self):
        from types import SimpleNamespace
        self.enterContext(patch.dict("sys.modules", {"serial.tools": SimpleNamespace(list_ports=SimpleNamespace(comports=lambda: []))}))
        self.enterContext(patch.object(server.sys, "platform", "linux"))

    def tearDown(self):
        server.CATALOG_CACHE.update(until=0., result=None)

    def test_50_or_more_installed_models_not_fixed_list(self):
        fake = {'boards': [{'name': f'Board {i}', 'fqbn': f'vendor:arch:b{i}',
                            'platform': {'name': 'Hardware Manufacturer'}} for i in range(260)]}
        with patch.object(server, '_cli_json', return_value={'ok':True,'data': fake,'error':''}) as cli:
            response = server.board_catalog(refresh=True)
        self.assertTrue(response['ok'])
        self.assertEqual(len(response['boards']), 260)
        self.assertEqual(response['boards'][0]['platform'], 'Hardware Manufacturer')
        self.assertEqual(cli.call_args.args[0], ['board','listall','--json'])

    def test_filters_invalid_fqbns_and_duplicates(self):
        fake = {'boards': [{'name':'Uno','fqbn':'arduino:avr:uno'},
                           {'name':'Alias','fqbn':'arduino:avr:uno'},
                           {'name':'Bad','fqbn':'arduino:avr:uno;del'},
                           {'name':'bad'}, {}, 'junk']}
        choices = server._normalize_boards(fake)
        self.assertEqual(len(choices), 1)
        self.assertEqual(choices[0]['fqbn'],'arduino:avr:uno')

    def test_cli_output_more_than_100kb_not_truncated(self):
        output = json.dumps({'boards':[{'name':f'Device{i}'+('x'*140),'fqbn':f'v:a:d{i}'} for i in range(1300)]})
        self.assertGreater(len(output), 100000)
        proc = type('Completed',(),{'returncode':0,'stdout':output,'stderr':''})()
        with patch.object(server.shutil, 'which', return_value='/usr/bin/arduino-cli'), patch.object(server.subprocess, 'run',return_value=proc):
            r=server._cli_json(['board','listall','--json'])
        self.assertTrue(r['ok'])
        self.assertEqual(len(server._normalize_boards(r['data'])),1300)

    def test_cache_does_not_refetch_every_usb_scan(self):
        resp={'ok':True,'data':{'boards':[{'name':'Uno','fqbn':'arduino:avr:uno'}]},'error':''}
        with patch.object(server,'_cli_json',return_value=resp) as cli:
            server.board_catalog(refresh=True)
            server.board_catalog()
            server.board_catalog()
        self.assertEqual(cli.call_count,1)

    def test_no_static_fallback_on_missing_cli(self):
        with patch.object(server,'_boards_from_installed_cores',return_value=[]), patch.object(server,'_cli_json',return_value={'ok':False,'data':None,'error':'missing'}):
            r=server.board_catalog(refresh=True)
        self.assertFalse(r['ok'])
        self.assertEqual(r['boards'],[])

    def test_board_search_missing_core_and_installed(self):
        sample={'boards':[
            {'name':'Uno','fqbn':'arduino:avr:uno','platform':{'id':'arduino:avr','name':'Arduino AVR'}},
            {'name':'Custom','fqbn':'vendor:arch:custom','platform':{'id':'vendor:arch','name':'Custom Core'}}]}
        with patch.object(server,'_cli_json',return_value={'ok':True,'data':sample,'error':''}), patch.object(server,'board_catalog',return_value={'boards':[{'fqbn':'arduino:avr:uno'}]}):
            r=server.board_search('uno')
        self.assertEqual(r['total'],2)
        self.assertTrue(r['boards'][0]['installed'])
        self.assertFalse(r['boards'][1]['installed'])
        self.assertEqual(r['boards'][1]['core'],'vendor:arch')

    def test_search_rejects_command_injection(self):
        for q in ('', '../bad;del', 'esp32 && rm -rf /', 'test\nxx', 'a'*100):
            with self.subTest(q=q), self.assertRaises(ValueError):server.board_search(q)

    def test_port_matching_unknown_ch340_keeps_unknown_model(self):
        data={'detected_ports':[{'port':{'address':'COM4','label':'CH340',
                            'properties':{'vid':'0x1A86','pid':'0x7523'}},'matching_boards':[]}]}
        with patch.object(server.sys,'platform','linux'), patch.object(server.shutil,'which',return_value='/fake/arduino-cli'),patch.object(server,'command_result',return_value={'ok':True,'output':json.dumps(data)}):
            r=server.scan_ports()
        self.assertEqual(r[0]['port'],'COM4')
        self.assertEqual(r[0]['boards'],[])
        self.assertEqual(r[0]['vid'],'0x1A86')

    def test_frontend_has_full_search_and_explicit_binding(self):
        from pathlib import Path
        root=Path(__file__).resolve().parents[1]
        js=(root/'app.js').read_text('utf-8')
        html=(root/'index.html').read_text('utf-8')
        for marker in ('boardFingerprint','rememberBoard','rememberedBoard', 'scanInProgress', 'renderCatalog','/api/board-catalog/search'):
            self.assertIn(marker,js)
        self.assertIn('role="list"',html)
        self.assertIn('id="catalogQuery"',html)
        self.assertIn('id="catalogOpen"',html)
        self.assertIn('id="terminalGrip"',html)

if __name__=='__main__': unittest.main()
