from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
import jobs


class BoardTrialTests(unittest.TestCase):
    def test_evidence_scope_node_regressions(self):
        result=subprocess.run(['node','--test','tests/board_trials.test.cjs'],capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)

    def test_upload_port_is_preserved_after_server_restart(self):
        with tempfile.TemporaryDirectory() as temp:
            folder=Path(temp)/('a'*32);folder.mkdir()
            job=jobs.Job(id='a'*32,action='upload',port='COM4',fqbn='esp32:esp32:esp32',active=False,ok=True,exit_code=0)
            job.journal=folder/'job.json';job.persist(force=True)
            manager=jobs.JobManager(threading.Lock(),Path(temp))
            result=manager.status(job.id)
            self.assertEqual(result['port'],'COM4')
            self.assertEqual(result['action'],'upload')


if __name__=='__main__':unittest.main()
