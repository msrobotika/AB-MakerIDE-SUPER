/* AB MakerIDE / MS Robotika - radar visual para la IdeaSpark de Salto Robot.
 * Pantalla ST7789 135x240, rotacion 1: 240x135.
 * Conexionado recuperado del proyecto que el usuario confirmo como funcional.
 * Ecos SIMULADOS: no hay sensor ni medicion de distancias.
 * Un solo archivo: no necesita radar_config.h ni cambios en TFT_eSPI.
 */
#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <math.h>

#if !defined(ARDUINO_ARCH_ESP32)
#error "Selecciona ESP32 Dev Module; Arduino Uno no es compatible."
#endif

constexpr int LCD_MOSI = 23, LCD_SCLK = 18, LCD_CS = 15;
constexpr int LCD_DC = 2, LCD_RST = 4, LCD_BL = 32;
constexpr int WIDTH = 240, HEIGHT = 135;
constexpr int CENTER_X = 66, CENTER_Y = 74, RADIUS = 54;
constexpr uint32_t FRAME_INTERVAL_MS = 40;
Adafruit_ST7789 display(&SPI, LCD_CS, LCD_DC, LCD_RST);
GFXcanvas16 canvas(WIDTH, HEIGHT);
uint32_t lastFrame = 0, lastReport = 0, frameNumber = 0;
uint16_t bearing = 0;

struct RadarEcho { uint16_t angle; uint8_t distance; };
const RadarEcho echoes[] = {{30, 38}, {118, 25}, {215, 46}, {312, 33}};

uint16_t green(uint8_t brightness) {
  return static_cast<uint16_t>((brightness >> 2) << 5);
}

void polarPoint(int degrees, int distance, int16_t &x, int16_t &y) {
  const float radians = (degrees - 90) * DEG_TO_RAD;
  x = CENTER_X + lroundf(cosf(radians) * distance);
  y = CENTER_Y + lroundf(sinf(radians) * distance);
}

void textAt(int x, int y, const char *text, uint16_t color) {
  canvas.setCursor(x, y);
  canvas.setTextColor(color);
  canvas.print(text);
}

void drawFrame() {
  canvas.fillScreen(ST77XX_BLACK);
  canvas.setTextWrap(false);
  canvas.setTextSize(1);
  textAt(7, 3, "RADAR", ST77XX_GREEN);
  textAt(134, 3, "MS ROBOTIKA", ST77XX_CYAN);
  for (int radius = 18; radius <= RADIUS; radius += 18)
    canvas.drawCircle(CENTER_X, CENTER_Y, radius, green(55));
  for (int degrees = 0; degrees < 360; degrees += 45) {
    int16_t x, y;
    polarPoint(degrees, RADIUS, x, y);
    canvas.drawLine(CENTER_X, CENTER_Y, x, y, green(32));
  }
  // Redibujado en RAM: cola y ecos sin acumular pixeles ni parpadeo por borrado.
  for (int age = 32; age >= 0; --age) {
    int16_t x, y;
    polarPoint(static_cast<int>(bearing) - age, RADIUS - 1, x, y);
    canvas.drawLine(CENTER_X, CENTER_Y, x, y, green(28 + (32 - age) * 7));
  }
  for (const RadarEcho &echo : echoes) {
    const int age = (bearing + 360 - echo.angle) % 360;
    if (age < 110) {
      int16_t x, y;
      polarPoint(echo.angle, echo.distance, x, y);
      const uint8_t brightness = 255 - age * 2;
      canvas.drawCircle(x, y, 4, green(brightness / 3));
      canvas.fillCircle(x, y, 2, green(brightness));
    }
  }
  canvas.drawCircle(CENTER_X, CENTER_Y, RADIUS, green(135));
  canvas.fillCircle(CENTER_X, CENTER_Y, 2, ST77XX_WHITE);
  canvas.drawFastVLine(126, 20, 110, green(65));
  textAt(137, 26, "BARRIDO 360", ST77XX_GREEN);
  char angleText[20];
  snprintf(angleText, sizeof(angleText), "AZIMUT %03u", static_cast<unsigned>(bearing));
  textAt(137, 45, angleText, ST77XX_WHITE);
  textAt(137, 65, "4 ECOS DEMO", green(210));
  textAt(137, 87, "SIMULADO", ST77XX_YELLOW);
  textAt(137, 104, "SIN SENSOR", green(140));
  textAt(137, 123, "ESP32 / TFT", ST77XX_CYAN);
  display.drawRGBBitmap(0, 0, canvas.getBuffer(), WIDTH, HEIGHT);
  ++frameNumber;
}

void setup() {
  Serial.begin(115200);
  pinMode(LCD_BL, OUTPUT);
  digitalWrite(LCD_BL, LOW);
  if (!canvas.getBuffer()) {
    Serial.println("RADAR ERROR: no hay memoria para el lienzo.");
    while (true) delay(1000);
  }
  SPI.begin(LCD_SCLK, -1, LCD_MOSI, LCD_CS); // Igual que Salto Robot; sin MISO.
  display.init(135, 240);
  display.setRotation(1);
  display.setSPISpeed(27000000);
  display.fillScreen(ST77XX_BLACK);
  digitalWrite(LCD_BL, HIGH);
  Serial.println("RADAR IDEASPARK | ST7789 240x135 | ECOS SIMULADOS");
  Serial.println("MOSI23 SCLK18 CS15 DC2 RST4 BL32 | sin sensores ni Wi-Fi");
  drawFrame();
  lastFrame = millis();
}

void loop() {
  const uint32_t now = millis();
  if (now - lastFrame >= FRAME_INTERVAL_MS) {
    lastFrame = now;
    bearing = (bearing + 3) % 360;
    drawFrame();
  }
  if (now - lastReport >= 10000) {
    lastReport = now;
    Serial.printf("RADAR_SIMULADO frames=%lu azimut=%u heap=%u\n",
                  static_cast<unsigned long>(frameNumber), bearing, ESP.getFreeHeap());
  }
  delay(1);
}
