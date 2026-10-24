(()=>{'use strict';
const DEFAULT_CPP='/*\n  AB MakerIDE - MS Robotika\n  Prueba minima para Arduino Uno R3\n  Sin sensores ni librerias externas\n  LED integrado: D13 (LED_BUILTIN)\n*/\n\nconst byte LED = LED_BUILTIN;\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  Serial.begin(9600);\n  Serial.println("AB MakerIDE - Arduino Uno listo");\n}\n\nvoid loop() {\n  digitalWrite(LED, HIGH);\n  Serial.println("LED encendido");\n  delay(500);\n\n  digitalWrite(LED, LOW);\n  Serial.println("LED apagado");\n  delay(500);\n}\n';
const DEFAULT_PY=`# AB MakerIDE · MS Robotika — MicroPython ESP32\n# Ejemplo LED GPIO2 (comprueba tu placa)\nfrom machine import Pin\nimport time\n\nled = Pin(2, Pin.OUT)\nprint("AB MakerIDE listo")\n\nwhile True:\n    led.on()\n    print("LED ON")\n    time.sleep_ms(500)\n    led.off()\n    print("LED OFF")\n    time.sleep_ms(500)\n`;
const SAVEKEY='ab-makeride-project-v2'; // Compatible con proyectos v0.5 y anteriores
const UI_STORAGE='ab-makeride-layout-v092';
const BOARD_PROFILES_KEY='ab-makeride-verified-board-assignments-v095';
const MIGRATION_BACKUP='ab-makeride-backup-antes-v09';
try{const project=localStorage.getItem(SAVEKEY);if(project&&!localStorage.getItem(MIGRATION_BACKUP))localStorage.setItem(MIGRATION_BACKUP,project)}catch(_e){/* La exportacion JSON sigue disponible */}
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const escapeHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let recoveryStorageError=false;
const state={lang:'cpp',files:{cpp:DEFAULT_CPP,py:DEFAULT_PY},name:'mi-proyecto',fqbn:'arduino:avr:uno',port:'',baud:9600,uploadSpeed:115200,retrySlow:false,panel:'project',pane:'console',ports:[],choices:[],catalogOk:false,catalogError:'',catalogWarning:'',catalogSource:'',catalogCount:0,tools:{},serialId:0,serialConnected:false,simRunning:false,simTimer:null,apiReady:false,busy:false,dirty:false,sidebarOpened:true};
try{const old=JSON.parse(localStorage.getItem(SAVEKEY)||'null');if(old&&old.files&&typeof old.files.cpp==='string'&&typeof old.files.py==='string'){state.files={cpp:old.files.cpp,py:old.files.py};state.lang=old.lang==='py'?'py':'cpp';state.name=typeof old.name==='string'?old.name.slice(0,60):state.name;state.fqbn=typeof old.fqbn==='string'?old.fqbn:state.fqbn;state.port=/^COM\d+$/i.test(old.port||'')?old.port.toUpperCase():'';state.baud=Number(old.baud)||115200;state.uploadSpeed=[115200,230400,460800,921600].includes(Number(old.uploadSpeed))?Number(old.uploadSpeed):115200;state.retrySlow=old.retrySlow===true;}else if(old){recoveryStorageError=true;}}catch(e){recoveryStorageError=true;console.warn('No se pudo recuperar el proyecto',e)}
let toasts;
function toast(msg){const e=$('#toast');e.textContent=msg;e.classList.add('show');clearTimeout(toasts);toasts=setTimeout(()=>e.classList.remove('show'),2700)}
let storageConflict=recoveryStorageError;
function save(){if(storageConflict){$('#footSave').textContent='Guardado pausado: exporta tu copia antes de recargar';return;}try{localStorage.setItem(SAVEKEY,JSON.stringify({files:state.files,lang:state.lang,name:state.name,fqbn:state.fqbn,port:state.port,baud:state.baud,uploadSpeed:state.uploadSpeed,retrySlow:state.retrySlow}));state.dirty=false;$('#footSave').textContent='✓ Guardado local';}catch(e){$('#footSave').textContent='Error al guardar';toast('No se pudo guardar en este navegador')}}
window.addEventListener('pagehide',()=>{clearTimeout(saveDelay);state.files[state.lang]=$('#code').value;save()});
window.addEventListener('storage',e=>{if(e.key===SAVEKEY&&e.newValue){storageConflict=true;clearTimeout(saveDelay);$('#footSave').textContent='Otra pestaña cambió el proyecto: exporta esta copia antes de recargar';toast('Guardado pausado para evitar sobrescribir otra pestaña. Exporta tu copia.')}});
let saveDelay;function scheduleSave(){state.dirty=true;$('#footSave').textContent='● Cambios pendientes';clearTimeout(saveDelay);saveDelay=setTimeout(save,550)}
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
$('#code').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const t=e.currentTarget,a=t.selectionStart,b=t.selectionEnd;t.setRangeText('  ',a,b,'end');t.dispatchEvent(new Event('input'))}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();toast('Proyecto guardado en el navegador')}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();verify()}});
$$('[data-lang]').forEach(x=>x.addEventListener('click',()=>setLang(x.dataset.lang)));
$$('[data-pane]').forEach(x=>x.addEventListener('click',()=>switchPane(x.dataset.pane)));
$('#clearBtn').addEventListener('click',()=>$('#pane-'+state.pane).replaceChildren());
function download(filename,text){const blob=new Blob([text],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),800)}
function exportProject(){state.files[state.lang]=$('#code').value;const obj={format:'ab-makeride-v1',name:state.name,lang:state.lang,fqbn:state.fqbn,files:{'sketch.ino':state.files.cpp,'main.py':state.files.py},exported_at:new Date().toISOString()};download((state.name.replace(/[^a-z0-9-]/gi,'_')||'proyecto')+'.abmaker.json',JSON.stringify(obj,null,2));toast('Proyecto exportado a JSON')}
function importProject(file){file.text().then(txt=>{const obj=JSON.parse(txt);if(obj.format!=='ab-makeride-v1'||!obj.files||typeof obj.files['sketch.ino']!=='string'||typeof obj.files['main.py']!=='string')throw Error('Formato de proyecto no compatible');if(obj.files['sketch.ino'].length>300000||obj.files['main.py'].length>300000)throw Error('Archivos demasiado grandes');if(!confirm('¿Reemplazar los dos archivos actuales? Exporta antes si quieres conservarlos.'))return;state.files.cpp=obj.files['sketch.ino'];state.files.py=obj.files['main.py'];state.name=String(obj.name||'proyecto').slice(0,60);state.fqbn=String(obj.fqbn||state.fqbn);setLang(obj.lang==='py'?'py':'cpp',false);$('#code').value=state.files[state.lang];updateHL();save();renderSidebar();toast('Proyecto importado')}).catch(e=>toast('No se pudo importar: '+e.message));}
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
function busy(v){state.busy=v;$('#verifyBtn').disabled=v;$('#uploadBtn').disabled=v;}
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
 if(persist){try{localStorage.setItem(UI_STORAGE,JSON.stringify({terminalHeight,sidebarOpen:!$('#sidebar').classList.contains('is-collapsed')}))}catch(_e){}}
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
function setSidebar(open,persist=true){$('#sidebar').classList.toggle('is-collapsed',!open);if(persist)try{localStorage.setItem(UI_STORAGE,JSON.stringify({terminalHeight,sidebarOpen:open}))}catch(_e){}}
function refreshDeviceHint(){
 refreshSketchTargetNotice();
 const label=$('#deviceHint'),p=state.ports.find(x=>x.port===state.port);
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
 try{const before=$('#code').value;localStorage.setItem('ab-makeride-before-target-template',JSON.stringify({date:new Date().toISOString(),code:before}));}
 catch(_e){toast('No se pudo crear copia en el navegador. Exporta el proyecto antes de reemplazarlo.');return}
 const code=`// AB MakerIDE · MS Robotika\n// Sketch básico para ${state.fqbn}\n// No presupone pines ni periféricos.\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  delay(1000);\n}\n`;
 state.files.cpp=code;$('#code').value=code;updateHL();updateCaret();scheduleSave();scheduleAdvisor();refreshSketchTargetNotice();toast('Sketch básico preparado. Compila antes de grabar.');
};
$('#quickHelp').onclick=()=>$('#quickStart').showModal();
$('#quickStartClose').onclick=()=>$('#quickStart').close();
$('#quickBoardFocus').onclick=()=>{$('#quickStart').close();$('#quickBoard').focus()};
try{const pref=JSON.parse(localStorage.getItem(UI_STORAGE)||'null');if(pref){normalTerminalHeight=Number.isFinite(pref.terminalHeight)?pref.terminalHeight:165;setSidebar(pref.sidebarOpen===true,false)}}catch(_e){}
requestAnimationFrame(()=>resizeTerminal(normalTerminalHeight,false));
// Asociación explícita de FQBN al dispositivo: USB CH340 no equivale a Arduino Uno.
let boardProfiles={};
try{const prev=JSON.parse(localStorage.getItem(BOARD_PROFILES_KEY)||'{}');if(prev&&typeof prev==='object'&&!Array.isArray(prev))boardProfiles=prev}catch(_e){}
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
 try{localStorage.setItem(BOARD_PROFILES_KEY,JSON.stringify(boardProfiles))}catch(_e){}
}
function applyBoardChoice(fqbn,remember=true){
 if(!state.choices.some(b=>b.fqbn===fqbn))return toast('Instala primero el núcleo de esa placa');
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
 board.replaceChildren();port.replaceChildren();
 const curated=state.choices.filter(p=>p.fqbn===state.fqbn || state.ports.some(d=>(d.boards||[]).some(x=>x.fqbn===p.fqbn))).slice(0,8);
 for(const p of curated)board.add(new Option(p.name,p.fqbn));
 if(!curated.some(p=>p.fqbn===state.fqbn))board.add(new Option(state.fqbn+' · verificar selección',state.fqbn));
 board.add(new Option('⌕ Buscar cualquier placa…','__search__'));
 board.value=state.fqbn;
 port.add(new Option(state.ports.length?'Seleccionar puerto COM':'Sin puertos COM detectados',''));
 for(const p of state.ports){const isCH340=/^(?:0x)?1a86$/i.test(String(p.vid||''))&&/^(?:0x)?7523$/i.test(String(p.pid||''));const description=isCH340?'USB CH340 · modelo a elegir':String(p.name||'Dispositivo serie').slice(0,35);port.add(new Option(p.port+' · '+description,p.port))}
 port.value=state.port;
 if(state.port&&!state.ports.some(p=>p.port===state.port)){port.add(new Option(state.port+' · desconectado / sin verificar',state.port));port.value=state.port;}
}
$('#quickBoard').addEventListener('change',e=>{if(e.target.value==='__search__'){refreshQuickSelectors();openCatalog()}else applyBoardChoice(e.target.value)});
$('#quickPort').addEventListener('change',e=>applyPortChoice(e.target.value));
$('#quickScan').addEventListener('click',async()=>{const btn=$('#quickScan');btn.disabled=true;try{const scanned=await scan();if(scanned.scan_ok===false){toast('Detección incompleta: revisa el aviso');return;}if(!state.ports.length){showLog('console','No hay puertos COM detectados: comprueba cable USB de DATOS, controlador CH340/ATmega16U2 y Administrador de dispositivos. El IDE no inventa puertos.','bad');switchPane('console');toast('Sin puertos detectados. Revisa USB/driver.')}else toast(state.ports.length+' puerto(s) COM real(es) detectado(s)')}catch(e){showLog('console',e.message,'bad');toast('Error en detección: '+e.message)}finally{btn.disabled=false}});
const openRight=(mode)=>{document.body.dataset.right=document.body.dataset.right===mode?'none':mode;if(mode==='lab')$('#hardwareLab').open=true;};
$('#showAI').onclick=()=>openRight('ai');$('#showSim').onclick=()=>{openRight('sim');$('#extraTools').open=false};$('#showLab').onclick=()=>{openRight('lab');$('#extraTools').open=false};$('#rightClose').onclick=()=>{document.body.dataset.right='none'};
function checkSelection(requirePort){if(!state.apiReady){toast('Servidor desconectado. Inicia server.py');return false}if(requirePort&&!state.port){toast('Selecciona el puerto USB en la barra superior');$('#quickPort').focus();return false}if(state.lang==='cpp'&&!state.fqbn){toast('Selecciona una placa/FQBN');return false}return true}
let currentJobId=null, lastJobLine=0;
async function updateBuildVisual(d){
  d={...d,success:d.success===true&&d.exit_code===0&&!d.cancelled&&!d.interrupted&&!d.error};
  if(!d.active&&d.success&&d.source_sha256){
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode($('#code').value));
   const sha=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
   d.stale=sha!==d.source_sha256||state.fqbn!==d.fqbn||state.lang!=='cpp';
  }
  RobotActivity.report('build',(d.action==='upload'?'Compilar y grabar':'Compilación')+(d.fqbn?' · '+d.fqbn:''),d);
  const panel=$('#buildProgress');panel.classList.remove('hidden');
  $('#buildStage').textContent=({'compilación':'Compilación Arduino CLI · en curso', 'grabación':'Grabando en el dispositivo real', 'reintento 115200':'Recuperación USB a 115200 baudios', 'completado':'Operación finalizada', 'error':'Operación fallida', 'cancelado':'Operación cancelada'})[d.stage]||'Preparando operación';
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
    const started=await request('/api/jobs/start',{request_id:requestId,action,lang:'cpp',fqbn:state.fqbn,code:state.files.cpp,port:state.port,upload_speed:state.uploadSpeed,retry_slow:state.retrySlow,confirm:action==='upload'});
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
  if(state.lang==='cpp')return runCppJob('compile');
  if(state.busy||!checkSelection(false))return;
  RobotActivity.begin('syntax','Sintaxis Python');
  busy(true);switchPane('console');
  try{const d=await request('/api/verify',{lang:'py',code:state.files.py});RobotActivity.report('syntax','Sintaxis Python',{success:d.ok,verified:d.ok&&d.mode==='syntax_only'});showOutput('console',d.output);toast(d.ok?'Sintaxis correcta':'Error de sintaxis');if(!d.ok){switchPane('problems');showOutput('problems',d.output)}}catch(e){RobotActivity.lost('syntax','Sintaxis Python',e.message);toast(e.message)}finally{busy(false)}
}
async function upload(){
  if(state.lang==='cpp')return runCppJob('upload');
  if(state.busy||!checkSelection(true))return;
  if(!confirm(`SOBRESCRIBIR main.py REAL en ${state.port}. ¿Confirmas?`))return;
  busy(true);switchPane('console');
  RobotActivity.begin('micropython','Guardar MicroPython');
  try{const d=await request('/api/upload',{confirm:true,port:state.port,fqbn:state.fqbn,code:state.files.py,lang:'py'});RobotActivity.report('micropython','Guardar MicroPython',{...d,success:d.ok});showOutput('console',d.output);toast(d.ok?'MicroPython desplegado':'No se confirmó el despliegue')}catch(e){RobotActivity.lost('micropython','Guardar MicroPython',e.message);showLog('console',e.message,'bad')}finally{busy(false);refreshSerial()}
}
$('#verifyBtn').addEventListener('click',verify);$('#uploadBtn').addEventListener('click',upload);
async function scan({force=false,quiet=false}={}){
 /* Nunca sobreescribir automáticamente el FQBN elegido por el usuario sin un perfil previamente confirmado. */
 let d;
 try{d=await request('/api/boards?selected='+encodeURIComponent(state.fqbn)+(force?'&refresh=1':''));}
 catch(e){$('#scanNotice').textContent='No se pudo detectar hardware: '+e.message+'. Se conserva la selección; presencia sin verificar.';$('#scanNotice').classList.remove('hidden');throw e;}
 const ports=d.ports||[],choices=d.choices||[];
 const oldSelected=state.choices.find(b=>b.fqbn===state.fqbn);
 if(oldSelected&&!choices.some(b=>b.fqbn===state.fqbn))choices.push(oldSelected);
 const oldFingerprint=JSON.stringify(state.ports.map(p=>[p.port,p.vid,p.pid,p.serial_number,p.boards]));
 const newFingerprint=JSON.stringify(ports.map(p=>[p.port,p.vid,p.pid,p.serial_number,p.boards]));
 const updated=force||oldFingerprint!==newFingerprint||state.choices.length!==choices.length;
 state.ports=ports;state.choices=choices;state.catalogOk=d.catalog_ok===true;state.catalogError=d.catalog_error||'';state.catalogWarning=d.catalog_warning||'';state.catalogSource=d.catalog_source||'';state.catalogCount=d.catalog_count||0;
 // Keep a disconnected manual port as a reference, never as evidence of presence.
 if(!state.port&&ports.length===1){
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
  badge.textContent='🧩 Analizando cabeceras...';
  try{
    const data=await request('/api/advisor/check',{code:$('#code').value,fqbn:state.fqbn,diagnostics:latestCompilerError});
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
<div class="fieldrow" style="margin:7px 0"><button class="action small" id="exportBtn">Exportar</button><button class="action small" id="importBtn">Importar</button></div>
<details style="margin-top:12px"><summary class="hint" style="cursor:pointer">Recuperación (opcional)</summary><button class="action small ghost" id="restoreMigrationBackup" style="margin:9px 0;width:100%">Recuperar proyecto anterior</button><button class="action small ghost" id="restoreAiBackup" style="width:100%">Recuperar cambios anteriores a IA</button></details>`;
b.querySelector('#restoreMigrationBackup').onclick=()=>{try{const raw=localStorage.getItem(MIGRATION_BACKUP);if(!raw)return toast('No existe una copia anterior en este navegador');const data=JSON.parse(raw);if(!data.files||typeof data.files.cpp!=='string'||typeof data.files.py!=='string')throw Error('Copia inválida');if(!confirm('¿Recuperar la copia? Exporta primero el trabajo actual.'))return;state.files={cpp:data.files.cpp,py:data.files.py};state.name=String(data.name||'mi-proyecto').slice(0,60);state.fqbn=String(data.fqbn||state.fqbn);setLang(data.lang==='py'?'py':'cpp',false);$('#code').value=state.files[state.lang];updateHL();save();renderSidebar();toast('Proyecto recuperado')}catch(e){toast('No se pudo recuperar: '+e.message)}};
b.querySelector('#restoreAiBackup').onclick=restoreAiBackup;
b.querySelector('#projectName').addEventListener('input',e=>{state.name=e.target.value;scheduleSave()});
b.querySelectorAll('[data-open]').forEach(x=>x.addEventListener('click',()=>setLang(x.dataset.open)));
b.querySelector('#exportBtn').onclick=exportProject;b.querySelector('#importBtn').onclick=()=>$('#projectFile').click();
b.querySelector('#newBtn').onclick=()=>{if(!confirm('¿Crear proyecto nuevo? Se reemplazará el código actual. Exporta primero si deseas conservarlo.'))return;state.files={cpp:DEFAULT_CPP,py:DEFAULT_PY};state.name='mi-proyecto';setLang('cpp',false);$('#code').value=state.files.cpp;updateHL();save();renderSidebar();toast('Proyecto nuevo. Selecciona la placa antes de compilar.')};}
else if(panel==='boards'){
b.innerHTML=`<button class="action" id="scanBtn" style="width:100%;margin-bottom:15px">↻ Buscar placas reales</button><button class="action" id="openBoardSearch" style="width:100%;margin-bottom:12px">⌕ Buscar entre ${state.catalogOk?state.catalogCount:'total desconocido de'} modelos instalados</button><div class="field"><label class="formlabel" for="boardSelect">TIPO DE PLACA / FQBN</label><select class="selector" id="boardSelect">${state.choices.map(p=>`<option value="${escapeHtml(p.fqbn)}" ${p.fqbn===state.fqbn?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></div><div class="field"><label class="formlabel" for="portSelect">PUERTO FÍSICO</label><select class="selector" id="portSelect"><option value="">— Ningún dispositivo seleccionado —</option>${state.ports.map(p=>`<option value="${escapeHtml(p.port)}" ${p.port===state.port?'selected':''}>${escapeHtml(p.port+' · '+p.name)}</option>`).join('')}</select></div><div class="field"><label class="formlabel" for="baudSelect">BAUDIOS DEL MONITOR SERIE</label><select class="selector" id="baudSelect">${[9600,19200,38400,57600,74880,115200,230400,460800,921600].map(v=>`<option value="${v}" ${v===state.baud?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label class="formlabel" for="uploadSpeedSelect">VELOCIDAD DE GRABACIÓN ESP32</label><select class="selector" id="uploadSpeedSelect">${[115200,230400,460800,921600].map(v=>`<option value="${v}" ${v===state.uploadSpeed?'selected':''}>${v} baudios</option>`).join('')}</select></div><label class="settingscheck" style="margin:7px 0 14px"><span>Reintento USB automático a 115200 (si falla el enlace)</span><input type="checkbox" id="retrySlow" ${state.retrySlow?'checked':''}></label><button class="action" id="serialConnect" style="width:100%;margin:4px 0">${state.serialConnected?'■ Desconectar monitor':'↗ Conectar monitor serie'}</button>${state.lang==='py'?'<button class="action" id="pyRun" style="width:100%;margin-top:7px">▶ Ejecutar MicroPython desde RAM</button>':''}<div class="boxinfo">${state.ports.length?'Dispositivos detectados: <strong>'+state.ports.length+'</strong>':'No se detectan dispositivos. No se inventan puertos COM.'}<br><span class="hint">La selección FQBN es manual si el puerto no identifica por sí solo el modelo. Comprueba la serigrafía de tu placa.</span></div>`;
b.querySelector('#openBoardSearch').onclick=openCatalog;b.querySelector('#scanBtn').onclick=async()=>{toast('Buscando hardware real...');try{const result=await scan({force:true});toast(result.scan_ok===false?'Detección incompleta: revisa el aviso':state.ports.length+' puerto(s) detectado(s)')}catch(e){toast(e.message)}};b.querySelector('#boardSelect').onchange=e=>applyBoardChoice(e.target.value);b.querySelector('#portSelect').onchange=e=>applyPortChoice(e.target.value);b.querySelector('#baudSelect').onchange=e=>{state.baud=+e.target.value;save()};b.querySelector('#uploadSpeedSelect').onchange=e=>{state.uploadSpeed=+e.target.value;save()};b.querySelector('#retrySlow').onchange=e=>{state.retrySlow=e.target.checked;save()};b.querySelector('#serialConnect').onclick=toggleSerial;const py=b.querySelector('#pyRun');if(py)py.onclick=runPython;}
else if(panel==='libraries'){
b.innerHTML='<div class="notice">Se consultan e instalan librerías Arduino mediante Arduino CLI. Solo se mostrará éxito si la herramienta responde correctamente.</div><div class="miniheading">RECOMENDADAS PARA ESTE SKETCH</div><div id="advisorDetails" aria-live="polite"></div><button class="action small ghost" id="advisorRefresh" style="width:100%;margin-bottom:11px">Analizar el código actual</button><div class="miniheading">INSTALAR LIBRERÍA</div><input class="input" id="libName" placeholder="Ej.: DHT sensor library"><button class="action small" id="libInstall" style="width:100%;margin:9px 0 16px">Instalar con Arduino CLI</button><button class="action small ghost" id="libRefresh" style="width:100%">↻ Ver librerías instaladas</button><div class="miniheading">BUSCAR EN ARDUINO LIBRARY MANAGER</div><input class="input" id="libSearchQuery" placeholder="Nombre a buscar en el catálogo"><button class="action small ghost" style="width:100%;margin-top:7px" id="libSearch">Buscar con Arduino CLI</button><pre id="libSearchResult" class="notice" style="white-space:pre-wrap;max-height:175px;overflow:auto"></pre><div id="libList" style="margin-top:13px"></div>';b.querySelector('#libRefresh').onclick=loadLibraries;b.querySelector('#libInstall').onclick=installLibrary;b.querySelector('#libSearch').onclick=searchLibraries;b.querySelector('#advisorRefresh').onclick=()=>refreshAdvisor(false);renderAdvisorPanel();}
else{b.innerHTML='<div class="miniheading">COMPORTAMIENTO</div><label class="settingscheck"><span>Guardado automático</span><input type="checkbox" checked disabled></label><label class="settingscheck"><span>Grabación con confirmación</span><input type="checkbox" checked disabled></label><label class="settingscheck"><span>Resultados de hardware reales</span><input type="checkbox" checked disabled></label><div class="miniheading">INTELIGENCIA ARTIFICIAL</div><div class="notice">Google Gemma 4 31B disponible por Google AI Studio u OpenRouter. Ollama se ejecuta localmente. Las claves quedan únicamente en memoria del servidor y las propuestas nunca se graban sin revisión.</div><div class="miniheading">SEGURIDAD</div><div class="boxinfo">Servidor limitado a <strong>127.0.0.1</strong>.<br>Sin telemetría. IA externa solo cuando el usuario la habilita.<br>Los proyectos se guardan en el navegador hasta exportarlos.</div><button class="action small" id="diagnosticBtn">Actualizar diagnósticos</button>';b.querySelector('#diagnosticBtn').onclick=refreshAll;}}
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
async function toggleSerial(){try{if(state.serialConnected){await request('/api/serial/stop',{});state.serialConnected=false;showLog('serial','[Sistema] Monitor serie desconectado','note')}else{if(!checkSelection(true))return;const r=await request('/api/serial/start',{port:state.port,baud:state.baud});state.serialConnected=r.connected;showLog('serial',`[Sistema] Abierto ${state.port} (${state.baud} baudios)`,'good');switchPane('serial')}renderSidebar()}catch(e){toast(e.message);showLog('serial',e.message,'bad')}}
async function refreshSerial(){try{const d=await request('/api/serial/poll?since='+state.serialId);const changed=state.serialConnected!==d.connected;state.serialConnected=d.connected;state.serialId=d.last_id;for(const m of d.messages)showLog('serial',m.text,m.text.startsWith('[Sistema]')?'note':'good');if(changed&&state.panel==='boards')renderSidebar();}catch(e){state.serialConnected=false}}
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
async function runPython(){if(state.lang!=='py'||!checkSelection(true))return;if(!confirm('Ejecutar código MicroPython en RAM, sin sobrescribir main.py de la placa. ¿Continuar?'))return;switchPane('console');showLog('console','MicroPython · ejecución en RAM (mpremote)','cmd');busy(true);try{const r=await request('/api/micropython/run',{code:state.files.py,port:state.port});showOutput('console',r.output);toast(r.ok?'Ejecución enviada a placa':'Error al ejecutar MicroPython')}catch(e){showLog('console',e.message,'bad')}finally{busy(false);refreshSerial()}}
// Simulator: only models deterministic Blink subset; not real firmware execution.
let simModel=null,simStarted=0,simFrameId=0;
function simDraw(now=0){
  const pin=Number($('#simPin').value),analog=Number($('#simAnalog').value),button=$('#simButton').checked;
  window.MakerSimulator.draw($('#simCanvas'),simModel,now,pin,analog,button);
}
function simStep(timestamp){
  if(!state.simRunning)return;
  simDraw(timestamp-simStarted);
  simFrameId=requestAnimationFrame(simStep);
}
function stopSim(){state.simRunning=false;cancelAnimationFrame(simFrameId);$('#simBtn').textContent='▶ Simular lógica';$('#simStatus').textContent='Detenido · no se ha ejecutado firmware';}
$('#simBtn').onclick=()=>{
  if(state.simRunning){stopSim();return;}
  simModel=window.MakerSimulator.analyze(state.files[state.lang],state.lang);
  if(!simModel.supported){$('#simStatus').textContent='NO SOPORTADO: '+simModel.reason;toast('Este sketch requiere emulación de hardware real, todavía no disponible');simDraw();return;}
  $('#simPin').value=String(simModel.pin);
  if($('#simPin').value!==String(simModel.pin)){const opt=new Option(String(simModel.pin),String(simModel.pin));$('#simPin').add(opt);$('#simPin').value=String(simModel.pin)}
  $('#simPeriod').textContent=`GPIO ${simModel.pin} · HIGH ${simModel.on} ms · LOW ${simModel.off} ms · período ${simModel.period} ms`;
  state.simRunning=true;simStarted=performance.now();$('#simBtn').textContent='■ Detener';
  $('#simStatus').textContent='MODELO LÓGICO EN EJECUCIÓN · NO FIRMWARE';simFrameId=requestAnimationFrame(simStep);
};
$('#simPin').onchange=()=>{if(state.simRunning)stopSim();simDraw()};
$('#simAnalog').oninput=()=>{$('#simAnalogValue').textContent=$('#simAnalog').value;simDraw()};
$('#simButton').onchange=()=>simDraw();
requestAnimationFrame(()=>simDraw());
function bot(message,action){const el=document.createElement('div');el.className='msg bot';const content=document.createElement('div');content.textContent=message;el.appendChild(content);if(action){const b=document.createElement('button');b.className='action small';b.textContent='↳ Insertar plantilla (reemplaza archivo actual)';b.onclick=()=>{if(!confirm('¿Reemplazar el contenido del archivo actual por la plantilla?'))return;state.files[state.lang]=action;$('#code').value=action;updateHL();scheduleSave();toast('Plantilla aplicada');};el.appendChild(b)}$('#chatLog').appendChild(el);$('#chatLog').scrollTop=$('#chatLog').scrollHeight}
function userMsg(message){const el=document.createElement('div');el.className='msg user';el.textContent=message;$('#chatLog').appendChild(el);$('#chatLog').scrollTop=$('#chatLog').scrollHeight}
function assistant(text){const ms=text.match(/(\d{2,5})\s*(?:ms|milisegundos?)/i);const n=Math.min(60000,Math.max(20,ms?+ms[1]:500));if(/\bled\b|parpad|blink/i.test(text)){const isUno=state.fqbn==='arduino:avr:uno';const pin=isUno?'LED_BUILTIN':'2';const desc=isUno?'Arduino Uno: LED_BUILTIN (D13)':'ESP32: GPIO2 (comprobar perfil)';if(state.lang==='py'&&isUno){bot('Arduino Uno R3 tradicional usa Arduino C++, no MicroPython. Cambia a sketch.ino.');return}const code=state.lang==='cpp'?`// LED ${desc} · intervalo ${n} ms\nconst int LED_PIN = ${pin};\nvoid setup() {\n  Serial.begin(115200);\n  pinMode(LED_PIN, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(LED_PIN, HIGH);\n  Serial.println("ON");\n  delay(${n});\n  digitalWrite(LED_PIN, LOW);\n  Serial.println("OFF");\n  delay(${n});\n}\n`:`# LED ESP32: GPIO2 · intervalo ${n} ms\nfrom machine import Pin\nimport time\nled = Pin(2, Pin.OUT)\nwhile True:\n    led.on()\n    print("ON")\n    time.sleep_ms(${n})\n    led.off()\n    print("OFF")\n    time.sleep_ms(${n})\n`;bot(`Plantilla para ${desc}: ${n} ms encendido y ${n} ms apagado. Verifica el LED y la revisión de placa. Esto NO lo ha generado una IA remota.`,code);return}if(/dht|temperatura|humedad/i.test(text)){const code=state.lang==='cpp'?`#include <DHT.h>\n#define DHTPIN 4\n#define DHTTYPE DHT22\nDHT dht(DHTPIN, DHTTYPE);\nvoid setup() {\n  Serial.begin(115200);\n  dht.begin();\n}\nvoid loop() {\n  float t = dht.readTemperature();\n  float h = dht.readHumidity();\n  if (isnan(t) || isnan(h)) { Serial.println("Error DHT22"); }\n  else { Serial.printf("Temperatura: %.1f C Humedad: %.1f %%\\n", t, h); }\n  delay(2500);\n}\n`:`import time\nimport dht\nfrom machine import Pin\nsensor = dht.DHT22(Pin(4))\nwhile True:\n    try:\n        sensor.measure()\n        print("Temp:", sensor.temperature(), "Hum:", sensor.humidity())\n    except OSError as exc:\n        print("Error DHT22:", exc)\n    time.sleep_ms(2500)\n`;bot('Plantilla DHT22 para GPIO4 preparada. Comprueba alimentación, pull-up del bus y compatibilidad. En Arduino C++ requiere DHT sensor library (y dependencias).',code);return}bot('Soy un asistente LOCAL basado en plantillas, no una IA conectada. De momento puedo preparar programas para LED (con intervalos en ms) y DHT22. Usa Compilar para comprobar C++ realmente y revisa el hardware antes de grabar.')}
$('#chatSend').onclick=()=>{const e=$('#chatInput'),s=e.value.trim();if(!s)return;e.value='';userMsg(s);if($('#aiProvider').value==='local')assistant(s);else sendCloudAgent(s)};$('#chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#chatSend').click()}});

async function loadDeviceExample(kind){
  const info={uno:{file:'uno_r3_diagnostico.ino',name:'Arduino Uno R3',fqbn:'arduino:avr:uno'},cam:{file:'esp32cam_ai_thinker_test.ino',name:'ESP32-CAM AI-Thinker (clásico)',fqbn:'esp32:esp32:esp32cam'}}[kind];
  if(!info)return;
  const advisory=kind==='cam'?'IMPORTANTE: el ejemplo exige AI-Thinker clásica OV2640; NO sirve para ESP32-S3-CAM ni otros pinouts. USB-C no identifica el chip.\n\n':'';
  if(!confirm(advisory+'¿Cargar '+info.name+'? Reemplazará sketch.ino y seleccionará su perfil de compilación. EXPORTA tu proyecto actual primero.'))return;
  try{
    const r=await fetch('/examples/'+info.file,{cache:'no-store'});
    if(!r.ok)throw Error('Ejemplo no disponible');
    const source=await r.text();
    if(!source.includes('void setup()')||!source.includes('void loop()'))throw Error('Ejemplo inválido');
    state.files.cpp=source;
    state.fqbn=info.fqbn;
    state.baud=115200;
    state.uploadSpeed=115200;
    state.retrySlow=false;
    setLang('cpp');
    $('#code').value=source;updateHL();scheduleAdvisor();save();renderSidebar();
    $('#footBoard').textContent=info.name;
    updateHardwareLabVisibility();
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
function renderAiModels(preferred){
  const provider=$('#aiProvider').value, select=$('#aiModel');select.replaceChildren();
  for(const model of AI_MODELS[provider]||[]){const o=document.createElement('option');o.value=model;o.textContent=model;select.appendChild(o)}
  if(preferred&&[...select.options].some(o=>o.value===preferred))select.value=preferred;
  $('#aiModel').disabled=['local','codex','claude_code'].includes(provider);$('#aiKeyGroup').classList.toggle('hidden',['local','ollama','codex','claude_code'].includes(provider));
  $('#aiTest').disabled=provider==='local';
}
$('#aiProvider').addEventListener('change',()=>renderAiModels());
async function saveAiConfig(){
  const provider=$('#aiProvider').value,model=$('#aiModel').value,key=$('#aiKey').value;
  const result=await request('/api/ai/config',{provider,model,key});
  $('#aiKey').value='';
  $('#aiState').textContent=provider==='local'?'PLANTILLAS':provider.toUpperCase()+' · CONFIGURADO';
  toast(provider==='local'?'Plantillas locales activas':'Proveedor seleccionado. Prueba la conexión.');
  return result;
}
$('#aiReset').onclick=async()=>{if(!confirm('¿Borrar todas las claves API de la memoria del servidor y desactivar la IA remota?'))return;try{await request('/api/ai/reset',{});$('#aiProvider').value='local';$('#aiKey').value='';renderAiModels();$('#aiState').textContent='CLAVES BORRADAS';toast('Credenciales eliminadas de la sesión local')}catch(e){toast(e.message)}};
$('#aiSave').onclick=async()=>{try{await saveAiConfig()}catch(e){toast(e.message)}};
$('#aiTest').onclick=async()=>{
  $('#aiTest').disabled=true;
  try{await saveAiConfig();const d=await request('/api/ai/chat',{prompt:'Responde exactamente: CONEXION OK',test:true,lang:'cpp'});
      bot('Prueba validada: '+d.provider+'/'+d.model+' → CONEXION OK');$('#aiState').textContent='● IA VALIDADA';toast('Modelo respondió exactamente al desafío')}
  catch(e){bot('Error de conexión IA: '+e.message);$('#aiState').textContent='ERROR IA'}
  finally{$('#aiTest').disabled=false}
};
async function initAi(){
  try{const r=await request('/api/ai/status');$('#aiProvider').value=r.provider||'local';renderAiModels(r.model);$('#aiState').textContent=r.provider==='local'?'PLANTILLAS':r.provider.toUpperCase()+' · CONFIGURADO';}
  catch(e){$('#aiState').textContent='SIN CONEXIÓN'}
}
async function sendCloudAgent(prompt){
  const button=$('#chatSend');button.disabled=true;
  const provider=$('#aiProvider').value;
  const context=$('#aiSendCode').checked?state.files[state.lang].slice(0,24000):'';
  try{
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
         try{const key='ab-makeride-ai-backup-v1',arr=JSON.parse(localStorage.getItem(key)||'[]');arr.unshift({date:new Date().toISOString(),lang:state.lang,code:old});localStorage.setItem(key,JSON.stringify(arr.slice(0,5)))}catch(_e){}
         state.files[state.lang]=code;$('#code').value=code;updateHL();scheduleSave();scheduleAdvisor();toast('Propuesta insertada; revisa, compila y valida antes de grabar.')};el.appendChild(apply);
    }
    if(result.secrets_redacted){const note=document.createElement('div');note.textContent=`Privacidad: ${result.secrets_redacted} posible(s) secreto(s) redactado(s) antes del envío.`;el.prepend(note)}
    $('#chatLog').appendChild(el);$('#chatLog').scrollTop=$('#chatLog').scrollHeight;
    $('#aiState').textContent='● IA RESPONDE';
  }catch(e){bot('La IA no ha respondido: '+e.message);$('#aiState').textContent='ERROR IA'}
  finally{button.disabled=false}
}

function restoreAiBackup(){
 try{const a=JSON.parse(localStorage.getItem('ab-makeride-ai-backup-v1')||'[]');
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
Perfil físico: ${$('#hwProfile').value} (verificación limitada a un ESP32 clásico)
Cableado declarado: ${currentHardware} (no certificado)
Wi-Fi previsto: ${$('#hwWifi').checked?'sí':'no'}
Objetivo: ${goal}
Componentes confirmados: ${parts||'No definidos; pregunta antes de inventar pines'}
Restricciones/Conexiones: ${constraints||'Por confirmar'}
Placa/FQBN del IDE: ${state.fqbn}
Lenguaje: ${state.lang}

Entrega en orden: 1) resumen funcional; 2) materiales y alimentación segura; 3) tabla de conexiones con incertidumbres; 4) librerías Arduino exactas a verificar; 5) sketch completo en bloque de código; 6) pruebas incrementales y diagnóstico; 7) advertencias de seguridad. No inventes resultados ni pruebes hardware. No propongas contraseñas reales.`;
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
try{const saved=JSON.parse(localStorage.getItem(LAB_STORAGE)||'{}');if(Array.isArray(saved.connections))lab.connections=saved.connections.filter(x=>x&&LAB_KINDS[x.kind]&&Number.isInteger(x.gpio)&&Number(x.voltage)>=0).slice(0,32);if(['ideaspark-19','ideaspark-114','esp32-generic'].includes(saved.profile))$('#hwProfile').value=saved.profile;$('#hwWifi').checked=saved.wifi===true;}catch(e){console.warn('Hardware profile reset',e)}
function labSave(){try{localStorage.setItem(LAB_STORAGE,JSON.stringify({profile:$('#hwProfile').value,connections:lab.connections,wifi:$('#hwWifi').checked}))}catch(e){showLog('console','Sin espacio para guardar el perfil de conexiones.','bad')}lab.last=null;$('#hwResult').textContent='Conexiones modificadas: pulsa Auditar conexiones.'}
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
// AB MakerIDE SUPER: Codex / Claude Code tasks with user-controlled permissions.
// This is a real external CLI job, never a simulated AI result.
// =============================================================
const AGENT_LAST='ab-makeride-last-agent-v094';
const agentRunState={id:null,last:0,active:false,lastLang:null,lastData:null,recovering:false};
function agentPermissionsView(){
  const mode=$('#execMode').value,warning=$('#execWarning');
  warning.classList.toggle('danger-warning',mode==='total');
  warning.textContent={
    consultar:'Solo análisis. No debe modificar los archivos del proyecto.',
    supervisado:'La CLI puede editar el proyecto de trabajo. Los cambios no se insertarán en tu editor hasta que los revises.',
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
    $('#execStatus').textContent=`Codex: ${r.installed.codex?'detectado':'no instalado'} · Claude Code: ${r.installed.claude_code?'detectado':'no instalado'}. Carpeta de sesiones: ${r.workspace_base}`;
  }catch(e){$('#execStatus').textContent='No disponible: '+e.message;}
}
$('#agentWorkbench').addEventListener('toggle',()=>{if($('#agentWorkbench').open)refreshAgentCLIs()});
function rememberAgent(id){try{if(id)localStorage.setItem(AGENT_LAST,id);else localStorage.removeItem(AGENT_LAST)}catch(_e){}}
function reportAgentOutcome(r){
  if(r.legacy)return 'Archivo de una versión anterior recuperado. NO existe registro fiable de compilación ni grabación; revisa el código antes de importarlo.';
  if(r.interrupted || r.outcome==='unknown_after_restart')return 'Servidor cerrado durante la tarea · ESTADO DEL HARDWARE DESCONOCIDO. No repitas grabación sin diagnosticar.';
  if(r.active)return 'Agente trabajando. Puedes cerrar esta pestaña; la sesión se podrá consultar al volver.';
  if(!r.success)return 'Tarea fallida o cancelada. No se confirma firmware instalado.';
  if(r.outcome==='flash_reported_verified')return 'El registro declara firmware verificado. Falta comprobar en la pantalla que ejecuta el proyecto solicitado.';
  if(r.outcome==='compiled_only')return 'Codex terminó y hay evidencia de compilación, pero NO consta grabación verificada.';
  return 'Codex terminó; NO consta compilación o grabación verificadas. Revisa los archivos creados y continúa la tarea.';
}
async function recoverAgentSession(silent=false){
  if(agentRunState.active)return;
  const stored=(()=>{try{return localStorage.getItem(AGENT_LAST)||''}catch(_e){return ''}})();
  try{
    const list=await request('/api/agents/history');
    const recent=(list.recent||[]);
    const picked=recent.find(x=>x.job_id===stored)||(stored?{job_id:stored}:null)||(!silent?recent[0]:null);
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
$('#agentRecover').onclick=()=>recoverAgentSession(false);
$('#agentContinue').onclick=()=>{
  const prev=agentRunState.lastData;
  if(!prev || prev.active)return;
  const gap=prev.outcome==='flash_reported_verified'
    ? 'El grabador informó de verificación; no se ha comprobado visualmente la pantalla. Solicita una prueba visual al usuario y diagnostica pantalla, rotación y luz de fondo si sigue negra.'
    : 'No consta una grabación verificada en el informe o la tarea se interrumpió. Comprueba primero el estado actual del hardware y las salidas anteriores sin borrar ni grabar a ciegas.';
  $('#execTask').value=`CONTINUAR PROYECTO PREVIO. Solicitud original resumida: ${prev.task_summary||'(no disponible)'}\nResultado registrado: ${reportAgentOutcome(prev)}\n${gap}\nNo des por terminado un juego solo porque finalizó la CLI. Verifica primero placa, GPIO, compilación y grabación; si falta una fase, completa únicamente lo que autorice el usuario. No repitas grabación si el estado de hardware es desconocido hasta diagnosticar.`;
  $('#execTask').focus();toast('Continuación preparada. Revisa y autoriza de nuevo su ejecución.');
};
function agentSetWorking(working){
  agentRunState.active=working;
  $('#execRun').disabled=working;
  $('#execStop').disabled=!working;
  $('#execProvider').disabled=working;
  $('#execMode').disabled=working;
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
function showAgentResult(data){
  const el=document.createElement('div');el.className='msg bot';
  const text=document.createElement('div');
  text.textContent=reportAgentOutcome(data)+'\n'+(data.error||'')+
    `\nTiempo: ${data.elapsed}s · Modo: ${data.mode}\n`+
    (data.response||'(La CLI no devolvió texto.)');
  el.appendChild(text);
  if(data.diff){
    const details=document.createElement('details');details.className='agent-raw';
    const head=document.createElement('summary');head.textContent='Revisar diferencias antes de aplicar';details.appendChild(head);
    const diff=document.createElement('pre');diff.className='agent-diff';diff.textContent=data.diff;details.appendChild(diff);el.appendChild(details);
  }
  if(data.changed_files&&data.changed_files.length){
    const more=document.createElement('div');
    more.textContent='Otros archivos creados o existentes en la sesión: '+data.changed_files.join(', ')+
      '. Puedes encontrarlos en la carpeta de sesiones; no se importan automáticamente.';
    el.appendChild(more);
  }
  if(data.modified_code!==null&&typeof data.modified_code==='string'&&data.diff){
    const proposed=data.modified_code;
    const originalLanguage=agentRunState.lastLang || state.lang;
    const btn=document.createElement('button');btn.className='action small primary';
    btn.textContent=data.legacy?'↳ Importar código antiguo (con copia de seguridad)':'↳ Aplicar cambios al archivo abierto (con copia de seguridad)';
    btn.onclick=async()=>{
      if(!data.legacy && window.crypto?.subtle && data.before_sha256){
        const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode($('#code').value));
        const sha=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
        if(sha!==data.before_sha256){toast('El editor ha cambiado desde que Codex inició. Exporta el proyecto y revisa la comparación antes de reemplazar.');return;}
      }
      if(!confirm(data.legacy?'Esta sesión antigua no tiene historial de compilación o grabación. ¿Importar solo el archivo recuperado? Se guardará copia de seguridad.':'El agente ha modificado la copia del proyecto. ¿Reemplazar el archivo actual? Se conservará una copia de seguridad local. Revisa el diff antes.'))return;
      try{
        const list=JSON.parse(localStorage.getItem('ab-makeride-ai-backup-v1')||'[]');
        list.unshift({date:new Date().toISOString(),lang:state.lang,code:$('#code').value});
        localStorage.setItem('ab-makeride-ai-backup-v1',JSON.stringify(list.slice(0,7)));
      }catch(e){toast('No se pudo guardar la copia de seguridad; exporta el proyecto antes.');return;}
      if(state.lang!==originalLanguage){toast('Has cambiado de archivo; vuelve al archivo con el que iniciaste el agente para aplicar sus cambios.');return;}
      state.files[state.lang]=proposed;$('#code').value=proposed;updateHL();scheduleSave();scheduleAdvisor();
      toast('Cambios aplicados localmente. Compila y revisa antes de grabar.');btn.disabled=true;
    };
    el.appendChild(btn);
  }
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
$('#execRun').onclick=async()=>{
  const task=$('#execTask').value.trim(),provider=$('#execProvider').value,mode=$('#execMode').value;
  if(task.length<3)return toast('Describe primero la tarea del agente');
  if(!state.apiReady)return toast('Conecta el servidor local antes de iniciar el agente');
  if(!confirm(`Ejecutar ${provider} en modo ${mode}?\nSe proporcionará una copia del sketch al agente. Puede utilizar los recursos autorizados por su modo y configuración local.`))return;
  let consent='';
  if(mode==='total'){
    consent=prompt('ATENCIÓN: esta ejecución puede acceder a TODO el equipo. Úsala preferentemente en una VM.\nPara autorizar esta tarea escribe exactamente: ACCESO TOTAL','')||'';
    if(consent!=='ACCESO TOTAL')return toast('Acceso total no autorizado');
  }
  state.files[state.lang]=$('#code').value;
  save(); // No perder los cambios pendientes si se cierra la pestaña durante Codex.
  agentSetWorking(true);resetAgentStages();switchPane('console');
  RobotActivity.begin('agent','Agente CLI');
  $('#execStatus').textContent='Preparando copia de proyecto y arrancando CLI real…';
  try{
    const r=await request('/api/agents/start',{
      provider,mode,prompt:task,code:state.files[state.lang],lang:state.lang,fqbn:state.fqbn,
      confirm:true,full_consent:consent,port:state.port||'',
    });
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

function init(){setTimeout(()=>{recoverAgentSession(true);recoverBuild()},1000);setLang(state.lang);updateHardwareLabVisibility();renderSidebar();showLog('console','AB MakerIDE v1.0.0-rc.1 SUPER · by MS Robotika','good');showLog('console','Modo de prueba: compilación/subida reales cuando estén las herramientas y la placa.','note');showLog('console','La simulación no ejecuta firmware. Codex puede grabar con tu permiso: exige evidencia real.','note');refreshAll();save();scheduleAdvisor();if(innerWidth<=520){$('#sidebar').classList.add('mobileclosed');$$('.rail button').forEach(b=>b.addEventListener('click',()=>$('#sidebar').classList.toggle('mobileclosed')))}}init();initAi();
})();
