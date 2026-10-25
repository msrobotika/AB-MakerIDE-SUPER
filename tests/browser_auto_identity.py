"""Real HTTP/browser, controlled identity worker. Never touches a serial port."""
import argparse
import json
from pathlib import Path
import sys
import threading
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from playwright.sync_api import sync_playwright
import server

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--outputs',type=Path,required=True)
    args=parser.parse_args();args.outputs.mkdir(parents=True,exist_ok=True)
    report={'checks':[],'page_errors':[],'scope':'Real local HTTP and Chromium. Mock chip query; no physical port, AI CLI or firmware upload.'}
    def check(name,value):
        report['checks'].append({'name':name,'passed':bool(value)})
        if not value:raise AssertionError(name)
    ports=[{'port':'COM14','name':'CONTROLADO CH340','vid':'1A86','pid':'7523','boards':[]}]
    boards=[{'fqbn':fqbn,'name':name} for fqbn,name in [('arduino:avr:uno','Arduino Uno'),('esp32:esp32:esp32','ESP32 Dev Module'),('esp32:esp32:esp32s3','ESP32-S3 Dev Module')]]
    calls=[]
    query_started=threading.Event();query_release=threading.Event();delay_query=False
    def scan(*,diagnostics=False):return {'ports':list(ports),'scan_ok':True,'scan_errors':[]} if diagnostics else list(ports)
    def identify(current,catalog,port):
        calls.append(port)
        if delay_query:
            query_started.set()
            if not query_release.wait(20):raise AssertionError('Controlled query was not released')
        model='esp32:esp32:esp32s3' if port=='COM17' else 'esp32:esp32:esp32'
        return {'ok':True,'status':'identified','port':port,'fqbn':model,'name':'ESP32 CONTROLADO',
                'chip':'ESP32 CONTROLADO','message':'CONTROLADO: chip consultado; pantalla sin identificar.', 'display_identified':False}
    catalog={'ok':True,'boards':boards,'count':len(boards),'source':'CONTROLLED','error':'','warning':''}
    try:
        with patch.object(server,'scan_ports',scan),patch.object(server,'board_catalog',return_value=catalog),patch.object(server,'identify_board',side_effect=identify):
            http=server.ThreadingHTTPServer(('127.0.0.1',0),server.IDEHandler)
            threading.Thread(target=http.serve_forever,daemon=True).start()
            try:
                with sync_playwright() as pw:
                    browser=pw.chromium.launch(headless=True)
                    page=browser.new_page(viewport={'width':1440,'height':1000})
                    page.on('pageerror',lambda error:report['page_errors'].append(str(error)))
                    page.add_init_script('localStorage.setItem("ab-makeride-project-v2",JSON.stringify({name:"Mi proyecto",lang:"cpp",fqbn:"arduino:avr:uno",port:"COM99",files:{cpp:"// CODIGO DEL USUARIO\\nvoid setup(){} void loop(){}",py:"# sin cambios"}}))')
                    def guard(route):
                        if route.request.method=='POST' and not any(route.request.url.endswith(path) for path in ('/api/boards/identify','/api/advisor/check')):
                            route.abort();raise AssertionError('Unexpected action '+route.request.url)
                        route.continue_()
                    page.route('**/api/**',guard)
                    page.goto('http://127.0.0.1:'+str(http.server_port))
                    page.wait_for_function('()=>document.querySelector("#quickBoard").value==="esp32:esp32:esp32"')
                    check('one connected board replaces stale Uno profile',page.locator('#quickBoard').input_value()=='esp32:esp32:esp32')
                    check('one connected port replaces stale COM99',page.locator('#quickPort').input_value()=='COM14')
                    check('code is preserved when profile changes',page.locator('#code').input_value().startswith('// CODIGO DEL USUARIO'))
                    check('bridge is queried instead of treated as model',calls==['COM14'])
                    check('display is still explicitly unknown','pantalla sin identificar' in page.locator('#deviceHint').inner_text())
                    page.locator('#quickPort').select_option('')
                    page.wait_for_timeout(13000)
                    check('manual deselection survives background discovery',page.locator('#quickPort').input_value()=='' and calls==['COM14'])
                    page.locator('#quickPort').select_option('COM14')
                    page.locator('#showAI').click();page.locator('#agentWorkbench').evaluate('(e)=>e.open=true')
                    check('PC companion is opt-in',not page.locator('#execAllowPC').is_checked())
                    check('screen profile does not come from USB',page.locator('#execHardware').input_value()=='board-unspecified')
                    page.locator('#execHardware').select_option('esp32-cyd-28')
                    check('CYD can be declared separately from chip',page.locator('#execHardware').input_value()=='esp32-cyd-28' and page.locator('#quickBoard').input_value()=='esp32:esp32:esp32')
                    ports.clear();page.locator('#quickScan').click()
                    page.wait_for_function('()=>!document.querySelector("#quickScan").disabled')
                    ports.append({'port':'COM17','name':'CONTROLADO USB','boards':[]})
                    page.locator('#quickScan').click()
                    page.wait_for_function('()=>document.querySelector("#quickBoard").value==="esp32:esp32:esp32s3"')
                    check('new connection selects its own port and family',page.locator('#quickPort').input_value()=='COM17' and calls==['COM14','COM17'])
                    check('reconnection does not replace the user source',page.locator('#code').input_value().startswith('// CODIGO DEL USUARIO'))
                    ports.append({'port':'COM18','name':'CONTROLADO second','boards':[]})
                    page.wait_for_function('()=>!!document.querySelector("#quickPort option[value=COM18]")',timeout=16000)
                    check('multiple ports never choose a random device',calls==['COM14','COM17'])
                    page.locator('#quickPort').select_option('COM18')
                    page.wait_for_timeout(13000)
                    check('manual port selection survives background discovery',page.locator('#quickPort').input_value()=='COM18' and calls==['COM14','COM17'])
                    port_option=page.locator('#quickPort option[value="COM18"]').element_handle()
                    page.locator('#agentTaskCYD').click()
                    check('changing board leaves COM options attached',port_option.evaluate('(e)=>e.isConnected') and page.locator('#quickPort').input_value()=='COM18')
                    page.locator('#quickPort').select_option('COM17')
                    delay_query=True
                    page.locator('#quickScan').click()
                    # Keep Playwright dispatching the routed HTTP request while the
                    # controlled worker waits; a blocking Event.wait here deadlocks it.
                    page.wait_for_timeout(500)
                    if not query_started.is_set():raise AssertionError('Selected port query did not start')
                    page.locator('#quickPort').select_option('COM18')
                    page.locator('#quickPort').select_option('COM17')
                    query_release.set()
                    page.wait_for_function('()=>!document.querySelector("#quickScan").disabled')
                    check('explicit refresh queries selected port among several',calls==['COM14','COM17','COM17'])
                    check('late chip result cannot undo manual selection even after return to same port',page.locator('#quickPort').input_value()=='COM17' and page.locator('#quickBoard').input_value()=='esp32:esp32:esp32')
                    page.locator('#agentTaskCYD').click()
                    page.wait_for_function('()=>document.querySelector("#code").value.includes("MSR_CYD_GAME_READY")')
                    check('CYD game opens as firmware in code editor',page.locator('#code').input_value().startswith('/*') and 'Adafruit_ILI9341' in page.locator('#code').input_value())
                    check('CYD loader selects its profile without PC companion',page.locator('#execHardware').input_value()=='esp32-cyd-28' and not page.locator('#execAllowPC').is_checked())
                    check('no uncaught JS errors',not report['page_errors'])
                    page.screenshot(path=str(args.outputs/'auto-identity-controlled.png'))
                    browser.close()
            finally:http.shutdown();http.server_close()
        report['passed']=True
    except Exception as error:
        report.update(passed=False,failure=str(error));raise
    finally:
        (args.outputs/'checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(json.dumps({'passed':report.get('passed'),'checks':len(report['checks']),'failure':report.get('failure')}))

if __name__=='__main__':main()
