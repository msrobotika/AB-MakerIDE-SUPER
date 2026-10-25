"""Extract and test a local ZIP without touching existing MakerIDE installations.

Uses a new private venv; optional preparation downloads Python dependencies.
Only this test's temporary server process is started/stopped; no serial is opened.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from urllib.request import urlopen
import venv
import zipfile

def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1',0))
        return sock.getsockname()[1]

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--package',type=Path,required=True)
    parser.add_argument('--work',type=Path,required=True)
    parser.add_argument('--outputs',type=Path,required=True)
    parser.add_argument('--browser',action='store_true')
    parser.add_argument('--prepare',action='store_true',help='Install optional requirements in the extracted private venv')
    args=parser.parse_args()
    args.package=args.package.resolve();args.work=args.work.resolve();args.outputs=args.outputs.resolve()
    args.work.mkdir(parents=True,exist_ok=False)
    args.outputs.mkdir(parents=True,exist_ok=True)
    report={'checks':[], 'page_errors':[], 'package_sha256':hashlib.sha256(args.package.read_bytes()).hexdigest(),
            'scope':'New extraction and isolated Python environment on the same Windows machine; not a fresh OS or another PC. Controlled empty browser port list. No hardware writes or serial opens.'}
    def check(name,condition):
        report['checks'].append({'name':name,'passed':bool(condition)})
        if not condition:raise AssertionError(name)
    try:
        with zipfile.ZipFile(args.package) as archive:
            check('ZIP CRC intact',archive.testzip() is None)
            base=args.work.resolve()
            for name in archive.namelist():
                target=(base/name).resolve()
                if not target.is_relative_to(base):raise ValueError('ZIP path escapes test folder')
            archive.extractall(args.work)
        folders=[p for p in args.work.iterdir() if p.is_dir()]
        check('single source folder',len(folders)==1)
        # Rename only this freshly extracted folder to exercise spaces and ampersands.
        source=args.work/'MakerIDE prueba limpia & local'
        if not folders[0].resolve().is_relative_to(base) or not source.resolve().is_relative_to(base):
            raise ValueError('Extracted directory rename escapes test folder')
        folders[0].rename(source)
        verified=0
        for line in (source/'MANIFEST_SHA256.txt').read_text(encoding='utf-8').splitlines()[3:]:
            digest,name=line.split('  ',1)
            if hashlib.sha256((source/name).read_bytes()).hexdigest()!=digest:raise AssertionError('Manifest mismatch: '+name)
            verified+=1
        check('all extracted manifest hashes match',verified>0)
        report['manifest_files']=verified
        venv.EnvBuilder(with_pip=True).create(str(source/'.venv'))
        python=source/'.venv'/('Scripts/python.exe' if os.name=='nt' else 'bin/python')
        env=os.environ.copy()
        env['PYTHONUTF8']='1';env['AB_MAKERIDE_NO_PAUSE']='1'
        env['AB_MAKERIDE_DATA_DIR']=str(args.work/'isolated data')
        env['ARDUINO_DIRECTORIES_DATA']=str(args.work/'empty arduino cores')
        env['AB_MAKERIDE_ARDUINO_CLI']=str(args.work/'not-installed-arduino.exe')
        paths=[str(Path(getattr(sys,'_base_executable',sys.executable)).parent)]
        if os.name=='nt':paths.extend([str(Path(env.get('SystemRoot',r'C:\Windows'))/'System32'),env.get('SystemRoot',r'C:\Windows')])
        else:paths.extend(['/usr/bin','/bin'])
        env['PATH']=os.pathsep.join(paths)
        def command(name,args_list,timeout=45,batch=False,override=None):
            command_env={**env,**(override or {})}
            if batch and os.name=='nt':
                # Fixed flags and trusted extracted path; quote the complete batch path.
                cmd='"'+os.environ.get('COMSPEC',r'C:\Windows\System32\cmd.exe')+'" /d /s /c ""'+str(source/args_list[0])+'" '+' '.join(args_list[1:])+'"'
            else:cmd=[str(python),*args_list]
            run=subprocess.run(cmd,cwd=source,env=command_env,capture_output=True,timeout=timeout)
            (args.outputs/(name+'.txt')).write_bytes(run.stdout+run.stderr)
            return run
        port=free_port()
        flags=['--check','--json','--port',str(port)]
        bare=command('01-bare-diagnostic',['INICIAR_WINDOWS.bat',*flags] if os.name=='nt' else ['launch.py',*flags],batch=os.name=='nt')
        check('launcher works in extracted folder with spaces and ampersand',bare.returncode==0)
        diagnostic=json.loads(bare.stdout.decode('utf-8'))
        report['bare_tools']={c['name']:c['ok'] for c in diagnostic['checks']}
        check('optional tools absent but editor permitted',diagnostic['ok'] and all(not report['bare_tools'][name] for name in ['arduino','serial','micropython']))
        # Occupied socket belongs to this fixture and must remain open.
        with socket.socket() as owner:
            owner.bind(('127.0.0.1',0));owner.listen()
            occupied=command('02-occupied-port',['launch.py','--no-browser','--port',str(owner.getsockname()[1])])
            check('busy port explains failure without stopping owner',occupied.returncode==2 and b'ocupado' in occupied.stdout and owner.fileno()!=-1)
        sentinel=args.work/'existing project file';sentinel.write_bytes(b'KEEP USER PROJECT')
        blocked=command('03-blocked-data',['launch.py',*flags],override={'AB_MAKERIDE_DATA_DIR':str(sentinel)})
        check('unwritable data target is explained and preserved',blocked.returncode==2 and sentinel.read_bytes()==b'KEEP USER PROJECT')
        server_log=(args.outputs/'04-extracted-server.txt').open('wb')
        process=subprocess.Popen([str(python),'launch.py','--no-browser','--port',str(port)],cwd=source,env=env,
                                 stdout=server_log,stderr=server_log,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
        url='http://127.0.0.1:'+str(port)
        try:
            for _ in range(100):
                if process.poll() is not None:raise RuntimeError('Extracted server exited')
                try:
                    with urlopen(url+'/api/health',timeout=.5) as response:health=json.load(response)
                    break
                except OSError:time.sleep(.1)
            else:raise RuntimeError('Extracted startup timed out')
            check('real startup from private bare venv',health['version']=='1.0.0-rc.2')
            with urlopen(url) as response:html=response.read()
            check('editor and simulator delivered without dependencies',b'id="code"' in html and b'id="simCanvas"' in html)
            if args.browser:
                from playwright.sync_api import sync_playwright
                with sync_playwright() as pw:
                    browser=pw.chromium.launch(headless=True)
                    page=browser.new_page(viewport={'width':1440,'height':1000})
                    page.on('pageerror',lambda error:report['page_errors'].append(str(error)))
                    def guard(route):
                        if route.request.method=='POST':
                            if '/api/advisor/check' not in route.request.url:raise AssertionError('Unexpected operation')
                        route.continue_()
                    page.route('**/api/**',guard)
                    page.route('**/api/boards?**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'ports':[],'boards':[],'catalog_ok':False,'catalog_count':0,'catalog_error':'CONTROLADO: entorno sin herramientas ni placas','scan_ok':True,'scan_errors':[]})))
                    page.goto(url)
                    page.wait_for_function('()=>document.querySelector("#backendState").textContent.includes("activo")')
                    check('empty discovery completes without endless loading labels','Buscando' not in page.locator('#quickBoard').inner_text() and 'Buscando' not in page.locator('#quickPort').inner_text())
                    page.locator('#code').fill('// PROYECTO CONSERVADO\nvoid setup(){}\nvoid loop(){}')
                    page.reload()
                    page.wait_for_function('()=>document.querySelector("#code").value.startsWith("// PROYECTO CONSERVADO")')
                    check('editor saves and reloads in bare installation',True)
                    page.locator('#code').fill('void setup(){pinMode(13,OUTPUT);}void loop(){digitalWrite(13,HIGH);delay(500);digitalWrite(13,LOW);delay(500);}')
                    page.locator('#extraTools').evaluate('(e)=>e.open=true');page.locator('#showSim').click();page.locator('#simNext').click()
                    check('simulator works offline without optional tools','500 ms' in page.locator('#simClock').inner_text())
                    page.screenshot(path=str(args.outputs/'clean-install-desktop.png'))
                    check('bare installation browser has no JS errors',not report['page_errors'])
                    browser.close()
        finally:
            if process.poll() is None:process.terminate();process.wait(10)
            server_log.close()
        check('test server stopped without touching other instances',process.poll() is not None)
        if args.prepare:
            prepared=command('05-prepare-private-venv',['PREPARAR_WINDOWS.bat'] if os.name=='nt' else ['prepare_windows.py'],timeout=180,batch=os.name=='nt')
            check('optional preparation succeeds in private venv',prepared.returncode==0)
            ready=command('06-prepared-diagnostic',['INICIAR_WINDOWS.bat',*flags] if os.name=='nt' else ['launch.py',*flags],batch=os.name=='nt')
            check('prepared launcher succeeds',ready.returncode==0)
            ready_data=json.loads(ready.stdout.decode('utf-8'))
            report['prepared_tools']={c['name']:c['ok'] for c in ready_data['checks']}
            check('serial and mpremote resolved from private environment',report['prepared_tools']['serial'] and report['prepared_tools']['micropython'])
            versions=command('07-dependency-versions',['-c','import importlib.metadata as m,json; print(json.dumps({p:m.version(p) for p in ["pyserial","mpremote"]}))'])
            report['dependency_versions']=json.loads(versions.stdout.decode('utf-8'))
        report['passed']=True
    except Exception as error:
        report['passed']=False;report['failure']=str(error);raise
    finally:
        (args.outputs/'clean-install.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(json.dumps({'passed':report.get('passed'),'checks':len(report['checks']),'failure':report.get('failure')}))

if __name__=='__main__':main()
