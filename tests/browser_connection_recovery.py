"""Real HTTP and Chromium, controlled serial transport and COM999 only."""
import argparse
import json
from pathlib import Path
import sys
import tempfile
import threading
import types
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT));sys.path.insert(0,str(ROOT/'tests'))
from playwright.sync_api import sync_playwright
from test_install_recovery import Connection
import jobs
import server

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--outputs',type=Path,required=True)
    args=parser.parse_args();args.outputs.mkdir(parents=True,exist_ok=True)
    report={'checks':[],'page_errors':[],'serial_opens':[],'posts':[],
            'scope':'Real HTTP and Chromium; controlled COM999 transport and interrupted journal. No physical port, firmware upload or AI execution.'}
    def check(name,condition):
        report['checks'].append({'name':name,'passed':bool(condition)})
        if not condition:raise AssertionError(name)
    read_conn=Connection();write_conn=Connection();write_conn.write_error=True;healthy=Connection()
    pending=[OSError('CONTROLADO: puerto ocupado'),read_conn,write_conn,healthy]
    def factory(port,**kwargs):
        report['serial_opens'].append(port)
        if port!='COM999':raise AssertionError('Physical port forbidden')
        conn=pending.pop(0)
        if isinstance(conn,Exception):raise conn
        return conn
    def scan(*,diagnostics=False):
        ports=[{'port':'COM999','name':'CONTROLADO transporte serie','boards':[]}]
        return {'ports':ports,'scan_ok':True,'scan_errors':[]} if diagnostics else ports
    catalog={'ok':True,'boards':[{'fqbn':'arduino:avr:uno','name':'Arduino Uno'}],'count':1,'source':'CONTROLLED','error':'','warning':''}
    bridge=server.SerialBridge()
    try:
        with tempfile.TemporaryDirectory() as temp,patch.object(server,'BOARD_IDENTIFICATION_ENABLED',False),patch.dict(sys.modules,serial=types.SimpleNamespace(Serial=factory,SerialException=OSError)),patch.object(server,'SERIAL',bridge),patch.object(server,'scan_ports',scan),patch.object(server,'board_catalog',return_value=catalog),patch.object(server,'JOBS',jobs.JobManager(threading.Lock(),Path(temp))):
            journal=Path(temp)/('7'*32);journal.mkdir()
            data={'id':'7'*32,'action':'upload','active':True,'success':None,'stage':'grabación','fqbn':'arduino:avr:uno','port':'COM999','lines':[],'last_id':0}
            (journal/'job.json').write_text(json.dumps(data),encoding='utf-8')
            original=(journal/'job.json').read_bytes()
            http=server.ThreadingHTTPServer(('127.0.0.1',0),server.IDEHandler)
            threading.Thread(target=http.serve_forever,daemon=True).start()
            try:
                with sync_playwright() as pw:
                    browser=pw.chromium.launch(headless=True)
                    page=browser.new_page(viewport={'width':1440,'height':1000})
                    page.on('pageerror',lambda error:report['page_errors'].append(str(error)))
                    def guard(route):
                        req=route.request
                        if req.method=='POST':
                            path=req.url.split('/api/')[-1];report['posts'].append(path)
                            if path not in ['serial/start','serial/stop','serial/send','advisor/check']:
                                route.abort();raise AssertionError('Unexpected operation '+path)
                        route.continue_()
                    page.route('**/api/**',guard)
                    url='http://127.0.0.1:'+str(http.server_port)
                    page.goto(url);page.wait_for_function('()=>document.querySelector("#backendState").textContent.includes("activo")')
                    code='// PROYECTO INTACTO\nvoid setup(){}\nvoid loop(){}'
                    page.locator('#code').fill(code);page.locator('#quickPort').select_option('COM999')
                    page.locator('[data-panel="boards"]').click()
                    page.locator('#serialConnect').click()
                    page.wait_for_function('()=>document.querySelector("#pane-serial").textContent.includes("ocupado")')
                    check('busy port visible and reconnect remains available','Conectar monitor' in page.locator('#serialConnect').inner_text() and page.locator('#pane-serial .bad').count()>0)
                    check('busy open never retries automatically',len(report['serial_opens'])==1)
                    page.locator('#serialConnect').click()
                    page.wait_for_function('()=>document.querySelector("#serialConnect").textContent.includes("Desconectar")')
                    check('explicit connect reaches connected state',bridge.status()['connected'])
                    read_conn.read_error.set()
                    page.wait_for_function('()=>document.querySelector("#serialConnect").textContent.includes("Conectar monitor")')
                    check('USB read failure clears connected state',not bridge.status()['connected'] and not read_conn.is_open)
                    check('disconnected send button is disabled',page.locator('#serialSend').is_disabled())
                    check('read failure is shown as error',page.locator('#pane-serial .bad').filter(has_text='Error de conexión').count()>0)
                    check('selection and editor survive disconnect',page.locator('#quickPort').input_value()=='COM999' and page.locator('#code').input_value()==code)
                    check('disconnect does not automatically open another transport',len(report['serial_opens'])==2)
                    page.screenshot(path=str(args.outputs/'serial-disconnected-controlled.png'))
                    page.locator('#serialConnect').click()
                    page.wait_for_function('()=>document.querySelector("#serialConnect").textContent.includes("Desconectar")')
                    page.locator('#serialText').fill('CONTROLADO');page.locator('#serialSend').click()
                    page.wait_for_function('()=>document.querySelector("#serialConnect").textContent.includes("Conectar monitor")')
                    check('failed write disconnects and transmits once',write_conn.sent==[b'CONTROLADO\n'] and not bridge.status()['connected'])
                    check('failed send remains available for review',page.locator('#serialText').input_value()=='CONTROLADO')
                    page.locator('#serialConnect').click()
                    page.wait_for_function('()=>document.querySelector("#serialConnect").textContent.includes("Desconectar")')
                    check('new connection does not replay prior send',healthy.sent==[] and bridge.status()['error']=='')
                    check('explicit reconnection enables send',page.locator('#serialSend').is_enabled())
                    page.locator('#serialText').fill('NUEVO');page.locator('#serialSend').click()
                    page.wait_for_function('()=>document.querySelector("#serialText").value===""')
                    check('new explicit send succeeds',healthy.sent==[b'NUEVO\n'])
                    page.locator('#serialConnect').click()
                    page.wait_for_function('()=>document.querySelector("#serialConnect").textContent.includes("Conectar monitor")')
                    check('manual disconnect remains neutral',not bridge.status()['connected'] and bridge.status()['error']=='')
                    page.evaluate('localStorage.setItem("ab-makeride-last-build-v1","7".repeat(32))')
                    page.reload();page.wait_for_function('()=>document.querySelector("#backendState").textContent.includes("activo")')
                    check('opening IDE does not recover previous operation automatically',page.locator('#robotStatus').get_attribute('data-state')=='idle')
                    check('opening IDE clears previous task inputs',page.locator('#execTask').input_value()=='' and page.locator('#chatInput').input_value()=='')
                    page.locator('#recoverBuild').click()
                    page.wait_for_function('()=>document.querySelector("#robotText").textContent.toLowerCase().includes("interrump")')
                    check('restart journal never turns successful',page.locator('#robotStatus').get_attribute('data-state')!='success')
                    check('interrupted operation is not labelled preparing','interrumpida' in page.locator('#buildStage').inner_text() and page.locator('#buildCancel').is_disabled())
                    check('restart preserves pending journal bytes',(journal/'job.json').read_bytes()==original)
                    check('reload clears draft and detects the present port',page.locator('#code').input_value()=='' and page.locator('#quickPort').input_value()=='COM999')
                    check('reload does not reconnect',len(report['serial_opens'])==4)
                    page.screenshot(path=str(args.outputs/'restart-unknown-controlled.png'))
                    check('no JavaScript errors',not report['page_errors'])
                    check('no upload or agent request',all(p in ['serial/start','serial/send','serial/stop','advisor/check'] for p in report['posts']))
                    browser.close()
            finally:bridge.close();http.shutdown();http.server_close()
        report['passed']=True
    except Exception as error:
        report['passed']=False;report['failure']=str(error);raise
    finally:
        (args.outputs/'connection-recovery.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(json.dumps({'passed':report.get('passed'),'checks':len(report['checks']),'failure':report.get('failure')}))

if __name__=='__main__':main()
