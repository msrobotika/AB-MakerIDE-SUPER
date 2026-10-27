import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, addWidget } from '../frontend/screenlab-core.js';
import { generateArduinoSketch, rgb565 } from '../frontend/screenlab-sketch.js';

test('IdeaSpark sketch has documented pins, rotation and safe boot', () => {
  const code = generateArduinoSketch(addWidget(createProject('ideaspark'), 'bar'));
  for (const term of [
    '#include <Arduino.h>',
    '#include <Adafruit_ST7789.h>',
    'SL_CLK = 18',
    'SL_MOSI = 23',
    'SL_CS = 15',
    'SL_DC = 2',
    'SL_RST = 4',
    'SL_BL = 32',
    'tft.init(135, 240);',
    'tft.setRotation(1);',
    'tft.drawRect(',
    'tft.fillRect(',
    'void setup()',
    'void loop()',
    'SCREENLAB_STATIC_READY profile=ideaspark touch=OFF',
  ])
    assert.ok(code.includes(term), term);
  assert.equal(code.includes('lvgl.h'), false);
  assert.equal(code.includes('XPT2046_Touchscreen.h'), false);
  assert.equal(code.includes('WiFi.h'), false);
});
test('CYD sketch uses separate HSPI and never enables touch or SD', () => {
  const code = generateArduinoSketch(createProject('cyd'));
  for (const token of [
    'SPIClass screenBus(HSPI);',
    '#include <Adafruit_ILI9341.h>',
    'screenBus.begin(14, 12, 13, 15);',
    'tft.setRotation(1);',
    'pinMode(5, OUTPUT);',
    'digitalWrite(5, HIGH);',
    'pinMode(21, OUTPUT);',
  ])
    assert.ok(code.includes(token), token);
  assert.ok(!code.includes('touch.begin('));
  assert.ok(!code.includes('SD.begin('));
});
test('non-audited profile and motion never produce a silently degraded sketch', () => {
  assert.throws(() => generateArduinoSketch(createProject('generic')), /controlador/);
  for (const motion of ['fade-in', 'slide-in', 'pulse']) {
    const p = createProject('ideaspark');
    p.widgets[0].motion = motion;
    assert.throws(() => generateArduinoSketch(p), /estático/);
  }
});
test('generated strings are safe ASCII C++ literals, not executable code', () => {
  const p = createProject('ideaspark');
  p.widgets[0].text = '¡Año! "LED" \\ final';
  const code = generateArduinoSketch(p);
  assert.ok(code.includes('Ano!'));
  assert.ok(code.includes('\\"LED\\"'));
  assert.ok(!code.includes('¡'));
  const malicious = createProject('cyd');
  malicious.widgets[0].text = '";digitalWrite(2,1);//';
  const source = generateArduinoSketch(malicious);
  assert.ok(source.includes('\\";digitalWrite'));
  assert.equal(source.split('digitalWrite(2,1)').length, 2);
});
test('generated sketch remains independent of state and deterministic', () => {
  const p = createProject('ideaspark');
  const snapshot = JSON.stringify(p);
  assert.equal(generateArduinoSketch(p), generateArduinoSketch(p));
  assert.equal(JSON.stringify(p), snapshot);
});

test('RGB888 palette is converted exactly to Adafruit RGB565', () => {
  for (const [source, expected] of [
    ['#ff0000', '0xF800'],
    ['#00ff00', '0x07E0'],
    ['#0000ff', '0x001F'],
    ['#ffffff', '0xFFFF'],
    ['#000000', '0x0000'],
  ])
    assert.equal(rgb565(source), expected);
  assert.throws(() => rgb565('0xff0000'), /RGB888/);
  assert.throws(() => rgb565('#xyzxyz'), /RGB888/);
  const design = createProject('ideaspark');
  design.background = '#ff0000';
  design.widgets[0].color = '#00ff00';
  const code = generateArduinoSketch(design);
  assert.ok(code.includes('tft.fillScreen(0xF800);'));
  assert.ok(code.includes('tft.setTextColor(0x07E0);'));
  assert.ok(!code.includes('tft.fillScreen(0xFF0000);'));
});
