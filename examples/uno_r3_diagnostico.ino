/*
 * AB MakerIDE - MS Robotika
 * PRUEBA 02: Arduino Uno R3 (ATmega328P)
 * Sin sensores ni componentes externos.
 * LED integrado pin 13 + comandos de terminal serie.
 * 115200 baudios | FQBN: arduino:avr:uno
 *
 * Comandos: 1 = encender, 0 = apagar, A = automatico, ? = ayuda.
 */
#include <Arduino.h>

const uint8_t LED_PIN = LED_BUILTIN;
const unsigned long INTERVALO_MS = 500;
const unsigned long ESTADO_MS = 5000;

bool modoAuto = true;
bool ledEncendido = false;
unsigned long ultimoCambio = 0;
unsigned long ultimoInforme = 0;

void ponerLed(bool encendido) {
  ledEncendido = encendido;
  digitalWrite(LED_PIN, encendido ? HIGH : LOW);
}

void ayuda() {
  Serial.println(F("Comandos: 1=LED ON | 0=LED OFF | A=automatico | ?=ayuda"));
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  ponerLed(false);
  Serial.begin(115200);
  Serial.println();
  Serial.println(F("================================"));
  Serial.println(F("AB MakerIDE | MS Robotika"));
  Serial.println(F("ARDUINO UNO R3 - PRUEBA REAL"));
  Serial.println(F("================================"));
  Serial.println(F("LED integrado: pin 13"));
  ayuda();
  ultimoCambio = millis();
  ultimoInforme = millis();
}

void loop() {
  while (Serial.available() > 0) {
    char orden = (char)Serial.read();
    if (orden == '1' || orden == '0') {
      modoAuto = false;
      ponerLed(orden == '1');
      Serial.println(ledEncendido ? F("LED ENCENDIDO") : F("LED APAGADO"));
    } else if (orden == 'A' || orden == 'a') {
      modoAuto = true;
      ultimoCambio = millis();
      Serial.println(F("MODO AUTOMATICO"));
    } else if (orden == '?') {
      ayuda();
    }
  }

  unsigned long ahora = millis();
  if (modoAuto && ahora - ultimoCambio >= INTERVALO_MS) {
    ultimoCambio = ahora;
    ponerLed(!ledEncendido);
  }
  if (ahora - ultimoInforme >= ESTADO_MS) {
    ultimoInforme = ahora;
    Serial.print(F("UPTIME="));
    Serial.print(ahora / 1000UL);
    Serial.print(F("s | LED="));
    Serial.print(ledEncendido ? F("ON") : F("OFF"));
    Serial.print(F(" | MODO="));
    Serial.println(modoAuto ? F("AUTO") : F("MANUAL"));
  }
}
