"""V0.9.1 SUPER agent orchestration regressions.
The execution tests use a local Python CLI stub, NOT live Codex/Claude accounts.
"""
import http.client
import json
import os
from pathlib import Path
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

import agent_runtime as ar
import server

SKETCH = 'const int LED = LED_BUILTIN;\nvoid setup() {}\nvoid loop(){ delay(500); }\n'


class AgentFlagTests(unittest.TestCase):
    def test_codex_sandbox_and_full_access_explicit(self):
        with tempfile.TemporaryDirectory() as base:
            p = Path(base)
            inspect = ar.agent_command('codex','consultar','codex',p)
            edit = ar.agent_command('codex','supervisado','codex',p)
            full = ar.agent_command('codex','total','codex',p)
            self.assertIn('read-only', inspect)
            self.assertIn('workspace-write', edit)
            self.assertNotIn('--dangerously-bypass-approvals-and-sandbox', edit)
            self.assertIn('--dangerously-bypass-approvals-and-sandbox', full)
            self.assertEqual(full[-1], '-')

    def test_claude_permissions_are_not_implicitly_full(self):
        with tempfile.TemporaryDirectory() as base:
            p = Path(base)
            inspect = ar.agent_command('claude_code','consultar','claude',p)
            auto = ar.agent_command('claude_code','autonomo','claude',p)
            full = ar.agent_command('claude_code','total','claude',p)
            self.assertIn('plan', inspect)
            self.assertNotIn('--dangerously-skip-permissions', auto)
            self.assertIn('--dangerously-skip-permissions', full)

    def test_bad_mode_rejected(self):
        with self.assertRaises(ValueError):
            ar.agent_command('codex','bad','codex',Path('.'))

    def test_redaction_on_reported_cli_output(self):
        self.assertNotIn('sk-'+'x'*40, ar.redact_log('sk-'+'x'*40))
        self.assertIn('OCULTA', ar.redact_log('sk-'+'x'*40))


class AgentManagerTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.manager=ar.AgentJobManager(Path(self.tmp.name)/'workspaces')

    def tearDown(self):
        self.tmp.cleanup()

    def start(self, **changes):
        opts = dict(provider='codex',mode='supervisado',prompt='Cambia 500 ms a 200 ms',code=SKETCH,
                    lang='cpp',fqbn='arduino:avr:uno',confirmed=True)
        opts.update(changes)
        return self.manager.start(**opts)

    def test_full_requires_separate_text_consent(self):
        with patch.object(ar.shutil,'which',return_value='/fake/codex'):
            with self.assertRaisesRegex(ValueError,'ACCESO TOTAL'):
                self.start(mode='total')

    def test_lacks_confirmation_rejected(self):
        with patch.object(ar.shutil,'which',return_value='/fake/codex'):
            with self.assertRaisesRegex(ValueError,'aprobar'):
                self.start(confirmed=False)

    def test_source_secrets_are_blocked(self):
        with patch.object(ar.shutil,'which',return_value='/fake/codex'):
            with self.assertRaisesRegex(ValueError,'credenciales'):
                self.start(code='WiFi.begin("SSID", "my-secret-123");')

    def test_invalid_identity_and_shell_prompt_cannot_change_provider(self):
        with self.assertRaisesRegex(ValueError,'Proveedor'):
            self.start(provider='codex;echo fail')

    def test_cli_unavailable_diagnostic(self):
        with patch.object(ar.shutil,'which',return_value=None):
            with self.assertRaisesRegex(ValueError,'Instala'):
                self.start()

    def test_real_local_mocked_subprocess_yields_reviewable_diff(self):
        script=Path(self.tmp.name)/'mock_agent.py'
        script.write_text('''
from pathlib import Path
import sys
prompt=sys.stdin.read()
assert "Cambia 500" in prompt
p=Path.cwd()/"sketch.ino"
p.write_text(p.read_text().replace("500", "200"), encoding="utf-8")
print("Propuse cambiar 500ms por 200ms")
''', encoding='utf-8')
        with patch.object(ar.shutil,'which',return_value=sys.executable), patch.object(
            ar,'agent_command',return_value=[sys.executable,'-u',str(script)]
        ):
            job=self.start()
            result=None
            for _ in range(120):
                result=self.manager.get(job['job_id'])
                if not result['active']:
                    break
                time.sleep(.04)
            self.assertFalse(result['active'],'El agente no terminó en el tiempo previsto')
            self.assertTrue(result['success'],result['error'])
            self.assertIn('200',result['modified_code'])
            self.assertIn('-void loop(){ delay(500); }',result['diff'])
            self.assertIn('+void loop(){ delay(200); }',result['diff'])
            self.assertEqual((Path(result['workspace'])/'sketch.ino').read_text(),result['modified_code'])

    def test_cancel_really_stops_process(self):
        script=Path(self.tmp.name)/'slow_agent.py'
        script.write_text('import sys,time\nsys.stdin.read()\ntime.sleep(20)\n',encoding='utf-8')
        with patch.object(ar.shutil,'which',return_value=sys.executable), patch.object(
            ar,'agent_command',return_value=[sys.executable,'-u',str(script)]
        ):
            job=self.start()
            time.sleep(.3)
            self.manager.cancel(job['job_id'])
            result=None
            for _ in range(100):
                result=self.manager.get(job['job_id'])
                if not result['active']: break
                time.sleep(.05)
            self.assertFalse(result['active'])
            self.assertTrue(result['cancelled'])
            self.assertFalse(result['success'])

    def test_file_symlink_not_loaded(self):
        if os.name == 'nt':
            self.skipTest('Symlinks require different Windows privileges')
        with tempfile.TemporaryDirectory() as base:
            b=Path(base)
            (b/'sketch.ino').symlink_to('/etc/hosts')
            self.assertIsNone(ar._safe_workspace_file(b,'sketch.ino'))


class AgentHTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import threading
        cls.http = server.ThreadingHTTPServer(('127.0.0.1',0),server.IDEHandler)
        cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown();cls.http.server_close();cls.thread.join(3)

    def req(self, method, path, body=None, **headers):
        conn=http.client.HTTPConnection('127.0.0.1',self.http.server_port,timeout=5)
        content=json.dumps(body).encode() if body is not None else None
        if content: headers['Content-Type']='application/json'
        conn.request(method,path,body=content,headers=headers)
        r=conn.getresponse();status=r.status;data=json.loads(r.read());conn.close()
        return status,data

    def test_agent_status_has_no_secret(self):
        code,body=self.req('GET','/api/agents/status')
        self.assertEqual(code,200);self.assertIn('installed',body)
        self.assertNotIn('csrf',body)

    def test_no_token_blocks_start(self):
        code,body=self.req('POST','/api/agents/start',{'provider':'codex','mode':'total'})
        self.assertEqual(code,403)

    def test_foreign_origin_rejected_even_with_token(self):
        code,body=self.req('POST','/api/agents/start',{'provider':'codex','mode':'consultar'},
                           **{'X-AB-Session':server.SESSION_KEY,'Origin':'http://evil.test:8765'})
        self.assertEqual(code,403)

    def test_api_denies_full_without_second_authorization(self):
        code,body=self.req('POST','/api/agents/start',{
            'provider':'codex','mode':'total','prompt':'Mejora sketch',
            'code':SKETCH,'lang':'cpp','fqbn':'arduino:avr:uno', 'confirm':True,
        },**{'X-AB-Session':server.SESSION_KEY})
        self.assertEqual(code,400)
        self.assertIn('ACCESO TOTAL',body['error'])


if __name__ == '__main__': unittest.main()

class BoardScanJSONTests(unittest.TestCase):
    def setUp(self):
        from types import SimpleNamespace
        self.enterContext(patch.dict("sys.modules", {"serial.tools": SimpleNamespace(list_ports=SimpleNamespace(comports=lambda: []))}))
        self.enterContext(patch.object(server.sys, "platform", "linux"))

    def test_cli_v151_board_json_is_parsed(self):
        from unittest.mock import patch
        result={'ok':True,'output':json.dumps({'detected_ports':[
            {'port':{'address':'COM4','label':'USB CP2102','properties':{'vid':'0x10C4','pid':'0xEA60'}},
             'matching_boards':[{'fqbn':'esp32:esp32:esp32','name':'ESP32 Dev Module'}]}
        ]})}
        with patch.object(server.shutil,'which',return_value='arduino-cli'), \
             patch.object(server,'command_result',return_value=result) as cmd:
            boards=server.scan_ports()
        self.assertEqual(boards[0]['port'],'COM4')
        self.assertEqual(boards[0]['boards'][0]['fqbn'],'esp32:esp32:esp32')
        self.assertEqual(boards[0]['vid'],'0x10C4')
        self.assertIn('--json',cmd.call_args.args[0])
