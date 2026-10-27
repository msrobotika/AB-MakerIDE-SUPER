// AB ScreenLab: bounded Arduino/Adafruit TFT sketch for identified display profiles.
// This is a separate rendering backend from LVGL. NEVER reads or flashes a device.
import { bounds, validateProject } from './screenlab-core.js';

// Convert CSS RGB888 into 16-bit RGB565 required by Adafruit GFX TFT drivers.
export function rgb565(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw Error('Color RGB888 inválido');
  const red = Number.parseInt(hex.slice(1, 3), 16) >> 3;
  const green = Number.parseInt(hex.slice(3, 5), 16) >> 2;
  const blue = Number.parseInt(hex.slice(5, 7), 16) >> 3;
  return '0x' + ((red << 11) | (green << 5) | blue).toString(16).toUpperCase().padStart(4, '0');
}
const pcolor = rgb565;
function literal(text, limit) {
  // Adafruit's built-in 5x7 font covers printable ASCII, not Unicode.
  const ascii = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const cropped = [...ascii].map((c) => (/[\x20-\x7E]/.test(c) ? c : '?')).join('');
  return (
    '"' + cropped.slice(0, Math.max(0, limit)).replaceAll('\\', '\\\\').replaceAll('"', '\\"') + '"'
  );
}

const drivers = Object.freeze({
  ideaspark: [
    '#include <Adafruit_ST7789.h>',
    '// Reference: IdeaSpark ESP32-WROOM-32, ST7789 135x240 (landscape).',
    '// Pins from verified MakerIDE physical example; verify board revision.',
    'constexpr int SL_CLK = 18, SL_MOSI = 23;',
    'constexpr int SL_CS = 15, SL_DC = 2, SL_RST = 4, SL_BL = 32;',
    'Adafruit_ST7789 tft(&SPI, SL_CS, SL_DC, SL_RST);',
    'void screenInit() {',
    '  pinMode(SL_BL, OUTPUT);',
    '  digitalWrite(SL_BL, LOW);',
    '  SPI.begin(SL_CLK, -1, SL_MOSI, SL_CS);',
    '  tft.init(135, 240);',
    '  tft.setRotation(1);',
    '  digitalWrite(SL_BL, HIGH);',
    '}',
  ],
  cyd: [
    '#include <Adafruit_ILI9341.h>',
    '// Reference: CYD ESP32-2432S028R, ILI9341 240x320 (landscape).',
    '// Pins from verified MakerIDE physical example; verify board revision.',
    'SPIClass screenBus(HSPI);',
    'Adafruit_ILI9341 tft(&screenBus, 2, 15, -1);',
    'void screenInit() {',
    '  pinMode(5, OUTPUT);',
    '  digitalWrite(5, HIGH); // SD deselected; do not mount or write SD.',
    '  pinMode(21, OUTPUT);',
    '  digitalWrite(21, LOW);',
    '  screenBus.begin(14, 12, 13, 15);',
    '  tft.begin(20000000);',
    '  tft.setRotation(1);',
    '  digitalWrite(21, HIGH);',
    '}',
  ],
});

export function generateArduinoSketch(design) {
  const p = validateProject(design);
  if (!Object.hasOwn(drivers, p.profile))
    throw Error('No hay controlador Arduino auditado para este perfil.');
  if (p.widgets.some((v) => (v.motion ?? 'none') !== 'none'))
    throw Error('El sketch Adafruit es estático: desactiva MotionLab o exporta LVGL .h.');
  const screen = bounds(p);
  const code = [
    '// AB ScreenLab | MS Robotika | generated single-file Arduino sketch',
    '// Renderer: Adafruit GFX, static layout only. No LVGL required.',
    '// Requires installed esp32:esp32 core and Adafruit GFX + display driver.',
    '// NO touch, buttons are visual ONLY. No GPIO actuators or Wi-Fi.',
    '// NO hardware was detected or identified while generating this file.',
    '#include <Arduino.h>',
    '#include <SPI.h>',
    '#include <Adafruit_GFX.h>',
    '#if !defined(ARDUINO_ARCH_ESP32)',
    '#error "Board must be an ESP32 with the confirmed physical display profile."',
    '#endif',
    ...drivers[p.profile],
    '',
    'void drawScreen() {',
    '  tft.setTextWrap(false);',
    '  tft.fillScreen(' + pcolor(p.background) + ');',
  ];
  for (const item of p.widgets) {
    const { x, y, width: w, height: h, color, type, text, value, id } = item;
    const tint = pcolor(color);
    const safeText = literal(text, Math.floor((w - 4) / 6));
    code.push('  // ScreenLab widget ' + id + ': ' + type);
    if (type === 'label') {
      code.push('  tft.setTextSize(1);');
      code.push('  tft.setTextColor(' + tint + ');');
      code.push('  tft.setCursor(' + (x + 2) + ', ' + (y + 2) + ');');
      code.push('  tft.print(' + safeText + ');');
    } else if (type === 'button') {
      code.push(
        '  tft.fillRoundRect(' +
          [x, y, w, h, Math.min(7, Math.floor(h / 4)), tint].join(', ') +
          ');',
      );
      code.push(
        '  tft.drawRoundRect(' +
          [x, y, w, h, Math.min(7, Math.floor(h / 4)), '0xFFFFFF'].join(', ') +
          ');',
      );
      code.push('  tft.setTextColor(0xFFFFFF);');
      code.push('  tft.setTextSize(1);');
      code.push(
        '  tft.setCursor(' + (x + 2) + ', ' + (y + Math.max(2, Math.floor((h - 8) / 2))) + ');',
      );
      code.push('  tft.print(' + safeText + ');');
    } else if (type === 'bar') {
      code.push('  tft.fillRect(' + [x, y, w, h, pcolor('#294455')].join(', ') + ');');
      if (value > 0) {
        code.push(
          '  tft.fillRect(' + [x, y, Math.floor((w * value) / 100), h, tint].join(', ') + ');',
        );
      }
      code.push('  tft.drawRect(' + [x, y, w, h, '0xFFFFFF'].join(', ') + ');');
    } else if (type === 'panel') {
      code.push('  tft.fillRect(' + [x, y, w, h, tint].join(', ') + ');');
      code.push('  tft.drawRect(' + [x, y, w, h, '0xFFFFFF'].join(', ') + ');');
    }
  }
  code.push(
    '}',
    '',
    'void setup() {',
    '  Serial.begin(115200);',
    '  screenInit();',
    '  if (tft.width() != ' + screen.width + ' || tft.height() != ' + screen.height + ') {',
    '    Serial.println("SCREENLAB_WRONG_DISPLAY_DIMENSIONS");',
    '    return;',
    '  }',
    '  drawScreen();',
    '  Serial.println("SCREENLAB_STATIC_READY profile=' + p.profile + ' touch=OFF");',
    '}',
    '',
    'void loop() {',
    '  delay(100); // Static image, no actions, no sensor/network access.',
    '}',
    '',
  );
  return code.join('\n');
}
