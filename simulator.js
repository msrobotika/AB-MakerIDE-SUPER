/* AB MakerIDE · bounded digital sequence model (MIT).
 * No CPU, firmware, GPIO connection, eval or arbitrary code execution.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MakerSimulator = api;
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  const atom = '(?:[A-Za-z_]\\w*|(?:0|[1-9]\\d*)(?:\\.\\d+)?)';
  const fail = (message) => {
    throw Error(message);
  };
  const quoted = '(?:"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\')';
  const literal = '(?:' + quoted + '|F\\(\\s*' + quoted + '\\s*\\)|\\d+)';
  function clean(code, py = false) {
    const pattern = new RegExp(
      quoted + '|' + (py ? '#[^\\n]*' : '/\\*[\\s\\S]*?\\*/|//[^\\n]*'),
      'g',
    );
    return code.replace(pattern, (s) => (/^["']/.test(s) ? s : s.replace(/[^\n]/g, ' ')));
  }
  function masked(code) {
    return code.replace(new RegExp(quoted, 'g'), (s) => s.replace(/[^\n]/g, ' '));
  }
  function boardInfo(fqbn = '') {
    const name = fqbn.split(':')[2];
    if (fqbn.startsWith('arduino:avr:') && ['uno', 'nano', 'mega'].includes(name))
      return {
        label: 'ARDUINO ' + name.toUpperCase(),
        builtin: 13,
        maxPin: name === 'mega' ? 69 : name === 'nano' ? 21 : 19,
        avr: true,
      };
    return {
      label: fqbn.startsWith('esp32:') ? 'ESP32 · MODELO DIGITAL' : 'MODELO DIGITAL',
      builtin: null,
      maxPin: 255,
      avr: false,
    };
  }
  function context(fqbn) {
    const board = boardInfo(fqbn),
      values = new Map([
        ['HIGH', 1],
        ['LOW', 0],
      ]);
    if (board.builtin !== null) values.set('LED_BUILTIN', board.builtin);
    const resolve = (value, depth = 0) => {
      if (depth > 12) fail('Constantes circulares o demasiado anidadas.');
      if (/^\d+(?:\.\d+)?$/.test(value)) return Number(value);
      if (!values.has(value))
        fail(
          'No se puede resolver ' +
            value +
            '. Usa un número o una constante conocida para esta placa.',
        );
      const result = values.get(value);
      return typeof result === 'number' ? result : resolve(result, depth + 1);
    };
    const define = (name, value) => {
      if (
        values.has(name) ||
        [
          'pinMode',
          'digitalWrite',
          'delay',
          'setup',
          'loop',
          'Serial',
          'OUTPUT',
          'F',
          'Pin',
          'time',
          'LED_BUILTIN',
        ].includes(name)
      )
        fail('Constante duplicada o reservada: ' + name);
      values.set(name, value);
    };
    const pin = (value) => {
      const n = resolve(value);
      if (!Number.isInteger(n) || n < 0 || n > board.maxPin)
        fail('Pin fuera del rango del perfil lógico.');
      return n;
    };
    return { board, resolve, define, pin };
  }
  function builder(ctx, lang) {
    const initial = {},
      pins = [],
      events = [];
    let at = 0,
      serialIgnored = false;
    function configure(pin, level = 0) {
      if (pins.includes(pin)) fail('Salida declarada más de una vez.');
      if (pins.length >= 8) fail('Máximo ocho salidas por secuencia.');
      pins.push(pin);
      initial[pin] = level;
    }
    function write(pin, value, setup = false) {
      if (!pins.includes(pin)) fail('La salida ' + pin + ' necesita pinMode OUTPUT o Pin.OUT.');
      if (value !== 0 && value !== 1) fail('Solo se admiten niveles HIGH/LOW o 0/1.');
      if (setup) initial[pin] = value;
      else events.push({ kind: 'write', at, pin, value });
    }
    function delay(ms) {
      if (!Number.isFinite(ms) || ms < 1 || ms > 60000)
        fail('Cada espera debe estar entre 1 y 60000 ms.');
      events.push({ kind: 'delay', at, ms });
      at += ms;
      if (at > 120000) fail('El ciclo supera 120000 ms.');
    }
    function finish() {
      if (!pins.length || !events.some((e) => e.kind === 'write') || at <= 0)
        fail('Se necesitan salidas, escrituras y al menos una espera positiva.');
      if (events.length > 128) fail('Máximo 128 instrucciones por ciclo.');
      const endState = { ...initial };
      for (const e of events) if (e.kind === 'write') endState[e.pin] = e.value;
      const model = {
        supported: true,
        mode: 'digital-sequence',
        lang,
        board: ctx.board.label,
        pins,
        initial,
        endState,
        events,
        period: at,
        serialIgnored,
      };
      if (
        pins.length === 1 &&
        events.length === 4 &&
        events[0].kind === 'write' &&
        events[1].kind === 'delay' &&
        events[2].kind === 'write' &&
        events[3].kind === 'delay' &&
        events[0].value !== events[2].value
      ) {
        model.pin = pins[0];
        model.on = events[0].value ? events[1].ms : events[3].ms;
        model.off = events[0].value ? events[3].ms : events[1].ms;
      }
      return model;
    }
    return {
      configure,
      write,
      delay,
      finish,
      ignoreSerial: () => {
        serialIgnored = true;
      },
    };
  }
  function statements(body) {
    const mask = masked(body),
      items = [];
    let start = 0;
    for (let i = 0; i < mask.length; i++)
      if (mask[i] === ';') {
        items.push(body.slice(start, i).trim());
        start = i + 1;
      }
    if (body.slice(start).trim())
      fail('Falta un punto y coma o hay instrucciones fuera del subconjunto.');
    return items.filter(Boolean);
  }
  function analyzeCpp(code, fqbn) {
    let src = clean(code);
    const ctx = context(fqbn),
      build = builder(ctx, 'cpp');
    src = src.replace(/^\s*#include\s*[<"]Arduino\.h[>"]\s*$/gm, '');
    src = src.replace(
      new RegExp('^\\s*#define[ \\t]+([A-Za-z_]\\w*)[ \\t]+(' + atom + ')[ \\t]*$', 'gm'),
      (_s, name, value) => {
        ctx.define(name, value);
        return '';
      },
    );
    if (/^\s*#/m.test(src)) fail('Directivas o bibliotecas fuera del subconjunto digital.');
    const mask = masked(src),
      blocks = {};
    const ranges = [];
    for (const name of ['setup', 'loop']) {
      const re = new RegExp('\\bvoid\\s+' + name + '\\s*\\(\\s*\\)\\s*\\{', 'g'),
        matches = [...mask.matchAll(re)];
      if (matches.length !== 1) fail('Se necesita exactamente un void ' + name + '().');
      const head = matches[0];
      let depth = 1,
        i = head.index + head[0].length,
        start = i;
      for (; i < mask.length && depth; i++) {
        if (mask[i] === '{') depth++;
        else if (mask[i] === '}') depth--;
      }
      if (depth) fail('Bloque sin cerrar.');
      blocks[name] = src.slice(start, i - 1);
      ranges.push([head.index, i]);
    }
    let globals = src;
    for (const [start, end] of ranges.sort((a, b) => b[0] - a[0]))
      globals = globals.slice(0, start) + ' '.repeat(end - start) + globals.slice(end);
    const constants = [];
    for (const statement of statements(globals)) {
      const m = new RegExp(
        '^(?:static\\s+)?(?:const|constexpr)\\s+(?:(unsigned|signed)\\s+)?(byte|int|long|uint8_t|uint16_t|uint32_t)\\s+([A-Za-z_]\\w*)\\s*=\\s*(' +
          atom +
          ')$',
      ).exec(statement);
      if (!m) fail('Solo se admiten constantes simples, setup() y loop() lineales.');
      ctx.define(m[3], m[4]);
      constants.push(m);
    }
    for (const m of constants) {
      const n = ctx.resolve(m[3]),
        max = /^(byte|uint8_t)$/.test(m[2])
          ? 255
          : m[2] === 'uint16_t' || (m[2] === 'int' && m[1] === 'unsigned')
            ? 65535
            : m[2] === 'uint32_t' || (m[2] === 'long' && m[1] === 'unsigned')
              ? 4294967295
              : m[2] === 'long'
                ? 2147483647
                : 32767;
      if (!Number.isInteger(n) || n > max)
        fail('Constante fuera del rango conservador de su tipo.');
    }
    function parse(body, setup) {
      for (const s of statements(body)) {
        let m;
        if (
          setup &&
          (m = new RegExp('^pinMode\\s*\\(\\s*(' + atom + ')\\s*,\\s*OUTPUT\\s*\\)$').exec(s))
        )
          build.configure(ctx.pin(m[1]));
        else if (
          (m = new RegExp(
            '^digitalWrite\\s*\\(\\s*(' + atom + ')\\s*,\\s*(' + atom + ')\\s*\\)$',
          ).exec(s))
        )
          build.write(ctx.pin(m[1]), ctx.resolve(m[2]), setup);
        else if (!setup && (m = new RegExp('^delay\\s*\\(\\s*(' + atom + ')\\s*\\)$').exec(s))) {
          const ms = ctx.resolve(m[1]);
          if (!Number.isInteger(ms)) fail('Arduino: usa esperas enteras en milisegundos.');
          build.delay(ms);
        } else if (setup && /^Serial\.begin\s*\(\s*\d+\s*\)$/.test(s)) build.ignoreSerial();
        else if (
          new RegExp('^Serial\\.(?:print|println)\\s*\\(\\s*' + literal + '?\\s*\\)$').test(s)
        )
          build.ignoreSerial();
        else
          fail(
            'Instrucción no representada: ' +
              s.slice(0, 70) +
              '. Se admiten escrituras y esperas lineales.',
          );
      }
    }
    parse(blocks.setup, true);
    parse(blocks.loop, false);
    return build.finish();
  }
  function analyzePy(code, fqbn) {
    const ctx = context(fqbn);
    if (ctx.board.avr)
      fail('Este perfil AVR usa Arduino C++; selecciona un perfil MicroPython adecuado.');
    if (/\t|"""|'''/.test(code))
      fail('Usa espacios y comentarios de una línea en este subconjunto MicroPython.');
    const lines = clean(code, true)
      .split(/\r?\n/)
      .filter((line) => line.trim());
    const build = builder(ctx, 'py'),
      pins = new Map();
    let inLoop = false,
      indent = null,
      importPin = false,
      importTime = false;
    for (const line of lines) {
      const s = line.trim(),
        spaces = line.length - line.trimStart().length;
      let m;
      if (!inLoop && spaces === 0 && s === 'while True:') {
        inLoop = true;
        continue;
      }
      if (inLoop) {
        if (!spaces) fail('Hay instrucciones fuera del bucle MicroPython.');
        if (indent === null) indent = spaces;
        if (spaces !== indent) fail('No se admiten bloques anidados ni condiciones.');
      } else if (spaces) fail('Indentación fuera del bucle.');
      if (!inLoop && s === 'from machine import Pin') {
        importPin = true;
        continue;
      }
      if (!inLoop && s === 'import time') {
        importTime = true;
        continue;
      }
      if (!inLoop && (m = new RegExp('^([A-Z_]\\w*)\\s*=\\s*(' + atom + ')$').exec(s))) {
        ctx.define(m[1], m[2]);
        continue;
      }
      if (
        !inLoop &&
        (m = new RegExp(
          '^([A-Za-z_]\\w*)\\s*=\\s*Pin\\(\\s*(' + atom + ')\\s*,\\s*Pin\\.OUT\\s*\\)$',
        ).exec(s))
      ) {
        if (!importPin || pins.has(m[1]) || ['time', 'Pin'].includes(m[1]))
          fail('Importa Pin y usa nombres de salida distintos.');
        const pin = ctx.pin(m[2]);
        pins.set(m[1], pin);
        build.configure(pin, null);
        continue;
      }
      if ((m = new RegExp('^([A-Za-z_]\\w*)\\.(on|off)\\(\\s*\\)$').exec(s))) {
        if (!pins.has(m[1])) fail('Salida MicroPython no declarada.');
        build.write(pins.get(m[1]), m[2] === 'on' ? 1 : 0, !inLoop);
        continue;
      }
      if ((m = new RegExp('^([A-Za-z_]\\w*)\\.value\\(\\s*(' + atom + ')\\s*\\)$').exec(s))) {
        if (!pins.has(m[1])) fail('Salida MicroPython no declarada.');
        build.write(pins.get(m[1]), ctx.resolve(m[2]), !inLoop);
        continue;
      }
      if (inLoop && (m = new RegExp('^time\\.sleep(_ms)?\\(\\s*(' + atom + ')\\s*\\)$').exec(s))) {
        if (!importTime) fail('Falta import time.');
        build.delay(ctx.resolve(m[2]) * (m[1] ? 1 : 1000));
        continue;
      }
      if (new RegExp('^print\\(\\s*' + quoted + '\\s*\\)$').test(s)) {
        build.ignoreSerial();
        continue;
      }
      fail('Instrucción MicroPython no representada: ' + s.slice(0, 70));
    }
    if (!inLoop) fail('No se encuentra while True:');
    return build.finish();
  }
  function analyze(code, lang, options = {}) {
    try {
      if (typeof code !== 'string' || code.length > 100000)
        fail('El modelo admite hasta 100000 caracteres.');
      const fqbn = typeof options === 'string' ? options : options.fqbn || '';
      return lang === 'py' ? analyzePy(code, fqbn) : analyzeCpp(code, fqbn);
    } catch (error) {
      return { supported: false, reason: error.message };
    }
  }
  function output(model, elapsedMs, pin = model?.pins?.[0]) {
    if (!model?.supported || !model.pins.includes(Number(pin))) return null;
    pin = Number(pin);
    const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0,
      point = elapsed % model.period;
    let value = (elapsed >= model.period ? model.endState : model.initial)[pin];
    for (const event of model.events) {
      if (event.at > point) break;
      if (event.kind === 'write' && event.pin === pin) value = event.value;
    }
    return value;
  }
  function nextTime(model, elapsedMs) {
    if (!model?.supported) return 0;
    const elapsed = Math.max(0, Number(elapsedMs) || 0),
      cycle = Math.floor(elapsed / model.period),
      phase = elapsed % model.period;
    const boundaries = model.events.filter((e) => e.kind === 'delay').map((e) => e.at + e.ms);
    return (
      cycle * model.period + (boundaries.find((time) => time > phase + 0.00001) ?? model.period)
    );
  }
  function draw(canvas, model, elapsed = 0, selectedPin) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pins = model?.supported ? model.pins : [],
      height = 140 + Math.max(1, pins.length) * 42;
    if (canvas.height !== height) canvas.height = height;
    const W = canvas.width;
    ctx.clearRect(0, 0, W, height);
    ctx.fillStyle = '#08111a';
    ctx.fillRect(0, 0, W, height);
    ctx.fillStyle = '#bcecff';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(model?.board || 'SIMULADOR LÓGICO', 16, 26);
    ctx.fillStyle = '#91a5b9';
    ctx.font = '11px monospace';
    ctx.fillText('Tiempo virtual: ' + Math.round(elapsed) + ' ms', 16, 47);
    if (!pins.length) {
      ctx.fillStyle = '#f5c469';
      ctx.fillText('Analiza una secuencia digital compatible.', 16, 90);
    }
    pins.forEach((pin, index) => {
      const y = 76 + index * 42,
        value = output(model, elapsed, pin);
      ctx.fillStyle = Number(selectedPin) === pin ? '#102e40' : '#0e1b28';
      ctx.fillRect(10, y - 17, W - 20, 38);
      ctx.beginPath();
      ctx.arc(25, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = value === 1 ? '#44dbac' : '#526b7b';
      ctx.fill();
      ctx.fillStyle = '#dbeaf6';
      ctx.font = '11px monospace';
      ctx.fillText('D' + pin + ' ' + (value === null ? 'N/D' : value ? 'HIGH' : 'LOW'), 39, y + 4);
      ctx.strokeStyle = '#284357';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const x = 145 + ((W - 165) * i) / 4;
        ctx.beginPath();
        ctx.moveTo(x, y - 12);
        ctx.lineTo(x, y + 12);
        ctx.stroke();
      }
      const span = model.period,
        left = Math.floor(elapsed / model.period) * model.period;
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      let drawing = false;
      for (let i = 0; i < 240; i++) {
        const t = left + (i / 239) * span,
          x = 145 + (i / 239) * (W - 165),
          v = output(model, t, pin),
          level = y + (v ? -9 : 9);
        if (v === null) {
          drawing = false;
          continue;
        }
        if (!drawing) ctx.moveTo(x, level);
        else ctx.lineTo(x, level);
        drawing = true;
      }
      ctx.stroke();
      const cursor = 145 + ((elapsed % span) / span) * (W - 165);
      ctx.strokeStyle = '#f5c469';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cursor, y - 13);
      ctx.lineTo(cursor, y + 13);
      ctx.stroke();
    });
    ctx.fillStyle = '#91a5b9';
    ctx.font = '10px monospace';
    ctx.fillText(
      pins.length
        ? 'TRAZA DEL CICLO · CURSOR ÁMBAR = TIEMPO ACTUAL'
        : 'NIVELES DIGITALES · NO VALIDA CONEXIONES',
      16,
      height - 36,
    );
    ctx.fillText('SIN CPU, FIRMWARE NI ACCESO A LA PLACA', 16, height - 17);
  }
  return { analyze, output, nextTime, draw, boardInfo };
});
