/*
  AB MakerIDE - MS Robotika
  Prueba minima para Arduino Uno R3
  Sin sensores ni librerias externas
  LED integrado: D13 (LED_BUILTIN)
*/

const byte LED = LED_BUILTIN;

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
  Serial.println("AB MakerIDE - Arduino Uno listo");
}

void loop() {
  digitalWrite(LED, HIGH);
  Serial.println("LED encendido");
  delay(500);

  digitalWrite(LED, LOW);
  Serial.println("LED apagado");
  delay(500);
}
