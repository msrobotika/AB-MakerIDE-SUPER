const {test}=require('node:test');
const assert=require('node:assert/strict');
const sim=require('../simulator.js');
const cpp=(body,setup='pinMode(13,OUTPUT);',globals='')=>`${globals}\nvoid setup(){${setup}}\nvoid loop(){${body}}`;
const analyze=(code,fqbn='arduino:avr:uno')=>sim.analyze(code,'cpp',{fqbn});
const py=body=>`from machine import Pin\nimport time\na = Pin(2, Pin.OUT)\nb = Pin(4, Pin.OUT)\nwhile True:\n${body.split('\n').map(s=>'    '+s).join('\n')}`;
function valid(model){assert.equal(model.supported,true,model.reason);return model;}
test('LOW-first Blink keeps its phase at exact boundaries and wraps',()=>{
  const m=valid(analyze(cpp('digitalWrite(13,LOW);delay(250);digitalWrite(13,HIGH);delay(750);')));
  assert.deepEqual([0,249,250,999,1000,1250].map(t=>sim.output(m,t)),[0,0,1,1,0,1]);
  assert.equal(m.on,750);assert.equal(m.off,250);
});
test('LED_BUILTIN and named delay resolve for Uno, Nano and Mega',()=>{
  for(const board of ['uno','nano:cpu=atmega328old','mega:cpu=atmega2560']){
    const m=valid(analyze(cpp('digitalWrite(LED,HIGH);delay(WAIT);digitalWrite(LED,LOW);delay(WAIT);','pinMode(LED,OUTPUT);','const byte LED=LED_BUILTIN;\n#define WAIT 400'),'arduino:avr:'+board));
    assert.deepEqual(m.pins,[13]);assert.equal(m.period,800);
  }
  assert.equal(analyze(cpp('digitalWrite(LED_BUILTIN,HIGH);delay(100);','pinMode(LED_BUILTIN,OUTPUT);'),'esp32:esp32:esp32').supported,false);
});
test('three channels follow a shared deterministic timeline',()=>{
  const m=valid(analyze(cpp('digitalWrite(13,HIGH);digitalWrite(12,LOW);digitalWrite(11,LOW);delay(1000);digitalWrite(13,LOW);digitalWrite(12,HIGH);delay(500);digitalWrite(12,LOW);digitalWrite(11,HIGH);delay(1000);','pinMode(13,OUTPUT);pinMode(12,OUTPUT);pinMode(11,OUTPUT);')));
  const levels=t=>m.pins.map(p=>sim.output(m,t,p));
  assert.deepEqual(levels(0),[1,0,0]);assert.deepEqual(levels(1000),[0,1,0]);assert.deepEqual(levels(1500),[0,0,1]);assert.deepEqual(levels(2500),[1,0,0]);
  assert.equal(sim.output(m,0,22),null);
});
test('setup initial level applies only at startup, not every loop',()=>{
  const m=valid(analyze(cpp('delay(50);digitalWrite(13,HIGH);delay(50);','pinMode(13,OUTPUT);digitalWrite(13,LOW);')));
  assert.equal(sim.output(m,0),0);assert.equal(sim.output(m,50),1);assert.equal(sim.output(m,100),1);
  assert.deepEqual([0,50,100,150].map(t=>sim.nextTime(m,t)),[50,100,150,200]);
});
test('comments and serial strings cannot inject GPIO instructions',()=>{
  const m=valid(analyze(cpp('Serial.println("}; // digitalWrite(12,HIGH);");digitalWrite(13,LOW);delay(100);digitalWrite(13,HIGH);delay(200); // ignored\n')));
  assert.deepEqual(m.pins,[13]);assert.equal(m.serialIgnored,true);assert.equal(sim.output(m,0),0);
});
test('unknown instructions, conditionals and libraries reject the whole model',()=>{
  for(const body of ['if(false)digitalWrite(13,HIGH);delay(500);','analogWrite(13,128);delay(500);','digitalWrite(13,HIGH);mystery();delay(500);','while(true){digitalWrite(13,HIGH);delay(500);}','digitalWrite(13,HIGH);delay(0);'])assert.equal(analyze(cpp(body)).supported,false,body);
  assert.equal(analyze('#include <WiFi.h>\n'+cpp('digitalWrite(13,HIGH);delay(50);')).supported,false);
});
test('bounds, ambiguous constants and implicit conversions are not invented',()=>{
  for(const globals of ['const byte P=269;','int P=13;','const int P=60000;','#define P Q\n#define Q P','#define digitalWrite 3'])assert.equal(analyze(cpp('digitalWrite(P,HIGH);delay(50);','pinMode(P,OUTPUT);',globals)).supported,false,globals);
  for(const body of ['digitalWrite(13,HIGH);delay(1.5);','digitalWrite(13,HIGH);delay(010);','digitalWrite(13,HIGH);delay(60001);'])assert.equal(analyze(cpp(body)).supported,false,body);
  assert.equal(sim.analyze('x'.repeat(100001),'cpp').supported,false);
  const setup=Array.from({length:9},(_,p)=>`pinMode(${p},OUTPUT);`).join('');
  assert.equal(analyze(cpp('digitalWrite(0,HIGH);delay(100);',setup)).supported,false);
});
test('MicroPython represents both outputs, fractions and LOW-first phase',()=>{
  const m=valid(sim.analyze(py('a.off()\nb.on()\ntime.sleep(0.25)\na.on()\nb.value(0)\ntime.sleep_ms(750)'),'py',{fqbn:'esp32:esp32:esp32'}));
  assert.deepEqual([0,249,250,1000].map(t=>[sim.output(m,t,2),sim.output(m,t,4)]),[[0,1],[0,1],[1,0],[0,1]]);
});
test('MicroPython unknown startup levels stay unknown until written',()=>{
  const m=valid(sim.analyze(py('time.sleep_ms(100)\na.on()\nb.off()\ntime.sleep_ms(100)'),'py'));
  assert.equal(sim.output(m,0,2),null);assert.equal(sim.output(m,100,2),1);assert.equal(sim.output(m,200,2),1);
});
test('MicroPython rejects foreign objects, read calls, nesting and missing imports',()=>{
  for(const body of ['a.on()\nother.off()\ntime.sleep_ms(500)','a.on()\nb.value()\ntime.sleep_ms(500)','if True:\n    a.on()\ntime.sleep_ms(500)','a.on(1)\ntime.sleep_ms(500)'])assert.equal(sim.analyze(py(body),'py').supported,false,body);
  assert.equal(sim.analyze(py('a.on()\ntime.sleep_ms(500)').replace('import time',''),'py').supported,false);
  assert.equal(sim.analyze(py('a.on()\ntime.sleep_ms(500)'),'py',{fqbn:'arduino:avr:mega'}).supported,false);
});
