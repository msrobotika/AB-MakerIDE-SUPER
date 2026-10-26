const {test}=require('node:test');
const assert=require('node:assert/strict');
const book=require('../board_trials.js');
const context={source_sha256:'a'.repeat(64),fqbn:'esp32:esp32:esp32',port:'COM4',lang:'cpp',agent_project_id:''};
const result={id:'b'.repeat(32),source_sha256:context.source_sha256,fqbn:context.fqbn,port:'',agent_project_id:'',action:'compile',success:true,active:false,exit_code:0};

test('compile success never establishes upload or physical result',()=>{
  const r=book.makeRecord(context,result,'IdeaSpark','not_checked','');
  assert.equal(r.tool.status,'compile_ok');assert.equal(r.observation.state,'not_checked');
  assert.equal(r.observation.source,'user');assert.equal(r.code,undefined);
});
test('upload success is scoped to the exact port',()=>{
  assert.equal(book.evidence(context,{...result,action:'upload',port:'COM4'}).status,'upload_ok');
  for(const port of ['',undefined,'COM8'])assert.equal(book.evidence(context,{...result,action:'upload',port}).status,'mismatch');
});
test('other source, board, project or language cannot supply evidence',()=>{
  for(const change of [{source_sha256:'f'.repeat(64)},{fqbn:'arduino:avr:uno'},{agent_project_id:'c'.repeat(32)},{lang:'py'}])
    assert.equal(book.evidence({...context,...change},result).status,'mismatch');
});
test('missing exit code and errors never count as success',()=>{
  for(const change of [{exit_code:null},{success:false},{error:'failed'},{exit_code:1}])
    assert.equal(book.evidence(context,{...result,...change}).status,'failed');
});
test('cancel and restart override an exit zero',()=>{
  assert.equal(book.evidence(context,{...result,cancelled:true}).status,'cancelled');
  assert.equal(book.evidence(context,{...result,stage:'interrumpido'}).status,'interrupted');
  assert.equal(book.evidence(context,{...result,active:true}).status,'running');
});
test('manual working observation remains separate without tool evidence',()=>{
  const r=book.makeRecord(context,null,'Placa azul','works','Veo el radar');
  assert.equal(r.tool.status,'not_run');assert.equal(r.observation.state,'works');
});
test('lost server result permits manual notes without fabricating evidence',()=>{
  const r=book.makeRecord(context,{unavailable:true},'Placa nueva','works','Observación manual');
  assert.equal(r.tool.status,'unavailable');assert.equal(r.tool.exit_code,null);assert.equal(r.observation.source,'user');
});
test('reject incomplete records and preserve the storage input',()=>{
  for(const raw of ['{','{}','[{}]',JSON.stringify(Array(101).fill({}))])assert.throws(()=>book.parseRecords(raw));
  assert.throws(()=>book.makeRecord(context,null,'','works',''));
  assert.throws(()=>book.makeRecord(context,null,'Placa','inventado',''));
  const raw=JSON.stringify([book.makeRecord(context,result,'Placa','not_checked','')]);
  assert.equal(book.parseRecords(raw).length,1);
});
test('changing target while reading evidence invalidates the context',()=>{
  const c={...context,code:'void setup(){}'};
  assert.equal(book.sameContext(c,{...c}),true);
  for(const change of [{code:'editado'},{fqbn:'otro'},{port:'COM8'},{agent_project_id:'nuevo'}])assert.equal(book.sameContext(c,{...c,...change}),false);
});

test('export uses the application version supplied by the UI, never a hardcoded RC',()=>{const version=require('node:fs').readFileSync(require('node:path').join(__dirname,'../VERSION'),'utf8').trim();const record=book.makeRecord({...context,ide_version:version},result,'Fixture','not_checked','');assert.equal(record.ide_version,version);assert.equal(book.makeRecord(context,result,'Fixture','not_checked','').ide_version,'unknown');});
