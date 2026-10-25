"""Real HTTP + isolated Chromium UI. Controlled catalog; no hardware or agent."""
import argparse
import json
from pathlib import Path
import sys
import tempfile
import threading
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from playwright.sync_api import sync_playwright
import server

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--outputs',type=Path,required=True)
    args=parser.parse_args();args.outputs.mkdir(parents=True,exist_ok=True)
    report={'checks':[], 'page_errors':[], 'posts':[], 'scope':'Real local HTTP and Chromium, isolated profile, controlled board catalog. No upload, serial connection or AI calls.'}
    def check(name,condition):
        report['checks'].append({'name':name,'passed':bool(condition)})
        if not condition:raise AssertionError(name)
    boards=[{'fqbn':'arduino:avr:uno','name':'Arduino Uno'}, {'fqbn':'arduino:avr:mega','name':'Arduino Mega 2560'}, {'fqbn':'esp32:esp32:esp32','name':'ESP32 Dev Module'}]
    def scan(*,diagnostics=False):return {'ports':[],'scan_ok':True,'scan_errors':[]} if diagnostics else []
    catalog={'ok':True,'boards':boards,'count':len(boards),'source':'CONTROLLED_UI_TEST','error':'','warning':''}
    try:
        with patch.object(server,'scan_ports',scan),patch.object(server,'board_catalog',return_value=catalog):
            http=server.ThreadingHTTPServer(('127.0.0.1',0),server.IDEHandler)
            threading.Thread(target=http.serve_forever,daemon=True).start()
            try:
                with sync_playwright() as pw:
                    browser=pw.chromium.launch(headless=True)
                    page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
                    page.on('pageerror',lambda error:report['page_errors'].append(str(error)))
                    def guard(route):
                        req=route.request
                        if req.method=='POST':
                            report['posts'].append(req.url.split('/api/')[-1])
                            if '/api/advisor/check' not in req.url:
                                route.abort();raise AssertionError('Unexpected operation: '+req.url)
                        route.continue_()
                    page.route('**/api/**',guard)
                    page.goto('http://127.0.0.1:'+str(http.server_port))
                    page.wait_for_function('()=>document.querySelector("#backendState").textContent.includes("activo")')
                    check('startup without JavaScript errors',not report['page_errors'])
                    page.locator('#extraTools').evaluate('(e)=>e.open=true');page.locator('#showSim').click()
                    check('simulator visible',page.locator('#simCanvas').is_visible())
                    check('inert ADC and button controls removed',page.locator('#simAnalog,#simButton').count()==0)
                    check('new session starts with empty editor',page.locator('#code').input_value()=='')
                    page.locator('#code').fill('void setup(){pinMode(LED_BUILTIN,OUTPUT);}\nvoid loop(){digitalWrite(LED_BUILTIN,HIGH);delay(500);digitalWrite(LED_BUILTIN,LOW);delay(500);}')
                    robot=page.locator('#robotStatus').get_attribute('data-state')
                    page.locator('#simBtn').click()
                    page.wait_for_function('()=>document.querySelector("#simClock").textContent.match(/\d+/)[0]>80')
                    check('default Uno LED_BUILTIN recognized','ARDUINO UNO' in page.locator('#simPeriod').inner_text() and page.locator('#simLevels [data-pin="13"]').count()==1)
                    page.locator('#simBtn').click();paused=page.locator('#simClock').inner_text();page.wait_for_timeout(160)
                    check('pause freezes virtual clock',paused==page.locator('#simClock').inner_text())
                    page.locator('#simBtn').click();page.wait_for_function('(n)=>Number(document.querySelector("#simClock").textContent.match(/\d+/)[0])>n+70',arg=int(paused.split(':')[1].split()[0]))
                    check('resume advances clock',page.locator('#simBtn').inner_text().endswith('Pausar'))
                    page.locator('#simReset').click();check('reset pauses at zero','0 ms' in page.locator('#simClock').inner_text())
                    check('simulator never claims hardware success',robot==page.locator('#robotStatus').get_attribute('data-state'))
                    page.locator('#simBtn').click();page.locator('#rightClose').click();closed=page.locator('#simClock').inner_text();page.wait_for_timeout(120)
                    check('closing panel pauses simulation',closed==page.locator('#simClock').inner_text() and 'Continuar' in page.locator('#simBtn').inner_text())
                    page.locator('#extraTools').evaluate('(e)=>e.open=true');page.locator('#showSim').click()
                    low='void setup(){pinMode(13,OUTPUT);}\nvoid loop(){digitalWrite(13,LOW);delay(250);digitalWrite(13,HIGH);delay(750);}'
                    page.locator('#code').fill(low)
                    check('editing discards model immediately',page.locator('#simLevels span').count()==0 and 'Vuelve a analizar' in page.locator('#simStatus').inner_text())
                    page.locator('#simNext').click();check('step moves exactly to next wait boundary','250 ms' in page.locator('#simClock').inner_text() and page.locator('#simLevels [data-pin="13"]').get_attribute('data-level')=='1')
                    page.locator('#simReset').click();check('LOW-first starts LOW',page.locator('#simLevels [data-pin="13"]').get_attribute('data-level')=='0')
                    page.locator('#simSpeed').select_option('4');page.locator('#simBtn').click();page.wait_for_timeout(100);page.locator('#simBtn').click()
                    check('virtual speed multiplier advances time',int(page.locator('#simClock').inner_text().split(':')[1].split()[0])>=300)
                    # Repeated full cycles are deterministic when stepping.
                    page.locator('#simReset').click()
                    for _ in range(3):page.locator('#simNext').click()
                    check('step wraps to next cycle correctly','1250 ms' in page.locator('#simClock').inner_text())
                    page.locator('#code').fill((ROOT/'examples/semaforo_simulacion.ino').read_text(encoding='utf-8'))
                    page.locator('#simNext').click()
                    check('three outputs represented together',page.locator('#simLevels span').count()==3)
                    check('traffic sequence yellow at 1000ms',page.locator('#simLevels [data-pin="12"]').get_attribute('data-level')=='1' and page.locator('#simLevels [data-pin="13"]').get_attribute('data-level')=='0')
                    page.screenshot(path=str(args.outputs/'simulator-desktop.png'))
                    page.locator('#quickBoard').evaluate('(e)=>{e.add(new Option("Arduino Mega 2560","arduino:avr:mega"));e.value="arduino:avr:mega";e.dispatchEvent(new Event("change",{bubbles:true}))}')
                    check('board change discards stale model',page.locator('#simLevels span').count()==0)
                    page.locator('#simNext').click();check('canvas profile follows Mega selection','ARDUINO MEGA' in page.locator('#simPeriod').inner_text())
                    page.locator('[data-lang="py"]').click()
                    check('language change discards stale model',page.locator('#simLevels span').count()==0)
                    page.locator('#quickBoard').evaluate('(e)=>{e.add(new Option("ESP32 Dev Module","esp32:esp32:esp32"));e.value="esp32:esp32:esp32";e.dispatchEvent(new Event("change",{bubbles:true}))}')
                    page.locator('#code').fill((ROOT/'examples/semaforo_simulacion.py').read_text(encoding='utf-8'))
                    page.locator('#simNext').click();check('MicroPython three-output sequence','1000 ms' in page.locator('#simClock').inner_text() and page.locator('#simLevels [data-pin="4"]').get_attribute('data-level')=='1')
                    page.set_viewport_size({'width':390,'height':844})
                    check('mobile panel fits viewport',page.locator('#simulatorPanel').evaluate('(e)=>e.getBoundingClientRect().right<=innerWidth+1 && e.scrollWidth<=e.clientWidth'))
                    check('mobile step control usable',page.locator('#simNext').is_visible())
                    page.screenshot(path=str(args.outputs/'simulator-mobile.png'))
                    page.locator('#code').fill('from machine import Pin\nimport time\na=Pin(2,Pin.OUT)\nwhile True:\n    a.on()\n    mystery()\n    time.sleep_ms(500)')
                    page.locator('#simBtn').click()
                    check('unsupported code explains refusal and clears outputs','NO SOPORTADO' in page.locator('#simStatus').inner_text() and page.locator('#simLevels span').count()==0)
                    page.set_viewport_size({'width':1440,'height':1000})
                    page.locator('[data-lang="cpp"]').click();page.locator('#code').fill('const byte LED=LED_BUILTIN; void setup(){pinMode(LED,OUTPUT);}void loop(){digitalWrite(LED,HIGH);delay(500);digitalWrite(LED,LOW);delay(500);}')
                    page.locator('#simBtn').click()
                    check('unknown built-in LED is not inferred for ESP32','NO SOPORTADO' in page.locator('#simStatus').inner_text())
                    page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path=str(args.outputs/'simulator-unsupported.png'))
                    check('no JavaScript errors',not report['page_errors'])
                    check('no hardware or agent operations',all(p=='advisor/check' for p in report['posts']))
                    browser.close()
            finally:http.shutdown();http.server_close()
        report['passed']=True
    except Exception as error:
        report['passed']=False;report['failure']=str(error);raise
    finally:
        (args.outputs/'simulator-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(json.dumps({'passed':report.get('passed'),'checks':len(report['checks']),'failure':report.get('failure')}))

if __name__=='__main__':main()
