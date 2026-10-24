# AB MakerIDE SUPER v0.9.2 — Auditoría UX
Fecha: 2026-10-24 · MS Robotika · versión privada

## Cambios aplicados sobre el código fuente completo v0.9.1

- Consola extensible verticalmente mediante separador con cursor; permite arrastrar hacia arriba/abajo.
- Maximizar/restaurar desde botón y doble clic. `Ctrl+Alt+T`, flechas, Mayús+flechas, Inicio/Fin con foco en el separador.
- Altura recordada mediante almacenamiento local del navegador; anchura adaptable a la ventana.
- Barra lateral plegable al pulsar el icono activo; estado almacenado localmente.
- Menor ruido: los avisos de librerías se ocultan cuando no requieren atención.
- Guía rápida de 3 pasos y selección manual del modelo cuando el conversor USB es CH340 (VID 1A86, PID 7523).
- Puerto COM conservado entre sesiones si sigue presente en un nuevo escaneo; de lo contrario se descarta.
- La antigua pestaña «Terminal» se llama «Consola» para distinguir registros del campo inferior de comandos guiados. **Ese campo no es PowerShell ni una shell general.**
- Versión en `/api/health`: `0.9.2`, banner e instalador actualizados.

## Verificación reproducible

- `python -m pytest -q`: **139 passed, 21 subtests passed**. Se actualizaron aserciones de número de versión y añadieron 9 pruebas sobre los controles UX.
- `node --check app.js`: correcto.
- `python -m compileall -q .`: correcto.
- Servidor local (`--port 18765`): `GET /api/health` respondió `0.9.2`.
- Chromium (interfaz aislada, código JavaScript integrado en el documento): **sin excepciones JS**, tamaño consola 165 px → 185 px con flecha → 627 px maximizada → 185 px restaurada → 291 px por arrastre. Diálogo de ayuda abierto/cerrado y control del panel lateral comprobados.
- **Limitación de la prueba Chromium:** la navegación a localhost y a archivos locales fue bloqueada por política del entorno. La versión aislada no accedió al backend; no se verificó persistencia en una sesión real del navegador ni selección USB real.

## Pendientes de validación en Windows

1. Arranque de `INICIAR_WINDOWS.bat` en el PC del usuario y comprobación `/api/health`.
2. Persistencia de altura de consola y puerto entre reinicios reales en Edge/Chrome.
3. Selección manual de Arduino Uno clónico CH340 en COM4, compilación, grabación y monitor serie sin PowerShell.
4. Integración real Codex CLI 0.164.0 y Claude Code autenticadas con permisos seleccionados.
5. Soporte de **terminal de sistema plenamente interactiva** con PTY, aislamiento, política de privilegios y confirmaciones. El control actual sigue siendo de comandos guiados y no debe describirse como terminal de PowerShell.
6. Simulación de firmware AVR y ESP32: **no implementada**, solo lógica Blink simplificada.
7. Auditoría independiente de seguridad y de accesibilidad. **Sin certificación de seguridad.**

## Dictamen

**Apta para pruebas privadas de usabilidad, no para publicación estable todavía.**
Las 139 pruebas automáticas no demuestran compatibilidad USB física ni ejecución aislada segura de agentes con acceso total. No se ha subido a GitHub.
