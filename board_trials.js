(function(root){
'use strict';
const KEY='ab-makeride-board-trials-v1',MAX=100;
const LABELS={not_run:'Sin resultado de herramienta',unavailable:'Resultado no recuperable · sin evidencia de herramienta',running:'Operación en curso',mismatch:'Resultado de otra revisión, placa o puerto',interrupted:'Interrumpida · resultado desconocido',cancelled:'Cancelada',failed:'Herramienta con error',compile_ok:'Compilación correcta · no acredita grabación',upload_ok:'Compilación y grabación terminadas con salida 0'};
const OBS={not_checked:'Sin comprobar en el dispositivo',works:'Funciona según el usuario',fails:'Falla según el usuario'};
function evidence(context,result){
  if(!result)return {status:'not_run',job_id:null,action:null,exit_code:null,port:null};
  if(result.unavailable)return {status:'unavailable',job_id:null,action:null,exit_code:null,port:null};
  const output={status:'not_run',job_id:result.id||null,action:result.action||null,exit_code:result.exit_code??null,port:result.port||null};
  const match=/^[a-f0-9]{64}$/.test(context.source_sha256||'')&&context.lang==='cpp'&&
    context.source_sha256===result.source_sha256&&context.fqbn===result.fqbn&&
    (context.agent_project_id||'')===(result.agent_project_id||'')&&
    (result.action!=='upload'||(!!result.port&&result.port===context.port));
  if(!match)output.status='mismatch';
  else if(result.interrupted||result.stage==='interrumpido')output.status='interrupted';
  else if(result.cancelled)output.status='cancelled';
  else if(result.active)output.status='running';
  else if(result.success===true&&result.exit_code===0&&!result.error&&['compile','upload'].includes(result.action))output.status=result.action==='upload'?'upload_ok':'compile_ok';
  else output.status='failed';
  return output;
}
function makeRecord(context,result,name,observation,notes){
  if(typeof name!=='string'||!name.trim()||name.trim().length>80)throw Error('Escribe un nombre de placa de hasta 80 caracteres.');
  if(!Object.hasOwn(OBS,observation)||typeof notes!=='string'||notes.length>2000)throw Error('Observación o notas no válidas.');
  if(!/^[a-f0-9]{64}$/.test(context.source_sha256||''))throw Error('No se pudo identificar la revisión del código.');
  return {schema:1,id:crypto.randomUUID(),created_at:new Date().toISOString(),board_name:name.trim(),
    selected:{fqbn:context.fqbn,port:context.port||'',lang:context.lang},source_sha256:context.source_sha256,
    agent_project_id:context.agent_project_id||'',tool:evidence(context,result),
    observation:{state:observation,source:'user',notes},ide_version:'1.0.0-rc.1'};
}
function parseRecords(raw){
  if(!raw)return [];
  if(raw.length>600000)throw Error('Cuaderno demasiado grande. Exporta una copia antes de recuperarlo.');
  const records=JSON.parse(raw);
  if(!Array.isArray(records)||records.length>MAX||records.some(r=>!r||r.schema!==1||typeof r.board_name!=='string'||r.board_name.length>80||!r.tool||!Object.hasOwn(LABELS,r.tool.status)||!r.selected||!r.observation||!Object.hasOwn(OBS,r.observation.state)||typeof r.observation.notes!=='string'||r.observation.notes.length>2000))throw Error('Cuaderno dañado. Se conserva el contenido anterior; exporta una copia.');
  return records;
}
function sameContext(a,b){return ['code','fqbn','port','lang','agent_project_id'].every(key=>a[key]===b[key]);}
function mount({readContext,readBuild}){
  const $=id=>document.getElementById(id),dialog=$('boardTrialsDialog'),status=$('trialStatus');
  let records=[],raw='',blocked=false;
  function message(text){status.textContent=text;}
  function render(){
    $('trialHistory').replaceChildren();
    for(const r of records){
      const item=document.createElement('div');item.className='boxinfo';
      item.textContent=r.board_name+' · '+r.created_at+'\n'+r.selected.fqbn+' · '+(r.selected.port||'sin puerto declarado')+
        '\n'+LABELS[r.tool.status]+'\n'+OBS[r.observation.state]+'\nSHA-256: '+r.source_sha256+(r.observation.notes?'\n'+r.observation.notes:'');
      item.style.whiteSpace='pre-wrap';item.style.overflowWrap='anywhere';$('trialHistory').appendChild(item);
    }
    $('trialCount').textContent=records.length+' / '+MAX+' pruebas guardadas en este navegador';
  }
  function load(){
    records=[];
    try{raw=localStorage.getItem(KEY)||'';records=parseRecords(raw);blocked=false;message('Guardar una prueba solo registra datos; no compila, no graba ni abre el puerto serie.');}
    catch(error){blocked=true;message(error.message);}
    $('trialSave').disabled=blocked;render();
  }
  $('showTrials').onclick=()=>{
    load();const c=readContext();
    $('trialTarget').textContent='Selección actual: '+c.fqbn+' · '+(c.port||'sin puerto')+'. El puerto y el modelo seleccionados no prueban la identidad de la placa.';
    dialog.showModal();
  };
  $('trialClose').onclick=()=>dialog.close();
  $('trialSave').onclick=async()=>{
    if(blocked)return;
    $('trialSave').disabled=true;
    const c=readContext(),name=$('trialName').value,observation=$('trialObservation').value,notes=$('trialNotes').value;
    try{
      if(records.length>=MAX)throw Error('Límite de 100 pruebas. Exporta el cuaderno; se conservan todas las pruebas existentes.');
      const result=await readBuild();
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(c.code));
      if(!sameContext(c,readContext()))throw Error('El código, placa o puerto cambió durante la consulta. Revisa la selección y guarda de nuevo.');
      c.source_sha256=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
      const record=makeRecord(c,result,name,observation,notes);
      if((localStorage.getItem(KEY)||'')!==raw)throw Error('Otra pestaña modificó el cuaderno. Cierra y vuelve a abrirlo antes de guardar.');
      const next=JSON.stringify([record,...records]);
      localStorage.setItem(KEY,next);raw=next;records=[record,...records];render();
      message('Prueba guardada: '+LABELS[record.tool.status]+'. Observación atribuida al usuario.');
      $('trialObservation').value='not_checked';$('trialNotes').value='';
    }catch(error){message('No se guardó la prueba: '+error.message);}
    finally{$('trialSave').disabled=blocked;}
  };
  $('trialExport').onclick=()=>{
    const body=blocked?raw:JSON.stringify({format:'ab-makeride-board-trials-v1',exported_at:new Date().toISOString(),
      note:'Registros locales editables. Los resultados de herramienta y las observaciones del usuario son pruebas distintas; no constituyen certificación del hardware.',records},null,2);
    const url=URL.createObjectURL(new Blob([body],{type:'application/json;charset=utf-8'})),link=document.createElement('a');
    link.href=url;link.download=blocked?'MakerIDE-pruebas-recuperacion.json':'MakerIDE-pruebas-placas.json';
    document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
}
const api={evidence,makeRecord,parseRecords,sameContext,mount,KEY,MAX};
if(typeof module==='object'&&module.exports)module.exports=api;else root.BoardTrials=api;
})(typeof globalThis==='object'?globalThis:this);
