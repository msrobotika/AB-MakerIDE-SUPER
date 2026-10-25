// AB MakerIDE / MS Robotika: diagnostico por serie para Mega ATmega2560.
// No configura GPIO. Emite cinco muestras y termina el diagnostico.
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println(F("MSR_MEGA_START"));
  bool passed = true;
  for (byte sample = 1; sample <= 5; ++sample) {
    volatile unsigned int total = 0;
    for (unsigned int i = 0; i < 100; ++i) total += i;
    const bool ok = (total == 4950);
    passed = passed && ok;
    Serial.print(F("SAMPLE ")); Serial.print(sample);
    Serial.print(F(" ARITHMETIC ")); Serial.print(ok ? F("OK") : F("FAIL"));
    Serial.print(F(" MILLIS ")); Serial.println(millis());
    delay(500);
  }
  Serial.println(passed ? F("MSR_MEGA_PASS") : F("MSR_MEGA_FAIL"));
}
void loop() { }
