# AB MakerIDE SUPER v0.9.3 — Auditoría de revisión

Fecha: 24/10/2026 · MS Robotika · versión de desarrollo privada

## Evidencia aportada por el usuario (versión anterior 0.9.2)

La transcripción real del equipo Windows muestra que Codex CLI 0.164.0:
- Se ejecutó en modo `total` con aprobación desactivada a nivel CLI.
- Interrogó el dispositivo del puerto COM4 con `avrdude` y recibió firma `1E 95 0F`.
- Compiló `sketch.ino` para `arduino:avr:uno`, usando 930 bytes de Flash y 9 bytes RAM.
- Subió el Blink a COM4 y el grabador reportó `930 bytes of flash verified`.
- Guardó una copia `sketch.ino.bak`, además de crear el fichero de salida del compilador.

La evidencia demuestra operación CLI en la máquina del usuario **para la versión 0.9.2**, no que la 0.9.3 haya sido grabada físicamente.

## Cambios implementados en 0.9.3

1. Tres indicadores de evidencia: firma del microcontrolador, resumen de compilación y verificación de firmware. Se extraen de texto de herramientas y **no** representan validación independiente o porcentaje de ejecución de Codex.
2. Panel plegable de registros de agente y diff plegable. El terminal general recibe solo hitos del agente para evitar saturación visual.
3. Contexto mínimo con FQBN seleccionado y puerto COM, incluyendo advertencia de que una selección FQBN/USB no confirma la identidad del circuito.
4. Instrucciones de uso de comandos acotados para evitar miles de líneas de `board details --json` u otros volcados sin valor, sin garantizar cifras de tokens.
5. El mensaje al usuario explica que `total` puede ejecutar operaciones de hardware y requiere consentimiento explícito. Modo predeterminado `supervisado` sin cambios.
6. Tareas rápidas «Diagnosticar placa» y «Probar Blink» que **solo rellenan** el prompt y nunca lanzan ni modifican permisos automáticamente.
7. Entrada de puerto validada en servidor para agente.
8. Botón de consola ampliable y preferencias de tamaño heredados de 0.9.2.

## Pruebas locales realizadas

- `python -m unittest discover -s tests`: **146 pruebas correctas**, incluidas 7 pruebas nuevas de evidencia de eventos, puertos inválidos, prompt y UI.
- `node --check app.js`, `python -m compileall`: correctos.
- Chromium headless **con HTML aislado**: pruebas de apertura de IA, preparación de dos tareas rápidas, estados visibles y ausencia de errores JavaScript. No ejecuta CLIs. La navegación a `http://127.0.0.1` o `file://` en este navegador de pruebas estaba bloqueada por administración; no se da por validada la integración visual de extremo a extremo.
- Pruebas HTTP del servidor mediante unittest, incluyendo `/api/health`, permisos de sesión, origen y validación.

## Límites y riesgos abiertos

- No se ha ejecutado Codex/Claude autenticado desde la versión 0.9.3 sobre el PC del usuario. Se requiere validación física y de flujo de puerto COM.
- La CLI en modo total puede leer, alterar o borrar archivos del sistema y operar hardware fuera del workspace, conforme a sus propios permisos efectivos. No se ha realizado auditoría de penetración independiente.
- Los indicadores de «observado en registro» se basan en texto de salida que un proceso con acceso total podría falsificar o repetir. Se deben interpretar junto al código de salida y la evidencia del dispositivo, no como certificación criptográfica.
- El simulador continúa limitado a patrones lógicos; no ejecuta firmware AVR/ESP32 real.
- La terminal integrada sigue siendo una consola guiada, no un shell PowerShell/PTY genérico.
- No se ha publicado nada en GitHub.

## Próximos hitos

Validar en Windows v0.9.3 con placa Uno clónica CH340, comprobar el flujo del agente, verificar que el registro no satura, desarrollar terminal PTY opcional con controles y mejorar el simulador con emulación AVR verificable.
