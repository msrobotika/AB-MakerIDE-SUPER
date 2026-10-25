"""Agent consent regression: real HTTP + Chromium, stub worker, no CLI/hardware.

Run in the local Playwright venv with --outputs pointing to an evidence folder.
Native confirm/prompt deliberately throw, matching the integrated browser bug.
"""
import argparse
import json
import difflib
import zipfile
import os
from pathlib import Path
import sys
import tempfile
import threading
import time
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from playwright.sync_api import sync_playwright
import agent_runtime
import server


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--outputs', type=Path, required=True)
    args = parser.parse_args()
    args.outputs.mkdir(parents=True, exist_ok=True)
    report = {'checks': [], 'page_errors': [], 'starts': [],
              'scope': 'Real HTTP handler/consent validation/workspace; stub CLI worker. No hardware.'}

    def check(name, value):
        report['checks'].append({'name': name, 'passed': bool(value)})
        if not value:
            raise AssertionError(name)

    def worker(_manager, job, executable, task):
        time.sleep(.6)
        if task.startswith('PROJECT:'):
            report.setdefault('inherited_headers', []).append((job.workspace/'radar_config.h').exists())
            code='#include "radar_config.h"\n// PROJECT_GENERATED '+job.id[:8]+'\nvoid setup(){}\nvoid loop(){}\n'
            (job.workspace/'radar_config.h').write_text('#define CONTROLLED_TEST 1\n')
            (job.workspace/job.file_name).write_text(code)
            job.modified_code=code
            job.diff=''.join(difflib.unified_diff(job.before.splitlines(True), code.splitlines(True)))
            job.changed_files=['radar_config.h']
        job.result = 'CONTROLADO: tarea de prueba completada sin CLI ni hardware.'
        job.exit_code = 0
        job.success = True
        job.active = False
        job.emit(job.result)
        job.persist()

    def scan(*, diagnostics=False):
        return {'ports': [], 'scan_ok': True, 'scan_errors': []} if diagnostics else []

    catalog = {'ok': True, 'boards': [{'fqbn': 'arduino:avr:uno', 'name': 'Arduino Uno'}],
               'count': 1, 'source': 'CONTROLADO', 'error': '', 'warning': ''}
    try:
        with tempfile.TemporaryDirectory() as temp, \
                patch.object(server, 'AGENT_JOBS', agent_runtime.AgentJobManager(Path(temp))), \
                patch.object(agent_runtime.AgentJobManager, '_work', worker), \
                patch.object(server, 'scan_ports', scan), \
                patch.object(server, 'board_catalog', return_value=catalog):
            http = server.ThreadingHTTPServer(('127.0.0.1', 0), server.IDEHandler)
            thread = threading.Thread(target=http.serve_forever, daemon=True)
            thread.start()
            try:
                with sync_playwright() as pw:
                    browser = pw.chromium.launch(headless=True)
                    page = browser.new_page(viewport={'width': 1360, 'height': 950})
                    page.on('pageerror', lambda error: report['page_errors'].append(str(error)))
                    page.add_init_script("window.prompt=()=>{throw Error('prompt() is not supported.')};window.confirm=()=>{throw Error('Native confirm disabled for regression')}")

                    def guard(route):
                        request = route.request
                        if request.method == 'POST':
                            if '/api/agents/start' in request.url:
                                report['starts'].append(request.post_data_json)
                            elif '/api/advisor/check' not in request.url:
                                raise AssertionError('Unexpected POST ' + request.url)
                        route.continue_()

                    page.route('**/api/**', guard)
                    page.goto(f'http://127.0.0.1:{http.server_port}')
                    page.wait_for_function('()=>document.querySelector("#backendState").textContent.includes("activo")')
                    page.locator('#showAI').click()
                    page.locator('#agentWorkbench').evaluate('(e)=>e.open=true')
                    page.locator('#execTask').fill('CONTROLADO: comprobar autorización, sin hardware')
                    page.locator('#execMode').select_option('total')
                    page.locator('#execRun').click()
                    check('total opens in-page dialog with focus', page.locator('#agentConsentInput').evaluate('(e)=>e===document.activeElement'))
                    check('blank consent cannot start', not page.locator('#agentConsentApprove').is_enabled() and not report['starts'])
                    page.locator('#agentConsentInput').fill('acepto')
                    check('incorrect consent cannot start', not page.locator('#agentConsentApprove').is_enabled() and not report['starts'])
                    page.locator('#agentConsentCancel').click()
                    page.wait_for_function('()=>document.querySelector("#execStatus").textContent.includes("cancelada")')
                    check('cancel starts nothing and explains outcome', not report['starts'] and 'cancelada' in page.locator('#execStatus').inner_text())
                    page.locator('#execRun').click()
                    page.locator('#agentConsentInput').press('Escape')
                    page.locator('#agentConsentDialog').wait_for(state='hidden')
                    check('Escape starts nothing', not report['starts'] and not page.locator('#agentConsentDialog').is_visible())
                    page.locator('#execRun').click()
                    check('consent resets each task', page.locator('#agentConsentInput').input_value() == '')
                    page.screenshot(path=str(args.outputs/'agent-consent-dialog.png'))
                    page.locator('#agentConsentInput').fill('ACCESO TOTAL')
                    check('exact consent enables start', page.locator('#agentConsentApprove').is_enabled())
                    page.locator('#agentConsentInput').press('Enter')
                    page.wait_for_function('()=>document.querySelector("#robotStatus").dataset.state==="success"')
                    check('one total request reaches real validation', len(report['starts']) == 1 and report['starts'][0]['full_consent'] == 'ACCESO TOTAL' and report['starts'][0]['confirm'] is True)
                    check('backend creates completed total job', server.AGENT_JOBS._current.mode == 'total' and server.AGENT_JOBS._current.success is True)
                    page.screenshot(path=str(args.outputs/'agent-consent-started-controlled.png'))
                    page.locator('#execMode').select_option('consultar')
                    page.locator('#execRun').click()
                    check('read-only hides full-access input', not page.locator('#agentConsentInput').is_visible() and page.locator('#agentConsentApprove').is_enabled())
                    page.locator('#agentConsentApprove').click()
                    page.wait_for_function('()=>document.querySelector("#robotStatus").dataset.state==="success"')
                    check('read-only request keeps permission scope', len(report['starts']) == 2 and report['starts'][1]['mode'] == 'consultar' and report['starts'][1]['full_consent'] == '')
                    page.set_viewport_size({'width': 390, 'height': 844})
                    page.locator('#execMode').select_option('total')
                    page.locator('#execRun').click()
                    check('dialog usable on mobile', page.locator('#agentConsentInput').is_visible() and page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
                    page.locator('#agentConsentCancel').click()
                    page.locator('#agentConsentDialog').wait_for(state='hidden')
                    page.set_viewport_size({'width':1360,'height':950})
                    original=page.locator('#code').input_value()
                    page.locator('#execMode').select_option('supervisado')
                    page.locator('#execTask').fill('PROJECT: generar código controlado')
                    page.locator('#execRun').click();page.locator('#agentConsentApprove').click()
                    page.wait_for_function('()=>document.querySelector("#code").value.includes("PROJECT_GENERATED")')
                    check('generated code automatically opens in editor', 'PROJECT_GENERATED' in page.locator('#code').input_value())
                    backup=page.evaluate('JSON.parse(localStorage.getItem("ab-makeride-ai-backup-v1"))[0]')
                    check('original editor code backed up before replacement', backup['code']==original)
                    parent=page.evaluate('localStorage.getItem("ab-makeride-agent-project-v1")')
                    check('save and open controls visible beside agent actions',page.locator('#agentOpenCode').is_enabled() and page.locator('#agentSaveProject').is_enabled())
                    with page.expect_download() as event:
                        page.locator('#agentSaveProject').click()
                    exported=event.value;exported.save_as(str(args.outputs/'controlled-agent-project.zip'))
                    with zipfile.ZipFile(args.outputs/'controlled-agent-project.zip') as archive:
                        check('project download includes header and sketch', 'sketch/radar_config.h' in archive.namelist() and 'sketch/sketch.ino' in archive.namelist())
                    page.screenshot(path=str(args.outputs/'agent-generated-editor-controlled.png'))
                    page.locator('#execTask').fill('PROJECT: continuar y conservar mis ediciones')
                    page.locator('#execRun').click();page.locator('#agentConsentApprove').click()
                    page.locator('#code').fill('// edición del usuario durante la tarea')
                    page.wait_for_function('()=>!document.querySelector("#execRun").disabled')
                    page.wait_for_timeout(100)
                    check('continued task carries parent project reference', report['starts'][-1]['parent_job_id']==parent)
                    check('continued backend receives auxiliary header', report['inherited_headers'][-1])
                    check('editing during task prevents automatic overwrite', page.locator('#code').input_value()=='// edición del usuario durante la tarea')
                    page.evaluate('window.confirm=()=>true')
                    page.locator('#agentOpenCode').click()
                    page.wait_for_function('()=>document.querySelector("#code").value.includes("PROJECT_GENERATED")')
                    check('manual open preserves competing edit in backup', page.evaluate('JSON.parse(localStorage.getItem("ab-makeride-ai-backup-v1"))[0].code')=='// edición del usuario durante la tarea')
                    manual_code=page.locator('#code').input_value()
                    page.locator('#agentAutoOpen').uncheck()
                    page.locator('#execTask').fill('PROJECT: conservar revisión manual')
                    page.locator('#execRun').click();page.locator('#agentConsentApprove').click()
                    page.wait_for_function('()=>!document.querySelector("#execRun").disabled')
                    page.wait_for_timeout(100)
                    check('automatic open can be disabled without losing generated project',page.locator('#code').input_value()==manual_code and page.locator('#agentSaveProject').is_enabled())
                    page.locator('#agentAutoOpen').check()
                    saved_code='// sketch reutilizado\nvoid setup(){}\nvoid loop(){}\n'
                    reusable=Path(temp)/'Reutilizable.ino';reusable.write_text(saved_code)
                    page.locator('#projectFile').set_input_files(str(reusable))
                    page.wait_for_function('()=>document.querySelector("#code").value.includes("sketch reutilizado")')
                    check('saved ino can be reopened with Importar', page.locator('#code').input_value().startswith('// sketch reutilizado'))
                    check('importing another sketch clears old agent project reference',page.evaluate('localStorage.getItem("ab-makeride-agent-project-v1")') is None)
                    page.locator('#agentTaskRadar').click()
                    page.wait_for_function('()=>document.querySelector("#code").value.includes("RADAR IDEASPARK")')
                    check('radar opens in code editor without hardware action', 'Adafruit_ST7789' in page.locator('#code').input_value())
                    check('radar selects ESP32 instead of Uno', page.locator('#quickBoard').input_value()=='esp32:esp32:esp32')
                    page.screenshot(path=str(args.outputs/'radar-editor-controlled.png'))
                    check('no native-popup exceptions', not report['page_errors'])
                    browser.close()
            finally:
                http.shutdown()
                http.server_close()
        report['passed'] = True
    except Exception as error:
        report['passed'] = False
        report['failure'] = str(error)
        raise
    finally:
        (args.outputs/'agent-consent-checks.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps({'passed': report.get('passed'), 'checks': len(report['checks']), 'failure': report.get('failure')}))


if __name__ == '__main__':
    main()
