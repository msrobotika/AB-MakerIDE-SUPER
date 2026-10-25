# Pruebas físicas disponibles

25 octubre 2026. Esta matriz distingue las pruebas de dispositivos concretos de los tests automatizados del IDE. No implica compatibilidad con todas las revisiones que comparten un nombre comercial o conversor USB.

**Primera ronda:** cinco dispositivos registrados y [cerrados](CIERRE_PRUEBAS_2026-10-25.md). **RC2:** se incorpora una sexta prueba de CYD con autorización específica posterior.

| Dispositivo y perfil | Compilación y carga | Comprobación del periférico | Pendientes |
| --- | --- | --- | --- |
| IdeaSpark, ESP32-D0WD, flash 4 MB, ST7789 135x240, rotación 1 | Radar de archivo único; salida 0 y cuatro segmentos verificados en COM4, con autorización | El usuario confirmó que ve el radar; cuatro ecos simulados, sin sensor de distancias | Prueba prolongada, reconexión, cancelación durante carga y otras revisiones |
| ESP32-CAM con pinout AI-Thinker, ESP32-D0WD-V3 revisión 3.1, flash 4 MB | Diagnóstico de cámara; salida 0 y cuatro segmentos verificados en COM4, con autorización y copia previa completa de flash | PSRAM detectada; sensor OV3660 PID 0x3660; cinco buffers JPEG 320x240 reportados por el controlador durante 16 s, sin errores | Calidad, enfoque y orientación de imágenes no observados; capacidad de PSRAM no medida; duración, SD y Wi-Fi sin probar |
| ESP32-WROOM, ESP32-D0WDQ6 revisión 1.0, flash 4 MB, CP2102 en COM7 | Controlador reparado; copia completa, borrado autorizado e instalación oficial de MicroPython 1.29.0; verificación independiente de 1790544 bytes | Diagnóstico ejecutado en RAM con mpremote: cinco muestras de memoria, aritmética, JSON y temporización, más lectura del sistema de archivos; salida 0 | Sin prueba de GPIO, LED, Wi-Fi, escritura de archivos ni duración. No acredita ejecución desde los botones del IDE |
| Arduino Nano indicado por el usuario, firma ATmega328P 0x1E950F, CH340, perfil de cargador antiguo a 57600 baudios | Respaldo previo de 32 KB flash y 1 KB EEPROM; diagnóstico compilado, carga autorizada y verificación independiente en COM4 | Cinco muestras aritméticas y temporales por serie, resultado MSR_NANO_PASS; EEPROM conservada y comparada | GPIO, LED, sensores, otros periféricos y estabilidad prolongada sin probar; no acredita uso de botones del IDE |
| Arduino Mega 2560, firma ATmega2560 0x1E9801, USB 2341:0042, COM8 | Respaldo de 256 KB flash y 4 KB EEPROM; diagnóstico compilado, carga autorizada y verificación independiente | Cinco muestras aritméticas y temporales por serie, resultado MSR_MEGA_PASS; EEPROM conservada y comparada | LED, GPIO externos, otras UART, sensores, I2C, SPI, ADC y duración sin probar; no acredita uso de botones del IDE |
| CYD ESP32-2432S028R, ESP32-D0WD-V3 rev 3.0, ILI9341 240×320 y XPT2046 | Dos respaldos completos coincidentes de 4 MB; juego compilado y carga autorizada con cuatro bloques verificados en COM4 | El usuario confirma caída de piezas sin parpadeo y controles táctiles funcionales tras calibración de tres cruces | Otras revisiones, duración, microSD, Wi-Fi y altavoz no probados; la carga se realizó por CLI |

COM4 se usó en momentos distintos para cuatro dispositivos. El puerto o el conversor CH340 no identifican por sí solos la placa ni el sensor. La identidad de los ESP32 se leyó con esptool y las firmas del Nano y Mega con AVRDUDE; el perfil físico se confirmó con el usuario. La PSRAM y el sensor se consultaron desde el diagnóstico cargado, no se dedujeron de la memoria flash.

[Registros y código del radar](evidence/radar-ideaspark/README.md) · [Registros y código exacto de la ESP32-CAM](evidence/esp32cam/README.md).

[Registros y código MicroPython de la ESP32-WROOM](evidence/wroom-micropython/README.md). En este caso se ejecutaron esptool y mpremote, con salida completa y prueba finita; no se guardó el diagnóstico como main.py.

Las cargas del radar y la cámara se hicieron con Arduino CLI y la lectura de cámara con pyserial; las de Nano y Mega usaron AVRDUDE y pyserial. No se atribuyen a una ejecución real de los botones de la pestaña del usuario. Las regresiones de esos flujos en navegador están documentadas por separado como controladas.

Las pruebas físicas de Uno, otras familias ESP32, MicroPython en otras placas, desconexión y cancelación todavía no quedan acreditadas por esta matriz. La compilación de un sketch para un modelo tampoco demuestra que se haya cargado o ejecutado en ese hardware.

[Registros y código del Nano ATmega328P](evidence/arduino-nano/README.md): carga por AVRDUDE y diagnóstico serie real por pyserial.

[Registros y código del Mega ATmega2560](evidence/arduino-mega/README.md): carga por AVRDUDE, verificación independiente y diagnóstico serie real por pyserial.

[Registros y alcance de la CYD](evidence/cyd/README.md).

RC3 añade [Space Invaders en la misma CYD](evidence/cyd-space-invaders/README.md): firmware completo, respaldo doble coincidente, carga con cuatro bloques verificados y marcador serie. El usuario confirmó que tenía el juego. No se añade otro dispositivo a la cuenta de seis ni se atribuyen pruebas independientes de todos sus controles o duración.
