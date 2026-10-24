"""Multi-board v0.7 regression tests. Not a substitute for Arduino CLI or hardware."""
from pathlib import Path
import re
import unittest
import subprocess
import shutil
import tempfile
from unittest.mock import patch
import server

ROOT = Path(__file__).resolve().parents[1]
UNO = (ROOT / 'examples/uno_r3_diagnostico.ino').read_text(encoding='utf-8')
CAM = (ROOT / 'examples/esp32cam_ai_thinker_test.ino').read_text(encoding='utf-8')

class MultiBoardTests(unittest.TestCase):
    def test_board_catalog_contains_targets(self):
        from_cli = {'ok': True, 'error': '', 'data': {'boards': [
            {'name': 'Arduino Uno', 'fqbn': 'arduino:avr:uno'},
            {'name': 'ESP32-CAM', 'fqbn': 'esp32:esp32:esp32cam'}]}}
        with patch.object(server, '_cli_json', return_value=from_cli):
            catalog = server.board_catalog(refresh=True)
        fb = {b['fqbn'] for b in catalog['boards']}
        self.assertIn('arduino:avr:uno', fb)
        self.assertIn('esp32:esp32:esp32cam', fb)
        server.CATALOG_CACHE.update(until=0, result=None)
    def test_examples_are_whitelisted_static_only(self):
        s = (ROOT / 'server.py').read_text(encoding='utf-8')
        self.assertIn("'/examples/uno_r3_diagnostico.ino'", s)
        self.assertIn("'/examples/esp32cam_ai_thinker_test.ino'", s)
        self.assertIn('parsed.path in', s)
        self.assertNotIn('parsed.path.lstrip(\'/\')).resolve()', s)
    def test_ui_has_buttons_and_no_automatic_flash(self):
        s = (ROOT / 'app.js').read_text(encoding='utf-8')
        for x in ('arduino:avr:uno', 'esp32:esp32:esp32cam', 'hardwareLabAvailable()'):
            self.assertIn(x, s)
        self.assertIn('if(!confirm(advisory', s)
        self.assertIn('ESP32-S3-CAM', s)
        self.assertIn('hardwareLabAvailable() && lab.connections.length',s)
        self.assertIn('updateHardwareLabVisibility()',s)
    def test_camera_is_serial_only_no_network_or_sd(self):
        for token in ('WiFi.begin','WiFi.softAP','SD_MMC.begin','esp_http_server','SD.begin'):
            self.assertNotIn(token, CAM)
        for token in ('esp_camera_fb_get()', 'esp_camera_fb_return(fb)', 'Serial.begin(115200)', 'CAM_Y9     35', 'CAM_Y2      5'):
            self.assertIn(token,CAM)
        self.assertIn('NO sirve para ESP32-S3-CAM', CAM)
    def test_uno_no_external_deps(self):
        self.assertIn('LED_BUILTIN',UNO)
        self.assertIn('Serial.begin(115200)',UNO)
        self.assertIn('modoAuto',UNO)
        self.assertNotIn('#include <Adafruit',UNO)
        self.assertNotIn('ESP.',UNO)
    def test_ino_contains_setup_and_loop(self):
        for source in (UNO, CAM):
            self.assertRegex(source,r'void\s+setup\s*\(\s*\)')
            self.assertRegex(source,r'void\s+loop\s*\(\s*\)')
    def test_uno_syntax_cpp_stubs(self):
        if not shutil.which('g++'): self.skipTest('g++ unavailable')
        header='''#pragma once
#include <cstdint>
using uint8_t=std::uint8_t;
#define LED_BUILTIN 13
#define OUTPUT 1
#define LOW 0
#define HIGH 1
#define F(x) x
unsigned long millis();
void pinMode(int,int);
void digitalWrite(int,int);
struct MockSerial{void begin(int); int available(); int read();void println();void println(const char*);void print(const char*);void print(unsigned long);};
extern MockSerial Serial;
'''
        with tempfile.TemporaryDirectory() as d:
            (Path(d)/'Arduino.h').write_text(header)
            r=subprocess.run(['g++','-std=c++17','-fsyntax-only','-x','c++','-I',d,str(ROOT/'examples/uno_r3_diagnostico.ino')],capture_output=True,text=True,timeout=20)
            self.assertEqual(r.returncode,0,r.stderr)
    def test_camera_syntax_cpp_stubs(self):
        if not shutil.which('g++'): self.skipTest('g++ unavailable')
        arduino='''#pragma once
#include <cstdint>
using uint32_t=std::uint32_t;
#define LEDC_CHANNEL_0 0
#define LEDC_TIMER_0 0
bool psramFound(); unsigned long millis(); void delay(unsigned);
struct MockESP{const char* getChipModel(); unsigned getFlashChipSize(); unsigned getFreeHeap();}; extern MockESP ESP;
struct MockSerial{void begin(int);void println();void println(const char*);template<class... T>void printf(const char*,T...);};extern MockSerial Serial;
'''
        camera='''#pragma once
#include "Arduino.h"
#define ESP_OK 0
#define PIXFORMAT_JPEG 4
#define FRAMESIZE_QVGA 10
#define CAMERA_GRAB_WHEN_EMPTY 0
#define CAMERA_FB_IN_PSRAM 0
#define CAMERA_FB_IN_DRAM 1
using esp_err_t=int;
struct camera_config_t {int ledc_channel,ledc_timer,pin_d0,pin_d1,pin_d2,pin_d3,pin_d4,pin_d5,pin_d6,pin_d7,pin_xclk,pin_pclk,pin_vsync,pin_href,pin_sccb_sda,pin_sccb_scl,pin_pwdn,pin_reset,xclk_freq_hz,pixel_format,frame_size,jpeg_quality,fb_count,grab_mode,fb_location;};
struct sensor_t{struct{unsigned PID;}id;};
struct camera_fb_t{unsigned width,height,len;};
esp_err_t esp_camera_init(camera_config_t*);void esp_camera_deinit();sensor_t* esp_camera_sensor_get();camera_fb_t* esp_camera_fb_get();void esp_camera_fb_return(camera_fb_t*);
'''
        with tempfile.TemporaryDirectory() as d:
            (Path(d)/'Arduino.h').write_text(arduino)
            (Path(d)/'esp_camera.h').write_text(camera)
            r=subprocess.run(['g++','-std=c++17','-fsyntax-only','-x','c++','-I',d,str(ROOT/'examples/esp32cam_ai_thinker_test.ino')],capture_output=True,text=True,timeout=20)
            self.assertEqual(r.returncode,0,r.stderr)

if __name__=='__main__':unittest.main()
