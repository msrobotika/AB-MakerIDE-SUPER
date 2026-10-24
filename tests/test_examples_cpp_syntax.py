"""C++ grammar smoke tests against stubbed Arduino types (NOT a real Arduino build)."""
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
HEADER=r'''
#pragma once
#include <cstdint>
#include <string>
using uint8_t = std::uint8_t;using uint16_t = std::uint16_t;
using uint32_t = std::uint32_t;
struct String:std::string{ using std::string::string;String(const std::string &s):std::string(s){}String(unsigned n):std::string(std::to_string(n)){}String(int n):std::string(std::to_string(n)){} };
inline String operator+(const String&a,const char*b){return String(static_cast<std::string>(a)+b);}
inline String operator+(const String&a,const String&b){return String(static_cast<std::string>(a)+static_cast<std::string>(b));}
struct {void begin(int){}; template<typename... T> void printf(const char *, T...){};void println(const char*){};} Serial;
struct {const char* getChipModel(){return "ESP32";}unsigned getFlashChipSize(){return 16777216;}unsigned getFreeHeap(){return 204800;}} ESP;
inline unsigned long millis(){return 0;}inline void delay(unsigned){}inline void pinMode(int,int){}inline void digitalWrite(int,int){}
constexpr int OUTPUT=1,HIGH=1,WIFI_STA=1,WIFI_OFF=0;
struct {void begin(int,int,int,int){};} SPI;
struct {void mode(int){};void disconnect(){};int scanNetworks(bool,bool){return 2;}void scanDelete(){};} WiFi;
constexpr uint16_t ST77XX_RED=0xF800,ST77XX_GREEN=0x7E0,ST77XX_BLUE=0x001F,
ST77XX_YELLOW=0xFFE0,ST77XX_CYAN=0x07FF,ST77XX_MAGENTA=0xF81F,ST77XX_BLACK=0,ST77XX_WHITE=0xFFFF;
struct Adafruit_ST7789 {Adafruit_ST7789(int,int,int){};void init(int,int){};void setRotation(int){};void fillScreen(uint16_t){};void setTextColor(uint16_t){};void setTextSize(int){};void setCursor(int,int){};void print(const String&){};void drawFastHLine(int,int,int,uint16_t){};void fillRect(int,int,int,int,uint16_t){};void drawRect(int,int,int,int,uint16_t){};int width(){return 320;}int height(){return 170;}};
'''
class SketchSyntax(unittest.TestCase):
    def test_ideaspark_examples_cpp_grammar(self):
        if not shutil.which('g++'):
            self.skipTest('g++ no disponible; esto no comprueba Arduino Core')
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)
            for name in ('Arduino.h','SPI.h','WiFi.h','Adafruit_GFX.h','Adafruit_ST7789.h'):
                (p/name).write_text(HEADER if name=='Arduino.h' else '#include "Arduino.h"\n')
            for size in ('19','114'):
                source=ROOT/'examples'/f'ideaspark_{size}_st7789.ino'
                with self.subTest(size=size):
                    result=subprocess.run(['g++','-std=c++17','-fsyntax-only','-x','c++','-I',str(p),str(source)],capture_output=True,text=True,timeout=30)
                    self.assertEqual(result.returncode,0,result.stderr)
