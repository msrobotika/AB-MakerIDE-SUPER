"""Real localhost + isolated Chromium acceptance. Never uploads or opens serial.

Install playwright in a local venv; set PLAYWRIGHT_BROWSERS_PATH to its isolated
browser cache. Run with --work and --outputs pointing outside original projects.
Real Arduino enumeration/compile are clearly separated from intercepted scenarios.
"""
import argparse
import json
import hashlib
import os
from pathlib import Path
import subprocess
import sys
import time
from urllib.request import urlopen
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--work',type=Path,required=True)
parser.add_argument('--outputs',type=Path,required=True)
parser.add_argument('--port',type=int,default=8770)
args=parser.parse_args()
args.work.mkdir(parents=True,exist_ok=True);args.outputs.mkdir(parents=True,exist_ok=True)
url=f'http://127.0.0.1:{args.port}'
report={'server':url,'checks':[],'console_errors':[],'page_errors':[],'expected_network_errors':[],'requests':[],'real':{},'controlled':[]}
server=None
server_log=(args.outputs/'browser-server.log').open('w',encoding='utf-8')

def check(name,condition,detail=None):
    report['checks'].append({'name':name,'passed':bool(condition),'detail':detail})
    if not condition: raise AssertionError(name+': '+str(detail))

def start():
    global server
    env=os.environ.copy();env['AB_MAKERIDE_DATA_DIR']=str(args.work/'server-data');env['PYTHONUTF8']='1'
    server=subprocess.Popen([getattr(sys,'_base_executable',sys.executable),'-u',str(ROOT/'server.py'),'--no-browser','--port',str(args.port)],cwd=ROOT,env=env,stdout=server_log,stderr=server_log,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    for _ in range(100):
        if server.poll() is not None: raise RuntimeError('Test server exited; port may already be occupied')
        try:
            with urlopen(url+'/api/health',timeout=.5) as response:
                report['real']['health']=json.load(response)
            return
        except OSError: time.sleep(.1)
    raise RuntimeError('Local server failed to start')

def stop():
    if server and server.poll() is None:
        server.terminate();server.wait(10) # Only our own Python test server PID.

def capture(page,name):
    page.screenshot(path=str(args.outputs/name),full_page=True)

def state(page,value):
    page.wait_for_function('(s)=>document.querySelector("#robotStatus").dataset.state===s',arg=value,timeout=120000)

def ready(page):
    page.goto(url)
    page.wait_for_function('()=>document.querySelector("#backendState").textContent.includes("activo")',timeout=60000)
    page.wait_for_timeout(1400)

def fulfill(route,data): route.fulfill(status=200,content_type='application/json',body=json.dumps(data))

try:
    start()
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
        def guard(route):
            request=route.request
            if request.method=='POST' and request.url.endswith('/api/boards/identify'):
                route.fulfill(json={'ok':True,'status':'busy','message':'CONTROLLED: physical chip query disabled in acceptance.'});return
            if request.method=='POST':
                data=request.post_data_json or {}
                report['requests'].append({'path':request.url.split(url)[-1],'action':data.get('action')})
                forbidden=any(x in request.url for x in ('/serial/connect','/serial/send','/api/upload','/micropython','install','/agents/start')) or ('/jobs/start' in request.url and data.get('action')!='compile')
                if forbidden: raise AssertionError('Forbidden real operation '+request.url)
            route.continue_()
        context.route('**/api/**',guard)
        page=context.new_page()
        page.on('pageerror',lambda error:report['page_errors'].append(str(error)))
        page.on('console',lambda message:report['console_errors'].append(message.text) if message.type=='error' else None)
        ready(page)
        check('real server version',report['real']['health']['version']=='1.0.0-rc.3')
        check('robot idle neutral',page.locator('#robotStatus').get_attribute('data-state')=='idle')
        boards=page.request.get(url+'/api/boards').json();report['real']['boards']=boards
        check('real installed catalog available',boards['catalog_ok'] and boards['catalog_count']>0,boards['catalog_count'])
        check('CH340 COM4 has no invented model',all(not p['boards'] for p in boards['ports'] if p.get('vid','').lower().replace('0x','')=='1a86'))
        check('compile and board controls visible',all(page.locator(x).is_visible() for x in ('#quickBoard','#quickPort','#verifyBtn','#uploadBtn')))
        editor=page.locator('#code').bounding_box()
        check('editor is primary area',editor['width']>600 and editor['height']>400,editor)
        capture(page,'01-real-idle.png')
        page.locator('#catalogOpen').click()
        page.wait_for_function('()=>document.querySelectorAll("#catalogResults .picker-item").length>0')
        check('real catalog first page has 40 entries',page.locator('#catalogResults .picker-item').count()==40)
        page.locator('#catalogNext').click();page.wait_for_function('()=>document.querySelector("#catalogPageLabel").textContent.includes("Página 2")')
        check('real catalog pagination',page.locator('#catalogResults .picker-item').count()==40)
        capture(page,'02-real-catalog-page2.png')
        page.locator('#catalogQuery').fill('Arduino Uno')
        page.wait_for_function('()=>document.querySelector("#catalogCount").textContent.includes("coincidencias") && !document.querySelector("#catalogCount").textContent.includes("433 coincidencias")')
        page.locator('#catalogClose').click()
        source='// RC1 acceptance: no pin access\nvoid setup() {}\nvoid loop() { delay(10); }\n'
        page.locator('#code').fill(source)
        page.locator('#verifyBtn').click();state(page,'working')
        capture(page,'03-real-compiling.png')
        state(page,'success')
        check('real compile output zero', 'salida 0' in page.locator('#robotText').inner_text())
        report['real']['compile_console']=page.locator('#pane-console').inner_text()
        report['real']['compile_id']=page.evaluate('localStorage.getItem("ab-makeride-last-build-v1")')
        report['real']['compile_result']=page.request.get(url+'/api/jobs/status?id='+report['real']['compile_id']).json()
        check('real backend compile evidence',report['real']['compile_result']['exit_code']==0 and report['real']['compile_result']['success'])
        check('real compile bound to source hash',report['real']['compile_result'].get('source_sha256')==hashlib.sha256(source.encode()).hexdigest())
        check('success message is not styled as error',page.locator('.logline.bad').filter(has_text='sin errores').count()==0)
        capture(page,'04-real-compile-success.png')
        page.locator('#code').fill(source+'// edited after verified build\n');state(page,'unknown')
        check('editing invalidates previous green',page.locator('#robotStatus').get_attribute('data-state')=='unknown')
        page.locator('#code').fill(source)
        ready(page);state(page,'idle')
        check('reload starts empty',page.locator('#code').input_value()=='')
        page.locator('#recoverBuild').click();state(page,'unknown')
        page.locator('#code').fill(source)
        check('reload same build recovered',page.evaluate('localStorage.getItem("ab-makeride-last-build-v1")')==report['real']['compile_id'])
        stop();start()
        page.locator('#verifyBtn').click();state(page,'working');state(page,'success')
        check('restart refreshes expired CSRF token without losing project',page.locator('#code').input_value()==source)
        ready(page);state(page,'idle')
        check('server restart does not populate old code',page.locator('#code').input_value()=='')
        page.locator('#recoverBuild').click();state(page,'unknown')
        capture(page,'05-real-recovered.png')
        page.locator('#code').fill('void setup(){ deliberate_rc1_compile_error; }\nvoid loop(){}\n')
        page.locator('#verifyBtn').click();state(page,'failed')
        failed_id=page.evaluate('localStorage.getItem("ab-makeride-last-build-v1")')
        report['real']['failed_compile_result']=page.request.get(url+'/api/jobs/status?id='+failed_id).json()
        check('real compile failure nonzero',report['real']['failed_compile_result']['exit_code']!=0 and not report['real']['failed_compile_result']['success'])
        capture(page,'06-real-compile-error.png')
        # A controlled journal represents abrupt server death; no process is killed during hardware access.
        folder=args.work/'server-data'/'BuildSessions'/('c'*32);folder.mkdir()
        (folder/'job.json').write_text(json.dumps({'id':'c'*32,'action':'compile','active':True,'success':None,'stage':'compilación','elapsed':2,'lines':[],'last_id':0}))
        page.evaluate('localStorage.setItem("ab-makeride-last-build-v1","c".repeat(32))')
        ready(page);state(page,'idle')
        page.locator('#recoverBuild').click();state(page,'unknown')
        check('controlled interrupted build never green','interrump' in page.locator('#robotText').inner_text())
        capture(page,'07-controlled-interrupted.png')
        report['controlled'].append('Interrupted build journal inserted in isolated server data; no hardware operation interrupted.')
        page.evaluate('localStorage.removeItem("ab-makeride-last-build-v1")')
        # Controlled API failures through the real app and server connection.
        page.route('**/api/board-catalog/installed?**',lambda route:fulfill(route,{'ok':False,'boards':[],'page':1,'pages':0,'total':0,'error':'CONTROLADO: catálogo no disponible'}))
        page.locator('#catalogOpen').click()
        page.wait_for_function('()=>document.querySelector("#catalogCount").textContent.includes("total desconocido")')
        check('catalog failure never false zero','0 coincidencias' not in page.locator('#catalogCount').inner_text())
        capture(page,'08-controlled-catalog-error.png')
        page.locator('#catalogClose').click();page.unroute('**/api/board-catalog/installed?**')
        page.route('**/api/boards?**',lambda route:route.abort('failed'))
        page.locator('#quickScan').click()
        page.wait_for_function('()=>document.querySelector("#scanNotice").textContent.includes("No se pudo detectar hardware")')
        check('scan network failure visible and preserves model',page.locator('#quickBoard').input_value()=='arduino:avr:uno')
        page.unroute('**/api/boards?**')
        # Chosen model persists through a conflicting single board suggestion.
        suggested={**boards,'ports':[{'port':'COM999','name':'CP210x','vid':'0x10C4','pid':'0xEA60','boards':[{'fqbn':'esp32:esp32:esp32','name':'ESP32'}]}]}
        page.route('**/api/boards?**',lambda route:fulfill(route,suggested))
        page.locator('#quickScan').click();page.wait_for_timeout(300)
        check('model independent of USB suggestion',page.locator('#quickBoard').input_value()=='arduino:avr:uno')
        page.locator('#quickPort').select_option('COM999')
        check('manual model survives port choice',page.locator('#quickBoard').input_value()=='arduino:avr:uno')
        check('CP210x identified only as converter','CP210x' in page.locator('#deviceHint').inner_text() and 'manual' in page.locator('#deviceHint').inner_text())
        # Mocked upload route is fulfilled by Playwright and cannot reach the server.
        upload_count=[0]
        page.route('**/api/jobs/start',lambda route:fulfill(route,{'ok':True,'job_id':'d'*32}) if route.request.post_data_json['action']=='upload' else route.continue_())
        def upload_status(route):
            upload_count[0]+=1
            fulfill(route,{'ok':True,'id':'d'*32,'action':'upload','active':upload_count[0]<3,'success':False if upload_count[0]>=3 else None,'exit_code':2 if upload_count[0]>=3 else None,'stage':'error' if upload_count[0]>=3 else 'grabación','error':'CONTROLADO: fallo del grabador' if upload_count[0]>=3 else '', 'lines':[],'last_id':0,'elapsed':1})
        page.route('**/api/jobs/status?**',upload_status)
        page.on('dialog',lambda dialog:dialog.accept())
        page.locator('#uploadBtn').click();state(page,'working');state(page,'failed')
        check('controlled upload failure red','CONTROLADO' in page.locator('#robotText').inner_text())
        capture(page,'09-controlled-upload-error.png')
        report['controlled'].append('Upload start/status intercepted entirely by Playwright; no server upload request.')
        page.unroute('**/api/jobs/start');page.unroute('**/api/jobs/status?**')
        page.evaluate('localStorage.removeItem("ab-makeride-last-build-v1")')
        ready(page)
        # Agent completed is a CLI outcome only, not a hardware outcome.
        agent={'ok':True,'job_id':'e'*32,'provider':'codex','mode':'consultar','active':False,'success':True,'exit_code':0,'cancelled':False,'interrupted':False,'elapsed':1,'response':'CONTROLADO: revisión completada','diff':'','modified_code':None,'changed_files':[],'evidence':{},'events':[{'id':1,'kind':'log','text':'CONTROLADO: CLI exit 0'}],'last_id':1,'outcome':'agent_finished_only','file_name':'sketch.ino'}
        page.route('**/api/agents/start',lambda route:fulfill(route,{'ok':True,'job_id':'e'*32,'workspace':'CONTROLADO: temporal'}))
        page.route('**/api/agents/poll?**',lambda route:fulfill(route,agent))
        page.locator('#showAI').click() if page.locator('body').get_attribute('data-right')!='ai' else None;page.locator('#agentWorkbench').evaluate('(e)=>e.open=true')
        page.locator('#execTask').fill('CONTROLADO: solo revisión')
        page.locator('#execRun').click();page.locator('#agentConsentApprove').click();state(page,'success')
        check('controlled agent completion explicitly limits scope','hardware sin comprobar' in page.locator('#robotText').inner_text())
        capture(page,'10-controlled-agent-success.png')
        # Concurrent task reducer, cancellation and network errors in rendered UI.
        page.evaluate('RobotActivity.begin("build","Compilación");RobotActivity.begin("agent","Agente");RobotActivity.report("build","Compilación",{success:true,exit_code:0})')
        check('concurrent task remains amber',page.locator('#robotStatus').get_attribute('data-state')=='working')
        page.evaluate('RobotActivity.report("agent","Agente",{success:true,exit_code:0,cancelled:true})')
        state(page,'unknown')
        check('cancelled agent exit zero neutral',page.locator('#robotStatus').get_attribute('data-state')=='unknown')
        page.route('**/api/agents/poll?**',lambda route:route.abort('failed'))
        page.locator('#execRun').click();page.locator('#agentConsentApprove').click();state(page,'failed')
        check('agent network failure red','desconocido' in page.locator('#robotText').inner_text())
        check('agent reference is not persisted as a startup instruction',page.evaluate('localStorage.getItem("ab-makeride-last-agent-v094")') is None)
        capture(page,'11-controlled-network-error.png')
        report['controlled'].append('Agent API fulfilled/aborted by Playwright. Concurrent and cancelled status reducer also exercised in DOM.')
        page.evaluate('localStorage.removeItem("ab-makeride-last-agent-v094")')
        page.unroute('**/api/agents/poll?**');page.unroute('**/api/agents/start');page.unroute('**/api/boards?**')
        page.locator('#code').fill('// reload immediately, before debounce\nvoid setup(){}\nvoid loop(){}')
        page.reload();page.wait_for_timeout(1500)
        check('page reopen starts empty without restoring pending editor change',page.locator('#code').input_value()=='')
        page.wait_for_function('()=>document.querySelector("#backendState").textContent.includes("activo")',timeout=90000)
        page.locator('#quickPort').select_option('')
        page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(300)
        check('mobile controls visible',all(page.locator(x).is_visible() for x in ('#quickBoard','#quickPort','#verifyBtn','#uploadBtn')))
        check('mobile no horizontal page overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        check('reduced motion disables robot pulse',page.evaluate('getComputedStyle(document.querySelector("#robotStatus svg")).animationName')=='none')
        capture(page,'12-real-mobile.png')
        page.set_viewport_size({'width':1440,'height':1000})
        other=context.new_page();ready(other)
        other.locator('#code').fill('// competing tab');other.wait_for_timeout(700)
        page.wait_for_timeout(600)
        page.locator('#code').fill('// keep this unsaved copy');page.wait_for_timeout(700)
        check('draft is never persisted across independent tabs',page.evaluate('localStorage.getItem("ab-makeride-project-v2")') is None)
        check('cross tab editor copy retained',page.locator('#code').input_value()=='// keep this unsaved copy')
        other.close();context.close()
        # A fresh browser process must recover the existing storage schema.
        profile=args.work/'isolated-profile'
        persistent=pw.chromium.launch_persistent_context(str(profile),headless=True,viewport={'width':1440,'height':1000})
        persistent.route('**/api/**',guard)
        p=persistent.pages[0];ready(p);p.locator('#code').fill('// browser restart preserved');p.wait_for_timeout(650);persistent.close()
        persistent=pw.chromium.launch_persistent_context(str(profile),headless=True)
        persistent.route('**/api/**',guard)
        p=persistent.pages[0];ready(p)
        check('browser process restart starts with empty editor',p.locator('#code').input_value()=='')
        persistent.close()
        corrupt=browser.new_context();corrupt.route('**/api/**',guard)
        corrupt.add_init_script('if(location.origin==='+json.dumps(url)+'){localStorage.setItem("ab-makeride-project-v2","{damaged legacy storage")}')
        p=corrupt.new_page();ready(p)
        check('damaged legacy storage never overwritten',p.evaluate('localStorage.getItem("ab-makeride-project-v2")')=='{damaged legacy storage')
        check('damaged legacy storage does not populate editor',p.locator('#code').input_value()=='')
        corrupt.close();browser.close()
        check('no uncaught browser errors',not report['page_errors'],report['page_errors'])
        report['expected_network_errors']=[x for x in report['console_errors'] if 'ERR_FAILED' in x or 'Failed to fetch' in x or '403 (Forbidden)' in x]
        report['unexpected_console_errors']=[x for x in report['console_errors'] if x not in report['expected_network_errors']]
        check('no unexpected console errors',not report['unexpected_console_errors'],report['unexpected_console_errors'])
        report['passed']=True
except Exception as exc:
    report['passed']=False;report['failure']=str(exc)
    raise
finally:
    stop();server_log.close()
    (args.outputs/'browser-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'passed':report.get('passed'),'checks':len(report['checks']),'failure':report.get('failure')},ensure_ascii=False))
