"""Pagination, large CLI responses, and honest local device matching. No hardware access."""
import json
import unittest
from unittest.mock import patch
from pathlib import Path
import server

class PaginatedCatalog097(unittest.TestCase):
    def tearDown(self):
        server.CATALOG_CACHE.update(until=0.0, result=None)

    def test_installed_full_catalog_searched_on_server_with_40_results(self):
        data=[{'fqbn':f'custom:arch:board{i}', 'name':f'Device {i:04d}','platform':'Custom'} for i in range(600)]
        with patch.object(server,'board_catalog',return_value={'ok':True,'boards':data,'source':'installed','error':'','warning':''}):
            first=server.installed_board_search('',page=1,limit=40)
            second=server.installed_board_search('',page=2,limit=40)
            last=server.installed_board_search('',page=15,limit=40)
            match=server.installed_board_search('Device 059',page=1,limit=40)
        self.assertEqual(first['total'],600)
        self.assertEqual(first['pages'],15)
        self.assertEqual(len(first['boards']),40)
        self.assertEqual(second['boards'][0]['fqbn'],'custom:arch:board40')
        self.assertEqual(last['boards'][-1]['fqbn'],'custom:arch:board599')
        self.assertEqual(match['total'],10)

    def test_pagination_rejects_invalid_values_before_cli(self):
        with patch.object(server,'_cli_json') as cli:
            for page,limit in ((0,40),(1,0),(1,51),(100001,40)):
                with self.subTest(page=page,limit=limit),self.assertRaises(ValueError):
                    server.board_search('ESP32',page=page,limit=limit)
            cli.assert_not_called()
        with self.assertRaises(ValueError):
            server.installed_board_search('\n')

    def test_manager_remote_results_page_no_250_cap(self):
        remote={'boards':[{'name':f'ESP32 board {i:03d}', 'fqbn':f'esp32:esp32:model{i}',
                           'platform':{'id':'esp32:esp32','name':'Espressif'}} for i in range(350)]}
        with patch.object(server,'_cli_json',return_value={'ok':True,'data':remote,'error':''}),\
             patch.object(server,'board_catalog',return_value={'boards':[]}):
            r=server.board_search('ESP32',page=7,limit=40)
        self.assertEqual(r['total'],350)
        self.assertEqual(len(r['boards']),40)
        self.assertEqual(r['boards'][0]['fqbn'],'esp32:esp32:model240')

    def test_cli_12mb_response_no_8mb_false_error(self):
        large={'boards':[{'name':f'Custom device {i:06d} '+('A'*280),'fqbn':f'custom:arch:d{i}'} for i in range(32000)]}
        output=json.dumps(large)
        self.assertGreater(len(output),8_000_000)
        proc=type('Completed',(),{'returncode':0,'stdout':output,'stderr':''})()
        with patch.object(server.shutil,'which',return_value='/usr/bin/arduino-cli'),patch.object(server.subprocess,'run',return_value=proc):
            result=server._cli_json(['board','search','custom','--json'])
        self.assertTrue(result['ok'])
        self.assertEqual(len(result['data']['boards']),32000)

    def test_no_js_injection_from_catalog_name(self):
        js=(Path(__file__).resolve().parents[1]/'app.js').read_text('utf-8')
        self.assertIn('name.textContent=b.name',js)
        self.assertIn("desc.textContent=b.fqbn",js)
        self.assertIn('fetchInstalledCatalog',js)
        self.assertIn("'__search__'",js)
        self.assertIn('catalogPrev',js)
        self.assertIn('catalogNext',js)

if __name__ == '__main__': unittest.main()
