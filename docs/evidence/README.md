# Evidencias RC1

Los archivos de esta carpeta se copian de ejecuciones locales reales. Las capturas 07–11 muestran escenarios controlados indicados en su nombre. El resto muestra interfaz y compilación contra el servidor real, con Chromium aislado.

- `arduino-real.json`: versión, núcleos, igualdad exacta de FQBN, puertos y páginas reales.
- `browser-results.json`: cada comprobación, respuestas reales, salida del compilador y errores esperados/inesperados.
- `browser-server.txt`: solicitudes y respuestas HTTP del servidor de aceptación.
- `unit-tests.txt`, `robot-tests.txt`, `syntax-checks.txt`: resultados reproducibles.
- `original-projects-integrity.json`: comparación con los 711 hashes originales.
- `01-real-idle.png` a `12-real-mobile.png`: capturas PNG reales. `04-real-compile-success.png` confirma solo compilación; `10-controlled-agent-success.png` confirma solo el escenario CLI interceptado.
- `13-final-desktop.png` y `final-preview.json`: revisión final adicional en el servidor 8770, sin operaciones de hardware; cero errores de consola/JavaScript y controles visibles a 390 px. La captura móvil definitiva se renovó en este contexto limpio, sin referencias COM sintéticas.

Comandos de reproducción en el README principal. Usar siempre un nuevo directorio de aceptación, un perfil aislado y un puerto libre. Las respuestas originales de la ejecución permiten auditar el alcance; no hay afirmación de firmware instalado ni de hardware funcional.

## Vídeo posterior aportado por el usuario

[Vídeo, ficha de observación y SHA-256](videos/README.md): evidencia física de campo, conservada sin edición. No sustituye la matriz de aceptación RC1 ni vincula por sí sola el hardware a un commit.

[Capturas 134 y 135 aportadas por el usuario](user-robot-states/README.md): ambas muestran finalización CLI en verde, sin grabación confirmada.

[Mejora de proyectos generados](agent-projects/README.md): apertura con respaldo, descarga ZIP, continuidad e importación, verificadas en pruebas aisladas.

[Radar IdeaSpark](radar-ideaspark/README.md): grabación autorizada en COM4 y verificada por el grabador; el usuario confirmó que ve el radar. Esta evidencia posterior es independiente de las capturas 134/135.

[Cuaderno de placas y cuentas propias](board-trials/README.md): 199 pruebas Python correctas, 4 omitidas y 37 comprobaciones de interfaz. Los casos de hardware son controlados.

[ESP32-CAM](esp32cam/README.md): respaldo completo, grabación autorizada y verificada; diagnóstico serie con PSRAM, sensor OV3660 y cinco fotogramas JPEG reportados por el controlador, sin revisión visual de las imágenes. [Matriz de hardware](../MATRIZ_HARDWARE.md).

[ESP32-WROOM con MicroPython](wroom-micropython/README.md): controlador CP2102 reparado, firmware oficial instalado con autorización y respaldo, verificación independiente y diagnóstico finito en RAM terminado correctamente.

[Arduino Nano ATmega328P](arduino-nano/README.md): cargador antiguo a 57600 baudios, copias previas, carga autorizada y verificada, EEPROM conservada y cinco muestras serie correctas.

[Arduino Mega ATmega2560](arduino-mega/README.md): reconocido en COM8, copia previa, carga autorizada y verificada, EEPROM conservada y cinco muestras serie correctas.

[Simulador de secuencias digitales](simulator/README.md): ocho salidas, reproducción y pasos, regresiones del motor y 26 comprobaciones de interfaz. Capturas reales con catálogo y puertos controlados; sin hardware.

[Instalación y recuperación](install-recovery/README.md): extracción nueva, .venv privada, 17 comprobaciones de instalación, 21 de recuperación y regresiones de proyectos/simulador. Sin nuevas operaciones de hardware.
