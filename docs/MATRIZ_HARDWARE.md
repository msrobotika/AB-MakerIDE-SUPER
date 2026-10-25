# Pruebas físicas disponibles

25 octubre 2026. Esta matriz distingue las pruebas de dispositivos concretos de los tests automatizados del IDE. No implica compatibilidad con todas las revisiones que comparten un nombre comercial o conversor USB.

| Dispositivo y perfil | Compilación y carga | Comprobación del periférico | Pendientes |
| --- | --- | --- | --- |
| IdeaSpark, ESP32-D0WD, flash 4 MB, ST7789 135x240, rotación 1 | Radar de archivo único; salida 0 y cuatro segmentos verificados en COM4, con autorización | El usuario confirmó que ve el radar; cuatro ecos simulados, sin sensor de distancias | Prueba prolongada, reconexión, cancelación durante carga y otras revisiones |
| ESP32-CAM con pinout AI-Thinker, ESP32-D0WD-V3 revisión 3.1, flash 4 MB | Diagnóstico de cámara; salida 0 y cuatro segmentos verificados en COM4, con autorización y copia previa completa de flash | PSRAM detectada; sensor OV3660 PID 0x3660; cinco buffers JPEG 320x240 reportados por el controlador durante 16 s, sin errores | Calidad, enfoque y orientación de imágenes no observados; capacidad de PSRAM no medida; duración, SD y Wi-Fi sin probar |

COM4 se usó en momentos distintos para dos dispositivos. El puerto o el conversor CH340 no identifican por sí solos la placa ni el sensor. La identidad del chip de cada caso se leyó con esptool; el perfil físico se confirmó con el usuario. La PSRAM y el sensor se consultaron desde el diagnóstico cargado, no se dedujeron de la memoria flash.

[Registros y código del radar](evidence/radar-ideaspark/README.md) · [Registros y código exacto de la ESP32-CAM](evidence/esp32cam/README.md).

Las cargas de estas dos pruebas se hicieron con Arduino CLI y la lectura de cámara con pyserial. No se atribuyen a una ejecución real de los botones de la pestaña del usuario. Las regresiones de esos flujos en navegador están documentadas por separado como controladas.

Las pruebas físicas de Uno, otras familias ESP32, MicroPython, desconexión y cancelación todavía no quedan acreditadas por esta matriz. La compilación de un sketch para un modelo tampoco demuestra que se haya cargado o ejecutado en ese hardware.
