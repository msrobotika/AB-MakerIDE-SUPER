"""V0.9.6: filesystem recovery and UX tests. NO actual Codex account/hardware exercised."""
from pathlib import Path
import json
import tempfile
import time
import sys
import unittest
from unittest.mock import patch
import agent_runtime as ar
import server

CODE = '#include <Arduino.h>\nvoid setup(){}\nvoid loop(){}\n'

class RecoveryTests(unittest.TestCase):
    def test_completed_job_recovered_with_diff_and_no_fake_flash(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)/'AgentWorkspaces'
            script=Path(temp)/'mock.py'
            script.write_text('from pathlib import Path\nimport sys\nsys.stdin.read()\np=Path("sketch.ino")\np.write_text(p.read_text()+"// Pong game\n",encoding="utf-8")\nprint("Propuesta terminada")\n'.replace('"// Pong game\n"','"// Pong game\\n"'),encoding='utf-8')
            manager=ar.AgentJobManager(root)
            with patch.object(ar.shutil,'which',return_value=sys.executable), patch.object(
               ar,'agent_command',return_value=[sys.executable,'-u',str(script)]):
                response=manager.start(provider='codex',mode='supervisado',prompt='Haz un Pong',code=CODE,
                    lang='cpp',fqbn='esp32:esp32:esp32',port='COM4',confirmed=True)
                jobid=response['job_id']
                for _ in range(200):
                    result=manager.get(jobid)
                    if not result['active']:break
                    time.sleep(.03)
            self.assertTrue(result['success'],result['error'])
            self.assertEqual(result['outcome'],'agent_finished_only')
            self.assertFalse(result['evidence']['flash_verified'])
            recovered=ar.AgentJobManager(root)
            result2=recovered.get(jobid)
            self.assertTrue(result2['success'])
            self.assertIn('Pong game',result2['modified_code'])
            self.assertIn('Pong game',result2['diff'])
            self.assertEqual(result2['outcome'],'agent_finished_only')
            self.assertFalse(result2['interrupted'])
            self.assertEqual(len(recovered.history()),1)
            self.assertIn('Pong',recovered.history()[0]['task_summary'])

    def test_unfinished_on_restart_marked_unknown_no_auto_repeat(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)/'sessions'
            mgr=ar.AgentJobManager(root)
            with patch.object(ar.shutil,'which',return_value='/fake/codex'),patch.object(mgr,'_work',return_value=None):
                entry=mgr.start(provider='codex',mode='total',prompt='Graba LED en COM4',code=CODE,
                    lang='cpp',fqbn='arduino:avr:uno',port='COM4',confirmed=True,full_consent='ACCESO TOTAL')
            recovered=ar.AgentJobManager(root)
            snapshot=recovered.get(entry['job_id'])
            self.assertFalse(snapshot['active'])
            self.assertFalse(snapshot['success'])
            self.assertTrue(snapshot['interrupted'])
            self.assertEqual(snapshot['outcome'],'unknown_after_restart')
            self.assertFalse(snapshot['evidence']['flash_verified'])
            self.assertIn('DESCONOCIDO',snapshot['error'])
            self.assertTrue((Path(entry['workspace'])/ar.JOURNAL_FILENAME).is_file())

    def test_old_session_sketch_offered_without_claimed_hardware_success(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)/'sessions';root.mkdir()
            legacy=root/'sesion-old-xyz';legacy.mkdir()
            (legacy/'sketch.ino').write_text(CODE+'// Juego del usuario',encoding='utf-8')
            mgr=ar.AgentJobManager(root)
            recent=mgr.history()
            self.assertEqual(len(recent),1)
            self.assertTrue(recent[0]['legacy'])
            result=mgr.get(recent[0]['job_id'])
            self.assertIn('Juego del usuario',result['modified_code'])
            self.assertFalse(result['success'])
            self.assertTrue(result['legacy'])
            self.assertTrue(result['interrupted'])
            self.assertFalse(any(result['evidence'].values()))

    def test_logs_persist_without_obvious_secrets(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)/'sessions';root.mkdir()
            work=root/'sesion-hello';work.mkdir()
            j=ar.AgentJob('a'*32,'codex','consultar',work,'sketch.ino',CODE)
            j.emit('bearer ABCDEFGHIJKLMNOPQRSTUVWXYZ0')
            journal=(work/ar.JOURNAL_FILENAME).read_text(encoding='utf-8')
            self.assertNotIn('ABCDEFGHIJKLMNOPQRSTUVWXYZ0',journal)
            self.assertIn('CREDENCIAL OCULTA',journal)

    def test_ui_recovery_and_game_preset_not_autorun(self):
        base=Path(__file__).resolve().parents[1]
        ui=(base/'app.js').read_text(encoding='utf-8')
        html=(base/'index.html').read_text(encoding='utf-8')
        self.assertIn('id="agentRecover"',html)
        self.assertIn('id="agentContinue"',html)
        self.assertIn('id="agentTaskPong"',html)
        self.assertIn('recoverAgentSession',ui)
        self.assertIn('reportAgentOutcome',ui)
        self.assertIn('rememberAgent',ui)
        self.assertIn('El registro declara firmware verificado',ui)
        self.assertIn("$('#agentTaskPong').onclick=()=>",ui)
        self.assertNotIn("$('#agentTaskPong').onclick=()=>{$('#execRun').click()",ui)

    def test_api_history_exists(self):
        with tempfile.TemporaryDirectory() as temp:
            mgr=ar.AgentJobManager(Path(temp)/'sessions')
            self.assertEqual(mgr.history(),[])
            self.assertTrue('/api/agents/history' in Path(server.__file__).read_text(encoding='utf-8'))

if __name__=='__main__': unittest.main()
