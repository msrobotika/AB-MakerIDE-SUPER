#pragma once

#include <Adafruit_GFX.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

// Coordenadas de diseno; NO declaran la resolucion fisica de la placa.
// El adaptador de pantalla debera proporcionar una superficie de 320 x 240.
class DefensaOrbital {
 public:
  static constexpr int WIDTH = 320;
  static constexpr int HEIGHT = 240;
  struct Input {
    bool down = false;
    int16_t x = 0;
    int16_t y = 0;
  };

  void begin(uint32_t now) {
    rng_ ^= now;
    mode_ = TITLE;
    last_ = now;
    previousDown_ = false;
  }

  void update(uint32_t now, const Input &input) {
    const bool pressed = input.down && !previousDown_;
    previousDown_ = input.down;
    uint32_t elapsed = now - last_;
    last_ = now;
    if (elapsed > 50) elapsed = 50;
    const float dt = elapsed / 1000.0f;

    if (mode_ == TITLE || mode_ == OVER) {
      if (pressed) newGame();
      return;
    }
    if (pressed && input.x >= 278 && input.y < 24) {
      mode_ = mode_ == PAUSED ? PLAY : PAUSED;
      return;
    }
    if (mode_ == PAUSED) return;
    playTime_ += elapsed;
    if (invulnerable_ > elapsed) invulnerable_ -= elapsed;
    else invulnerable_ = 0;
    if (waveWait_ > 0) {
      waveWait_ = waveWait_ > elapsed ? waveWait_ - elapsed : 0;
      if (!waveWait_) nextWave();
      return;
    }

    if (input.down && input.y >= 210) {
      if (input.x < 100) player_ -= 150 * dt;
      else if (input.x < 200) player_ += 150 * dt;
    } else if (input.down && input.y >= 28) {
      // Arrastrar por el campo mueve la nave; el boton DISPARO permite
      // disparar sin movimiento. El disparo es automatico al arrastrar.
      float delta = input.x - player_;
      const float step = 210 * dt;
      if (delta > step) delta = step;
      if (delta < -step) delta = -step;
      player_ += delta;
    }
    if (player_ < 11) player_ = 11;
    if (player_ > 308) player_ = 308;
    if (input.down && input.y >= 28 && playTime_ - shotTime_ >= 280) {
      for (auto &s : playerShots_) {
        if (!s.active) {
          s = {player_, 183.0f, true};
          shotTime_ = playTime_;
          break;
        }
      }
    }

    const uint32_t interval = alive_ * 7 + 55 > wave_ * 12
        ? alive_ * 7 + 55 - wave_ * 12 : 55;
    if (playTime_ - alienTime_ >= interval) {
      alienTime_ = playTime_;
      int left = 320, right = 0;
      for (int i = 0; i < 40; ++i) if (aliens_[i]) {
        const int x = alienX(i);
        if (x < left) left = x;
        if (x + 16 > right) right = x + 16;
      }
      if (left + direction_ * 5 < 5 || right + direction_ * 5 > 315) {
        direction_ = -direction_;
        originY_ += 9;
      } else originX_ += direction_ * 5;
      animation_ ^= 1;
      for (int i = 0; i < 40; ++i)
        if (aliens_[i] && alienY(i) + 12 >= 185) endGame();
    }
    if (mode_ != PLAY) return;

    if (playTime_ - enemyTime_ >= (wave_ < 8 ? 850 - wave_ * 65 : 330)) {
      enemyTime_ = playTime_;
      const int start = randomValue() % 10;
      for (int n = 0; n < 10; ++n) {
        const int col = (start + n) % 10;
        int shooter = -1;
        for (int row = 0; row < 4; ++row)
          if (aliens_[row * 10 + col]) shooter = row * 10 + col;
        if (shooter < 0) continue;
        for (auto &s : enemyShots_) if (!s.active) {
          s = {float(alienX(shooter) + 8), float(alienY(shooter) + 12), true};
          break;
        }
        break;
      }
    }

    for (auto &s : playerShots_) if (s.active) {
      const float oldY = s.y;
      s.y -= 220 * dt;
      if (hitBunker(int(s.x), int(s.y), int(oldY))) { s.active = false; continue; }
      for (int i = 0; i < 40 && s.active; ++i) {
        if (aliens_[i] && s.x >= alienX(i) && s.x < alienX(i) + 16 &&
            s.y <= alienY(i) + 12 && oldY >= alienY(i)) {
          aliens_[i] = false;
          --alive_;
          score_ += (4 - i / 10) * 10;
          s.active = false;
        }
      }
      if (s.y < 24) s.active = false;
    }
    for (auto &s : enemyShots_) if (s.active) {
      const float oldY = s.y;
      s.y += (105 + (wave_ < 12 ? wave_ : 12) * 9) * dt;
      if (hitBunker(int(s.x), int(oldY), int(s.y))) { s.active = false; continue; }
      if (s.x >= player_ - 10 && s.x <= player_ + 10 &&
          oldY <= 197 && s.y >= 185) {
        s.active = false;
        if (!invulnerable_) {
          --lives_;
          invulnerable_ = 1500;
          if (!lives_) endGame();
        }
      }
      if (s.y > 204) s.active = false;
    }
    if (alive_ == 0 && mode_ == PLAY) {
      score_ += 100;
      waveWait_ = 1000;
      clearShots();
    }
    if (score_ > best_) best_ = score_;
  }

  void draw(Adafruit_GFX &g) const {
    g.fillScreen(BLACK);
    g.setTextWrap(false);
    if (mode_ == TITLE) {
      text(g, 40, 35, "DEFENSA", CYAN, 4);
      text(g, 40, 75, "ORBITAL", GREEN, 4);
      sprite(g, 142, 126, 0, GREEN, 2);
      text(g, 40, 166, "TOCA PARA COMENZAR", WHITE, 2);
      text(g, 22, 201, "Arrastra: mover y disparar", CYAN);
      text(g, 22, 218, "O usa los botones inferiores", CYAN);
      return;
    }
    char line[44];
    snprintf(line, sizeof(line), "PTS %05lu  REC %05lu", (unsigned long)score_, (unsigned long)best_);
    text(g, 4, 6, line, WHITE);
    text(g, 283, 5, mode_ == PAUSED ? ">" : "II", CYAN, 2);
    g.drawFastHLine(0, 22, WIDTH, CYAN);
    for (int i = 0; i < 40; ++i)
      if (aliens_[i]) sprite(g, alienX(i), alienY(i), i / 10, i < 10 ? PINK : GREEN);
    for (int b = 0; b < 4; ++b)
      for (int y = 0; y < 3; ++y)
        for (int x = 0; x < 6; ++x)
          if (bunkers_[b][y][x]) g.fillRect(25 + b * 76 + x * 4, 163 + y * 4, 4, 4, GREEN);
    if (!invulnerable_ || (invulnerable_ / 90) % 2) {
      g.fillRect(int(player_) - 10, 191, 21, 6, CYAN);
      g.fillRect(int(player_) - 6, 187, 13, 5, CYAN);
      g.fillRect(int(player_) - 1, 183, 3, 5, WHITE);
    }
    for (const auto &s : playerShots_) if (s.active) g.fillRect(int(s.x), int(s.y), 2, 6, WHITE);
    for (const auto &s : enemyShots_) if (s.active) g.fillRect(int(s.x), int(s.y), 3, 6, PINK);
    snprintf(line, sizeof(line), "VIDAS %u       OLEADA %u", lives_, wave_);
    text(g, 4, 200, line, CYAN);
    g.drawRect(0, 211, 99, 29, CYAN);
    g.drawRect(100, 211, 99, 29, CYAN);
    g.drawRect(200, 211, 120, 29, GREEN);
    text(g, 18, 221, "< IZQ", WHITE);
    text(g, 118, 221, "DER >", WHITE);
    text(g, 233, 221, "DISPARO", GREEN);
    if (waveWait_ && mode_ == PLAY) panel(g, "OLEADA COMPLETA", "Preparando enemigos...");
    if (mode_ == PAUSED) panel(g, "PAUSA", "Toca > para continuar");
    if (mode_ == OVER) panel(g, "FIN DEL JUEGO", "Toca para otra partida");
  }

 private:
  enum Mode { TITLE, PLAY, PAUSED, OVER };
  struct Shot { float x = 0, y = 0; bool active = false; };
  static constexpr uint16_t BLACK = 0x0000, WHITE = 0xFFFF;
  static constexpr uint16_t CYAN = 0x07FF, GREEN = 0x07E0, PINK = 0xF81F;
  Mode mode_ = TITLE;
  Shot playerShots_[3], enemyShots_[5];
  bool aliens_[40] = {};
  bool bunkers_[4][3][6] = {};
  bool previousDown_ = false;
  uint32_t last_ = 0, playTime_ = 0, shotTime_ = 0, alienTime_ = 0, enemyTime_ = 0;
  uint32_t score_ = 0, best_ = 0, rng_ = 0xA3B12F19;
  uint32_t invulnerable_ = 0, waveWait_ = 0;
  uint16_t wave_ = 0;
  uint8_t lives_ = 3, alive_ = 0, animation_ = 0;
  int originX_ = 24, originY_ = 36, direction_ = 1;
  float player_ = 160;

  uint32_t randomValue() {
    rng_ ^= rng_ << 13; rng_ ^= rng_ >> 17; rng_ ^= rng_ << 5;
    return rng_;
  }
  int alienX(int index) const { return originX_ + (index % 10) * 27; }
  int alienY(int index) const { return originY_ + (index / 10) * 22; }
  void clearShots() {
    for (auto &s : playerShots_) s.active = false;
    for (auto &s : enemyShots_) s.active = false;
  }
  void newGame() {
    score_ = 0; lives_ = 3; wave_ = 0; player_ = 160;
    playTime_ = 0; invulnerable_ = 0; waveWait_ = 0;
    mode_ = PLAY;
    nextWave();
  }
  void nextWave() {
    ++wave_; alive_ = 40; originX_ = 24; originY_ = 36; direction_ = 1;
    memset(aliens_, 1, sizeof(aliens_));
    for (int b = 0; b < 4; ++b)
      for (int y = 0; y < 3; ++y)
        for (int x = 0; x < 6; ++x)
          bunkers_[b][y][x] = !(y == 2 && (x == 2 || x == 3));
    clearShots();
    alienTime_ = enemyTime_ = playTime_;
    shotTime_ = playTime_ - 280;
  }
  void endGame() {
    mode_ = OVER;
    if (score_ > best_) best_ = score_;
  }
  bool hitBunker(int x, int top, int bottom) {
    for (int b = 0; b < 4; ++b) {
      const int column = (x - (25 + b * 76));
      if (column < 0 || column >= 24) continue;
      for (int row = 0; row < 3; ++row) {
        const int y = 163 + row * 4;
        if (bunkers_[b][row][column / 4] && bottom >= y && top < y + 4) {
          bunkers_[b][row][column / 4] = false;
          return true;
        }
      }
    }
    return false;
  }
  static void text(Adafruit_GFX &g, int x, int y, const char *value, uint16_t color, uint8_t size = 1) {
    g.setCursor(x, y); g.setTextColor(color); g.setTextSize(size); g.print(value);
  }
  static void panel(Adafruit_GFX &g, const char *heading, const char *detail) {
    g.fillRect(12, 84, 296, 65, BLACK);
    g.drawRect(12, 84, 296, 65, CYAN);
    text(g, 24, 96, heading, WHITE, 2);
    text(g, 24, 128, detail, CYAN);
  }
  void sprite(Adafruit_GFX &g, int x, int y, int kind, uint16_t color, int scale = 1) const {
    static const uint8_t images[2][2][6] = {
      {{0x18, 0x7E, 0xDB, 0xFF, 0x24, 0x42}, {0x18, 0x7E, 0xDB, 0xFF, 0x42, 0x24}},
      {{0x42, 0x24, 0x7E, 0xDB, 0xFF, 0x81}, {0x42, 0x24, 0x7E, 0xDB, 0xFF, 0x24}}
    };
    for (int row = 0; row < 6; ++row)
      for (int col = 0; col < 8; ++col)
        if (images[kind % 2][animation_][row] & (0x80 >> col))
          g.fillRect(x + col * 2 * scale, y + row * 2 * scale, 2 * scale, 2 * scale, color);
  }
};
