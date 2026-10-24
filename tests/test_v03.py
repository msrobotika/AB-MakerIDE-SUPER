"""v0.3 tests: progress, security, cloud integration with mocked HTTP, no hardware."""
import http.client
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import threading
import time
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
import cloud_agent
import jobs
spec=importlib.util.spec_from_file_location('abmaker_test_v03',ROOT/'server.py')
server=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=server
spec.loader.exec_module(server)

class JobTests(unittest.TestCase):
    def test_ansi_cleaned(self):
        self.assertEqual(jobs.clean_terminal('\x1b[92mOK\x1b[0m'), 'OK')
    def test_uploader_progress_only_from_stdout(self):
        self.assertIsNone(jobs.extract_upload_percent('Compilando ...'))
        self.assertEqual(jobs.extract_upload_percent('Writing at 0x00... (67 %)'), 67)
        self.assertIsNone(jobs.extract_upload_percent('Error 6000'))
        self.assertIsNone(jobs.extract_upload_percent('950%'))
    def test_stage_compile_then_upload_and_real_progress(self):
        manager=jobs.JobManager(threading.Lock())
        calls=[]
        def fake_run(job,args,timeout):
            calls.append(args[1]);
            if args[1]=='upload':
                job.emit('Writing at 0x... 43%', from_tool=True)
                self.assertEqual(job.snapshot()['progress'],43)
            return 0
        with patch.object(manager,'_run',fake_run):
            r=manager.start('void setup(){} void loop(){}','esp32:esp32:esp32','COM4')
            for _ in range(100):
                d=manager.status(r['job_id']);
                if not d['active']:break
                time.sleep(.02)
        self.assertTrue(d['success']);self.assertEqual(d['stage'],'completado')
        self.assertEqual(calls,['compile','upload']);self.assertEqual(d['progress'],43)
    def test_compile_failure_prevents_upload(self):
        manager=jobs.JobManager(threading.Lock())
        calls=[]
        def fake_run(job,args,timeout):
            calls.append(args[1]);job.emit('sketch.ino:80: error: invalid operands');return 1
        with patch.object(manager,'_run',fake_run):
            jid=manager.start('broken','esp32:esp32:esp32','COM4')['job_id']
            for _ in range(100):
                d=manager.status(jid)
                if not d['active']:break
                time.sleep(.02)
        self.assertFalse(d['success']);self.assertEqual(d['stage'],'error')
        self.assertEqual(calls,['compile'])
    def test_real_subprocess_live_events(self):
        manager=jobs.JobManager(threading.Lock())
        job=jobs.Job(id='subprocess-test',action='upload',stage='grabación')
        command=[sys.executable,'-u','-c',
                 'import time;print("Writing at 0x... 35%",flush=True);time.sleep(1.2);print("Writing at 0x... 100%",flush=True)']
        holder={}
        t=threading.Thread(target=lambda:holder.update(rc=manager._run(job,command,5)),daemon=True)
        t.start()
        for _ in range(200):
            if job.snapshot()['progress']==35:break
            time.sleep(.01)
        self.assertEqual(job.snapshot()['progress'],35)
        self.assertTrue(t.is_alive(), 'La salida debería llegar antes de terminar el proceso')
        t.join(4)
        self.assertEqual(holder['rc'],0)
        self.assertEqual(job.snapshot()['progress'],100)

    def test_cancel_no_active_process(self):
        manager=jobs.JobManager(threading.Lock())
        start_evt=threading.Event()
        def fake_run(job,args,timeout):
            start_evt.set()
            while not job.cancelled: time.sleep(.01)
            return -1
        with patch.object(manager,'_run',fake_run):
            jid=manager.start('x','esp32:esp32:esp32')['job_id']
            self.assertTrue(start_evt.wait(1))
            manager.cancel(jid)
            for _ in range(100):
                d=manager.status(jid)
                if not d['active']:break
                time.sleep(.02)
        self.assertTrue(d['cancelled']);self.assertFalse(d['success'])

class CloudTests(unittest.TestCase):
    def setUp(self):self.agent=cloud_agent.AgentService()
    def test_google_api_request_and_no_key_exposure(self):
        self.agent.configure('google','gemma-4-31b-it','private-test-key')
        captured={}
        class FakeResponse:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self,n):return json.dumps({'candidates':[{'content':{'parts':[{'text':'OK'}]}}]}).encode()
        def fake_open(request,timeout):
            captured['url']=request.full_url
            captured['key']=request.get_header('X-goog-api-key')
            captured['body']=json.loads(request.data)
            return FakeResponse()
        with patch.object(cloud_agent,'urlopen',fake_open):
            out=self.agent.chat('Hola',code='void loop(){}',fqbn='esp32:esp32:esp32')
        self.assertTrue(out['ok']);self.assertEqual(out['text'],'OK')
        self.assertTrue(captured['url'].startswith('https://generativelanguage.googleapis.com/'))
        self.assertEqual(captured['key'],'private-test-key')
        self.assertNotIn('private-test-key',str(self.agent.status()))
        self.assertTrue(out['context_sent'])
    def test_openrouter_openai_compatible(self):
        self.agent.configure('openrouter','google/gemma-4-31b-it:free','key-example')
        class FakeResponse:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self,n):return b'{"choices":[{"message":{"content":"Texto real"}}]}'
        with patch.object(cloud_agent,'urlopen',return_value=FakeResponse()) as m:
            d=self.agent.chat('Hola')
        self.assertEqual(d['text'],'Texto real')
        self.assertEqual(m.call_args[0][0].full_url,'https://openrouter.ai/api/v1/chat/completions')
    def test_local_ollama_fixed_host_and_allowlist_validation(self):
        with self.assertRaises(ValueError):self.agent.configure('google','https://evil.com','secret')
        with self.assertRaises(ValueError):self.agent.configure('openrouter','wrong','secret')
        self.agent.configure('ollama','gemma3:4b')
        class Response:
            def __enter__(self):return self
            def __exit__(self,*a):pass
            def read(self,n):return b'{"message":{"content":"Local"}}'
        with patch.object(cloud_agent,'urlopen',return_value=Response()) as m:
            d=self.agent.chat('Hola')
        self.assertEqual(d['text'],'Local')
        self.assertEqual(m.call_args[0][0].full_url,'http://127.0.0.1:11434/api/chat')
    def test_code_context_is_opt_in_and_length_limited(self):
        self.agent.configure('google','gemma-4-31b-it','foo')
        with self.assertRaises(ValueError):self.agent.chat('Hola',code='x'*24001)
        self.assertFalse(self.agent.status()['configured']['openrouter'])
        with self.assertRaises(ValueError):self.agent.chat('x'*6001)
        with self.assertRaises(ValueError):self.agent.configure('google','gemma-4-31b-it','key\nHeader: fake')

class APIv03(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.http=server.ThreadingHTTPServer(('127.0.0.1',0),server.IDEHandler)
        cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True);cls.thread.start()
    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown();cls.http.server_close();cls.thread.join(3)
    def query(self,method,path,data=None):
        conn=http.client.HTTPConnection('127.0.0.1',self.http.server_port,timeout=6)
        h={'Content-Type':'application/json', 'X-AB-Session':server.SESSION_KEY}
        conn.request(method,path,body=json.dumps(data) if data is not None else None,headers=h)
        resp=conn.getresponse();body=resp.read();conn.close()
        return resp.status,json.loads(body) if path.startswith('/api') else body
    def test_ai_unconfigured_raises_clean_error(self):
        original=server.AGENT
        server.AGENT=cloud_agent.AgentService()
        try:
            status,data=self.query('POST','/api/ai/chat',{'prompt':'hola'})
            self.assertEqual(status,400)
            self.assertNotIn('Traceback',data['error'])
        finally:server.AGENT=original
    def test_job_requires_confirmation_and_safe_fqbn(self):
        with patch.object(server.shutil,'which',return_value='arduino-cli'):
            status,data=self.query('POST','/api/jobs/start',{'action':'upload','lang':'cpp','code':'void loop(){}','fqbn':'esp32:esp32:esp32','port':'COM4'})
            self.assertEqual(status,400)
            self.assertIn('confirmación',data['error'])
            status,data=self.query('POST','/api/jobs/start',{'action':'compile','lang':'cpp','code':'x','fqbn':'test; rm -rf'})
            self.assertEqual(status,400)
    def test_ideaspark_examples_http(self):
        for size in ('19','114'):
            status,data=self.query('GET',f'/examples/ideaspark_{size}_st7789.ino')
            self.assertEqual(status,200)
            self.assertIn(b'String("CHIP: ")',data)
