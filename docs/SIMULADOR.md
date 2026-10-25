# Simulador de secuencias digitales

El simulador permite recorrer patrones de salidas sin conectar una placa. Lee el código abierto y representa niveles digitales con tiempos ideales. No ejecuta firmware ni emula una CPU, un circuito eléctrico o el coste de instrucciones y mensajes serie. La compilación y las pruebas físicas son comprobaciones distintas.

## Uso

1. Abre un sketch compatible y selecciona su perfil de placa. El proyecto inicial de Uno funciona sin cambios. Hay ejemplos de semáforo en [Arduino C++](../examples/semaforo_simulacion.ino) y [MicroPython](../examples/semaforo_simulacion.py).
2. Abre **Herramientas → Simulación lógica** y pulsa **Simular lógica**. Se muestran todas las salidas declaradas, sus niveles y una traza del ciclo. El cursor ámbar indica el tiempo virtual actual.
3. **Pausar / Continuar** conserva el tiempo. **Siguiente paso** pausa y avanza al final de la siguiente espera; al llegar al final del ciclo sigue con el siguiente. **Reiniciar** vuelve a 0 ms en pausa.
4. La velocidad 0,25× / 1× / 2× / 4× solo cambia la reproducción. Los límites de los pasos siguen los tiempos del código. Destacar un canal no cambia la secuencia.

Editar el código, importar otro proyecto o cambiar de lenguaje o placa descarta el modelo anterior. Cerrar el panel, cambiar a otro panel o esconder la pestaña pausa la reproducción. La simulación no da por compilado o grabado un sketch y no cambia el robot a éxito de hardware.

## Subconjunto admitido

- Arduino C++: un `setup()` y un `loop()` lineales. `pinMode(..., OUTPUT)` en setup, `digitalWrite` con niveles 0/1 o HIGH/LOW y `delay` en milisegundos enteros en loop. Se permiten niveles iniciales en setup, constantes sencillas y defines de números o alias; no expresiones aritméticas.
- `LED_BUILTIN` se resuelve a D13 únicamente en los perfiles AVR Uno, Nano y Mega conocidos. No se inventa para ESP32 u otros perfiles. El nombre del panel sigue al perfil seleccionado, sin deducir una placa conectada.
- MicroPython: `from machine import Pin`, `import time`, salidas `Pin(n, Pin.OUT)` y un `while True:` de indentación uniforme. `on()`, `off()`, `value(0/1)`, `time.sleep` y `time.sleep_ms`; constantes numéricas sencillas en mayúsculas. Hasta la primera escritura, una salida sin nivel inicial conocido aparece como N/D.
- Los mensajes literales `Serial.print/println` y `print` se omiten expresamente; no se simula su contenido, velocidad ni efecto sobre la temporización.
- Máximo ocho salidas, 128 instrucciones por ciclo y 100000 caracteres. Esperas de 1 a 60000 ms; ciclo máximo de 120000 ms. Las cotas de pines de Uno/Nano/Mega son del perfil lógico, sin certificar su disponibilidad o conexión física.

Las instrucciones desconocidas rechazan el modelo completo con una explicación. No se omiten a escondidas condiciones, bucles anidados, lecturas, llamadas a otros objetos o bibliotecas. No hay soporte para ADC, botones, PWM, sensores, pantallas, Wi-Fi, interrupciones, código basado en millis() o archivos auxiliares. Se retiraron los controles de ADC y botón que antes no modificaban el comportamiento del modelo.

## Validación

[Regresiones y capturas reales de interfaz](evidence/simulator/README.md). La fase inicial LOW conserva su orden; varias salidas comparten el mismo reloj; los niveles iniciales de setup se aplican una sola vez. Las trazas y sus límites no sustituyen al compilador ni a una medición de la placa.
