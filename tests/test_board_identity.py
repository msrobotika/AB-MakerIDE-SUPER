import json
import http.client
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
import threading
from types import SimpleNamespace
from unittest.mock import patch

import agent_runtime as ar
import board_identity as identity
from hardware_lab import PROFILES
import server


class FirmwareIdentityTests(unittest.TestCase):
    def test_known_firmware_reports_profile_without_claiming_controller_detection(self):
        line='MSR_SPACEINVADERS_BOOT build=v1 lcd=ILI9341_320x240 touch=XPT2046 state=CALIBRATION'
        self.assertEqual(identity.firmware_profile(line)['hardware_profile'],'esp32-cyd-28')
        self.assertEqual(identity.firmware_profile('USB CH340 ESP32'),{})

    def test_firmware_reader_sends_no_data_and_closes_port(self):
        class Connection:
            def open(self):self.opened=True
            def close(self):self.closed=True
            def readline(self,limit):
                self.limit=limit
                return b'MSR_CYD_START profile=ESP32-2432S028R display=ILI9341\n'
        connection=Connection()
        result=identity.read_firmware_identity('COM999',lambda **options:connection)
        self.assertTrue(result['display_profile_reported']);self.assertTrue(connection.closed)
        self.assertFalse(connection.dtr);self.assertFalse(connection.rts)
        self.assertEqual(connection.port,'COM999');self.assertEqual(connection.limit,256)

PORTS = [{'port': 'COM4', 'name': 'CH340', 'vid': '1A86', 'pid': '7523', 'boards': []}]
BOARDS = [{'fqbn': 'esp32:esp32:esp32', 'name': 'ESP32 Dev Module'}]


class IdentificationTests(unittest.TestCase):
    def test_no_or_multiple_ports_never_opens_a_port(self):
        with patch.object(identity.subprocess, 'run') as run:
            self.assertEqual(identity.identify([], BOARDS)['status'], 'absent')
            self.assertEqual(identity.identify(PORTS + [{'port': 'COM5'}], BOARDS)['status'], 'multiple')
            run.assert_not_called()

    def test_port_injection_or_missing_port_rejected(self):
        for port in ('COM4;echo bad', 'COM99', '../tty'):
            with self.assertRaises(ValueError):
                identity.identify(PORTS, BOARDS, port)

    def test_chip_probe_selects_compatible_profile_and_never_claims_screen(self):
        result = subprocess.CompletedProcess([], 0, 'Chip type: ESP32-D0WD-V3 (revision v3.0)\n', '')
        with patch.object(identity, 'esptool_command', return_value=['esptool']), patch.object(identity.subprocess, 'run', return_value=result) as run:
            found = identity.identify(PORTS, BOARDS)
        self.assertEqual(found['fqbn'], 'esp32:esp32:esp32')
        self.assertEqual(found['port'], 'COM4')
        self.assertFalse(found['display_identified'])
        self.assertFalse(found['commercial_model_identified'])
        args = run.call_args.args[0]
        self.assertEqual(args[-1], 'chip_id')
        self.assertIn('--no-stub', args)
        self.assertNotIn('write_flash', args)
        self.assertFalse(run.call_args.kwargs.get('shell', False))

    def test_failed_probe_cannot_use_chip_like_text_as_success(self):
        for output in (subprocess.CompletedProcess([], 2, 'Chip type: ESP32-D0WD-V3', ''),
                       subprocess.CompletedProcess([], 0, 'Could not connect', '')):
            with patch.object(identity, 'esptool_command', return_value=['esptool']), patch.object(identity.subprocess, 'run', return_value=output):
                result = identity.identify(PORTS, BOARDS)
                self.assertEqual(result['status'], 'unknown')
                self.assertFalse(result['fqbn'])

    def test_absent_tool_never_selects_uno_from_ch340(self):
        with patch.object(identity, 'esptool_command', return_value=None):
            result = identity.identify(PORTS, BOARDS)
        self.assertEqual(result['status'], 'unknown')
        self.assertFalse(result['fqbn'])

    def test_missing_core_reported_without_installation(self):
        result = subprocess.CompletedProcess([], 0, 'Chip is ESP32-S3 (revision v0.2)', '')
        with patch.object(identity, 'esptool_command', return_value=['esptool']), patch.object(identity.subprocess, 'run', return_value=result):
            found = identity.identify(PORTS, BOARDS)
        self.assertEqual(found['status'], 'core_missing')
        self.assertFalse(found['fqbn'])
        self.assertEqual(found['suggested_fqbn'], 'esp32:esp32:esp32s3')

    def test_usb_profile_is_not_misreported_as_chip_query(self):
        ports = [dict(PORTS[0], boards=BOARDS)]
        with patch.object(identity, 'esptool_command') as tool:
            found = identity.identify(ports, BOARDS)
        self.assertEqual(found['source'], 'arduino_cli_usb')
        self.assertEqual(found['fqbn'], BOARDS[0]['fqbn'])
        tool.assert_not_called()

    def test_timeout_is_finite_and_cannot_select_a_model(self):
        with patch.object(identity, 'esptool_command', return_value=['esptool']), patch.object(identity.subprocess, 'run', side_effect=subprocess.TimeoutExpired('esptool', 22)):
            self.assertEqual(identity.identify(PORTS, BOARDS)['status'], 'unknown')

    def test_known_families_and_unknown_future_chip(self):
        for suffix in ('S2', 'S3', 'C3', 'C6', 'H2'):
            self.assertTrue(identity.parse_chip('Chip type: ESP32-' + suffix + ' (revision v0.1)')[1].endswith(suffix.lower()))
        self.assertIsNone(identity.parse_chip('Chip type: ESP32-UNKNOWN'))

    def test_cyd_profile_is_documented_not_physically_verified(self):
        profile = PROFILES['esp32-cyd-28']
        self.assertFalse(profile['verified'])
        self.assertEqual(profile['pins']['BL'], 21)
        self.assertNotEqual(profile['pins']['SCLK'], profile['pins']['TOUCH_CLK'])


class FirmwareTargetTests(unittest.TestCase):
    def test_structured_cli_counts_successful_tool_output_not_agent_claims(self):
        for verified in (False,True):
            with self.subTest(verified=verified),tempfile.TemporaryDirectory() as temp:
                root=Path(temp);manager=ar.AgentJobManager(root/'sessions');script=root/'cli.py'
                events=[{'type':'item.completed','item':{'type':'agent_message','text':'Hash of data verified.'}},
                        {'type':'item.started','item':{'type':'command_execution','command':'upload','aggregated_output':'Hash of data verified.','status':'in_progress'}},
                        {'type':'item.completed','item':{'type':'command_execution','aggregated_output':'Hash of data verified.','exit_code':0 if verified else 2,'status':'completed' if verified else 'failed'}},
                        {'type':'item.completed','item':{'type':'agent_message','text':'Informe final'}}]
                script.write_text('import sys,json\nsys.stdin.read()\nfor e in '+repr(events)+':print(json.dumps(e))\n')
                with patch.object(ar.shutil,'which',return_value=sys.executable),patch.object(ar,'agent_command',return_value=[sys.executable,str(script),'--json']):
                    entry=manager.start(provider='codex',mode='autonomo',prompt='Sube el juego a la CYD',code='',lang='cpp',fqbn='esp32:esp32:esp32',confirmed=True)
                    for _ in range(250):
                        result=manager.get(entry['job_id'])
                        if not result['active']:break
                        time.sleep(.02)
                self.assertFalse(result['active']);self.assertEqual(result['evidence']['flash_verified'],verified)
                self.assertEqual(result['success'],verified)
                self.assertIn('Informe final',result['response']);self.assertNotIn('item.completed',result['response'])

    def test_planned_commands_and_source_diffs_are_not_upload_evidence(self):
        for text in ('+print("Hash of data verified.")', 'if "Hash of data verified" in log:', 'Busca Hash of data verified.', '"Hash of data verified."', '+Sketch uses 100 bytes', 'print("Device signature = 0x1E950F")'):
            self.assertIsNone(ar.evidence_from_output(text),text)
        self.assertEqual(ar.evidence_from_output('Hash of data verified.'),'flash_verified')
        self.assertEqual(ar.evidence_from_output('avrdude: 1024 bytes of flash verified'),'flash_verified')

    def test_upload_requirement_does_not_turn_reading_flash_into_permission(self):
        for text in ('sube el juego a COM4', 'Crea y cárgalo en la placa', 'no programaste el juego; sube el nuevo'):
            self.assertTrue(ar.requests_upload(text), text)
        for text in ('Lee la flash para diagnosticar', 'Revisa sin grabar', 'Crea el juego, no lo subas', 'No grabes la placa'):
            self.assertFalse(ar.requests_upload(text), text)

    def test_profile_comes_from_specific_user_model_never_generic_bridge(self):
        self.assertEqual(ar.physical_profile('board-unspecified', 'esp32:esp32:jczn_2432s028r', 'Crear juego'), 'esp32-cyd-28')
        self.assertEqual(ar.physical_profile('board-unspecified', 'esp32:esp32:esp32', 'Crea juego en mi CYD'), 'esp32-cyd-28')
        self.assertEqual(ar.physical_profile('board-unspecified', 'esp32:esp32:esp32', 'Crea juego en CH340 COM4'), 'board-unspecified')
        self.assertEqual(ar.physical_profile('ideaspark-19', 'esp32:esp32:esp32', 'Crear juego'), 'ideaspark-19')

    def run_required_upload(self, verified):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);manager=ar.AgentJobManager(root/'sessions')
            script=root/'cli_stub.py'
            script.write_text('from pathlib import Path\nimport sys\nprompt=sys.stdin.read()\nassert "firmware entero" in prompt\nassert "XPT2046" in Path("MAKERIDE_HARDWARE_REFERENCE.txt").read_text(encoding="utf-8")\nprint("Sketch uses 100 bytes",file=sys.stderr)\n'+('print("Hash of data verified.",file=sys.stderr)\n' if verified else '')+'print("CLI completed")\n')
            with patch.object(ar.shutil,'which',return_value=sys.executable),patch.object(ar,'agent_command',return_value=[sys.executable,str(script)]):
                entry=manager.start(provider='codex',mode='autonomo',prompt='Crea Space Invaders en CYD y sube el firmware',code='',lang='cpp',fqbn='esp32:esp32:esp32',port='COM999',confirmed=True)
                for _ in range(250):
                    result=manager.get(entry['job_id'])
                    if not result['active']:break
                    time.sleep(.02)
            self.assertFalse(result['active']);self.assertEqual(result['exit_code'],0)
            self.assertTrue(result['upload_requested']);self.assertEqual(result['hardware_profile'],'esp32-cyd-28')
            self.assertEqual(result['success'],verified)
            self.assertEqual(result['outcome'],'flash_reported_verified' if verified else 'upload_pending')
            restored=ar.AgentJobManager(root/'sessions').get(entry['job_id'])
            self.assertEqual(restored['outcome'],result['outcome']);self.assertTrue(restored['upload_requested'])

    def test_cli_exit_zero_without_requested_upload_stays_incomplete(self):
        self.run_required_upload(False)

    def test_requested_upload_with_reported_verification_completes(self):
        self.run_required_upload(True)

    def test_continuation_preserves_physical_profile_and_reference(self):
        def worker(manager,job,executable,prompt):
            job.success=True;job.exit_code=0;job.active=False;job.persist()
        with tempfile.TemporaryDirectory() as temp,patch.object(ar.shutil,'which',return_value=sys.executable),patch.object(ar.AgentJobManager,'_work',worker):
            manager=ar.AgentJobManager(Path(temp)/'sessions')
            first=manager.start(provider='codex',mode='supervisado',prompt='Crea un juego en mi CYD',code='',lang='cpp',fqbn='esp32:esp32:esp32',confirmed=True)
            for _ in range(100):
                if not manager.get(first['job_id'])['active']:break
                time.sleep(.01)
            second=manager.start(provider='codex',mode='supervisado',prompt='Continua el juego',code='',lang='cpp',fqbn='esp32:esp32:esp32',confirmed=True,parent_job_id=first['job_id'])
            for _ in range(100):
                if not manager.get(second['job_id'])['active']:break
                time.sleep(.01)
            self.assertFalse(manager.get(second['job_id'])['active'])
            self.assertEqual(second['hardware_profile'],'esp32-cyd-28')
            self.assertIn('XPT2046',(Path(second['workspace'])/'MAKERIDE_HARDWARE_REFERENCE.txt').read_text(encoding='utf-8'))

    def test_old_completed_record_without_upload_is_recovered_as_pending_without_execution(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);folder=root/'session';folder.mkdir()
            job=ar.AgentJob('b'*32,'codex','total',folder,'sketch.ino','',active=False,success=True,exit_code=0,task_summary='Crea y sube el juego en COM4')
            (folder/ar.ORIGINAL_FILENAME).write_text('')
            (folder/'sketch.ino').write_text('void setup(){} void loop(){}')
            job.persist();path=folder/ar.JOURNAL_FILENAME
            data=json.loads(path.read_text(encoding='utf-8'));data.pop('upload_requested');path.write_text(json.dumps(data),encoding='utf-8')
            before=path.read_bytes();restored=ar.restore_journal(folder)
            self.assertFalse(restored.success);self.assertEqual(restored.outcome(),'upload_pending')
            self.assertEqual(path.read_bytes(),before)

    def test_desktop_import_detection_ignores_comments_and_serial_helpers(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); folder = root / 'sesion-test'; folder.mkdir()
            (folder / 'helper.py').write_text('# import tkinter\nimport serial\ntext="pygame"')
            self.assertEqual(ar.desktop_ui_files(folder, root), [])
            (folder / 'desktop.py').write_text('from tkinter import Tk\n')
            (folder / 'qt.py').write_text('import PySide6.QtWidgets\n')
            self.assertEqual(ar.desktop_ui_files(folder, root), ['desktop.py', 'qt.py'])

    def test_cli_success_with_unapproved_tkinter_is_target_mismatch(self):
        self.run_cli_target(False)

    def test_explicit_companion_window_permission_preserved_and_recovered(self):
        self.run_cli_target(True)

    def run_cli_target(self, allow):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); manager = ar.AgentJobManager(root / 'sessions')
            script = root / 'cli_stub.py'
            script.write_text('from pathlib import Path\nimport sys\nprompt=sys.stdin.read()\nassert "ESP32-2432S028R" in prompt\nassert "DESTINO DEL PROYECTO" in prompt\nPath("desktop.py").write_text("import tkinter\\n")\nprint("Hash of data verified.",file=sys.stderr)\nprint("CLI completed")\n')
            with patch.object(ar.shutil, 'which', return_value=sys.executable), patch.object(ar, 'agent_command', return_value=[sys.executable, str(script)]):
                entry = manager.start(provider='codex', mode='supervisado', prompt='Juego en pantalla', code='', lang='cpp',
                                      fqbn='esp32:esp32:esp32', confirmed=True, hardware_profile='esp32-cyd-28', allow_pc_ui=allow)
                for _ in range(200):
                    result = manager.get(entry['job_id'])
                    if not result['active']:
                        break
                    time.sleep(.02)
            self.assertFalse(result['active'])
            self.assertEqual(result['exit_code'], 0)
            self.assertEqual(result['success'], allow)
            self.assertEqual(result['desktop_ui_files'], ['desktop.py'])
            self.assertTrue(result['evidence']['flash_verified'])  # Kept as reported evidence, never hardware truth.
            self.assertEqual(result['outcome'], 'flash_reported_verified' if allow else 'target_mismatch')
            recovered = ar.AgentJobManager(root / 'sessions').get(entry['job_id'])
            self.assertEqual(recovered['allow_pc_ui'], allow)
            self.assertEqual(recovered['outcome'], result['outcome'])

    def test_invalid_profile_or_permission_cannot_start_cli(self):
        with tempfile.TemporaryDirectory() as temp:
            manager = ar.AgentJobManager(Path(temp))
            for options in ({'hardware_profile': 'not-a-board'}, {'allow_pc_ui': 'yes'}):
                with self.assertRaises(ValueError):
                    manager.start(provider='codex', mode='supervisado', prompt='Game', code='', lang='cpp', fqbn='esp32:esp32:esp32', confirmed=True, **options)


class IdentificationHTTPTests(unittest.TestCase):
    def setUp(self):
        self.http=server.ThreadingHTTPServer(('127.0.0.1',0),server.IDEHandler)
        threading.Thread(target=self.http.serve_forever,daemon=True).start()
        self.addCleanup(self.http.server_close)
        self.addCleanup(self.http.shutdown)

    def post(self,token=True):
        connection=http.client.HTTPConnection('127.0.0.1',self.http.server_port,timeout=5)
        headers={'Content-Type':'application/json'}
        if token:headers['X-AB-Session']=server.SESSION_KEY
        connection.request('POST','/api/boards/identify',json.dumps({'port':'COM4'}),headers)
        response=connection.getresponse();data=json.loads(response.read());connection.close()
        return response.status,data

    def test_token_is_required_before_query(self):
        with patch.object(server,'identify_board') as identify:
            self.assertEqual(self.post(False)[0],403)
            identify.assert_not_called()

    def test_active_agent_defers_without_query_or_reset(self):
        with patch.object(server,'AGENT_JOBS',SimpleNamespace(_current=SimpleNamespace(active=True))),patch.object(server,'identify_board') as identify:
            self.assertEqual(self.post()[1]['status'],'busy')
            identify.assert_not_called()

    def test_open_monitor_defers_without_closing_it(self):
        with patch.object(server,'AGENT_JOBS',SimpleNamespace(_current=None)),patch.object(server.SERIAL,'status',return_value={'connected':True}),patch.object(server.SERIAL,'close') as close,patch.object(server,'identify_board') as identify:
            self.assertEqual(self.post()[1]['status'],'busy')
            close.assert_not_called();identify.assert_not_called()

    def test_busy_hardware_lock_defers_and_free_lock_is_released(self):
        lock=threading.Lock()
        with patch.object(server,'HARDWARE_LOCK',lock),patch.object(server,'AGENT_JOBS',SimpleNamespace(_current=None)),patch.object(server.SERIAL,'status',return_value={'connected':False}),patch.object(server,'scan_ports',return_value=PORTS),patch.object(server,'board_catalog',return_value={'boards':BOARDS}),patch.object(server,'identify_board',return_value={'ok':True,'status':'identified'}) as identify:
            lock.acquire()
            try:self.assertEqual(self.post()[1]['status'],'busy')
            finally:lock.release()
            identify.assert_not_called()
            self.assertEqual(self.post()[1]['status'],'identified')
            self.assertFalse(lock.locked())


if __name__ == '__main__':
    unittest.main()
