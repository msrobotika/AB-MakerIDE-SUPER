#pragma once
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <stdlib.h>
#include <string.h>

// Paleta exacta del motor. Dos buffers de 76.800 bytes, sin PSRAM ni hashes.
class CYDFrame : public Adafruit_GFX {
 public:
  CYDFrame() : Adafruit_GFX(320, 240) {}
  bool begin() {
    pixels_ = static_cast<uint8_t *>(calloc(320 * 240, 1));
    previous_ = static_cast<uint8_t *>(malloc(320 * 240));
    return pixels_ && previous_;
  }
  void drawPixel(int16_t x, int16_t y, uint16_t color) override {
    if (x >= 0 && x < 320 && y >= 0 && y < 240)
      pixels_[y * 320 + x] = index(color);
  }
  void fillScreen(uint16_t color) override {
    memset(pixels_, index(color), 320 * 240);
  }
  void fillRect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color) override {
    if (w <= 0 || h <= 0) return;
    int left = max(0, int(x)), top = max(0, int(y));
    int right = min(320, int(x) + w), bottom = min(240, int(y) + h);
    if (left >= right || top >= bottom) return;
    uint8_t value = index(color);
    for (int row = top; row < bottom; ++row)
      memset(pixels_ + row * 320 + left, value, right - left);
  }
  void drawFastHLine(int16_t x, int16_t y, int16_t w, uint16_t c) override {
    fillRect(x, y, w, 1, c);
  }
  void drawFastVLine(int16_t x, int16_t y, int16_t h, uint16_t c) override {
    fillRect(x, y, 1, h, c);
  }
  void present(Adafruit_ILI9341 &lcd) {
    // SpaceInvaders::draw borra solo RAM. El LCD recibe filas finales cambiadas.
    lcd.startWrite();
    int y = 0;
    while (y < 240) {
      if (valid_ && memcmp(pixels_ + y * 320, previous_ + y * 320, 320) == 0) {
        ++y; continue;
      }
      int first = y++;
      while (y < 240 && (!valid_ || memcmp(pixels_ + y * 320, previous_ + y * 320, 320) != 0)) ++y;
      lcd.setAddrWindow(0, first, 320, y - first);
      for (int row = first; row < y; ++row) {
        const uint8_t *src = pixels_ + row * 320;
        for (int x = 0; x < 320; ++x) line_[x] = palette_[src[x]];
        lcd.writePixels(line_, 320, true, false);
        memcpy(previous_ + row * 320, src, 320);
      }
    }
    lcd.endWrite(); valid_ = true;
  }
 private:
  uint8_t *pixels_ = nullptr, *previous_ = nullptr;
  uint16_t line_[320];
  bool valid_ = false;
  const uint16_t palette_[5] = {0x0000, 0xFFFF, 0x07FF, 0x07E0, 0xF81F};
  static uint8_t index(uint16_t color) {
    switch (color) {
      case 0xFFFF: return 1;
      case 0x07FF: return 2;
      case 0x07E0: return 3;
      case 0xF81F: return 4;
      default: return 0;
    }
  }
};
