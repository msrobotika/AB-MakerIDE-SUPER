// Secuencia logica para el simulador de AB MakerIDE.
// No valida conexiones. No grabar sin revisar resistencias y circuito.
// Arduino Uno, Nano o Mega: D13, D12 y D11.
const byte ROJO = 13;
const byte AMARILLO = 12;
const byte VERDE = 11;
void setup() {
  pinMode(ROJO, OUTPUT);
  pinMode(AMARILLO, OUTPUT);
  pinMode(VERDE, OUTPUT);
}
void loop() {
  digitalWrite(ROJO, HIGH);
  digitalWrite(AMARILLO, LOW);
  digitalWrite(VERDE, LOW);
  delay(1000);
  digitalWrite(ROJO, LOW);
  digitalWrite(AMARILLO, HIGH);
  delay(500);
  digitalWrite(AMARILLO, LOW);
  digitalWrite(VERDE, HIGH);
  delay(1000);
}
