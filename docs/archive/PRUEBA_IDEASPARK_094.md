# Prueba física — ESP32 IdeaSpark y Pong

1. Exporta tu proyecto anterior y conserva v0.9.3. Descomprime v0.9.4 en otra carpeta.
2. Detén el servidor viejo, ejecuta `INICIAR_WINDOWS.bat` y comprueba `http://127.0.0.1:8765/api/health` (`0.9.4`).
3. Conecta la IdeaSpark. Selecciona **ESP32 Dev Module** arriba, puerto COM real (el COM4 del Uno no tiene por qué ser el de la IdeaSpark) y comprueba el tamaño de la pantalla (la prueba previa usó 1,9" con ST7789).
4. Pulsa **✦ IA → Codex / Claude → ▣ Pong IdeaSpark**. El botón solo rellena la tarea. Revisa GPIO, permisos y la solicitud antes de ejecutarla. Acceso total implica riesgo real para tu equipo; no es el predeterminado.
5. Observa el estado resumido. Busca verificación de firmware por la herramienta y **comprueba tú si se dibuja el juego**. La finalización del agente sola no basta.
6. Cierra la pestaña y vuelve a abrirla. Pulsa **↺ Recuperar última sesión** si no aparece el historial. La sesión debe ofrecer informe, archivos creados y diff si existe.
7. Si el servidor se cerró durante la ejecución, aparecerá estado desconocido. No repitas la grabación antes de comprobar el programa presente en la placa.

Si la pantalla queda negra, captura el resumen de los registros y la foto de la placa. El error puede deberse a selección de FQBN, pines, orientación, retroiluminación, resolución o fallo de grabación. No introduzcas claves Wi-Fi en las tareas de agente.
