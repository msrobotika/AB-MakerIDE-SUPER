/*
 * AB MakerIDE - MS Robotika
 * PRUEBA 03: ESP32-CAM con pinout AI-THINKER clasico.
 * El controlador identifica el sensor: probado con OV3660 (PID 0x3660).
 * Diagnostico de camara y capturas JPEG por monitor serie.
 * SIN Wi-Fi, SIN tarjeta SD, SIN activar LED flash.
 *
 * ATENCION: NO sirve para ESP32-S3-CAM ni placas con otro pinout.
 * USB-C por si solo NO identifica el controlador ni el sensor.
 * Seleccionar AI Thinker ESP32-CAM (esp32:esp32:esp32cam).
 * Puerto serie: 115200 baudios.
 */
#include <Arduino.h>
#include "esp_camera.h"

// Pinout AI-Thinker ESP32-CAM clasica; el sensor se detecta en ejecucion.
#define CAM_PWDN   32
#define CAM_RESET  -1
#define CAM_XCLK    0
#define CAM_SIOD   26
#define CAM_SIOC   27
#define CAM_Y9     35
#define CAM_Y8     34
#define CAM_Y7     39
#define CAM_Y6     36
#define CAM_Y5     21
#define CAM_Y4     19
#define CAM_Y3     18
#define CAM_Y2      5
#define CAM_VSYNC  25
#define CAM_HREF   23
#define CAM_PCLK   22

bool camaraOK = false;
unsigned long ultimaFoto = 0;
uint32_t fotosCorrectas = 0;
uint32_t fotosFallidas = 0;

bool iniciarCamara() {
  camera_config_t cfg = {};
  cfg.ledc_channel = LEDC_CHANNEL_0;
  cfg.ledc_timer = LEDC_TIMER_0;
  cfg.pin_d0 = CAM_Y2;
  cfg.pin_d1 = CAM_Y3;
  cfg.pin_d2 = CAM_Y4;
  cfg.pin_d3 = CAM_Y5;
  cfg.pin_d4 = CAM_Y6;
  cfg.pin_d5 = CAM_Y7;
  cfg.pin_d6 = CAM_Y8;
  cfg.pin_d7 = CAM_Y9;
  cfg.pin_xclk = CAM_XCLK;
  cfg.pin_pclk = CAM_PCLK;
  cfg.pin_vsync = CAM_VSYNC;
  cfg.pin_href = CAM_HREF;
  cfg.pin_sccb_sda = CAM_SIOD;
  cfg.pin_sccb_scl = CAM_SIOC;
  cfg.pin_pwdn = CAM_PWDN;
  cfg.pin_reset = CAM_RESET;
  cfg.xclk_freq_hz = 20000000;
  cfg.pixel_format = PIXFORMAT_JPEG;
  cfg.frame_size = FRAMESIZE_QVGA;  // 320 x 240
  cfg.jpeg_quality = 14;
  cfg.fb_count = 1;
  cfg.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  cfg.fb_location = psramFound() ? CAMERA_FB_IN_PSRAM : CAMERA_FB_IN_DRAM;

  esp_err_t resultado = esp_camera_init(&cfg);
  if (resultado != ESP_OK) {
    Serial.printf("ERROR CAMARA: esp_camera_init() = 0x%X\n", (unsigned)resultado);
    Serial.println("Comprueba sensor compatible, alimentacion y pinout AI-Thinker.");
    return false;
  }
  sensor_t *sensor = esp_camera_sensor_get();
  if (sensor == nullptr) {
    Serial.println("ERROR: no se puede consultar el sensor.");
    esp_camera_deinit();
    return false;
  }
  Serial.printf("SENSOR DETECTADO: PID=0x%04X\n", (unsigned)sensor->id.PID);
  return true;
}

void capturar() {
  camera_fb_t *fb = esp_camera_fb_get();
  if (fb == nullptr) {
    fotosFallidas++;
    Serial.println("ERROR: esp_camera_fb_get() devolvio NULL");
    return;
  }
  fotosCorrectas++;
  Serial.printf("JPEG #%lu | %ux%u | %u bytes | RAM libre=%u KB\n",
    (unsigned long)fotosCorrectas,
    (unsigned)fb->width, (unsigned)fb->height,
    (unsigned)fb->len,
    (unsigned)(ESP.getFreeHeap() / 1024U));
  esp_camera_fb_return(fb); // Obligatorio para evitar fugas de memoria
}

void setup() {
  Serial.begin(115200);
  delay(1200);
  Serial.println();
  Serial.println("========================================");
  Serial.println("AB MakerIDE | MS Robotika");
  Serial.println("ESP32-CAM AI-THINKER - PRUEBA CAMARA");
  Serial.println("========================================");
  Serial.printf("CHIP: %s\n", ESP.getChipModel());
  Serial.printf("FLASH: %u bytes\n", (unsigned)ESP.getFlashChipSize());
  Serial.printf("PSRAM: %s\n", psramFound() ? "SI" : "NO");
  Serial.println("Wi-Fi APAGADO | microSD SIN UTILIZAR");
  camaraOK = iniciarCamara();
  if (camaraOK) {
    Serial.println("CAMARA LISTA: capturando JPEG cada 3 segundos");
    capturar();
  } else {
    Serial.println("NO SE HARAN CAPTURAS: revisa el perfil antes de cambiar GPIO.");
  }
  ultimaFoto = millis();
}

void loop() {
  if (!camaraOK) { delay(1000); return; }
  if (millis() - ultimaFoto >= 3000UL) {
    ultimaFoto = millis();
    capturar();
  }
}
