/* AB MakerIDE 0.5 · Simulator (MIT)
 * Interprete didactico de una SUBCLASE documentada de Blink.
 * NUNCA ejecuta instrucciones de CPU ni interpreta firmware binario.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MakerSimulator = api;
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  const stripComments = code => String(code).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
  function constValues(code) {
    const m = new Map();
    for (const x of code.matchAll(/^\s*#define\s+([A-Za-z_]\w*)\s+(\d+)\b/gm)) m.set(x[1], Number(x[2]));
    for (const x of code.matchAll(/\b(?:const\s+)?(?:unsigned\s+)?(?:int|uint8_t|uint16_t|uint32_t|long)\s+([A-Za-z_]\w*)\s*=\s*(\d+)\s*;/g)) m.set(x[1], Number(x[2]));
    return m;
  }
  function block(code, name) {
    const head = new RegExp('\\bvoid\\s+' + name + '\\s*\\(\\s*\\)\\s*\\{').exec(code);
    if (!head) return null;
    let level = 1, start = head.index + head[0].length;
    for (let i = start; i < code.length; i++) {
      if (code[i] === '{') level++;
      else if (code[i] === '}' && --level === 0) return code.slice(start, i);
    }
    return null;
  }
  function analyzeCpp(code) {
    const src = stripComments(code), values = constValues(src);
    const loop = block(src, 'loop');
    if (!loop) return {supported: false, reason:'No hay void loop() identificable.'};
    // Restrict to linear write-delay steps. Do not fake control-flow or conditionals.
    if (/\b(?:if|while|for|switch|goto)\s*\(/.test(loop))
      return {supported:false,reason:'El bucle contiene control de flujo no soportado por el simulador lógico.'};
    const tokens = [...loop.matchAll(/\bdigitalWrite\s*\(\s*([A-Za-z_]\w*|\d+)\s*,\s*(HIGH|LOW)\s*\)\s*;|\bdelay\s*\(\s*(\d+)\s*\)\s*;/g)];
    // Never claim that unknown statements have been emulated. Serial logging
    // is deliberately ignored, but any other instruction rejects the pattern.
    let remainder = loop;
    for(const token of tokens) remainder = remainder.replace(token[0], ' ');
    remainder = remainder.replace(/\bSerial\.(?:println|print)\s*\(\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\d+)\s*\)\s*;/g,' ');
    if (remainder.trim())
      return {supported:false, reason:'El bucle contiene instrucciones no simuladas. No se infiere el estado del LED.'};
    const writes = tokens.filter(t => t[2]);
    if (writes.length !== 2 || !writes.some(t=>t[2]==='HIGH') || !writes.some(t=>t[2]==='LOW'))
      return {supported:false,reason:'Solo se admite un patrón Blink lineal: HIGH → delay → LOW → delay.'};
    const pin = values.get(writes[0][1]) ?? Number(writes[0][1]);
    const pin2 = values.get(writes[1][1]) ?? Number(writes[1][1]);
    if (!Number.isInteger(pin) || pin < 0 || pin > 48 || pin !== pin2)
      return {supported:false,reason:'No se puede resolver un único GPIO para ambas escrituras.'};
    const events = [];
    for (const t of tokens) {
      if (t[2]) events.push({kind:'write',pin,value:t[2]==='HIGH'?1:0});
      else events.push({kind:'delay', ms:Number(t[3])});
    }
    // Require only the canonical sequence to avoid inventing behavior.
    if (events.length!==4 || events[0].kind!=='write' || events[1].kind!=='delay' || events[2].kind!=='write' || events[3].kind!=='delay')
      return {supported:false,reason:'Patrón no soportado: se requieren dos escrituras y dos esperas sucesivas.'};
    const on = events[0].value===1 ? events[1].ms : events[3].ms;
    const off = events[0].value===0 ? events[1].ms : events[3].ms;
    if (!(on>=1 && off>=1 && on<=60000 && off<=60000))
      return {supported:false,reason:'Duraciones fuera del rango de 1–60000 ms.'};
    return {supported:true,pin,on,off,period:on+off,mode:'blink-subset',lang:'cpp'};
  }
  function analyzePy(code) {
    const txt=stripComments(code);
    const pins = [...txt.matchAll(/\b([a-zA-Z_]\w*)\s*=\s*Pin\(\s*(\d+)\s*,\s*Pin\.OUT\s*\)/g)];
    if (!pins.length) return {supported:false,reason:'No se ha encontrado un Pin de salida MicroPython.'};
    const varName=pins[0][1],pin=Number(pins[0][2]);
    const body=txt.split(/\bwhile\s+True\s*:/)[1];
    if (!body) return {supported:false,reason:'No se encuentra while True en el programa MicroPython.'};
    const calls=[...body.matchAll(/\b([a-zA-Z_]\w*)\.(on|off|value)\(\s*([01])?\s*\)|\btime\.sleep(_ms)?\(\s*([\d.]+)\s*\)/g)];
    const relevant=[];
    for (const m of calls) {
      if (m[1]===varName) relevant.push({kind:'write',value:m[2]==='on'?1:m[2]==='off'?0:Number(m[3])});
      else if(m[5]) relevant.push({kind:'delay',ms:Number(m[5])*(m[4]?1:1000)});
    }
    // Conservative: only the four modeled calls plus print() and whitespace
    // can participate in the loop. Unknown operations must not be faked.
    let remainder = body;
    for(const item of calls) remainder = remainder.replace(item[0], ' ');
    remainder = remainder.replace(/\bprint\s*\(\s*(?:"[^"\n]*"|'[^'\n]*')\s*\)/g,' ');
    if (remainder.trim()) return {supported:false,reason:'MicroPython contiene instrucciones no simuladas.'};
    if (relevant.length!==4 || relevant[0].kind!=='write' || relevant[1].kind!=='delay' || relevant[2].kind!=='write' || relevant[3].kind!=='delay' || relevant[0].value===relevant[2].value)
      return {supported:false,reason:'MicroPython: se admite solo un patrón Pin.on/off y dos sleep.'};
    const on=relevant[0].value===1?relevant[1].ms:relevant[3].ms;
    const off=relevant[0].value===0?relevant[1].ms:relevant[3].ms;
    if (!(on>=1&&off>=1&&on<=60000&&off<=60000))return {supported:false,reason:'Duraciones fuera del rango de 1–60000 ms.'};
    return {supported:true,pin,on,off,period:on+off,mode:'blink-subset',lang:'py'};
  }
  function analyze(code,lang){return lang==='py'?analyzePy(code):analyzeCpp(code);}
  function output(model,elapsedMs) {
    if (!model?.supported) return null;
    const point=((elapsedMs%model.period)+model.period)%model.period;
    return point<model.on?1:0;
  }
  function draw(canvas, model, elapsed=0, pin=2, analog=2048, button=false) {
    if (!canvas) return;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#08111a';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#163043';ctx.lineWidth=1;
    for(let x=0;x<W;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
    for(let y=0;y<H;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
    const rounded=(x,y,w,h,r)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);};
    rounded(18,20,195,110,10);ctx.fillStyle='#112a37';ctx.fill();ctx.strokeStyle='#3d6d86';ctx.stroke();
    ctx.fillStyle='#7ccbea';ctx.font='bold 17px monospace';ctx.fillText('ESP32 VIRTUAL',33,51);
    ctx.font='12px monospace';ctx.fillStyle='#a1b7c9';ctx.fillText('GPIO '+pin+'  → LED',33,77);
    ctx.fillText('ADC virtual '+analog,33,98);
    ctx.fillText('BOTON '+(button?'PULSADO':'ABIERTO'),33,116);
    ctx.beginPath();ctx.moveTo(213,73);ctx.lineTo(290,73);ctx.strokeStyle='#35b5de';ctx.lineWidth=3;ctx.stroke();
    const active=model?.supported&&Number(pin)===model.pin ? output(model,elapsed) : null;
    if(active===1){const g=ctx.createRadialGradient(324,73,3,324,73,47);g.addColorStop(0,'#66e7ffbd');g.addColorStop(1,'#36bdf800');ctx.fillStyle=g;ctx.beginPath();ctx.arc(324,73,47,0,Math.PI*2);ctx.fill()}
    ctx.beginPath();ctx.arc(324,73,19,0,Math.PI*2);ctx.fillStyle=active===1?'#38bdf8':'#244354';ctx.fill();ctx.strokeStyle='#7dd3fc';ctx.lineWidth=2;ctx.stroke();
    ctx.font='bold 12px monospace';ctx.fillStyle=active===1?'#8af2ff':'#8297aa';ctx.fillText(active===null?'N/D':active?'ON':'OFF',350,78);
    ctx.fillStyle='#7fa4bb';ctx.font='11px monospace';ctx.fillText('OSCILOSCOPIO VIRTUAL · NIVEL GPIO',18,160);
    // Logic trace only when current selected pin matches a proven code pattern.
    if(active!==null){
      ctx.strokeStyle='#31d9a7';ctx.lineWidth=2.4;ctx.beginPath();
      for(let i=0;i<420;i++){
        const t=Math.max(0,elapsed-1750)+i/420*1750;
        const y=output(model,t)?180:228;
        const x=18+i;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }else{ctx.font='12px monospace';ctx.fillStyle='#dfa85a';ctx.fillText('NO SIMULABLE: cargar un Blink compatible',20,206)}
    ctx.fillStyle='#6f899c';ctx.font='10px monospace';ctx.fillText('SIMULACION LOGICA DE SUBCONJUNTO · NO EMULA CPU NI FIRMWARE',18,265);
  }
  return {analyze, output, draw};
});
