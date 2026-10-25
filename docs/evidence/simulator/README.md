# Simulador de secuencias digitales · 25 octubre 2026

Pruebas locales del código de esta revisión. `validation.json` vincula las fuentes mediante SHA-256 y distingue suite general, motor, navegador y compilación.

- Suite general: 204 pruebas Python, 200 correctas y cuatro omitidas (tres por g++ ausente y una por privilegios de enlaces simbólicos en Windows). Una prueba Python invoca los diez casos Node del simulador: no se suman otra vez como pruebas Python.
- Motor: diez regresiones Node cubren fase LOW, bordes y ciclos, constantes y LED_BUILTIN, tres canales, estado de setup, comentarios/cadenas, límites y rechazo de instrucciones o llamadas desconocidas. MicroPython conserva niveles N/D hasta la primera escritura.
- Navegador: 26 comprobaciones con servidor HTTP real y Chromium aislado, catálogo y puertos controlados, cero errores JavaScript y ninguna operación de hardware o agente. Comprueba pausa, continuación, reinicio, pasos exactos, velocidad, cierre del panel, descarte por edición/placa/lenguaje, C++/MicroPython y ancho de 390 px.
- Regresión adicional de agentes/proyectos: 37 comprobaciones correctas en navegador, con trabajador CLI controlado y sin hardware.
- Ejemplo C++: compilación real para Arduino Uno, sin grabar. Ejemplo MicroPython: sintaxis comprobada con ast.parse; no ejecutado en placa en esta iteración.

`simulator-desktop.png`, `simulator-mobile.png` y `simulator-unsupported.png` son capturas reales de la interfaz bajo esas condiciones controladas. No muestran una ejecución de firmware ni una placa conectada. Los registros han sido despojados de rutas personales.

Reproducción: `python tests/run_isolated.py`; `node --test tests/simulator.test.cjs`; con Playwright disponible, `python tests/browser_simulator.py --outputs work/simulator-checks`. La configuración de CI añade este último caso, pero no se ha ejecutado remotamente.

[Guía y límites](../../SIMULADOR.md). La revisión está guardada como fuente y paquete local; no se acredita activación en la pestaña actual del usuario. No se publica ni se hace push.
