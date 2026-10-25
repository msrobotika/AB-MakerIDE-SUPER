# Arduino Mega 2560: prueba física por serie

25 octubre 2026. Windows y Arduino CLI reconocen Mega 2560 en COM8, USB VID:PID 2341:0042, sin errores del controlador. AVRDUDE leyó la firma 0x1E9801 del ATmega2560 mediante el cargador wiring a 115200 baudios. Perfil probado: `arduino:avr:mega:cpu=atmega2560`.

El usuario autorizó expresamente cargar y probar esta placa. Antes de grabar se conservaron 262144 bytes de flash, con dos lecturas independientes coincidentes, y 4096 bytes de EEPROM comparados con el dispositivo. Una tercera lectura de flash inmediatamente antes de la carga coincidió con el respaldo. Los binarios se conservan localmente fuera del repositorio; [tamaños y hashes](backup-metadata.json). Esta copia no incluye fusibles, bits de bloqueo ni firmware del puente USB.

El [código exacto probado](../../../examples/mega_diagnostico.ino) compiló con Arduino AVR core 1.8.8: 2580 bytes de programa y 188 bytes de RAM estática. Se cargó por AVRDUDE 8.0-arduino.1, con verificación automática y comparación independiente posterior de la flash. La EEPROM siguió coincidiendo con el respaldo.

La lectura real por pyserial observó `MSR_MEGA_START`, cinco muestras aritméticas correctas a 1000, 1500, 2000, 2501, 3002 ms y `MSR_MEGA_PASS`. La prueba usa la serie a 115200 baudios, sin configurar otros GPIO. No valida LED, sensores, las otras UART, I2C, SPI, entradas analógicas ni estabilidad prolongada.

El diagnóstico queda instalado y se ejecutará de nuevo al reiniciar; después de las cinco muestras permanece inactivo. [Proyecto importable para reutilizar el código](MegaDiagnostico.abmaker.json).

Los registros proceden de herramientas locales reales; no acreditan una ejecución de los botones del IDE ni compatibilidad universal con todas las revisiones Mega. Rutas locales retiradas de las copias de registros. No se ha publicado ni hecho push.
