# Arduino Nano: prueba física por serie

25 octubre 2026. El usuario conectó e identificó un Arduino Nano y autorizó expresamente cargar y probarlo en COM4. Windows detectó CH340 sin errores. AVRDUDE leyó la firma 0x1E950F, correspondiente al ATmega328P, a 57600 baudios. No hubo sincronización a 115200 durante la consulta previa: el perfil compatible probado es `arduino:avr:nano:cpu=atmega328old`. No se afirma una versión exacta del binario del cargador.

Antes de grabar se conservaron 32768 bytes de flash, comprobados mediante dos lecturas coincidentes, y 1024 bytes de EEPROM, comparados posteriormente con el dispositivo. Justo antes de grabar se volvió a leer la flash y coincidió su hash con el respaldo. Las copias binarias quedan fuera del repositorio; `backup-metadata.json` contiene sus tamaños y hashes. Esta copia por cargador no incluye fusibles ni bits de bloqueo.

El [código exacto](../../../examples/nano_diagnostico.ino) compiló con Arduino AVR core 1.8.8: 2236 bytes de programa y 188 bytes de RAM estática. Se grabó por AVRDUDE 8.0-arduino.1, con verificación automática y una comparación independiente posterior. La EEPROM siguió coincidiendo con el respaldo.

La lectura real por pyserial observó `MSR_NANO_START`, cinco muestras aritméticas correctas a 1000, 1500, 2000, 2501 y 3002 ms, y `MSR_NANO_PASS`. El firmware usa la serie a 115200 baudios y no configura otros GPIO. No acredita funcionamiento de sensores, LED, periféricos externos ni estabilidad prolongada.

El diagnóstico queda en flash: se ejecuta una vez en cada arranque y después permanece inactivo. [Proyecto importable](NanoDiagnostico.abmaker.json). No es una prueba en RAM como la de MicroPython en la WROOM.

Estos registros proceden de herramientas reales; no acreditan uso de los botones del IDE ni una detección automática del modelo a partir del CH340. No se publicaron cambios ni se hizo push. Se han retirado rutas locales de las copias de registros.
