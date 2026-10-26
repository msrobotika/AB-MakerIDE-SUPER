# Cierre de la ronda de placas · 25 octubre 2026

El usuario indicó que no dispone de más placas para esta ronda. Se cierra el registro de los cinco dispositivos ensayados y se continúa con mejoras del simulador. No se añaden nuevas cargas de hardware durante esta fase.

| Placa concreta | Evidencia conseguida |
| --- | --- |
| IdeaSpark ESP32 y ST7789 | Radar grabado y verificado; el usuario confirmó su visualización. Ecos simulados, sin sensor de distancia. |
| ESP32-CAM con pinout AI-Thinker | Grabación verificada; PSRAM detectada, sensor OV3660 y cinco buffers JPEG reportados. Sin evaluación visual de las imágenes. |
| ESP32-WROOM y CP2102 | Controlador corregido, MicroPython 1.29.0 instalado y verificado, diagnóstico finito en RAM correcto. |
| Arduino Nano ATmega328P | Perfil de cargador antiguo identificado, carga verificada, cinco muestras por serie y EEPROM conservada. |
| Arduino Mega ATmega2560 | Perfil y firma identificados, carga verificada, cinco muestras por serie y EEPROM conservada. |

La [matriz de hardware](../MATRIZ_HARDWARE.md) enlaza los registros y explica el alcance y los pendientes de cada caso. Los respaldos binarios previos se conservan localmente fuera del repositorio. Se mantiene la restricción de no publicar ni hacer push.

Estas pruebas no permiten declarar compatibilidad universal ni v1.0 estable. Faltan, entre otros escenarios, periféricos adicionales, desconexión y cancelación durante las operaciones, pruebas prolongadas, instalaciones en equipos limpios y validación en otros sistemas. El simulador se evalúa por separado y no convierte un patrón lógico en una prueba física.
