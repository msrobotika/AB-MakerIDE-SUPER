const {test}=require('node:test');
const assert=require('node:assert/strict');
function fresh(){delete require.cache[require.resolve('../activity.js')];return require('../activity.js');}
test('idle neutral',()=>assert.equal(fresh().summary().state,'idle'));
test('busy amber',()=>assert.equal(fresh().begin('build','Compilación').state,'working'));
test('success without exit code never green',()=>assert.equal(fresh().report('build','Compilación',{success:true}).state,'unknown'));
test('exit zero compile green',()=>assert.equal(fresh().report('build','Compilación',{success:true,exit_code:0}).state,'success'));
test('cancel exit zero neutral',()=>assert.equal(fresh().report('build','Compilación',{success:true,exit_code:0,cancelled:true}).state,'unknown'));
test('restart exit zero neutral',()=>assert.equal(fresh().report('build','Compilación',{success:true,exit_code:0,interrupted:true}).state,'unknown'));
test('nonzero red',()=>assert.equal(fresh().report('build','Compilación',{success:false,exit_code:1}).state,'failed'));
test('agent requires evidence',()=>assert.equal(fresh().report('agent','Agente',{success:true,exit_code:0,evidenceVerified:false}).state,'unknown'));
test('agent scope explicitly excludes hardware',()=>assert.match(fresh().report('agent','Agente',{success:true,exit_code:0}).text,/hardware sin comprobar/));
test('simultaneous task never prematurely green',()=>{const r=fresh();r.begin('build','Compilación');r.begin('agent','Agente');assert.equal(r.report('build','Compilación',{success:true,exit_code:0}).state,'working');});
test('failure survives another success',()=>{const r=fresh();r.lost('agent','Agente','Red');assert.equal(r.report('build','Compilación',{success:true,exit_code:0}).state,'failed');});
test('explicit retry replaces prior failure for same scope',()=>{const r=fresh();r.lost('build','Compilación','Red');r.begin('build','Compilación');assert.equal(r.report('build','Compilación',{success:true,exit_code:0}).state,'success');});
test('edited source invalidates previous success',()=>{const r=fresh();r.report('build','Compilación',{success:true,exit_code:0});assert.equal(r.invalidate('build').state,'unknown');});
test('stale snapshot is never green',()=>assert.equal(fresh().report('build','Compilación',{success:true,exit_code:0,stale:true}).state,'unknown'));
