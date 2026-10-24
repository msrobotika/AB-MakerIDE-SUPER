/*
  AB MakerIDE · MS Robotika · IdeaSpark ESP32-WROOM-32
  Pantalla TFT ST7789 de 1,9 pulgadas (170 x 320)
  SIN sensores externos. Pines documentados para la variante IdeaSpark 1,9".
  ADVERTENCIA: GPIO2 es DC de la pantalla; NO se debe utilizar como LED.
  Para otras revisiones de placa, confirmar el pinout antes de grabar.
*/
#include <Arduino.h>
#include <SPI.h>
#include <WiFi.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>

#define LCD_SCLK 18
#define LCD_MOSI 23
#define LCD_CS   15
#define LCD_DC    2
#define LCD_RST   4
#define LCD_BL   32

Adafruit_ST7789 tft(LCD_CS, LCD_DC, LCD_RST);
constexpr uint16_t CIAN = 0x07FF;
constexpr uint16_t VERDE = 0x07E0;
constexpr uint16_t VIOLETA = 0xA19F;
constexpr uint16_t GRIS = 0x8C71;
int redes = -1;
uint32_t pasos = 0;
uint32_t ultimo = 0;

void escribir(int16_t x, int16_t y, const String &s,
              uint16_t color, uint8_t size = 1) {
  tft.setTextColor(color);
  tft.setTextSize(size);
  tft.setCursor(x, y);
  tft.print(s);
}

void mostrarColores() {
  const uint16_t colores[6] = {
    ST77XX_RED, ST77XX_GREEN, ST77XX_BLUE,
    ST77XX_YELLOW, ST77XX_CYAN, ST77XX_MAGENTA
  };
  for (int i = 0; i < 6; ++i) {
    int x = i * tft.width() / 6;
    int x2 = (i + 1) * tft.width() / 6;
    tft.fillRect(x, 0, x2-x, tft.height(), colores[i]);
  }
  delay(1200);
}

void actualizar() {
  const int w = tft.width(), h = tft.height();
  tft.fillScreen(ST77XX_BLACK);
  tft.fillRect(0, 0, w, 28, 0x08E4);
  escribir(8, 7, "AB MakerIDE", ST77XX_WHITE, 2);
  tft.drawFastHLine(0, 29, w, CIAN);
  escribir(9, 39, String("CHIP: ") + ESP.getChipModel(), CIAN);
  escribir(9, 61, String("FLASH: ") + String(ESP.getFlashChipSize()/1048576) + " MB", ST77XX_WHITE);
  escribir(9, 83, String("RAM: ") + String(ESP.getFreeHeap()/1024) + " KB libres", VERDE);
  String wifi = redes >= 0 ? String(redes) + " redes" : String("sin lectura");
  escribir(9, 105, String("WIFI: ") + wifi, ST77XX_YELLOW);
  int barY = h - 34;
  tft.drawRect(8, barY, w-16, 9, GRIS);
  int pct = (pasos * 9) % 101;
  tft.fillRect(10, barY+2, (w-20)*pct/100, 5, VIOLETA);
  tft.fillRect(0, h-17, w, 17, 0x08E4);
  escribir(9, h-13, "MS ROBOTIKA | PRUEBA REAL", CIAN);
}

void setup() {
  Serial.begin(115200);
  delay(400);
  Serial.println("AB MakerIDE - IdeaSpark TFT 1.9 - inicio");
  SPI.begin(LCD_SCLK, -1, LCD_MOSI, LCD_CS);
  pinMode(LCD_BL, OUTPUT);
  digitalWrite(LCD_BL, HIGH);
  tft.init(170, 320);
  tft.setRotation(1);
  tft.fillScreen(ST77XX_BLACK);
  escribir(14, 35, "MS ROBOTIKA", ST77XX_CYAN, 2);
  escribir(14, 70, "Probando TFT...", ST77XX_WHITE, 2);
  delay(800);
  mostrarColores();
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  redes = WiFi.scanNetworks(false, true);
  WiFi.scanDelete();
  WiFi.mode(WIFI_OFF);
  actualizar();
  Serial.printf("ESP: %s | Redes: %d\n", ESP.getChipModel(), redes);
}

void loop() {
  if (millis() - ultimo >= 1000) {
    ultimo = millis();
    ++pasos;
    actualizar();
    Serial.printf("AB MakerIDE: %lu s | RAM: %u KB | ciclo: %lu\n",
                  millis()/1000UL, ESP.getFreeHeap()/1024,
                  static_cast<unsigned long>(pasos));
  }
}
