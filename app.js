(()=>{'use strict';
const DEFAULT_CPP='/*\n  AB MakerIDE - MS Robotika\n  Prueba minima para Arduino Uno R3\n  Sin sensores ni librerias externas\n  LED integrado: D13 (LED_BUILTIN)\n*/\n\nconst byte LED = LED_BUILTIN;\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  Serial.begin(9600);\n  Serial.println("AB MakerIDE - Arduino Uno listo");\n}\n\nvoid loop() {\n  digitalWrite(LED, HIGH);\n  Serial.println("LED encendido");\n  delay(500);\n\n  digitalWrite(LED, LOW);\n  Serial.println("LED apagado");\n  delay(500);\n}\n';
const DEFAULT_PY=`# AB MakerIDE · MS Robotika — MicroPython ESP32\n# Ejemplo LED GPIO2 (comprueba tu placa)\nfrom machine import Pin\nimport time\n\nled = Pin(2, Pin.OUT)\nprint("AB MakerIDE listo")\n\nwhile True:\n    led.on()\n    print("LED ON")\n    time.sleep_ms(500)\n    led.off()\n    print("LED OFF")\n    time.sleep_ms(500)\n`;
const SAVEKEY='ab-makeride-project-v2'; // Compatible con proyectos v0.5 y anteriores
const UI_STORAGE='ab-makeride-layout-v092';
const BOARD_PROFILES_KEY='ab-makeride-verified-board-assignments-v095';
const MIGRATION_BACKUP='ab-makeride-before-clean-start-v1';
try{const project=localStorage.getItem(SAVEKEY);if(project&&!localStorage.getItem(MIGRATION_BACKUP))localStorage.setItem(MIGRATION_BACKUP,project)}catch(_e){/* La exportacion JSON sigue disponible */}
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const escapeHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let recoveryStorageError=false;
const state={physicalProfile:'board-unspecified',lang:'cpp',files:{cpp:'',py:''},name:'mi-proyecto',fqbn:'arduino:avr:uno',port:'',baud:9600,uploadSpeed:115200,retrySlow:false,panel:'project',pane:'console',ports:[],choices:[],catalogOk:false,catalogError:'',catalogWarning:'',catalogSource:'',catalogCount:0,tools:{},serialId:0,serialConnected:false,simRunning:false,simTimer:null,apiReady:false,busy:false,dirty:false,sidebarOpened:true};
let toasts;
function toast(msg){const e=$('#toast');e.textContent=msg;e.classList.add('show');clearTimeout(toasts);toasts=setTimeout(()=>e.classList.remove('show'),2700)}
let storageConflict=recoveryStorageError;
let agentProjectId='';
let draftBackups=[],lastExport='';
function draftSnapshot(){return JSON.stringify({files:state.files,name:state.name,lang:state.lang,fqbn:state.fqbn,hardware_profile:state.physicalProfile})}
function rememberAgentProject(id){agentProjectId=id||'';}
function save(){invalidateSim();const content=state.files.cpp.length||state.files.py.length;state.dirty=Boolean(content)&&draftSnapshot()!==lastExport;$('#footSave').textContent=!content?'Sesión nueva · Guardado manual':state.dirty?'● Sin guardar · Guardar proyecto':'✓ Descarga solicitada';}
window.addEventListener('pagehide',()=>{clearTimeout(saveDelay);state.files[state.lang]=$('#code').value;save()});
let saveDelay;function scheduleSave(){invalidateSim();state.dirty=true;$('#footSave').textContent='● Cambios pendientes';clearTimeout(saveDelay);saveDelay=setTimeout(save,550)}
function showLog(p,t,type='note'){const panel=$('#pane-'+p);const el=document.createElement('div');el.className='logline '+type;el.textContent=t;panel.appendChild(el);while(panel.childNodes.length>1100)panel.removeChild(panel.firstChild);panel.scrollTop=panel.scrollHeight;return el;}
function showOutput(p,t){String(t||'').split(/\r?\n/).forEach(x=>showLog(p,x,/sin errores|no errors/i.test(x)?'good':/error|failed|fallid|fatal|traceback/i.test(x)?'bad':/success|correct|writing|compilaci[oó]n real|carga real|done/i.test(x)?'good':'note'))}
function switchPane(name){state.pane=name;$$('[data-pane]').forEach(x=>x.classList.toggle('on',x.dataset.pane===name));['console','serial','problems'].forEach(p=>$('#pane-'+p).classList.toggle('hidden',p!==name));$('#serialBar').classList.toggle('hidden',name!=='serial');$('#terminalBar').classList.toggle('hidden',name!=='console');}
function updateCaret(){const s=$('#code').value.slice(0,$('#code').selectionStart);const n=s.split('\n');$('#footCaret').textContent=`Ln ${n.length}, Col ${n.at(-1).length+1}`;}
const keywordsCPP=/\b(?:void|const|int|float|double|char|bool|long|unsigned|while|if|else|for|return|true|false|HIGH|LOW|INPUT|OUTPUT|static|class|struct|break|continue)\b/g;
const keywordsPY=/\b(?:from|import|as|def|class|while|True|False|None|if|elif|else|for|in|not|and|or|pass|return|global|break|continue|with|try|except|print)\b/g;
function highlight(code,lang){const regex=lang==='cpp'?/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(^\s*#[^\n]*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/gm:/(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/gm;let out='',last=0;for(const m of code.matchAll(regex)){out+=escapeHtml(code.slice(last,m.index));const t=m[0];last=m.index+t.length;const key=lang==='cpp'?keywordsCPP:keywordsPY;key.lastIndex=0;let cls=m[1]?'tok-com':m[2]?'tok-str':lang==='cpp'&&m[3]?'tok-pre':(lang==='cpp'&&m[4]||lang==='py'&&m[3])?'tok-num':null;if(!cls&&key.test(t))cls='tok-key';if(!cls&&/^\s*\(/.test(code.slice(last)))cls='tok-fn';out+=cls?`<span class="${cls}">${escapeHtml(t)}</span>`:escapeHtml(t);}return out+escapeHtml(code.slice(last))+'\n';}
function updateHL(){$('#highlight').innerHTML=highlight($('#code').value,state.lang);$('#highlight').scrollTop=$('#code').scrollTop;$('#highlight').scrollLeft=$('#code').scrollLeft;}
function setLang(lang,savePrevious=true){if(lang!=='py'&&lang!=='cpp')return;RobotActivity.invalidate('build');if(state.lang!==lang){if(savePrevious)state.files[state.lang]=$('#code').value;state.lang=lang;}$$('[data-lang]').forEach(x=>x.classList.toggle('on',x.dataset.lang===lang));$('#code').value=state.files[lang];$('#fileLabel').textContent=lang==='cpp'?'sketch.ino · Arduino C++':'main.py · MicroPython';$('#footLang').textContent=lang==='cpp'?'C++ · Arduino':'Python · MicroPython';$('#verifyBtn').textContent=lang==='cpp'?'⌕ Compilar':'⌕ Verificar sintaxis';$('#uploadBtn').textContent=lang==='cpp'?'↑ Compilar y grabar':'↑ Guardar main.py';renderSidebar();updateHL();updateCaret();scheduleSave();scheduleAdvisor();refreshSketchTargetNotice()}
$('#code').addEventListener('input',()=>{RobotActivity.invalidate('build');state.files[state.lang]=$('#code').value;updateHL();updateCaret();scheduleSave();scheduleAdvisor();refreshSketchTargetNotice()});$('#code').addEventListener('scroll',updateHL);$('#code').addEventListener('click',updateCaret);$('#code').addEventListener('keyup',updateCaret);
$('#code').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const t=e.currentTarget,a=t.selectionStart,b=t.selectionEnd;t.setRangeText('  ',a,b,'end');t.dispatchEvent(new Event('input'))}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();exportProject()}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();verify()}});
$$('[data-lang]').forEach(x=>x.addEventListener('click',()=>setLang(x.dataset.lang)));
$$('[data-pane]').forEach(x=>x.addEventListener('click',()=>switchPane(x.dataset.pane)));
$('#clearBtn').addEventListener('click',()=>$('#pane-'+state.pane).replaceChildren());
function download(filename,text,type='application/json;charset=utf-8'){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),800)}
function exportProject(){if(agentProjectId){saveAgentProject({job_id:agentProjectId,current_draft:true});return;}state.files[state.lang]=$('#code').value;const obj={format:'ab-makeride-v1',name:state.name,hardware_profile:state.physicalProfile,lang:state.lang,fqbn:state.fqbn,files:{'sketch.ino':state.files.cpp,'main.py':state.files.py},exported_at:new Date().toISOString()};download((state.name.replace(/[^a-z0-9-]/gi,'_')||'proyecto')+'.abmaker.json',JSON.stringify(obj,null,2));lastExport=draftSnapshot();save();toast('Descarga del proyecto solicitada')}
async function importProject(file){
 if(/\.zip$/i.test(file.name)){
  try{
   if(file.size>8100000)throw Error('El ZIP supera el límite de 8 MB de proyecto');
   if(!confirm('¿Abrir este proyecto ZIP en la sesión actual? Guarda antes el borrador si quieres conservarlo.'))return;
   const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let offset=0;offset<bytes.length;offset+=32768)binary+=String.fromCharCode(...bytes.subarray(offset,offset+32768));
   const project=await request('/api/projects/import',{archive:btoa(binary)});
   draftBackups.unshift({date:new Date().toISOString(),lang:state.lang,code:$('#code').value});draftBackups=draftBackups.slice(0,7);
   state.files={cpp:'',py:''};state.files[project.lang]=project.code;state.name=file.name.replace(/\.zip$/i,'');
   if(state.choices.some(p=>p.fqbn===project.fqbn))state.fqbn=project.fqbn;
   setPhysicalProfile(project.hardware_profile);rememberAgentProject(project.job_id);
   setLang(project.lang,false);save();toast('Proyecto abierto con '+project.file_count+' archivos. No se ha ejecutado ni grabado.');return;
  }catch(e){toast('No se pudo importar: '+e.message);return;}
 }
 file.text().then(txt=>{
  if(/\.(ino|py)$/i.test(file.name)){
    if(txt.length>300000)throw Error('Archivo demasiado grande');
    if(storageConflict)throw Error('Exporta la copia actual antes de resolver el conflicto de guardado');
    const lang=/\.py$/i.test(file.name)?'py':'cpp';
    if(!confirm('¿Abrir '+file.name+' en el editor? Se guardará una copia del archivo anterior.'))return;
    const list=draftBackups;
    if(!Array.isArray(list))throw Error('No se pudo guardar la copia anterior');
    list.unshift({date:new Date().toISOString(),lang,code:state.files[lang]});
    draftBackups=list.slice(0,7);
    rememberAgentProject('');state.files[lang]=txt;state.name=file.name.replace(/\.(ino|py)$/i,'').slice(0,60);
    setLang(lang,false);save();renderSidebar();toast('Archivo abierto · copia anterior guardada');return;
  }
  const obj=JSON.parse(txt);if(obj.format!=='ab-makeride-v1'||!obj.files||typeof obj.files['sketch.ino']!=='string'||typeof obj.files['main.py']!=='string')throw Error('Formato de proyecto no compatible');if(obj.files['sketch.ino'].length>300000||obj.files['main.py'].length>300000)throw Error('Archivos demasiado grandes');if(!confirm('¿Reemplazar los dos archivos actuales? Exporta antes si quieres conservarlos.'))return;rememberAgentProject('');state.files.cpp=obj.files['sketch.ino'];state.files.py=obj.files['main.py'];state.name=String(obj.name||'proyecto').slice(0,60);state.fqbn=String(obj.fqbn||state.fqbn);if(['board-unspecified','esp32-cyd-28','ideaspark-114','ideaspark-19'].includes(obj.hardware_profile))setPhysicalProfile(obj.hardware_profile);setLang(obj.lang==='py'?'py':'cpp',false);$('#code').value=state.files[state.lang];updateHL();save();renderSidebar();toast('Proyecto importado')
}).catch(e=>toast('No se pudo importar: '+e.message));}
$('#projectFile').addEventListener('change',e=>{const f=e.target.files[0];if(f)importProject(f);e.target.value='' });
let csrfSession='';
async function sessionToken(){
  if(csrfSession)return csrfSession;
  const resp=await fetch('/api/session',{cache:'no-store'});
  if(!resp.ok)throw Error('No se pudo establecer sesión local segura');
  const data=await resp.json();csrfSession=data.csrf;
  if(!csrfSession)throw Error('El servidor no devolvió token de sesión');
  return csrfSession;
}
async function request(path,payload,retry=true){const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),payload===undefined?(/\/api\/boards/.test(path)?75000:/board-catalog/.test(path)?55000:20000):360000);try{const res=await fetch(path,payload===undefined?{signal:controller.signal}:{method:'POST',headers:{'Content-Type':'application/json','X-AB-Session':await sessionToken()},body:JSON.stringify(payload),signal:controller.signal});if(res.status===403&&payload!==undefined&&retry){csrfSession='';return request(path,payload,false)}const d=await res.json();if(!res.ok)throw Error(d.error||'Error '+res.status);return d}finally{clearTimeout(timeout)}}
function busy(v){state.busy=v;$('#verifyBtn').disabled=v||Boolean(state.agentWorking);$('#uploadBtn').disabled=v||Boolean(state.agentWorking);}
function hardwareLabAvailable(){return state.fqbn==='esp32:esp32:esp32'}
function updateHardwareLabVisibility(){$('#hardwareLab').classList.toggle('hidden',!hardwareLabAvailable());}
// v0.9.2 — Consola dimensionable; guarda solo preferencias visuales en localStorage.
let terminalHeight=165,normalTerminalHeight=165,terminalMaximized=false,terminalDragging=false;
const terminalPanel=$('#terminalPanel'),terminalGrip=$('#terminalGrip');
function terminalMaxHeight(){return Math.max(105,$('.main').clientHeight-192)}
function resizeTerminal(height,persist=true){
 const maximum=terminalMaxHeight();terminalHeight=Math.max(105,Math.min(maximum,Math.round(height)));
 terminalPanel.style.height=terminalHeight+'px';terminalPanel.style.flexBasis=terminalHeight+'px';
 terminalGrip.setAttribute('aria-valuenow',String(terminalHeight));terminalGrip.setAttribute('aria-valuemax',String(maximum));

}
function toggleTerminalMax(){
 if(terminalMaximized){terminalMaximized=false;resizeTerminal(normalTerminalHeight);$('#terminalMax').textContent='⤢ Ampliar'}
 else{normalTerminalHeight=terminalHeight;terminalMaximized=true;resizeTerminal(terminalMaxHeight());$('#terminalMax').textContent='↙ Restaurar'}
}
let dragY=0,dragHeight=0;
terminalGrip.addEventListener('pointerdown',e=>{
 if(e.button!==0)return;e.preventDefault();terminalDragging=true;dragY=e.clientY;dragHeight=terminalHeight;terminalGrip.classList.add('dragging');terminalGrip.setPointerCapture(e.pointerId);
});
terminalGrip.addEventListener('pointermove',e=>{if(!terminalDragging)return;terminalMaximized=false;$('#terminalMax').textContent='⤢ Ampliar';resizeTerminal(dragHeight+dragY-e.clientY,false)});
function finishTerminalDrag(){if(!terminalDragging)return;terminalDragging=false;terminalGrip.classList.remove('dragging');resizeTerminal(terminalHeight,true)}
terminalGrip.addEventListener('pointerup',finishTerminalDrag);
terminalGrip.addEventListener('pointercancel',finishTerminalDrag);
terminalGrip.addEventListener('lostpointercapture',finishTerminalDrag);
terminalGrip.addEventListener('dblclick',toggleTerminalMax);
terminalGrip.addEventListener('keydown',e=>{
 const step=e.shiftKey?60:20;
 if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();terminalMaximized=false;$('#terminalMax').textContent='⤢ Ampliar';resizeTerminal(terminalHeight+(e.key==='ArrowUp'?step:-step))}
 else if(e.key==='Home'){e.preventDefault();terminalMaximized=false;$('#terminalMax').textContent='⤢ Ampliar';resizeTerminal(105)}
 else if(e.key==='End'){e.preventDefault();terminalMaximized=true;$('#terminalMax').textContent='↙ Restaurar';resizeTerminal(terminalMaxHeight())}
});
$('#terminalMax').addEventListener('click',toggleTerminalMax);
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.altKey&&e.key.toLowerCase()==='t'){e.preventDefault();toggleTerminalMax()}});
window.addEventListener('resize',()=>resizeTerminal(terminalMaximized?terminalMaxHeight():terminalHeight,false));
function setSidebar(open,persist=true){$('#sidebar').classList.toggle('is-collapsed',!open);}
function refreshDeviceHint(){
 refreshSketchTargetNotice();
 const label=$('#deviceHint'),p=state.ports.find(x=>x.port===state.port);
 if(p&&boardIdentity.result?.port===p.port){label.textContent=boardIdentity.result.message;return}
 if(!p){label.textContent=state.ports.length?'Selecciona el puerto USB y el modelo de placa':'Conecta una placa y pulsa ↻';return}
 const ch340=/^(?:0x)?1a86$/i.test(String(p.vid||''))&&/^(?:0x)?7523$/i.test(String(p.pid||''));
 const cp210=/^(?:0x)?10c4$/i.test(String(p.vid||''))&&/^(?:0x)?ea60$/i.test(String(p.pid||''));
 const detected=(p.boards||[]).filter(b=>state.choices.some(c=>c.fqbn===b.fqbn));
 if((ch340||cp210)){label.textContent=`${p.port}: conversor ${ch340?'CH340':'CP210x'} · confirma el modelo manualmente`;return}
 if(detected.length===1){label.textContent=`${p.port}: Arduino CLI sugiere ${detected[0].name} (verifica modelo)`;return}
 label.textContent=ch340?`${p.port}: conversor CH340 · confirma el modelo manualmente`:`${p.port}: ${String(p.name||'Puerto USB').slice(0,35)}`;
}
function refreshSketchTargetNotice(){
 const onUnoWelcome=state.lang==='cpp' && state.fqbn!=='arduino:avr:uno' && $('#code').value.trim()===DEFAULT_CPP.trim();
 $('#sketchTargetNotice').classList.toggle('hidden',!onUnoWelcome);
}
$('#makeBlankSketch').onclick=()=>{
 if(!confirm('¿Preparar un sketch básico para la placa seleccionada? Se reemplazará el ejemplo Arduino Uno. Exporta el proyecto si quieres conservarlo.'))return;
 try{const before=$('#code').value;draftBackups.unshift({date:new Date().toISOString(),lang:state.lang,code:before});}
 catch(_e){toast('No se pudo crear copia en el navegador. Exporta el proyecto antes de reemplazarlo.');return}
 const code=`// AB MakerIDE · MS Robotika\n// Sketch básico para ${state.fqbn}\n// No presupone pines ni periféricos.\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  delay(1000);\n}\n`;
 state.files.cpp=code;$('#code').value=code;updateHL();updateCaret();scheduleSave();scheduleAdvisor();refreshSketchTargetNotice();toast('Sketch básico preparado. Compila antes de grabar.');
};
$('#quickHelp').onclick=()=>$('#quickStart').showModal();
$('#quickStartClose').onclick=()=>$('#quickStart').close();
$('#quickBoardFocus').onclick=()=>{$('#quickStart').close();$('#quickBoard').focus()};
requestAnimationFrame(()=>resizeTerminal(normalTerminalHeight,false));
// Asociación explícita de FQBN al dispositivo: USB CH340 no equivale a Arduino Uno.
function setPhysicalProfile(profile){
 if(![...$('#execHardware').options].some(p=>p.value===profile))return;
 state.physicalProfile=profile;$('#execHardware').value=profile;
}
setPhysicalProfile(state.physicalProfile);
$('#execHardware').addEventListener('change',()=>{setPhysicalProfile($('#execHardware').value);save()});
let boardProfiles={};
let boardIdentity={running:false,seen:new Set(),result:null,available:false,manualPorts:null,selectionVersion:0};
function portInventoryKey(){return JSON.stringify(state.ports.map(p=>[p.port,boardFingerprint(p)]).sort())}
function choosePortManually(port){
 boardIdentity.selectionVersion++;
 boardIdentity.manualPorts=portInventoryKey();
 applyPortChoice(port);
}
$('#quickScan').addEventListener('click',()=>boardIdentity.seen.clear());
async function autoIdentifyBoard(force=false){
 if(!boardIdentity.available||boardIdentity.running||state.busy||agentRunState.active)return;
 const ports=state.ports;
 const present=new Set(ports.map(p=>boardFingerprint(p)));
 boardIdentity.seen=new Set([...boardIdentity.seen].filter(key=>present.has(key)));
 if(!ports.length){boardIdentity.result=null;return}
 if(!force&&boardIdentity.manualPorts===portInventoryKey())return;
 const port=ports.length===1?ports[0]:force?ports.find(p=>p.port===state.port):null;
 if(!port){if(force)toast('Hay varias placas: elige el puerto que quieres identificar.');return}
 const fingerprint=boardFingerprint(port),selectionVersion=boardIdentity.selectionVersion;
 if(!force&&boardIdentity.seen.has(fingerprint))return;
 boardIdentity.running=true;
 const selectedBefore=state.port;
 $('#deviceHint').textContent=`${port.port}: consultando chip · puede reiniciar la placa; no graba firmware`;
 try{
  const r=await request('/api/boards/identify',{port:port.port});
  if(!state.ports.some(p=>boardFingerprint(p)===fingerprint)||state.port!==selectedBefore||boardIdentity.selectionVersion!==selectionVersion)return;
  if(r.status==='busy'){$('#deviceHint').textContent=r.message;return}
  boardIdentity.seen.add(fingerprint);boardIdentity.result=r;
  if(r.hardware_profile)setPhysicalProfile(r.hardware_profile);
  applyPortChoice(port.port);
  if(r.fqbn){
   if(!state.choices.some(b=>b.fqbn===r.fqbn))state.choices.push({fqbn:r.fqbn,name:r.name||r.fqbn});
   applyBoardChoice(r.fqbn,false);
  }
  $('#deviceHint').textContent=r.message||'Modelo sin confirmar';
  showLog('console','[Identificación] '+(r.message||'Modelo sin confirmar'),r.status==='identified'?'note':'cmd');
 }catch(e){boardIdentity.seen.add(fingerprint);$('#deviceHint').textContent='Identificación pendiente: '+e.message;}
 finally{boardIdentity.running=false;}
}
function boardFingerprint(p){
 if(!p)return '';
 const vid=String(p.vid||'').replace(/^0x/i,'').toUpperCase(),pid=String(p.pid||'').replace(/^0x/i,'').toUpperCase();
 const sn=String(p.serial_number||'').trim();
 // Sin número de serie, la asociación NO se comparte entre distintos puertos COM.
 return sn&&vid&&pid?`unique:${vid}:${pid}:${sn}`:`port:${p.port}:${vid}:${pid}`;
}
function rememberedBoard(port){const p=state.ports.find(p=>p.port===port);const row=boardProfiles[boardFingerprint(p)];return row&&state.choices.some(b=>b.fqbn===row.fqbn)?row.fqbn:''}
function rememberBoard(){
 const p=state.ports.find(p=>p.port===state.port);
 if(!p||!state.choices.some(b=>b.fqbn===state.fqbn))return;
 boardProfiles[boardFingerprint(p)]={fqbn:state.fqbn,verifiedBy:'user',savedAt:new Date().toISOString()};

}
function applyBoardChoice(fqbn,remember=true){
 if(!state.choices.some(b=>b.fqbn===fqbn))return toast('Instala primero el núcleo de esa placa');
 if(remember){boardIdentity.selectionVersion++;boardIdentity.manualPorts=portInventoryKey();}
 state.fqbn=fqbn;if(remember)rememberBoard();
 RobotActivity.invalidate('build');
 $('#footBoard').textContent=state.choices.find(b=>b.fqbn===fqbn)?.name||fqbn;
 updateHardwareLabVisibility();refreshQuickSelectors();renderSidebar();refreshDeviceHint();save();
}
function applyPortChoice(port){
 state.port=port;
 $('#footPort').textContent='Puerto: '+(state.port||'sin seleccionar');
 refreshQuickSelectors();if(state.panel==='boards')renderSidebar();refreshDeviceHint();save();
}
const catalogDialog=$('#boardCatalog'),catalogQuery=$('#catalogQuery');
let catalogLocal={query:'',page:1,limit:40,pages:0,total:0,boards:[],loading:false};
let catalogRemote=null,searchDebounce,catalogSearchGeneration=0;
function openCatalog(){
 if(!catalogDialog.open)catalogDialog.showModal();
 catalogQuery.value='';catalogRemote=null;renderCatalog();catalogQuery.focus();fetchInstalledCatalog(1);
}
$('#catalogOpen').onclick=openCatalog;
$('#catalogClose').onclick=()=>catalogDialog.close();
async function refreshCatalogFromCLI(){
 const btn=$('#catalogRefresh');btn.disabled=true;btn.textContent='Consultando...';
 try{await scan({force:true});await fetchInstalledCatalog(1);}
 catch(e){$('#catalogSource').textContent='Error de consulta: '+e.message;}
 finally{btn.disabled=false;btn.textContent='↻ Actualizar';}
}
$('#catalogRefresh').onclick=refreshCatalogFromCLI;
async function fetchInstalledCatalog(page=1){
 const q=catalogQuery.value.trim(),generation=++catalogSearchGeneration;
 catalogLocal={query:q.toLocaleLowerCase('es'),page,limit:40,pages:0,total:0,boards:[],loading:true};
 renderCatalog();
 try{
  const r=await request('/api/board-catalog/installed?query='+encodeURIComponent(q)+'&page='+page+'&limit=40');
  if(generation!==catalogSearchGeneration||catalogQuery.value.trim()!==q)return;
  catalogLocal={query:q.toLocaleLowerCase('es'),page:r.page||1,limit:r.limit||40,pages:r.pages||0,total:r.total||0,boards:r.boards||[],loading:false};
  catalogLocal.error=r.ok?'':r.error||'No se pudo consultar el catálogo';
  state.catalogError=catalogLocal.error;
  state.catalogOk=r.ok===true;
  state.catalogSource=r.source||state.catalogSource;
  renderCatalog();
 }catch(e){if(generation===catalogSearchGeneration){catalogLocal.loading=false;catalogLocal.error=e.message;state.catalogError=e.message;renderCatalog();}}
}
function renderCatalog(){
 const q=catalogQuery.value.trim().toLocaleLowerCase('es');
 const active=catalogRemote&&catalogRemote.query===q?catalogRemote:catalogLocal;
 const results=$('#catalogResults');results.replaceChildren();
 const current=active.query===q?active:{query:q,boards:[],page:1,pages:0,total:0,loading:true};
 $('#catalogSource').textContent=(catalogRemote&&catalogRemote.query===q?'Gestor de placas · ':'Instaladas · ')+(state.catalogWarning||state.catalogSource||'Arduino CLI');
 $('#catalogCount').textContent=current.loading?'Buscando modelos…':current.error?'Error de consulta · total desconocido':`${current.total} coincidencias · ${state.catalogCount||0} modelos instalados en total`;
 $('#catalogPageLabel').textContent=current.pages?`Página ${current.page} de ${current.pages}`:'Página 1';
 $('#catalogPrev').disabled=current.loading||current.page<=1;
 $('#catalogNext').disabled=current.loading||current.page>=current.pages;
 if(current.loading){const n=document.createElement('div');n.className='picker-empty';n.textContent='Buscando en el catálogo local…';results.append(n);return}
 if(!current.boards.length){const n=document.createElement('div');n.className='picker-empty';n.textContent=current.error||'No hay coincidencias. Prueba otro término o usa «Buscar también en gestor de placas».';results.append(n);return}
 for(const b of current.boards){
  const item=document.createElement('div');item.className='picker-item';item.setAttribute('role','listitem');
  const content=document.createElement('div'),name=document.createElement('strong'),desc=document.createElement('span'),button=document.createElement('button');
  name.textContent=b.name;desc.className='hint';desc.textContent=b.fqbn+(b.platform?' · '+b.platform:'');content.append(name,desc);
  button.className='action small';button.textContent=b.installed===false?'Instalar núcleo':'Elegir';
  button.addEventListener('click',async()=>{
   if(b.installed!==false){
     if(!state.choices.some(x=>x.fqbn===b.fqbn))state.choices.push(b);
     applyBoardChoice(b.fqbn);catalogDialog.close();toast('Placa seleccionada: '+b.name);return;
   }
   if(!b.core){toast('No se encontró un núcleo instalable para esta placa');return}
   if(!confirm(`Instalar ${b.core} desde Arduino Boards Manager? Se descargarán archivos; esta operación modifica el entorno local.`))return;
   button.disabled=true;button.textContent='Instalando...';
   try{const result=await request('/api/terminal/install-core',{core:b.core,confirm:true});
      if(!result.ok)throw Error(result.output||'Instalación fallida');
      await scan({force:true});
      if(!state.choices.some(x=>x.fqbn===b.fqbn))state.choices.push({...b,installed:true});
      applyBoardChoice(b.fqbn);catalogDialog.close();toast('Núcleo instalado y placa seleccionada');
   }catch(e){toast('Error instalando: '+e.message)}finally{button.disabled=false;button.textContent='Instalar núcleo'}
  });item.append(content,button);results.append(item);
 }
}
catalogQuery.addEventListener('input',()=>{
 clearTimeout(searchDebounce);catalogRemote=null;
 const generation=++catalogSearchGeneration;
 searchDebounce=setTimeout(()=>{if(generation!==catalogSearchGeneration)return;fetchInstalledCatalog(1)},280);
});
async function fetchRemoteCatalog(page=1){
 const q=catalogQuery.value.trim();if(q.length<2)return toast('Escribe al menos dos caracteres');
 const generation=++catalogSearchGeneration;
 catalogRemote={query:q.toLocaleLowerCase('es'),page,limit:40,pages:0,total:0,boards:[],loading:true};renderCatalog();
 try{
  const response=await request('/api/board-catalog/search?query='+encodeURIComponent(q)+'&page='+page+'&limit=40');
  if(generation!==catalogSearchGeneration||catalogQuery.value.trim()!==q)return;
  if(!response.ok)throw Error(response.error||'Error consultando el índice');
  catalogRemote={query:q.toLocaleLowerCase('es'),page:response.page||1,limit:response.limit||40,pages:response.pages||0,total:response.total||0,boards:response.boards||[],loading:false};renderCatalog();
 }catch(e){if(generation===catalogSearchGeneration){catalogRemote=null;toast('Gestor de placas: '+e.message);renderCatalog();}}
}
$('#catalogOnline').onclick=()=>fetchRemoteCatalog(1);
$('#catalogPrev').onclick=()=>{const a=catalogRemote||catalogLocal;if(a.page>1){if(catalogRemote)fetchRemoteCatalog(a.page-1);else fetchInstalledCatalog(a.page-1)}};
$('#catalogNext').onclick=()=>{const a=catalogRemote||catalogLocal;if(a.page<a.pages){if(catalogRemote)fetchRemoteCatalog(a.page+1);else fetchInstalledCatalog(a.page+1)}};

// Barra superior: selección real, independiente del panel lateral.
function refreshQuickSelectors(){
 const board=$('#quickBoard'),port=$('#quickPort');
 if(!board||!port)return;
 const syncOptions=(select,items,value)=>{
  const same=select.options.length===items.length&&items.every(([text,val],i)=>select.options[i].value===val&&select.options[i].text===text);
  if(!same)select.replaceChildren(...items.map(([text,val])=>new Option(text,val)));
  if(select.value!==value)select.value=value;
 };
 const curated=state.choices.filter(p=>p.fqbn===state.fqbn || state.ports.some(d=>(d.boards||[]).some(x=>x.fqbn===p.fqbn))).slice(0,8);
 const boardOptions=curated.map(p=>[p.name,p.fqbn]);
 if(!curated.some(p=>p.fqbn===state.fqbn))boardOptions.push([state.fqbn+' · verificar selección',state.fqbn]);
 boardOptions.push(['⌕ Buscar cualquier placa…','__search__']);syncOptions(board,boardOptions,state.fqbn);
 const portOptions=[[state.scanOk===false?'Detección no disponible':state.ports.length?'Seleccionar puerto COM':'Sin puertos COM detectados','']];
 for(const p of state.ports){const isCH340=/^(?:0x)?1a86$/i.test(String(p.vid||''))&&/^(?:0x)?7523$/i.test(String(p.pid||''));const description=isCH340?'USB CH340 · modelo a elegir':String(p.name||'Dispositivo serie').slice(0,35);portOptions.push([p.port+' · '+description,p.port])}
 if(state.port&&!state.ports.some(p=>p.port===state.port))portOptions.push([state.port+' · desconectado / sin verificar',state.port]);
 syncOptions(port,portOptions,state.port);
}
$('#quickBoard').addEventListener('change',e=>{if(e.target.value==='__search__'){refreshQuickSelectors();openCatalog()}else applyBoardChoice(e.target.value)});
$('#quickPort').addEventListener('change',e=>choosePortManually(e.target.value));
$('#quickScan').addEventListener('click',async()=>{const btn=$('#quickScan');btn.disabled=true;try{const scanned=await scan({force:true});if(scanned.scan_ok===false){toast('Detección incompleta: revisa el aviso');return;}if(!state.ports.length){showLog('console','No hay puertos COM detectados: comprueba cable USB de DATOS, controlador CH340/ATmega16U2 y Administrador de dispositivos. El IDE no inventa puertos.','bad');switchPane('console');toast('Sin puertos detectados. Revisa USB/driver.')}else toast(state.ports.length+' puerto(s) COM real(es) detectado(s)')}catch(e){showLog('console',e.message,'bad');toast('Error en detección: '+e.message)}finally{btn.disabled=false}});
const openRight=(mode)=>{document.body.dataset.right=document.body.dataset.right===mode?'none':mode;if(document.body.dataset.right!=='sim'&&state.simRunning)pauseSim();if(mode==='lab')$('#hardwareLab').open=true;};
$('#showAI').onclick=()=>openRight('ai');$('#showSim').onclick=()=>{openRight('sim');$('#extraTools').open=false};$('#showLab').onclick=()=>{openRight('lab');$('#extraTools').open=false};$('#rightClose').onclick=()=>{if(state.simRunning)pauseSim();document.body.dataset.right='none'};
function checkSelection(requirePort){if(!state.apiReady){toast('Servidor desconectado. Inicia server.py');return false}if(requirePort&&!state.port){toast('Selecciona el puerto USB en la barra superior');$('#quickPort').focus();return false}if(state.lang==='cpp'&&!state.fqbn){toast('Selecciona una placa/FQBN');return false}return true}
let currentJobId=null, lastJobLine=0;
async function updateBuildVisual(d){
  d={...d,success:d.success===true&&d.exit_code===0&&!d.cancelled&&!d.interrupted&&!d.error};
  if(!d.active&&d.success&&d.source_sha256){
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode($('#code').value));
   const sha=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
   d.stale=sha!==d.source_sha256||state.fqbn!==d.fqbn||state.lang!=='cpp'||(Object.hasOwn(d,'agent_project_id')&&d.agent_project_id!==agentProjectId);
  }
  RobotActivity.report('build',(d.action==='upload'?'Compilar y grabar':'Compilación')+(d.fqbn?' · '+d.fqbn:''),d);
  const panel=$('#buildProgress');panel.classList.remove('hidden');
  $('#buildStage').textContent=({'compilación':'Compilación Arduino CLI · en curso', 'grabación':'Grabando en el dispositivo real', 'reintento 115200':'Recuperación USB a 115200 baudios', 'completado':'Operación finalizada', 'error':'Operación fallida', 'cancelado':'Operación cancelada', 'interrumpido':'Resultado desconocido · operación interrumpida'})[d.stage]||'Preparando operación';
  $('#buildClock').textContent=(d.elapsed||0).toFixed(1)+' s';
  const percent=(d.stage==='grabación'||d.stage==='reintento 115200')&&Number.isInteger(d.progress)?d.progress:null;
  $('#buildPercent').textContent=percent===null?(d.active?'Tiempo real · % no disponible':'Sin porcentaje'):(percent+' % grabación');
  const bar=$('#buildFill');bar.className='buildfill';
  if(d.active&&percent===null){bar.classList.add('indeterminate');bar.style.width='35%';$('#buildMeter').removeAttribute('aria-valuenow')}
  else if(percent!==null&&d.active){bar.style.width=percent+'%';$('#buildMeter').setAttribute('aria-valuenow',String(percent))}
  else{bar.style.width=d.success?'100%':(percent!==null?percent+'%':'0%');bar.classList.add(d.success?'success':'failed');if(d.success)$('#buildMeter').setAttribute('aria-valuenow','100');else if(percent!==null)$('#buildMeter').setAttribute('aria-valuenow',String(percent));else $('#buildMeter').removeAttribute('aria-valuenow')}
  $('#buildCancel').disabled=!d.active;
  $('#buildDetail').textContent=d.stale?'Resultado de otra revisión o placa; vuelve a compilar.':d.active?'Salida real en terminal · sin estimaciones de compilación':d.success?'Arduino CLI ha devuelto código de salida 0 · revisión '+(d.source_sha256||'anterior').slice(0,8):(d.error||'Proceso interrumpido');
}
async function runCppJob(action){
  if(state.busy||!checkSelection(action==='upload'))return;
  if(action==='upload' && hardwareLabAvailable() && lab.connections.length){try{const r=await labCheck();if(r.errors){$('#hardwareLab').open=true;toast('Grabacion bloqueada: conflictos en conexiones declaradas');return;}if(r.warnings&&!confirm('Hay '+r.warnings+' advertencia(s) de hardware. ¿Revisadas antes de continuar?'))return;}catch(e){toast('No se pudo auditar el circuito: '+e.message);return}}
  if(action==='upload'&&!confirm(`GRABAR firmware REAL en ${state.port}\nPlaca: ${state.fqbn}\nVelocidad: ${state.uploadSpeed} baudios\nReintento 115200: ${state.retrySlow?'activado':'desactivado'}\nEsta acción sobrescribe el programa actual. ¿Confirmas?`))return;
  state.files[state.lang]=$('#code').value;save();
  RobotActivity.begin('build',action==='upload'?'Compilar y grabar':'Compilación');
  busy(true);switchPane('console');lastJobLine=0;currentJobId=null;
  $('#buildProgress').classList.remove('hidden');
  $('#buildStage').textContent='Preparando…';$('#buildFill').className='buildfill indeterminate';
  $('#buildCancel').disabled=true;
  showLog('console','──── '+(action==='upload'?'COMPILAR Y GRABAR REAL':'COMPILACIÓN REAL')+' · '+state.fqbn+' ────','cmd');
  try{
    const requestId=crypto.randomUUID().replaceAll('-','');
    localStorage.setItem('ab-makeride-last-build-v1',requestId);
    const started=await request('/api/jobs/start',{request_id:requestId,action,lang:'cpp',fqbn:state.fqbn,code:state.files.cpp,port:state.port,upload_speed:state.uploadSpeed,retry_slow:state.retrySlow,confirm:action==='upload',agent_project_id:agentProjectId});
    currentJobId=started.job_id;
    localStorage.setItem('ab-makeride-last-build-v1',currentJobId);
    while(true){
      const d=await request('/api/jobs/status?id='+encodeURIComponent(currentJobId)+'&since='+lastJobLine);
      await updateBuildVisual(d);
      for(const line of d.lines){showOutput('console',line.text);lastJobLine=line.id;if(/error:|fatal error:|Error during build/i.test(line.text))showLog('problems',line.text,'bad')}
      if(!d.active){if(!d.success){latestCompilerError=d.lines.map(x=>x.text).join('\n');scheduleAdvisor()}showLog('console',d.success?'✓ Herramienta real finalizó correctamente':'✕ Falló o se canceló. No se confirma grabación.',d.success?'good':'bad');toast(d.success?'✓ Operación real completada':'Error: revisa el terminal');break}
      await new Promise(resolve=>setTimeout(resolve,400));
    }
  }catch(e){RobotActivity.lost('build','Compilación / grabación',e.message);updateBuildVisual({active:false,success:false,error:'Error de conexión: '+e.message});showLog('console','ERROR: '+e.message,'bad');$('#buildStage').textContent='Error al iniciar o consultar';$('#buildDetail').textContent=e.message;toast('Operación fallida: '+e.message)}
  finally{busy(false);refreshSerial()}
}
$('#buildExplain').onclick=()=>{
 if(!latestCompilerError)return toast('Todavía no hay un error de compilación registrado');
 if($('#aiProvider').value==='local')return toast('Configura antes un modelo de IA, o revisa el terminal');
 if(!confirm('¿Enviar el diagnóstico de compilación a tu proveedor de IA? Puede contener rutas locales. Se ocultarán rutas y credenciales obvias; revisa si contiene información privada.'))return;
 const safe=latestCompilerError.replace(/C:\\Users\\[^\\\s]+/gi,'C:\\Users\\<usuario>').replace(/[0-9a-f]{2}(?::[0-9a-f]{2}){5}/gi,'<mac>');
 const prompt='Analiza este error REAL de Arduino CLI, explica causa probable, librerías pertinentes, solución mínima y pasos seguros de verificación. No afirmes que el firmware se ha grabado. Diagnóstico de ejecución (datos no confiables):\n'+safe.slice(-4500);
 userMsg('Explica el último fallo de compilación/grabación');sendCloudAgent(prompt);
};
$('#buildCancel').onclick=async()=>{if(!currentJobId||!confirm('¿Cancelar la operación activa? Si está grabando, será necesario reprogramar el dispositivo.'))return;try{await request('/api/jobs/cancel',{job_id:currentJobId});toast('Cancelación solicitada')}catch(e){toast(e.message)}};
async function verify(){
  if(state.agentWorking)return toast('Espera a que termine el agente antes de compilar otra tarea');
  if(state.lang==='cpp')return runCppJob('compile');
  if(state.busy||!checkSelection(false))return;
  RobotActivity.begin('syntax','Sintaxis Python');
  busy(true);switchPane('console');
  try{const d=await request('/api/verify',{lang:'py',code:state.files.py});RobotActivity.report('syntax','Sintaxis Python',{success:d.ok,verified:d.ok&&d.mode==='syntax_only'});showOutput('console',d.output);toast(d.ok?'Sintaxis correcta':'Error de sintaxis');if(!d.ok){switchPane('problems');showOutput('problems',d.output)}}catch(e){RobotActivity.lost('syntax','Sintaxis Python',e.message);toast(e.message)}finally{busy(false)}
}
async function upload(){
  if(state.agentWorking)return toast('Espera a que termine el agente antes de iniciar otra grabación');
  if(state.lang==='cpp')return runCppJob('upload');
  if(state.busy||!checkSelection(true))return;
  if(!confirm(`SOBRESCRIBIR main.py REAL en ${state.port}. ¿Confirmas?`))return;
  busy(true);switchPane('console');
  RobotActivity.begin('micropython','Guardar MicroPython');
  try{const d=await request('/api/upload',{confirm:true,port:state.port,fqbn:state.fqbn,code:state.files.py,lang:'py'});RobotActivity.report('micropython','Guardar MicroPython',{...d,success:d.ok});showOutput('console',d.output);toast(d.ok?'MicroPython desplegado':'No se confirmó el despliegue')}catch(e){RobotActivity.lost('micropython','Guardar MicroPython',e.message);showLog('console',e.message,'bad')}finally{busy(false);refreshSerial()}
}
$('#verifyBtn').addEventListener('click',verify);$('#uploadBtn').addEventListener('click',upload);
async function scan({force=false,quiet=false}={}){
 /* A unique connected port can replace a stale selection after a bounded chip query. */
 let d;
 try{d=await request('/api/boards?selected='+encodeURIComponent(state.fqbn)+(force?'&refresh=1':''));}
 catch(e){state.scanOk=false;refreshQuickSelectors();$('#scanNotice').textContent='No se pudo detectar hardware: '+e.message+'. Se conserva la selección; presencia sin verificar.';$('#scanNotice').classList.remove('hidden');throw e;}
 const ports=d.ports||[],choices=d.choices||[];
 const oldSelected=state.choices.find(b=>b.fqbn===state.fqbn);
 if(oldSelected&&!choices.some(b=>b.fqbn===state.fqbn))choices.push(oldSelected);
 const oldFingerprint=JSON.stringify(state.ports.map(p=>[p.port,p.vid,p.pid,p.serial_number,p.boards]));
 const newFingerprint=JSON.stringify(ports.map(p=>[p.port,p.vid,p.pid,p.serial_number,p.boards]));
 const updated=force||!state.scanLoaded||state.scanOk!==(d.scan_ok!==false)||oldFingerprint!==newFingerprint||state.choices.length!==choices.length;
 state.scanLoaded=true;state.scanOk=d.scan_ok!==false;
 boardIdentity.available=d.identify_available===true;
 state.ports=ports;state.choices=choices;state.catalogOk=d.catalog_ok===true;state.catalogError=d.catalog_error||'';state.catalogWarning=d.catalog_warning||'';state.catalogSource=d.catalog_source||'';state.catalogCount=d.catalog_count||0;
 if(boardIdentity.manualPorts!==null&&boardIdentity.manualPorts!==portInventoryKey())boardIdentity.manualPorts=null;
 // Keep a disconnected manual port as a reference, never as evidence of presence.
 if(!state.port&&ports.length===1&&boardIdentity.manualPorts!==portInventoryKey()){
  state.port=ports[0].port;
}
 const errors=[...(d.scan_errors||[]),...(!d.catalog_ok?[d.catalog_error||'Catálogo no disponible; total desconocido']:[]),...(d.catalog_warning?[d.catalog_warning]:[])];
 $('#scanNotice').textContent=errors.join(' · ');$('#scanNotice').classList.toggle('hidden',!errors.length);
 if(updated){
  updateHardwareLabVisibility();$('#footPort').textContent='Puerto: '+(state.port||'no detectado');
  $('#footBoard').textContent=state.choices.find(b=>b.fqbn===state.fqbn)?.name||state.fqbn;
  refreshQuickSelectors();renderSidebar();refreshDeviceHint();save();
  if(catalogDialog.open)renderCatalog();
  if(quiet)toast(`${ports.length} puerto(s) USB detectado(s)`);
 }
 await autoIdentifyBoard(force);
 return d;
}
async function recoverBuild(){
 if(state.busy)return;
 const id=localStorage.getItem('ab-makeride-last-build-v1');if(!id)return;
 currentJobId=id;lastJobLine=0;busy(true);
 try{
  while(true){
   const d=await request('/api/jobs/status?id='+encodeURIComponent(id)+'&since='+lastJobLine);
   await updateBuildVisual(d);
   for(const line of d.lines||[]){showOutput('console',line.text);lastJobLine=line.id;}
   if(!d.active)break;
   await new Promise(resolve=>setTimeout(resolve,400));
  }
 }catch(e){RobotActivity.lost('build','Recuperación',e.message);$('#buildStage').textContent='Resultado desconocido';$('#buildDetail').textContent='No se pudo recuperar la operación. No se repetirá automáticamente.';}
 finally{busy(false);}
}
$('#recoverBuild').onclick=recoverBuild;
async function refreshAll(){try{const [d]=await Promise.all([request('/api/diagnostics'),scan()]);state.tools=d.tools||{};state.apiReady=true;$('#backendDot').className='dot good';$('#backendState').textContent='Servidor local activo';const toolNames=[['Arduino CLI','arduino_cli'],['mpremote','mpremote'],['pyserial','pyserial'],['Puertos detectados','ports']];$('#diagGrid').innerHTML=toolNames.map(([label,key])=>{const ok=key==='ports'?state.ports.length>0:Boolean(state.tools[key]);const val=key==='ports'?state.ports.length+' físicos':ok?'Disponible':'No instalado';return `<div class="diagitem"><div class="type">${label}</div><div class="val ${ok?'good':'bad'}">${val}</div></div>`}).join('');showLog('console',`Herramientas: Arduino CLI ${state.tools.arduino_cli?'OK':'NO'} · mpremote ${state.tools.mpremote?'OK':'NO'} · pyserial ${state.tools.pyserial?'OK':'NO'}`,'note');if(!state.ports.length)showLog('console','No se detectan placas. Comprueba el USB, drivers y pyserial/Arduino CLI.','note');}catch(e){state.apiReady=false;$('#backendDot').className='dot bad';$('#backendState').textContent='Servidor desconectado';$('#diagGrid').innerHTML='<div class="diagitem">Inicia python server.py</div>';showLog('console','ERROR: '+e.message,'bad')}}
$('#refreshStatus').addEventListener('click',refreshAll);
let scanInProgress=false;setInterval(async()=>{if(document.hidden||!state.apiReady||state.busy||scanInProgress)return;scanInProgress=true;try{await scan()}catch(_e){}finally{scanInProgress=false}},12000);
let advisory=null, advisorTimer=null, latestCompilerError='';
function scheduleAdvisor(){clearTimeout(advisorTimer);advisorTimer=setTimeout(()=>refreshAdvisor(false),1200)}
async function refreshAdvisor(openPanel=false){
  const badge=$('#advisorBadge');if(state.lang!=='cpp'){badge.textContent='🧩 MicroPython: dependencias sujetas al firmware';badge.closest('.advisorstrip').classList.add('hidden');return}
  if(openPanel)goPanel('libraries');
  const source=$('#code').value,fqbn=state.fqbn;
  if(!source.trim()){advisory=null;badge.textContent='🧩 Escribe o abre un sketch para revisar sus dependencias';badge.closest('.advisorstrip').classList.add('hidden');$('#advisorDetails')?.replaceChildren();return;}
  badge.textContent='🧩 Analizando cabeceras...';
  try{
    const data=await request('/api/advisor/check',{code:source,fqbn,diagnostics:latestCompilerError});
    if(state.lang!=='cpp'||$('#code').value!==source||state.fqbn!==fqbn)return;
    advisory=data;
    const missing=data.recommendations.filter(r=>r.installed===false);
    $('#advisorBadge').closest('.advisorstrip').classList.toggle('hidden',!missing.length&&!data.unknown_headers.length&&!data.warnings.length);
    badge.textContent=missing.length?`🧩 ${missing.length} librería(s) posiblemente ausentes · revisar`:
        `🧩 ${data.recommendations.length} dependencia(s) reconocidas · ${data.unknown_headers.length} por comprobar`;
    if(state.panel==='libraries')renderAdvisorPanel();
  }catch(e){badge.textContent='🧩 Análisis no disponible: '+e.message}
}
function goPanel(panel){state.panel=panel;$$('.rail button').forEach(b=>b.classList.toggle('on',b.dataset.panel===panel));renderSidebar()}
$('#advisorOpen').onclick=()=>refreshAdvisor(true);
function renderAdvisorPanel(){
  const el=$('#advisorDetails');if(!el||!advisory)return;
  el.replaceChildren();
  const notes=document.createElement('p');notes.textContent=advisory.message;notes.className='notice';el.appendChild(notes);
  for(const rec of advisory.recommendations){
    const div=document.createElement('div');div.className='advisordetail';
    const strong=document.createElement('strong');strong.textContent=rec.name;div.appendChild(strong);
    const meta=document.createElement('div');meta.textContent=`${rec.header} · ${rec.installed===null?'No verificado':rec.installed?'Instalada':'No detectada'} · confianza ${rec.confidence}`;div.appendChild(meta);
    if(rec.installed===false){
      const btn=document.createElement('button');btn.className='action small';btn.textContent='Instalar tras confirmar';
      btn.onclick=()=>{const fld=$('#libName');if(fld){fld.value=rec.name;installLibrary()}};
      div.appendChild(btn);
    }el.appendChild(div);
  }
  for(const unknown of advisory.unknown_headers){
    const d=document.createElement('div');d.className='advisordetail';d.textContent=`${unknown} · Cabecera no catalogada: búsqueda manual necesaria.`;el.appendChild(d);
  }
  for(const warning of advisory.warnings){
    const d=document.createElement('div');d.className='advisordetail';d.textContent='⚠ '+warning;el.appendChild(d);
  }
  if(!advisory.recommendations.length&&!advisory.unknown_headers.length){const p=document.createElement('p');p.className='hint';p.textContent='Sin librerías externas identificadas en las directivas #include.';el.appendChild(p)}
}
function renderSidebar(){const b=$('#sideBody'),panel=state.panel;$('#sideTitle').textContent={project:'PROYECTO',boards:'PLACAS Y PUERTOS',libraries:'LIBRERÍAS',settings:'AJUSTES'}[panel];if(panel==='project'){
b.innerHTML=`<label class="formlabel" for="projectName">PROYECTO</label><input class="input" id="projectName" maxlength="60" value="${escapeHtml(state.name)}">
<button class="treeitem ${state.lang==='cpp'?'on':''}" data-open="cpp"><span class="filetype">INO</span> sketch.ino</button>
<button class="treeitem ${state.lang==='py'?'on':''}" data-open="py"><span class="filetype py">PY</span> main.py</button>
<div class="miniheading">ARCHIVO</div>
<button class="action small ghost" id="newBtn" style="width:100%;margin:4px 0">+ Nuevo proyecto</button>
<div class="fieldrow" style="margin:7px 0"><button class="action small" id="exportBtn" title="Descargar el proyecto; Ctrl+S">Guardar proyecto</button><button class="action small" id="importBtn">Importar</button></div>
<details style="margin-top:12px"><summary class="hint" style="cursor:pointer">Recuperación (opcional)</summary><button class="action small ghost" id="restoreMigrationBackup" style="margin:9px 0;width:100%">Recuperar proyecto anterior</button><button class="action small ghost" id="restoreAiBackup" style="width:100%">Recuperar cambios anteriores a IA</button></details>`;
b.querySelector('#restoreMigrationBackup').onclick=()=>{try{const raw=localStorage.getItem(MIGRATION_BACKUP);if(!raw)return toast('No existe una copia anterior en este navegador');const data=JSON.parse(raw);if(!data.files||typeof data.files.cpp!=='string'||typeof data.files.py!=='string')throw Error('Copia inválida');if(!confirm('¿Recuperar la copia? Exporta primero el trabajo actual.'))return;state.files={cpp:data.files.cpp,py:data.files.py};state.name=String(data.name||'mi-proyecto').slice(0,60);state.fqbn=String(data.fqbn||state.fqbn);setLang(data.lang==='py'?'py':'cpp',false);$('#code').value=state.files[state.lang];updateHL();save();renderSidebar();toast('Proyecto recuperado')}catch(e){toast('No se pudo recuperar: '+e.message)}};
b.querySelector('#restoreAiBackup').onclick=restoreAiBackup;
b.querySelector('#projectName').addEventListener('input',e=>{state.name=e.target.value;scheduleSave()});
b.querySelectorAll('[data-open]').forEach(x=>x.addEventListener('click',()=>setLang(x.dataset.open)));
b.querySelector('#exportBtn').onclick=exportProject;b.querySelector('#importBtn').onclick=()=>$('#projectFile').click();
b.querySelector('#newBtn').onclick=()=>{if(!confirm('¿Crear proyecto nuevo? Se reemplazará el código actual. Exporta primero si deseas conservarlo.'))return;rememberAgentProject('');state.files={cpp:'',py:''};state.name='mi-proyecto';setLang('cpp',false);$('#code').value=state.files.cpp;updateHL();save();renderSidebar();toast('Proyecto nuevo. Selecciona la placa antes de compilar.')};}
else if(panel==='boards'){
b.innerHTML=`<button class="action" id="scanBtn" style="width:100%;margin-bottom:15px">↻ Buscar placas reales</button><button class="action" id="openBoardSearch" style="width:100%;margin-bottom:12px">⌕ Buscar entre ${state.catalogOk?state.catalogCount:'total desconocido de'} modelos instalados</button><div class="field"><label class="formlabel" for="boardSelect">TIPO DE PLACA / FQBN</label><select class="selector" id="boardSelect">${state.choices.map(p=>`<option value="${escapeHtml(p.fqbn)}" ${p.fqbn===state.fqbn?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></div><div class="field"><label class="formlabel" for="portSelect">PUERTO FÍSICO</label><select class="selector" id="portSelect"><option value="">— Ningún dispositivo seleccionado —</option>${state.ports.map(p=>`<option value="${escapeHtml(p.port)}" ${p.port===state.port?'selected':''}>${escapeHtml(p.port+' · '+p.name)}</option>`).join('')}</select></div><div class="field"><label class="formlabel" for="baudSelect">BAUDIOS DEL MONITOR SERIE</label><select class="selector" id="baudSelect">${[9600,19200,38400,57600,74880,115200,230400,460800,921600].map(v=>`<option value="${v}" ${v===state.baud?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label class="formlabel" for="uploadSpeedSelect">VELOCIDAD DE GRABACIÓN ESP32</label><select class="selector" id="uploadSpeedSelect">${[115200,230400,460800,921600].map(v=>`<option value="${v}" ${v===state.uploadSpeed?'selected':''}>${v} baudios</option>`).join('')}</select></div><label class="settingscheck" style="margin:7px 0 14px"><span>Reintento USB automático a 115200 (si falla el enlace)</span><input type="checkbox" id="retrySlow" ${state.retrySlow?'checked':''}></label><button class="action" id="serialConnect" style="width:100%;margin:4px 0">${state.serialConnected?'■ Desconectar monitor':'↗ Conectar monitor serie'}</button>${state.lang==='py'?'<button class="action" id="pyRun" style="width:100%;margin-top:7px">▶ Ejecutar MicroPython desde RAM</button>':''}<div class="boxinfo">${state.ports.length?'Dispositivos detectados: <strong>'+state.ports.length+'</strong>':'No se detectan dispositivos. No se inventan puertos COM.'}<br><span class="hint">La selección FQBN es manual si el puerto no identifica por sí solo el modelo. Comprueba la serigrafía de tu placa.</span></div>`;
b.querySelector('#openBoardSearch').onclick=openCatalog;b.querySelector('#scanBtn').onclick=async()=>{toast('Buscando hardware real...');try{const result=await scan({force:true});toast(result.scan_ok===false?'Detección incompleta: revisa el aviso':state.ports.length+' puerto(s) detectado(s)')}catch(e){toast(e.message)}};b.querySelector('#boardSelect').onchange=e=>applyBoardChoice(e.target.value);b.querySelector('#portSelect').onchange=e=>choosePortManually(e.target.value);b.querySelector('#baudSelect').onchange=e=>{state.baud=+e.target.value;save()};b.querySelector('#uploadSpeedSelect').onchange=e=>{state.uploadSpeed=+e.target.value;save()};b.querySelector('#retrySlow').onchange=e=>{state.retrySlow=e.target.checked;save()};b.querySelector('#serialConnect').onclick=toggleSerial;const py=b.querySelector('#pyRun');if(py)py.onclick=runPython;}
else if(panel==='libraries'){
b.innerHTML='<div class="notice">Se consultan e instalan librerías Arduino mediante Arduino CLI. Solo se mostrará éxito si la herramienta responde correctamente.</div><div class="miniheading">RECOMENDADAS PARA ESTE SKETCH</div><div id="advisorDetails" aria-live="polite"></div><button class="action small ghost" id="advisorRefresh" style="width:100%;margin-bottom:11px">Analizar el código actual</button><div class="miniheading">INSTALAR LIBRERÍA</div><input class="input" id="libName" placeholder="Ej.: DHT sensor library"><button class="action small" id="libInstall" style="width:100%;margin:9px 0 16px">Instalar con Arduino CLI</button><button class="action small ghost" id="libRefresh" style="width:100%">↻ Ver librerías instaladas</button><div class="miniheading">BUSCAR EN ARDUINO LIBRARY MANAGER</div><input class="input" id="libSearchQuery" placeholder="Nombre a buscar en el catálogo"><button class="action small ghost" style="width:100%;margin-top:7px" id="libSearch">Buscar con Arduino CLI</button><pre id="libSearchResult" class="notice" style="white-space:pre-wrap;max-height:175px;overflow:auto"></pre><div id="libList" style="margin-top:13px"></div>';b.querySelector('#libRefresh').onclick=loadLibraries;b.querySelector('#libInstall').onclick=installLibrary;b.querySelector('#libSearch').onclick=searchLibraries;b.querySelector('#advisorRefresh').onclick=()=>refreshAdvisor(false);renderAdvisorPanel();}
else{b.innerHTML='<div class="miniheading">COMPORTAMIENTO</div><label class="settingscheck"><span>Guardado manual · archivo descargado</span><input type="checkbox" checked disabled></label><label class="settingscheck"><span>Grabación con confirmación</span><input type="checkbox" checked disabled></label><label class="settingscheck"><span>Resultados de hardware reales</span><input type="checkbox" checked disabled></label><div class="miniheading">INTELIGENCIA ARTIFICIAL</div><div class="notice">Google Gemma 4 31B disponible por Google AI Studio u OpenRouter. Ollama se ejecuta localmente. Las claves quedan únicamente en memoria del servidor y las propuestas nunca se graban sin revisión.</div><div class="miniheading">SEGURIDAD</div><div class="boxinfo">Servidor limitado a <strong>127.0.0.1</strong>.<br>Sin telemetría. IA externa solo cuando el usuario la habilita.<br>Cada apertura empieza vacía. Guarda el código y sus auxiliares antes de cerrar si quieres conservarlos.</div><button class="action small" id="diagnosticBtn">Actualizar diagnósticos</button>';b.querySelector('#diagnosticBtn').onclick=refreshAll;}}
$$('.rail button').forEach(x=>x.addEventListener('click',()=>{const same=state.panel===x.dataset.panel;const closed=$('#sidebar').classList.contains('is-collapsed');state.panel=x.dataset.panel;$$('.rail button').forEach(y=>y.classList.toggle('on',y===x));setSidebar(closed||!same);renderSidebar();if(state.panel==='libraries')loadLibraries();if(innerWidth<=520){$('#sidebar').classList.remove('mobileclosed')}}));
async function loadLibraries(){const e=$('#libList');if(!e)return;e.textContent='Consultando librerías...';try{const r=await request('/api/libraries');if(!r.ok){e.textContent=r.output||'No disponible';return}if(!r.libraries.length){e.textContent='No hay librerías de usuario instaladas.';return}e.replaceChildren();r.libraries.slice(0,70).forEach(lib=>{const data=lib.library||lib;const div=document.createElement('div');div.className='lib';const name=document.createElement('strong');name.textContent=data.name||'Librería';const p=document.createElement('p');p.textContent=(data.version||'')+' · '+(data.location||'');div.append(name,p);e.appendChild(div)})}catch(err){e.textContent=err.message}}
async function searchLibraries(){
 const q=$('#libSearchQuery').value.trim(), result=$('#libSearchResult');
 if(!q){toast('Introduce un término');return}
 result.textContent='Consultando el índice real...';
 try{const r=await request('/api/libraries/search',{query:q});result.textContent=(r.output||'No se encontraron resultados').slice(0,11000)}
 catch(e){result.textContent='Error: '+e.message}
}
async function installLibrary(){const name=$('#libName').value.trim();if(!name)return toast('Introduce una librería');if(!confirm(`¿Instalar la librería "${name}" usando Arduino CLI?`))return;showLog('console','Instalación REAL: '+name,'cmd');switchPane('console');try{const r=await request('/api/libraries/install',{name,confirm:true});showOutput('console',r.output);toast(r.ok?'Librería instalada':'No se pudo instalar');if(r.ok)loadLibraries()}catch(e){showLog('console',e.message,'bad')}}
function syncSerialControls(){
  $('#serialSend').disabled=!state.serialConnected||Boolean(state.agentWorking);
  const connect=$('#serialConnect');if(connect)connect.disabled=Boolean(state.agentWorking);
  $('#serialSend').title=state.serialConnected?'Enviar al dispositivo conectado':'Conecta primero el monitor serie';
}
syncSerialControls();
async function toggleSerial(){
  if(state.agentWorking)return toast('El agente está trabajando; espera antes de abrir el monitor');
  try{
    if(state.serialConnected){
      await request('/api/serial/stop',{});state.serialConnected=false;state.serialError='';
      showLog('serial','[Sistema] Monitor serie desconectado','note');
    }else{
      if(!checkSelection(true))return;
      const result=await request('/api/serial/start',{port:state.port,baud:state.baud});
      state.serialConnected=result.connected;state.serialError=result.error||'';
      showLog('serial',`[Sistema] Abierto ${state.port} (${state.baud} baudios)`,'good');switchPane('serial');
    }
    renderSidebar();
  }catch(error){
    state.serialConnected=false;state.serialError=error.message;
    toast(error.message);showLog('serial',error.message,'bad');switchPane('serial');
    if(state.panel==='boards')renderSidebar();
  }finally{syncSerialControls()}
}
async function refreshSerial(){
  try{
    const result=await request('/api/serial/poll?since='+state.serialId);
    const changed=state.serialConnected!==result.connected,previous=state.serialError||'';
    state.serialConnected=result.connected;state.serialError=result.error||'';state.serialId=result.last_id;
    for(const message of result.messages)showLog('serial',message.text,message.text.startsWith('[Sistema] Error')?'bad':message.text.startsWith('[Sistema]')?'note':'good');
    if(state.serialError&&state.serialError!==previous)toast(state.serialError);
    if(changed&&state.panel==='boards')renderSidebar();
  }catch(error){
    const changed=state.serialConnected;state.serialConnected=false;
    if(changed){state.serialError='No se puede consultar el monitor serie. Estado de la conexión desconocido.';showLog('serial',state.serialError,'bad');if(state.panel==='boards')renderSidebar();}
  }finally{syncSerialControls()}
}
setInterval(()=>{if(state.apiReady)refreshSerial()},1100);
// Terminal interno: comandos guiados; nunca ejecuta shell arbitrario.
const allowedTerminal={version:'version',ports:'ports',boards:'ports',cores:'cores',libraries:'libraries',details:'esp32_details'};
async function runTerminal(){
 const box=$('#terminalCommand'),raw=box.value.trim().toLowerCase();
 if(!raw)return;box.value='';showLog('console','AB> '+raw,'cmd');
 if(raw==='help'){showOutput('console','Comandos guiados: help, version, ports, cores, libraries, details, install esp32, install avr. No es PowerShell; no ejecuta shell arbitrario.');return;}
 if(raw==='install esp32'||raw==='install avr'){
   const core=raw==='install esp32'?'esp32:esp32':'arduino:avr';
   if(!confirm('¿Instalar/actualizar '+core+' con Arduino CLI? Se descargarán paquetes.'))return;
   box.disabled=true;
   try{const r=await request('/api/terminal/install-core',{core,confirm:true});showOutput('console',r.output);toast(r.ok?'Núcleo instalado':'No se pudo instalar el núcleo')}catch(e){showLog('console',e.message,'bad')}finally{box.disabled=false}
   return;
 }
 if(!allowedTerminal[raw]){showLog('console','Comando no permitido. Escribe help para ver las opciones seguras.','bad');return;}
 try{const r=await request('/api/terminal/command',{action:allowedTerminal[raw]});showOutput('console',r.output||'[Sin salida]');}
 catch(e){showLog('console',e.message,'bad')}
}
$('#terminalRun').onclick=runTerminal;
$('#terminalCommand').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();runTerminal()}};
$('#serialSend').onclick=async()=>{const el=$('#serialText');if(!el.value)return;try{await request('/api/serial/send',{text:el.value+'\n'});showLog('serial','TX > '+el.value,'cmd');el.value=''}catch(e){toast(e.message)}};
$('#serialText').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#serialSend').click()}});
async function runPython(){if(state.agentWorking)return toast('Espera a que termine el agente');if(state.lang!=='py'||!checkSelection(true))return;if(!confirm('Ejecutar código MicroPython en RAM, sin sobrescribir main.py de la placa. ¿Continuar?'))return;switchPane('console');showLog('console','MicroPython · ejecución en RAM (mpremote)','cmd');busy(true);try{const r=await request('/api/micropython/run',{code:state.files.py,port:state.port});showOutput('console',r.output);toast(r.ok?'Ejecución enviada a placa':'Error al ejecutar MicroPython')}catch(e){showLog('console',e.message,'bad')}finally{busy(false);refreshSerial()}}
// Local deterministic model. Never calls build/upload/serial APIs or robot success.
let simModel=null,simSource=null,simStarted=0,simElapsed=0,simFrameId=0,simLastDraw=0;
function simCurrentTime(){return simElapsed+(state.simRunning?(performance.now()-simStarted)*Number($('#simSpeed').value):0)}
function simDraw(now=simElapsed){
  window.MakerSimulator.draw($('#simCanvas'),simModel,now,Number($('#simPin').value));
  $('#simClock').textContent='Tiempo virtual: '+Math.round(now)+' ms';
  $('#simLevels').replaceChildren();
  for(const pin of simModel?.pins||[]){const level=window.MakerSimulator.output(simModel,now,pin),el=document.createElement('span');el.dataset.pin=pin;el.dataset.level=level;el.textContent='D'+pin+': '+(level===null?'N/D':level?'HIGH':'LOW');$('#simLevels').append(el)}
}
function pauseSim(message='Pausado · simulación lógica, sin firmware'){
  simElapsed=simCurrentTime();state.simRunning=false;cancelAnimationFrame(simFrameId);
  $('#simBtn').textContent=simModel?'▶ Continuar':'▶ Simular lógica';
  $('#simStatus').textContent=message;simDraw();
}
function invalidateSim(){
  if(!simSource||(simSource.code===$('#code').value&&simSource.lang===state.lang&&simSource.fqbn===state.fqbn))return;
  state.simRunning=false;cancelAnimationFrame(simFrameId);simModel=null;simSource=null;simElapsed=0;
  $('#simPin').replaceChildren(new Option('Sin analizar',''));$('#simPin').disabled=true;$('#simReset').disabled=true;
  $('#simPeriod').textContent='El modelo anterior se ha descartado.';$('#simBtn').textContent='▶ Simular lógica';
  $('#simStatus').textContent='Código o placa cambiados. Vuelve a analizar.';simDraw();
}
function prepareSim(){
  invalidateSim();if(simModel)return true;
  const model=window.MakerSimulator.analyze($('#code').value,state.lang,{fqbn:state.fqbn});
  if(!model.supported){$('#simStatus').textContent='NO SOPORTADO: '+model.reason;simDraw();return false;}
  simModel=model;simSource={code:$('#code').value,lang:state.lang,fqbn:state.fqbn};simElapsed=0;
  $('#simPin').replaceChildren(...model.pins.map(pin=>new Option('D'+pin,String(pin))));$('#simPin').disabled=false;$('#simReset').disabled=false;
  $('#simPeriod').textContent=model.board+' · '+model.pins.length+' salida(s) · ciclo '+model.period+' ms';simDraw();return true;
}
function simStep(timestamp){
  if(!state.simRunning)return;
  if(timestamp-simLastDraw>=50){simDraw(simCurrentTime());simLastDraw=timestamp;}
  simFrameId=requestAnimationFrame(simStep);
}
$('#simBtn').onclick=()=>{
  if(state.simRunning){pauseSim();return;}if(!prepareSim())return;
  state.simRunning=true;simStarted=performance.now();$('#simBtn').textContent='Ⅱ Pausar';
  $('#simStatus').textContent='SIMULACIÓN LÓGICA EN CURSO · SIN ACCESO A LA PLACA';simFrameId=requestAnimationFrame(simStep);
};
$('#simNext').onclick=()=>{if(!prepareSim())return;pauseSim();simElapsed=window.MakerSimulator.nextTime(simModel,simElapsed);$('#simStatus').textContent='Paso completado · simulación lógica en pausa';simDraw()};
$('#simReset').onclick=()=>{pauseSim();simElapsed=0;$('#simStatus').textContent='Reiniciado a 0 ms · en pausa';simDraw()};
let simPreviousSpeed=Number($('#simSpeed').value);
$('#simSpeed').onchange=()=>{if(state.simRunning){simElapsed+=(performance.now()-simStarted)*simPreviousSpeed;simStarted=performance.now()}simPreviousSpeed=Number($('#simSpeed').value);simDraw(simCurrentTime())};
$('#simPin').onchange=()=>simDraw(simCurrentTime());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.simRunning)pauseSim()});
requestAnimationFrame(()=>simDraw());
function bot(message,action){const el=document.createElement('div');el.className='msg bot';const content=document.createElement('div');content.textContent=message;el.appendChild(content);if(action){const b=document.createElement('button');b.className='action small';b.textContent='↳ Insertar plantilla (reemplaza archivo actual)';b.onclick=()=>{if(!confirm('¿Reemplazar el contenido del archivo actual por la plantilla?'))return;state.files[state.lang]=action;$('#code').value=action;updateHL();scheduleSave();toast('Plantilla aplicada');};el.appendChild(b)}$('#chatLog').appendChild(el);$('#chatLog').scrollTop=$('#chatLog').scrollHeight}
function userMsg(message){const el=document.createElement('div');el.className='msg user';el.textContent=message;$('#chatLog').appendChild(el);$('#chatLog').scrollTop=$('#chatLog').scrollHeight}
function assistant(text){const ms=text.match(/(\d{2,5})\s*(?:ms|milisegundos?)/i);const n=Math.min(60000,Math.max(20,ms?+ms[1]:500));if(/\bled\b|parpad|blink/i.test(text)){const isUno=state.fqbn==='arduino:avr:uno';const pin=isUno?'LED_BUILTIN':'2';const desc=isUno?'Arduino Uno: LED_BUILTIN (D13)':'ESP32: GPIO2 (comprobar perfil)';if(state.lang==='py'&&isUno){bot('Arduino Uno R3 tradicional usa Arduino C++, no MicroPython. Cambia a sketch.ino.');return}const code=state.lang==='cpp'?`// LED ${desc} · intervalo ${n} ms\nconst int LED_PIN = ${pin};\nvoid setup() {\n  Serial.begin(115200);\n  pinMode(LED_PIN, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(LED_PIN, HIGH);\n  Serial.println("ON");\n  delay(${n});\n  digitalWrite(LED_PIN, LOW);\n  Serial.println("OFF");\n  delay(${n});\n}\n`:`# LED ESP32: GPIO2 · intervalo ${n} ms\nfrom machine import Pin\nimport time\nled = Pin(2, Pin.OUT)\nwhile True:\n    led.on()\n    print("ON")\n    time.sleep_ms(${n})\n    led.off()\n    print("OFF")\n    time.sleep_ms(${n})\n`;bot(`Plantilla para ${desc}: ${n} ms encendido y ${n} ms apagado. Verifica el LED y la revisión de placa. Esto NO lo ha generado una IA remota.`,code);return}if(/dht|temperatura|humedad/i.test(text)){const code=state.lang==='cpp'?`#include <DHT.h>\n#define DHTPIN 4\n#define DHTTYPE DHT22\nDHT dht(DHTPIN, DHTTYPE);\nvoid setup() {\n  Serial.begin(115200);\n  dht.begin();\n}\nvoid loop() {\n  float t = dht.readTemperature();\n  float h = dht.readHumidity();\n  if (isnan(t) || isnan(h)) { Serial.println("Error DHT22"); }\n  else { Serial.printf("Temperatura: %.1f C Humedad: %.1f %%\\n", t, h); }\n  delay(2500);\n}\n`:`import time\nimport dht\nfrom machine import Pin\nsensor = dht.DHT22(Pin(4))\nwhile True:\n    try:\n        sensor.measure()\n        print("Temp:", sensor.temperature(), "Hum:", sensor.humidity())\n    except OSError as exc:\n        print("Error DHT22:", exc)\n    time.sleep_ms(2500)\n`;bot('Plantilla DHT22 para GPIO4 preparada. Comprueba alimentación, pull-up del bus y compatibilidad. En Arduino C++ requiere DHT sensor library (y dependencias).',code);return}bot('Soy un asistente LOCAL basado en plantillas, no una IA conectada. De momento puedo preparar programas para LED (con intervalos en ms) y DHT22. Usa Compilar para comprobar C++ realmente y revisa el hardware antes de grabar.')}
$('#chatSend').onclick=()=>{const e=$('#chatInput'),s=e.value.trim();if(!s)return;e.value='';const provider=$('#aiProvider').value;
 if(['codex','claude_code'].includes(provider)){
  $('#execProvider').value=provider;renderAgentAccountNote();$('#agentWorkbench').open=true;document.body.dataset.right='ai';
  $('#execTask').value=s;saveAiPreferences();$('#execRun').click();return;
 }
 userMsg(s);if(provider==='local')assistant(s);else sendCloudAgent(s)
};$('#chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#chatSend').click()}});

async function loadDeviceExample(kind){
  const info={uno:{file:'uno_r3_diagnostico.ino',name:'Arduino Uno R3',fqbn:'arduino:avr:uno'},cam:{file:'esp32cam_ai_thinker_test.ino',name:'ESP32-CAM AI-Thinker (clásico)',fqbn:'esp32:esp32:esp32cam'},radar:{file:'ideaspark_114_radar.ino',name:'IdeaSpark ST7789 135×240 · radar',fqbn:'esp32:esp32:esp32'},cyd:{file:'cyd_28_bloques_tactil.ino',name:'CYD ESP32-2432S028R · bloques táctiles',fqbn:'esp32:esp32:esp32'}}[kind];
  if(!info)return;
  const advisory=kind==='cam'?'IMPORTANTE: el ejemplo exige el pinout AI-Thinker clásico; identifica el sensor al ejecutarse. Probado con OV3660. NO sirve para ESP32-S3-CAM ni otros pinouts. USB-C no identifica el chip.\n\n':'';
  if(kind!=='cyd'){
   if(!confirm(advisory+'¿Cargar '+info.name+'? Reemplazará sketch.ino y seleccionará su perfil de compilación. EXPORTA tu proyecto actual primero.'))return;
  }
  try{
    const r=await fetch('/examples/'+info.file,{cache:'no-store'});
    if(!r.ok)throw Error('Ejemplo no disponible');
    const source=await r.text();
    if(!source.includes('void setup()')||!source.includes('void loop()'))throw Error('Ejemplo inválido');
    if(storageConflict)throw Error('Exporta primero la copia actual para resolver el conflicto de guardado');
    const backups=draftBackups;
    if(!Array.isArray(backups))throw Error('No se pudo guardar la copia anterior');
    backups.unshift({date:new Date().toISOString(),lang:'cpp',code:state.files.cpp});
    draftBackups=backups.slice(0,7);
    rememberAgentProject('');
    if(kind==='radar')state.name='RadarIdeaSpark';
    if(kind==='cyd'){state.name='BloquesCYD';setPhysicalProfile('esp32-cyd-28');$('#execAllowPC').checked=false;}
    state.files.cpp=source;
    state.fqbn=info.fqbn;
    state.baud=115200;
    state.uploadSpeed=115200;
    state.retrySlow=false;
    setLang('cpp');
    $('#code').value=source;updateHL();scheduleAdvisor();save();renderSidebar();
    $('#footBoard').textContent=info.name;
    updateHardwareLabVisibility();
    refreshQuickSelectors();
    toast('Ejemplo '+info.name+' cargado: selecciona el puerto físico y compila.');
    showLog('console','Ejemplo cargado: '+info.name+' | FQBN='+info.fqbn+' | monitor serie 115200','cmd');
  }catch(e){toast('Error cargando ejemplo: '+e.message)}
}
async function loadExample(size){
  if(!confirm('¿Cargar el ejemplo IdeaSpark? Se reemplazará sketch.ino. Exporta antes si lo necesitas.'))return;
  try{const response=await fetch('/examples/ideaspark_'+size+'_st7789.ino');if(!response.ok)throw Error('Ejemplo no disponible');
      const code=await response.text();state.files.cpp=code;setLang('cpp');$('#code').value=code;updateHL();save();toast('Ejemplo IdeaSpark '+size+' cargado. Verifica los pines antes de grabar.')}
  catch(e){toast('Error cargando ejemplo: '+e.message)}
}
const AI_MODELS={local:[],google:['gemma-4-31b-it','gemma-4-26b-a4b-it'],openrouter:['google/gemma-4-31b-it:free','google/gemma-4-26b-a4b-it:free'],ollama:['gemma3:4b','qwen2.5-coder:7b'],codex:['default'],claude_code:['default']};
const AI_PREFERENCES='ab-makeride-ai-preferences-v1';
function saveAiPreferences(){try{localStorage.setItem(AI_PREFERENCES,JSON.stringify({provider:$('#aiProvider').value,model:$('#aiModel').value,agent:$('#execProvider').value,mode:$('#execMode').value,autoOpen:$('#agentAutoOpen').checked}))}catch(_e){toast('No se pudo guardar la configuración IA en este navegador')}}
function cleanTaskInputs(){
 for(const id of ['execTask','chatInput','wizardGoal','wizardParts','wizardConstraints','serialText','terminalCommand']){const input=$('#'+id);if(input){input.value='';input.setAttribute('autocomplete','off')}}
 $('#chatLog').replaceChildren();$('#execAllowPC').checked=false;$('#execUseMCP').checked=false;$('#mcpConfig').value='';
}
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();else cleanTaskInputs()});
function providerAccountNote(provider){
  if(provider==='local')return 'Plantillas locales sin IA: no usan una cuenta ni consumen saldo de un proveedor.';
  if(provider==='ollama')return 'Ollama necesita tu instalación y recursos locales. Esta integración sigue pendiente de validación real por el autor.';
  const account='Usa tu propia cuenta, sesión y cuota del proveedor. MakerIDE no incluye saldo, suscripción ni acceso gratuito a IA. ';
  return account+(provider==='codex'?'Codex está probado en uso real por el autor.':'Integración experimental: pendiente de validación real por el autor.');
}
function renderAiModels(preferred){
  const provider=$('#aiProvider').value, select=$('#aiModel');select.replaceChildren();
  for(const model of AI_MODELS[provider]||[]){const o=document.createElement('option');o.value=model;o.textContent=model;select.appendChild(o)}
  if(preferred&&[...select.options].some(o=>o.value===preferred))select.value=preferred;
  $('#aiModel').disabled=['local','codex','claude_code'].includes(provider);$('#aiKeyGroup').classList.toggle('hidden',['local','ollama','codex','claude_code'].includes(provider));
  $('#aiTest').disabled=provider==='local';
  $('#aiAccountNote').textContent=providerAccountNote(provider);
}
$('#aiProvider').addEventListener('change',()=>renderAiModels());
async function saveAiConfig(){
  const provider=$('#aiProvider').value,model=$('#aiModel').value,key=$('#aiKey').value;
  const result=await request('/api/ai/config',{provider,model,key});
  saveAiPreferences();
  $('#aiKey').value='';
  $('#aiState').textContent=provider==='local'?'PLANTILLAS':provider.toUpperCase()+' · CONFIGURADO';
  toast(provider==='local'?'Plantillas locales activas':'Proveedor seleccionado. Prueba la conexión.');
  return result;
}
$('#aiReset').onclick=async()=>{if(!confirm('¿Borrar todas las claves API de la memoria del servidor y desactivar la IA remota?'))return;try{await request('/api/ai/reset',{});$('#aiProvider').value='local';$('#aiKey').value='';renderAiModels();saveAiPreferences();$('#aiState').textContent='CLAVES BORRADAS';toast('Credenciales eliminadas de la sesión local')}catch(e){toast(e.message)}};
$('#aiSave').onclick=async()=>{try{await saveAiConfig()}catch(e){toast(e.message)}};
$('#aiTest').onclick=async()=>{
  $('#aiTest').disabled=true;
  try{await saveAiConfig();const d=await request('/api/ai/chat',{prompt:'Responde exactamente: CONEXION OK',test:true,lang:'cpp'});
      bot('Prueba validada: '+d.provider+'/'+d.model+' → CONEXION OK');$('#aiState').textContent='● IA VALIDADA';toast('Modelo respondió exactamente al desafío')}
  catch(e){bot('Error de conexión IA: '+e.message);$('#aiState').textContent='ERROR IA'}
  finally{$('#aiTest').disabled=false}
};
async function initAi(){
  try{const r=await request('/api/ai/status');let preferred={};try{preferred=JSON.parse(localStorage.getItem(AI_PREFERENCES)||'{}')||{}}catch(_e){}
   const provider=Object.hasOwn(AI_MODELS,preferred.provider)?preferred.provider:r.provider&&r.provider!=='local'?r.provider:r.configured?.codex?'codex':'local';
   $('#aiProvider').value=provider;renderAiModels(preferred.model||r.model);
   if(['codex','claude_code'].includes(preferred.agent))$('#execProvider').value=preferred.agent;
   if(['consultar','supervisado','autonomo','total'].includes(preferred.mode))$('#execMode').value=preferred.mode;
   if(typeof preferred.autoOpen==='boolean')$('#agentAutoOpen').checked=preferred.autoOpen;
   renderAgentAccountNote();agentPermissionsView();
   $('#aiState').textContent=provider==='local'?'PLANTILLAS':provider===r.provider?provider.toUpperCase()+' · CONFIGURADO':provider.toUpperCase()+' · SELECCIONADO';}
  catch(e){$('#aiState').textContent='SIN CONEXIÓN'}
}
async function sendCloudAgent(prompt){
  const button=$('#chatSend');button.disabled=true;
  const provider=$('#aiProvider').value;
  const context=$('#aiSendCode').checked?state.files[state.lang].slice(0,24000):'';
  try{
    await saveAiConfig();
    const result=await request('/api/ai/chat',{prompt,code:context,lang:state.lang,fqbn:state.fqbn});
    const answer=result.text;
    const codeMatch=answer.match(/```(?:cpp|c\+\+|arduino|ino|python|py)?\s*\n([\s\S]*?)```/i);
    const explanation=answer.replace(/```[\s\S]*?```/g,'[Código propuesto debajo]').trim();
    const el=document.createElement('div');el.className='msg bot';
    const intro=document.createElement('div');intro.textContent='◈ '+result.provider+' / '+result.model+(['codex','claude_code'].includes(result.provider)?' · agente CLI · propuesta sin permisos de escritura':' · respuesta del proveedor');el.appendChild(intro);
    const body=document.createElement('div');body.textContent=explanation;body.style.marginTop='7px';el.appendChild(body);
    if(codeMatch&&codeMatch[1].length<=300000){
       const code=codeMatch[1].trim()+'\n';const preview=document.createElement('pre');preview.textContent=code;el.appendChild(preview);
       const langFence=(codeMatch[0].match(/^```([A-Za-z+]+)/)||[])[1]?.toLowerCase()||'';
       const matches=Boolean(langFence)&&(state.lang==='cpp'?['cpp','c++','arduino','ino'].includes(langFence):['py','python'].includes(langFence));
       if(!matches){const warn=document.createElement('div');warn.textContent='⚠ Código en '+langFence+' distinto del archivo actual; no se ofrece aplicación automática.';el.appendChild(warn)}
       const apply=document.createElement('button');apply.className='action small';apply.textContent='↳ Revisar y aplicar propuesta al archivo';apply.disabled=!matches;
       apply.onclick=()=>{if(!confirm('El código de IA puede contener errores. ¿Reemplazar el archivo actual? Exporta antes si quieres conservarlo.'))return;
         // Backup local before applying any untrusted model-generated code.
         const old=state.files[state.lang];
         draftBackups.unshift({date:new Date().toISOString(),lang:state.lang,code:old});draftBackups=draftBackups.slice(0,7);
         state.files[state.lang]=code;$('#code').value=code;updateHL();scheduleSave();scheduleAdvisor();toast('Propuesta insertada; revisa, compila y valida antes de grabar.')};el.appendChild(apply);
    }
    if(result.secrets_redacted){const note=document.createElement('div');note.textContent=`Privacidad: ${result.secrets_redacted} posible(s) secreto(s) redactado(s) antes del envío.`;el.prepend(note)}
    $('#chatLog').appendChild(el);$('#chatLog').scrollTop=$('#chatLog').scrollHeight;
    $('#aiState').textContent='● IA RESPONDE';
  }catch(e){bot('La IA no ha respondido: '+e.message);$('#aiState').textContent='ERROR IA'}
  finally{button.disabled=false}
}

function restoreAiBackup(){
 try{const a=draftBackups;
   const item=a.find(x=>x.lang===state.lang);
   if(!item)return toast('No hay copia anterior para este lenguaje');
   if(!confirm('¿Recuperar el archivo anterior a la última propuesta IA? Se reemplazará el contenido actual.'))return;
   state.files[state.lang]=item.code;$('#code').value=item.code;updateHL();scheduleSave();scheduleAdvisor();toast('Copia local recuperada');
 }catch(e){toast('No se puede acceder a la copia de seguridad')}
}
$('#wizardBuild').onclick=()=>{
  const goal=$('#wizardGoal').value.trim(),parts=$('#wizardParts').value.trim(),constraints=$('#wizardConstraints').value.trim();
  if(goal.length<12)return toast('Describe el objetivo con al menos 12 caracteres');
  const currentHardware=lab.connections.map(c=>LAB_KINDS[c.kind]+' GPIO'+c.gpio+' '+c.voltage+'V').join(', ')||'ninguno conectado';
  const task=`QUIERO DESARROLLAR ESTE PROYECTO MAKER:
Perfil físico declarado del proyecto: ${state.physicalProfile} (no deducido del conversor USB)
Cableado declarado: ${currentHardware} (no certificado)
Wi-Fi previsto: ${$('#hwWifi').checked?'sí':'no'}
Objetivo: ${goal}
Componentes confirmados: ${parts||'No definidos; pregunta antes de inventar pines'}
Restricciones/Conexiones: ${constraints||'Por confirmar'}
Placa/FQBN del IDE: ${state.fqbn}
Lenguaje: ${state.lang}

Entrega en orden: 1) resumen funcional; 2) materiales y alimentación segura; 3) tabla de conexiones con incertidumbres; 4) librerías Arduino exactas a verificar; 5) sketch completo; 6) pruebas y diagnóstico. No inventes resultados. Si el objetivo solicita compilar o cargar, completa esas fases con el agente y los permisos autorizados; una propuesta de código no acredita carga. No propongas contraseñas reales.`;
  if(['codex','claude_code'].includes($('#aiProvider').value)){
    $('#execProvider').value=$('#aiProvider').value;
    $('#agentWorkbench').open=true;
    $('#execTask').value=task;
    $('#execTask').focus();
    toast('Proyecto preparado para el agente. Elige permisos y pulsa Ejecutar agente.');
    return;
  }
  if($('#aiProvider').value==='local'){
    bot('Para este proyecto configura Gemma/Ollama, o abre Ejecutar tarea real para usar Codex o Claude Code.');
    $('#chatInput').value=task;return;
  }
  userMsg(goal);sendCloudAgent(task);
};
// Hardware Lab 0.6: persistent diagram model, offline project safety, NO physical verification.
const LAB_STORAGE='ab-makeride-hardware-v06';
const LAB_KINDS={led:'LED + resistencia',button:'Pulsador',analog:'Sensor analogico',dht22:'DHT22',relay:'Modulo rele',servo:'Servomotor'};
const lab={connections:[],last:null};
function labSave(){lab.last=null;$('#hwResult').textContent='Conexiones modificadas: pulsa Auditar conexiones.'}
function labRender(){
 const root=$('#hwConnections');root.replaceChildren();
 lab.connections.forEach((entry,i)=>{
  const row=document.createElement('div');row.className='fieldrow';
  const kind=document.createElement('select');kind.className='selector';
  for(const [key,label] of Object.entries(LAB_KINDS)){const opt=document.createElement('option');opt.value=key;opt.textContent=label;kind.appendChild(opt)}kind.value=entry.kind;
  const pin=document.createElement('select');pin.className='selector';pin.setAttribute('aria-label','GPIO del componente '+(i+1));
  for(const n of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33,34,35,36,39]){const opt=document.createElement('option');opt.value=n;opt.textContent='GPIO '+n;pin.appendChild(opt)}pin.value=String(entry.gpio);
  const voltage=document.createElement('select');voltage.className='selector';voltage.setAttribute('aria-label','Nivel de señal '+(i+1));
  for(const n of [3.3,5,12,0]){const opt=document.createElement('option');opt.value=n;opt.textContent=n+' V';voltage.appendChild(opt)}voltage.value=String(entry.voltage);
  const del=document.createElement('button');del.className='action small danger';del.textContent='✕';del.title='Quitar conexión';
  kind.onchange=()=>{entry.kind=kind.value;labSave()};pin.onchange=()=>{entry.gpio=Number(pin.value);labSave()};voltage.onchange=()=>{entry.voltage=Number(voltage.value);labSave()};del.onclick=()=>{lab.connections.splice(i,1);labSave();labRender()};
  row.append(kind,pin,voltage,del);root.appendChild(row);
 });
 if(!lab.connections.length){const d=document.createElement('div');d.className='labnote';d.textContent='Sin componentes externos. Pantalla TFT integrada registrada en el perfil.';root.appendChild(d)}
}
function labProfileNote(){const p=$('#hwProfile').value;$('#hwProfileNote').textContent=p==='esp32-generic'?'Perfil generico: confirma los GPIO reales del fabricante.':p==='ideaspark-19'?'Perfil probado con tu IdeaSpark de la foto. TFT: MOSI23, SCLK18, CS15, DC2, RST4, BL32.':'Perfil 1,14″ provisional: comprueba tu revisión. TFT: MOSI23, SCLK18, CS15, DC2, RST4, BL32.'}
function labShow(result){const root=$('#hwResult');root.replaceChildren();let summary=document.createElement('div');summary.className=result.errors?'badline':'goodline';summary.textContent=result.errors?`${result.errors} errores · ${result.warnings} avisos · revisar antes de conectar`:`Sin conflictos bloqueantes conocidos · ${result.warnings} avisos`;root.appendChild(summary);for(const issue of result.issues){const line=document.createElement('div');line.className=issue.severity==='error'?'badline':issue.severity==='warning'?'warnline':'';line.textContent=(issue.severity==='error'?'✕ ':issue.severity==='warning'?'⚠ ':'ⓘ ')+issue.message;root.appendChild(line)}let note=document.createElement('div');note.textContent=result.disclaimer;root.appendChild(note)}
async function labCheck(display=true){const r=await request('/api/hardware/check',{profile:$('#hwProfile').value,connections:lab.connections,wifi:$('#hwWifi').checked});lab.last=r;if(display)labShow(r);return r}
$('#hwAdd').onclick=()=>{if(lab.connections.length>=32)return toast('Limite: 32 conexiones');lab.connections.push({kind:'led',gpio:13,voltage:3.3});labSave();labRender()};
$('#hwProfile').onchange=()=>{labProfileNote();labSave()};$('#hwWifi').onchange=labSave;
$('#hwCheck').onclick=async()=>{try{const r=await labCheck();toast(r.errors?'Auditoria: corrige conflictos':'Auditoria logica completada')}catch(e){toast(e.message)}};
$('#hwSketchCheck').onclick=async()=>{try{const r=await request('/api/hardware/sketch',{profile:$('#hwProfile').value,code:$('#code').value});const div=$('#hwResult');div.textContent=r.warnings.length?'Advertencias del sketch:\n'+r.warnings.join('\n'):'Los macros TFT_*/LCD_* declarados coinciden con el perfil o no se han encontrado. No implica que el cableado sea correcto.';toast('Revision del codigo completada')}catch(e){toast(e.message)}};
$('#hwApplyRotation').onclick=()=>{
 if(state.lang!=='cpp')return toast('La orientacion disponible es para C++ ST7789');
 const src=$('#code').value;const re=/\btft\.setRotation\s*\(\s*[0-3]\s*\)\s*;/g;
 if([...src.matchAll(re)].length!==1)return toast('El sketch debe contener exactamente una llamada tft.setRotation(n);');
 const next='tft.setRotation('+$('#hwRotation').value+');';
 if(!confirm('¿Cambiar la orientacion de la pantalla a '+$('#hwRotation').value+'? Conserva tu proyecto exportado antes de grabar.'))return;
 const updated=src.replace(re,next);state.files.cpp=updated;$('#code').value=updated;updateHL();scheduleSave();scheduleAdvisor();toast('Orientacion ajustada. Compila antes de grabar.');
};
labProfileNote();labRender();


// =============================================================
BoardTrials.mount({
  readContext:()=>({code:$('#code').value,lang:state.lang,fqbn:state.fqbn,port:state.port,agent_project_id:agentProjectId}),
  readBuild:async()=>{
    const id=currentJobId||localStorage.getItem('ab-makeride-last-build-v1');
    return id?request('/api/jobs/status?id='+encodeURIComponent(id)).catch(()=>({unavailable:true})):null;
  }
});
// AB MakerIDE SUPER: Codex / Claude Code tasks with user-controlled permissions.
function renderAgentAccountNote(){$('#execAccountNote').textContent=providerAccountNote($('#execProvider').value);}
$('#execProvider').addEventListener('change',()=>{renderAgentAccountNote();saveAiPreferences()});
$('#execMode').addEventListener('change',saveAiPreferences);
renderAgentAccountNote();
// This is a real external CLI job, never a simulated AI result.
// =============================================================
const AGENT_LAST='ab-makeride-last-agent-v094';
const agentRunState={id:null,last:0,active:false,lastLang:null,lastData:null,recovering:false};
function agentPermissionsView(){
  const mode=$('#execMode').value,warning=$('#execWarning');
  warning.classList.toggle('danger-warning',mode==='total');
  warning.textContent={
    consultar:'Solo análisis. No debe modificar los archivos del proyecto.',
    supervisado:'La CLI edita una copia del proyecto. Puedes abrir su código con respaldo; revisa el resultado antes de compilar.',
    autonomo:'Permite edición y herramientas de ejecución según la CLI. Podría alcanzar otros archivos o dispositivos: NO es aislamiento de sistema. Revísalo antes de activar.',
    total:'RIESGO ALTO: sin sandbox ni aprobaciones de la CLI. Puede leer o modificar archivos ajenos, borrar datos, usar la red e incluso intentar grabar placas mediante comandos. Recomendado SOLO en una máquina virtual. Exige consentimiento textual por tarea.'
  }[mode];
}
$('#execMode').onchange=agentPermissionsView;
agentPermissionsView();
// Presets fill the prompt, never launch the agent or change its permission mode.
$('#agentTaskInspect').onclick=()=>{
  $('#execTask').value=`Identifica y diagnostica la placa conectada, si es posible. FQBN seleccionado: ${state.fqbn}. Puerto seleccionado: ${state.port||'ninguno'}. Comprueba únicamente lo necesario y revisa sketch.ino. No grabes ni cambies el programa. Resume los problemas y su solución sin volcar configuraciones enteras.`;
  $('#execTask').focus();
};
$('#agentTaskPong').onclick=()=>{
  if(state.lang!=='cpp'){toast('Selecciona sketch.ino');return;}
  if(state.fqbn!=='esp32:esp32:esp32'){toast('Para Pong, selecciona ESP32 Dev Module arriba (no Arduino Uno) y confirma el puerto.');$('#quickBoard').focus();return;}
  if(!state.port){toast('Selecciona el puerto COM de tu IdeaSpark.');$('#quickPort').focus();return;}
  $('#execTask').value=`PROYECTO ESP32 IDEASPARK: Diseña un juego Pong automático para pantalla ST7789 1,9 pulgadas 170x320 (horizontal) sin sensores ni pantalla táctil. La placa del usuario que funcionó empleó MOSI=23 SCLK=18 CS=15 DC=2 RST=4 BL=32; valida primero modelo, conexiones y puerto (seleccionado: ${state.port||'sin seleccionar'}; FQBN: ${state.fqbn}) sin inventar la detección. Genera sketch completo usando Adafruit GFX y ST7789, compila realmente, y SOLO si el usuario autorizó acceso efectivo a hardware y el puerto/modelo son compatibles graba y verifica firmware. Resume separadamente código creado, compilación, grabación y pantalla NO OBSERVADA. No declares éxito visual hasta que lo confirme el usuario. Si solo generas código, indica claramente que falta la grabación.`;
  $('#agentWorkbench').open=true;$('#execTask').focus();toast('Pong preparado. Revisa placa, GPIO, permisos y autorización antes de ejecutar.');
};
$('#agentTaskBlink').onclick=()=>{
  if(!state.port){toast('Selecciona primero el puerto USB/COM en la barra superior');$('#quickPort').focus();return;}
  if(state.lang!=='cpp'){toast('Selecciona sketch.ino para la prueba Arduino');return;}
  $('#execTask').value=`PRUEBA FÍSICA SOLICITADA: En el puerto ${state.port} con FQBN elegido ${state.fqbn}, comprueba la firma real del microcontrolador y la correspondencia con el perfil antes de grabar. Guarda copia del sketch, prepara Blink del LED integrado, compila, graba con verificación del firmware y presenta un resumen corto de las evidencias, errores y pasos restantes. No afirmes haber observado visualmente el LED; no uses otros puertos, no borres archivos fuera de tu sesión, no vuelques configuraciones gigantes. Si no estás autorizado por los permisos elegidos, informa y detente.`;
  $('#execTask').focus();toast('Tarea Blink preparada. Revisa los permisos y autoriza la ejecución.');
};
async function refreshAgentCLIs(){
  try{
    const r=await request('/api/agents/status');
    $('#execStatus').textContent=`CLI Codex: ${r.installed.codex?'instalada':'no instalada'} · Claude Code: ${r.installed.claude_code?'instalada':'no instalada'}. Inicio de sesión y cuota sin comprobar. Carpeta de sesiones: ${r.workspace_base}`;
  }catch(e){$('#execStatus').textContent='No disponible: '+e.message;}
}
let mcpNames=[];
async function refreshMCP(){
 try{const r=await request('/api/mcp/status');mcpNames=r.servers.map(s=>s.name);$('#mcpStatus').textContent=mcpNames.length?'Configurados: '+r.servers.map(s=>s.name+' ('+s.transport+')').join(', ')+'. Conexión aún no comprobada.':'Sin MCP configurados en MakerIDE.';}
 catch(e){mcpNames=[];$('#mcpStatus').textContent=e.message;}
}
$('#mcpRefresh').onclick=refreshMCP;
$('#mcpPanel').addEventListener('toggle',()=>{if($('#mcpPanel').open)refreshMCP()});
$('#mcpSave').onclick=async()=>{
 try{if(state.agentWorking)return toast('Espera a que termine el agente');const value=JSON.parse($('#mcpConfig').value);await request('/api/mcp/config',value);$('#mcpConfig').value='';await refreshMCP();toast('Configuración MCP guardada; no se ha conectado ningún servidor.');}
 catch(e){toast(e instanceof SyntaxError?'JSON MCP no válido':e.message);}
};
$('#agentWorkbench').addEventListener('toggle',()=>{if($('#agentWorkbench').open)refreshAgentCLIs()});
let lastAgentId='';
function rememberAgent(id){lastAgentId=id||'';}
function reportAgentOutcome(r){
  const agent=r.provider==='codex'?'Codex':r.provider==='claude_code'?'Claude Code':'El agente';
  if(r.imported)return 'Proyecto importado por el usuario. No se ha ejecutado un agente ni grabado hardware.';
  if(r.legacy)return 'Archivo de una versión anterior recuperado. NO existe registro fiable de compilación ni grabación; revisa el código antes de importarlo.';
  if(r.interrupted || r.outcome==='unknown_after_restart')return 'Servidor cerrado durante la tarea · ESTADO DEL HARDWARE DESCONOCIDO. No repitas grabación sin diagnosticar.';
  if(r.active)return 'Agente trabajando. Puedes cerrar esta pestaña; la sesión se podrá consultar al volver.';
  if(r.outcome==='upload_pending')return 'Carga solicitada pendiente: no consta grabación verificada. La tarea sigue incompleta. '+(r.error||'');
  if(r.outcome==='target_mismatch')return 'Destino incorrecto: el agente creó una ventana de PC sin autorización. El proyecto de la pantalla física sigue pendiente. '+(r.error||'');
  if(r.mode==='consultar'&&r.success)return 'Consulta completada. No se solicitó grabar firmware.';
  if(!r.success)return 'Tarea fallida o cancelada. No se confirma firmware instalado.';
  if(r.outcome==='flash_reported_verified')return 'El registro declara firmware verificado. Falta comprobar en la pantalla que ejecuta el proyecto solicitado.';
  if(r.outcome==='compiled_only')return agent+' terminó y hay evidencia de compilación, pero NO consta grabación verificada.';
  return agent+' terminó; NO consta compilación o grabación verificadas. Revisa los archivos creados y continúa la tarea.';
}
async function recoverAgentSession(silent=false){
  if(agentRunState.active)return;
  const stored=lastAgentId;
  try{
    const list=await request('/api/agents/history');
    const recent=(list.recent||[]);
    const picked=recent.find(x=>x.active)||(!silent?recent[0]:null)||recent.find(x=>x.job_id===stored)||(stored?{job_id:stored}:null);
    if(!picked){if(!silent)toast('No hay sesiones guardadas en este servidor');return;}
    agentRunState.id=picked.job_id;agentRunState.last=0;
    agentRunState.lastLang=state.lang;
    rememberAgent(picked.job_id);
    resetAgentStages();
    $('#agentWorkbench').open=true;
    document.body.dataset.right='ai';
    const r=await request('/api/agents/poll?id='+encodeURIComponent(picked.job_id)+'&since=0');
    agentRunState.last=r.last_id;
    for(const e of r.events)appendAgentEvent(e);
    updateAgentStages(r);
    agentRunState.lastData=r;
    RobotActivity.report('agent','Agente CLI',{...r,evidenceVerified:Boolean(r.response||r.events?.length||r.diff)});
    agentRunState.lastLang=r.file_name==='main.py'?'py':'cpp';
    agentSetWorking(r.active);
    $('#execStatus').textContent=`Sesión recuperada: ${r.provider} · ${r.mode} · ${r.elapsed}s`;
    $('#agentResumeMessage').textContent=reportAgentOutcome(r);
    $('#agentContinue').disabled=r.active;
    if(r.active){pollAgent();}
    else{agentRunState.id=null;showAgentResult(r);}
    if(!silent)toast('Sesión recuperada desde el servidor local');
  }catch(e){if(!silent)toast('No se pudo recuperar la sesión: '+e.message)}
}
$('#agentTaskRadar').onclick=()=>loadDeviceExample('radar');
$('#agentTaskCYD').onclick=()=>loadDeviceExample('cyd');
$('#agentRecover').onclick=()=>recoverAgentSession(false);
$('#agentContinue').onclick=()=>{
  const prev=agentRunState.lastData;
  if(!prev || prev.active)return;
  rememberAgentProject(prev.job_id);
  const gap=prev.outcome==='flash_reported_verified'
    ? 'El grabador informó de verificación; no se ha comprobado visualmente la pantalla. Solicita una prueba visual al usuario y diagnostica pantalla, rotación y luz de fondo si sigue negra.'
    : 'No consta una grabación verificada en el informe o la tarea se interrumpió. Comprueba primero el estado actual del hardware y las salidas anteriores sin borrar ni grabar a ciegas.';
  $('#execTask').value=`CONTINUAR PROYECTO PREVIO. Solicitud original resumida: ${prev.task_summary||'(no disponible)'}\nResultado registrado: ${reportAgentOutcome(prev)}\n${gap}\nNo des por terminado un juego solo porque finalizó la CLI. Verifica primero placa, GPIO, compilación y grabación; si falta una fase, completa únicamente lo que autorice el usuario. No repitas grabación si el estado de hardware es desconocido hasta diagnosticar.`;
  $('#execTask').focus();toast('Continuación preparada. Revisa y autoriza de nuevo su ejecución.');
};
function agentSetWorking(working){
  state.agentWorking=working;busy(state.busy);syncSerialControls();
  agentRunState.active=working;
  $('#execRun').disabled=working;
  $('#execStop').disabled=!working;
  $('#execProvider').disabled=working;
  $('#execMode').disabled=working;
  $('#execHardware').disabled=working;$('#execAllowPC').disabled=working;
  $('#execUseMCP').disabled=working;$('#mcpSave').disabled=working;
}
function resetAgentStages(){
  $('#agentStages').classList.remove('hidden');
  $('#agentRawLog').textContent='';$('#agentEventCount').textContent='0 eventos';
  agentRunState.eventCount=0;agentRunState.evidence={};
  $$('[data-evidence]').forEach(el=>{el.classList.remove('observed');el.querySelector('.stage-icon').textContent='○';el.querySelector('small').textContent='Sin evidencia todavía'});
}
function updateAgentStages(data){
  $('#agentStageElapsed').textContent=(data.elapsed||0).toFixed(1)+' s';
  const evidence=data.evidence||{};
  for(const [key,yes] of Object.entries(evidence)){
    const el=$('[data-evidence="'+key+'"]');if(!el)continue;
    el.classList.toggle('observed',yes===true);
    el.querySelector('.stage-icon').textContent=yes===true?'✓':'○';
    el.querySelector('small').textContent=yes===true?'Observado en registro':(data.active?'Esperando evidencia':'No consta');
  }
}
function appendAgentEvent(ev){
  agentRunState.eventCount=(agentRunState.eventCount||0)+1;
  $('#agentEventCount').textContent=agentRunState.eventCount+' eventos vistos';
  const pre=$('#agentRawLog');
  // Append bounded text only. The raw log never executes HTML.
  pre.textContent=(pre.textContent+'['+(ev.kind||'log')+'] '+ev.text+'\n').slice(-85000);
  if(ev.kind==='milestone')showLog('console','[Agente] '+ev.text,'good');
}
$('#agentAutoOpen').onchange=saveAiPreferences;
async function openAgentCode(data,automatic=false){
  if(typeof data.modified_code!=='string'||!data.diff)return false;
  const lang=data.file_name==='main.py'?'py':'cpp';
  if(state.lang!==lang||storageConflict)return false;
  const current=$('#code').value;
  if(automatic){
    if(!$('#agentAutoOpen').checked||data.success!==true||data.cancelled||data.interrupted||data.legacy||agentProjectId===data.job_id||!window.crypto?.subtle)return false;
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(current));
    const sha=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
    if(sha!==data.before_sha256||$('#code').value!==current||state.lang!==lang)return false;
  }else if(!confirm('¿Abrir el código generado en el editor? Se guardará una copia del código actual; revisa las diferencias.'))return false;
  try{
    const list=draftBackups;
    if(!Array.isArray(list))throw Error('Copia dañada');
    list.unshift({date:new Date().toISOString(),lang,code:current,job_id:data.job_id});
    draftBackups=list.slice(0,7);
  }catch(_e){toast('No se pudo guardar la copia anterior; exporta el proyecto antes de abrir la propuesta.');return false;}
  state.files[lang]=data.modified_code;$('#code').value=data.modified_code;
  if(data.hardware_profile)setPhysicalProfile(data.hardware_profile);
  rememberAgentProject(data.job_id);RobotActivity.invalidate('build');
  updateHL();updateCaret();save();scheduleAdvisor();refreshSketchTargetNotice();
  showLog('console','Código del agente abierto en el editor; copia anterior guardada. Guarda el proyecto ZIP para conservar los archivos auxiliares.','note');
  toast('Código del agente abierto · copia anterior guardada');
  return true;
}
async function rememberCompletedProject(data){
  if(data.success!==true||data.active||data.cancelled||data.interrupted||storageConflict||!window.crypto?.subtle)return;
  if((data.file_name==='main.py'?'py':'cpp')!==state.lang)return;
  const current=$('#code').value;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(current));
  const sha=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  if($('#code').value===current&&(sha===data.before_sha256||current===data.modified_code)){
    if(agentProjectId!==data.job_id)RobotActivity.invalidate('build');
    rememberAgentProject(data.job_id);
  }
}
async function saveAgentProject(data){
  try{
    const current=data.current_draft||agentProjectId===data.job_id;
    const response=await fetch('/api/agents/project/export',{method:'POST',headers:{'Content-Type':'application/json','X-AB-Session':await sessionToken()},body:JSON.stringify({job_id:data.job_id,...(current?{code:$('#code').value}:{})})});
    if(!response.ok){const error=await response.json();throw Error(error.error||'No se pudo guardar el proyecto')}
    const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='MakerIDE-'+data.job_id.slice(0,8)+'.zip';
    document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    if(current){state.files[state.lang]=$('#code').value;lastExport=draftSnapshot();save()}
    toast('Descarga del proyecto solicitada con código y auxiliares');
  }catch(e){toast('No se pudo guardar: '+e.message)}
}
$('#agentOpenCode').onclick=()=>{if(agentRunState.lastData)openAgentCode(agentRunState.lastData)};
$('#agentSaveProject').onclick=()=>{if(agentRunState.lastData)saveAgentProject(agentRunState.lastData)};
function showAgentResult(data){
  $('#agentOpenCode').disabled=typeof data.modified_code!=='string'||!data.diff;
  $('#agentSaveProject').disabled=data.active===true;
  const el=document.createElement('div');el.className='msg bot';
  const text=document.createElement('div');
  text.textContent=reportAgentOutcome(data)+'\n'+(data.error||'')+
    `\nTiempo: ${data.elapsed}s · Modo: ${data.mode}\n`+
    (data.response||'(La CLI no devolvió texto.)');
  el.appendChild(text);
  const saveProject=document.createElement('button');saveProject.className='action small';
  saveProject.textContent='Guardar proyecto del agente (.zip)';saveProject.onclick=()=>saveAgentProject(data);el.appendChild(saveProject);
  if(typeof data.modified_code==='string'){
    const saveSketch=document.createElement('button');saveSketch.className='action small ghost';
    saveSketch.textContent='Guardar solo sketch';
    saveSketch.onclick=()=>download(data.file_name||'sketch.ino',data.modified_code,'text/plain;charset=utf-8');
    el.appendChild(saveSketch);
  }
  if(data.diff){
    const details=document.createElement('details');details.className='agent-raw';
    const head=document.createElement('summary');head.textContent='Ver diferencias con el código anterior';details.appendChild(head);
    const diff=document.createElement('pre');diff.className='agent-diff';diff.textContent=data.diff;details.appendChild(diff);el.appendChild(details);
  }
  if(data.changed_files&&data.changed_files.length){
    const more=document.createElement('div');
    more.textContent='Otros archivos creados o existentes en la sesión: '+data.changed_files.join(', ')+
      '. «Guardar proyecto» incluye los archivos auxiliares; las próximas tareas conservan la copia al continuar el proyecto.';
    el.appendChild(more);
  }
  if(data.modified_code!==null&&typeof data.modified_code==='string'&&data.diff){
    const btn=document.createElement('button');btn.className='action small primary';
    btn.textContent='Abrir código en el editor';btn.title='Guarda una copia del código actual antes de abrir la propuesta';
    btn.onclick=async()=>{if(await openAgentCode(data))btn.disabled=true;};
    el.appendChild(btn);
    if(data.outcome!=='target_mismatch')openAgentCode(data,true).then(opened=>{if(opened)btn.textContent='Código abierto · copia anterior guardada';return rememberCompletedProject(data)});
  }
  else rememberCompletedProject(data);
  $('#chatLog').appendChild(el);$('#chatLog').scrollTop=$('#chatLog').scrollHeight;
}
async function pollAgent(){
  if(!agentRunState.id)return;
  try{
    const r=await request('/api/agents/poll?id='+encodeURIComponent(agentRunState.id)+'&since='+agentRunState.last);
    RobotActivity.report('agent','Agente CLI',{...r,evidenceVerified:Boolean(r.response||r.events?.length||r.diff)});
    agentRunState.last=r.last_id;
    for(const e of r.events)appendAgentEvent(e);
    updateAgentStages(r);
    $('#execStatus').textContent=`${r.provider} · ${r.mode} · ${r.elapsed}s · ${r.active?'ejecutando':'finalizado'}`;
    if(r.active){setTimeout(pollAgent,900);return;}
    agentSetWorking(false);agentRunState.id=null;
    agentRunState.lastData=r;
    $('#agentResumeMessage').textContent=reportAgentOutcome(r);
    $('#agentContinue').disabled=false;
    showAgentResult(r);
    toast(reportAgentOutcome(r));
  }catch(e){
    RobotActivity.lost('agent','Agente CLI',e.message);
    $('#execStatus').textContent='No se pudo consultar el agente: '+e.message;
    // A transient connection error must not erase the job ID: allow recovery.
    agentSetWorking(false);agentRunState.id=null;
    $('#agentResumeMessage').textContent='Conexión interrumpida. Recupera la sesión antes de repetir la tarea.';
  }
}
const agentConsentDialog=$('#agentConsentDialog');
$('#agentConsentCancel').onclick=()=>agentConsentDialog.close('cancel');
$('#agentConsentInput').addEventListener('input',()=>{
  $('#agentConsentApprove').disabled=$('#agentConsentInput').required&&$('#agentConsentInput').value!=='ACCESO TOTAL';
});
function authorizeAgent(provider,mode,task){
  if(agentConsentDialog.open)return Promise.resolve(null);
  const total=mode==='total',input=$('#agentConsentInput');
  $('#agentConsentSummary').textContent=`${provider==='codex'?'Codex':'Claude Code'} · ${$('#execMode').selectedOptions[0].textContent}. ${$('#agentAutoOpen').checked?'El código generado se abrirá con respaldo si no has editado el original.':'Revisarás el código antes de abrirlo en el editor.'}`;
  $('#agentConsentTask').textContent=task;
  if($('#execUseMCP').checked)$('#agentConsentSummary').textContent+=' MCP adicionales: '+mcpNames.join(', ')+'. Autorizas sus herramientas durante esta tarea sin otra aprobación interactiva de la CLI; pueden actuar fuera de la carpeta del proyecto.';
  $('#agentConsentGroup').classList.toggle('hidden',!total);
  $('#agentConsentRisk').classList.toggle('hidden',!total);
  input.value='';input.required=total;
  $('#agentConsentApprove').disabled=total;
  agentConsentDialog.returnValue='cancel';
  return new Promise(resolve=>{
    agentConsentDialog.addEventListener('close',()=>{
      const consent=agentConsentDialog.returnValue==='authorize'?input.value:null;
      input.value='';
      resolve(consent);
    },{once:true});
    agentConsentDialog.showModal();
    (total?input:$('#agentConsentCancel')).focus();
  });
}
$('#execRun').onclick=async()=>{
  if($('#execRun').disabled||agentConsentDialog.open)return;
  if(state.busy)return toast('Espera a que termine la operación actual');
  if(boardIdentity.running)return toast('Espera a que termine la identificación de la placa');
  const task=$('#execTask').value.trim(),provider=$('#execProvider').value,mode=$('#execMode').value;
  if(task.length<3)return toast('Describe primero la tarea del agente');
  if(!state.apiReady)return toast('Conecta el servidor local antes de iniciar el agente');
  if($('#execUseMCP').checked){
   if(!['autonomo','total'].includes(mode))return toast('Para usar MCP adicionales elige Autónomo o Acceso total.');
   await refreshMCP();if(!mcpNames.length)return toast('Configura primero los servidores MCP en su panel.');
  }
  if(state.physicalProfile==='board-unspecified'&&(state.fqbn==='esp32:esp32:jczn_2432s028r'||/\b(?:CYD|ESP32[- ]2432S028R)\b/i.test(task)))setPhysicalProfile('esp32-cyd-28');
  const consent=await authorizeAgent(provider,mode,task);
  if(consent===null){$('#execStatus').textContent='Ejecución cancelada. El agente no se ha iniciado.';return;}
  if(mode==='total'&&consent!=='ACCESO TOTAL')return toast('Acceso total no autorizado');
  if(mode!=='consultar'&&state.port){
   try{
    const monitor=await request('/api/serial/poll?since='+state.serialId);
    if(monitor.connected&&monitor.port===state.port){
     await request('/api/serial/stop',{});state.serialConnected=false;syncSerialControls();
     showLog('console','Monitor serie del IDE pausado para liberar el puerto de la tarea.','note');
    }
   }catch(e){toast('No se pudo comprobar el puerto antes de iniciar: '+e.message);return;}
  }
  saveAiPreferences();
  state.files[state.lang]=$('#code').value;
  save(); // Estado visual del borrador; el código no se persiste en el navegador.
  agentSetWorking(true);resetAgentStages();switchPane('console');
  RobotActivity.begin('agent','Agente CLI');
  $('#execStatus').textContent='Preparando copia de proyecto y arrancando CLI real…';
  try{
    const r=await request('/api/agents/start',{
      provider,mode,prompt:task,code:state.files[state.lang],lang:state.lang,fqbn:state.fqbn,
      confirm:true,full_consent:consent,port:state.port||'',
      parent_job_id:agentProjectId,
      hardware_profile:$('#execHardware').value,allow_pc_ui:$('#execAllowPC').checked,
      use_mcp:$('#execUseMCP').checked,
    });
    if(r.hardware_profile)setPhysicalProfile(r.hardware_profile);
    agentRunState.id=r.job_id;agentRunState.last=0;agentRunState.lastLang=state.lang;
    rememberAgent(r.job_id);$('#agentResumeMessage').textContent='Trabajo iniciado. Puedes recuperar esta sesión si cierras la pestaña.';
    showLog('console',`[Agente] Iniciada sesión ${provider}; modo ${mode}; workspace ${r.workspace}`,'cmd');
    pollAgent();
  }catch(e){RobotActivity.lost('agent','Agente CLI',e.message);agentSetWorking(false);$('#execStatus').textContent=e.message;toast(e.message)}
};
$('#execStop').onclick=async()=>{
  if(!agentRunState.id)return;
  try{await request('/api/agents/cancel',{job_id:agentRunState.id});$('#execStatus').textContent='Solicitando detención del proceso…';}
  catch(e){toast(e.message)}
};
// Prefill agent task from the project wizard or chat without starting actions.
$('#execTask').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){$('#execRun').click()}});

function init(){cleanTaskInputs();document.body.dataset.right='ai';setLang(state.lang);updateHardwareLabVisibility();renderSidebar();showLog('console','AB MakerIDE v1.0.0-rc.3 SUPER · by MS Robotika','good');showLog('console','Modo de prueba: compilación/subida reales cuando estén las herramientas y la placa.','note');showLog('console','La simulación no ejecuta firmware. Codex puede grabar con tu permiso: exige evidencia real.','note');refreshAll();save();scheduleAdvisor();if(innerWidth<=520){$('#sidebar').classList.add('mobileclosed');$$('.rail button').forEach(b=>b.addEventListener('click',()=>$('#sidebar').classList.toggle('mobileclosed')))}}init();initAi();
})();
