"""AB MakerIDE 0.4 regression: speed, retry, safe commands, truthful simulator."""
import importlib.util
import http.client
import json
from pathlib import Path
import sys
import threading
import time
import unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
import jobs,cloud_agent
spec=importlib.util.spec_from_file_location('maker_v04',ROOT/'server.py')
srv=importlib.util.module_from_spec(spec);sys.modules[spec.name]=srv;spec.loader.exec_module(srv)

def completed(manager,jid):
    for _ in range(300):
        st=manager.status(jid)
        if not st['active']:return st
        time.sleep(.01)
    raise AssertionError('Job did not finish')

class UploadOptions(unittest.TestCase):
    def test_unsupported_speeds_rejected(self):
        m=jobs.JobManager(threading.Lock())
        for speed in ('921600',9600,0,True,-1):
            with self.subTest(speed=speed),self.assertRaises(ValueError):m.start('x','esp32:esp32:esp32','COM4',upload_speed=speed)
        with self.assertRaises(ValueError):m.start('x','arduino:avr:uno','COM4',upload_speed=921600)
    def test_compile_and_upload_share_exact_board_options(self):
        m=jobs.JobManager(threading.Lock());calls=[]
        def fake(job,args,timeout):calls.append(args);return 0
        with patch.object(m,'_run',fake):
            jid=m.start('void setup(){} void loop(){}','esp32:esp32:esp32','COM4',upload_speed=460800)['job_id']
            result=completed(m,jid)
        self.assertTrue(result['success']);self.assertEqual(result['attempted_speeds'],[460800])
        self.assertEqual(len(calls),2)
        for args in calls:
            self.assertEqual(args[args.index('--board-options')+1],'UploadSpeed=460800')
            self.assertIn('--no-color',args)
    def test_retry_only_on_recoverable_transport_error_and_opt_in(self):
        for enabled in (False,True):
            m=jobs.JobManager(threading.Lock());calls=[]
            def fake(job,args,timeout):
                calls.append(args)
                if args[1]=='upload' and len([x for x in calls if x[1]=='upload'])==1:
                    job.emit('Unable to verify flash chip connection (No more data to read from the serial port)',from_tool=True)
                    return 2
                return 0
            with patch.object(m,'_run',fake):
                jid=m.start('x','esp32:esp32:esp32','COM4',upload_speed=921600,retry_slow=enabled)['job_id']
                result=completed(m,jid)
            self.assertEqual(result['success'],enabled)
            self.assertEqual(len(calls),3 if enabled else 2)
            if enabled:
                self.assertEqual(result['attempted_speeds'],[921600,115200])
                self.assertIn('UploadSpeed=115200',calls[-1])
    def test_no_retry_for_compile_error_or_generic_upload_error(self):
        m=jobs.JobManager(threading.Lock());calls=[]
        def fake(job,args,timeout):
            calls.append(args)
            if args[1]=='upload':job.emit('permission denied: COM4',from_tool=True);return 1
            return 0
        with patch.object(m,'_run',fake):
            jid=m.start('x','esp32:esp32:esp32','COM4',upload_speed=921600,retry_slow=True)['job_id']
            res=completed(m,jid)
        self.assertFalse(res['success']);self.assertEqual(len(calls),2)
    def test_progress_only_when_writing_reported_by_uploader(self):
        j=jobs.Job(id='x',action='upload',stage='grabación')
        j.emit('Sketch uses 919560 bytes (70%)',from_tool=True)
        self.assertIsNone(j.upload_progress)
        j.emit('Writing at 0x00010000... (18 %)',from_tool=True)
        self.assertEqual(j.upload_progress,18)
    def test_google_test_rejects_prompt_leakage(self):
        a=cloud_agent.AgentService();a.configure('google','gemma-4-31b-it','fake')
        class Resp:
            def __enter__(self):return self
            def __exit__(self,*x):pass
            def read(self,*x):return json.dumps({'candidates':[{'content':{'parts':[{'text':'Role: Technical Assistant'}]}}]}).encode()
        with patch.object(cloud_agent,'urlopen',return_value=Resp()):
            with self.assertRaisesRegex(ValueError,'no superó'):a.chat('Responde exactamente: CONEXION OK',test=True)

class TerminalAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.http=srv.ThreadingHTTPServer(('127.0.0.1',0),srv.IDEHandler)
        cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True);cls.thread.start()
    @classmethod
    def tearDownClass(cls):cls.http.shutdown();cls.http.server_close();cls.thread.join(3)
    def call(self,path,data):
        c=http.client.HTTPConnection('127.0.0.1',self.http.server_port,timeout=5)
        c.request('POST',path,body=json.dumps(data),headers={'Content-Type':'application/json','X-AB-Session':srv.SESSION_KEY})
        r=c.getresponse();body=json.loads(r.read());status=r.status;c.close();return status,body
    def test_terminal_rejects_shell_injection(self):
        for bad in ['rm -rf /','version;rm','install esp32','__proto__']:
            st,d=self.call('/api/terminal/command',{'action':bad})
            self.assertEqual(st,400);self.assertFalse(d['ok'])
    def test_installer_requires_confirm_and_allowlist(self):
        for data in ({'core':'esp32:esp32'}, {'core':'evil:evil','confirm':True}):
            st,d=self.call('/api/terminal/install-core',data)
            self.assertEqual(st,400)
    def test_terminal_readonly_allowlist(self):
        with patch.object(srv,'command_result',return_value={'ok':True,'output':'arduino-cli 1.5.1'}):
            st,d=self.call('/api/terminal/command',{'action':'version'})
        self.assertEqual(st,200);self.assertIn('1.5.1',d['output'])
