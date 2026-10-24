/* MS Robotika status reducer. Success is scoped to an observed tool result. */
(()=>{'use strict';
const tasks=new Map();
function summary(){
 const rows=[...tasks.values()],working=rows.filter(x=>x.state==='working'),failed=rows.filter(x=>x.state==='failed'),unknown=rows.filter(x=>x.state==='unknown');
 const state=working.length?'working':failed.length?'failed':unknown.length?'unknown':rows.length?'success':'idle';
 const text=rows.length?rows.map(x=>x.text+' · '+x.label).join(' | '):'MS Robotika · En reposo';
 return {state,text,active:working.length};
}
function render(){
 const value=summary();
 if(typeof document!=='undefined'){
  const el=document.querySelector('#robotStatus');
  if(el){el.dataset.state=value.state;el.title=value.text;el.setAttribute('aria-busy',String(value.active>0));const text=document.querySelector('#robotText');if(text.textContent!==value.text)text.textContent=value.text;}
 }
 return value;
}
function begin(id,label){tasks.set(id,{state:'working',label,text:'En curso; resultado pendiente'});return render();}
function report(id,label,data){
 let state='unknown',text='Resultado sin verificar';
 if(data.active){state='working';text='En curso; resultado pendiente';}
 else if(data.stale){text='Resultado de otra revisión o placa; vuelve a compilar';}
 else if(data.cancelled||data.interrupted||data.stage==='interrumpido'){text='Cancelado o interrumpido; sin confirmar';}
 else if(data.success===false||data.error||(Number.isInteger(data.exit_code)&&data.exit_code!==0)){state='failed';text=data.error||'La herramienta falló';}
 else if(id==='syntax'&&data.success===true&&data.verified===true){state='success';text='Sintaxis Python verificada; firmware sin comprobar';}
 else if(data.success===true&&data.exit_code===0&&data.evidenceVerified!==false){state='success';text=id==='agent'?'CLI completada (salida 0); hardware sin comprobar':id==='build'&&data.action==='upload'?'Grabador finalizó con salida 0; funcionamiento físico pendiente':'Verificado: salida 0';}
 tasks.set(id,{state,label,text});return render();
}
function lost(id,label,message){tasks.set(id,{state:'failed',label,text:message+'; resultado desconocido, recupera la sesión'});return render();}
function invalidate(id){const task=tasks.get(id);if(task&&task.state!=='working'){task.state='unknown';task.text='Editor o placa modificados; vuelve a compilar';}return render();}
const api={begin,report,lost,invalidate,summary};
if(typeof module!=='undefined')module.exports=api;
else globalThis.RobotActivity=api;
render();
})();
