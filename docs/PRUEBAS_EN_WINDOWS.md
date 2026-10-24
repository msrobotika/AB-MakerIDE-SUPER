# Protocolo de aceptación v0.9.1 en Windows

1. Cerrar cualquier server.py de MakerIDE anterior; ejecutar nuevo `INICIAR_WINDOWS.bat`.
2. Verificar `http://127.0.0.1:8765/api/health` → 0.9.1.
3. Conectar Arduino Uno R3 por cable USB de datos; pulsar ↻. Debe aparecer COM real (no puerto ficticio).
4. Seleccionar `Arduino UNO R3`, instalar core AVR desde terminal guiado `install avr` **solo si falta**.
5. Compilar Blink integrado. Debe devolver tamaño real de Flash/RAM o un error reproducible.
6. Grabar con aprobación; comprobar LED integrado parpadeando y monitor serie bidireccional a 9600.
7. Conectar ESP32, seleccionar FQBN correspondiente y COM. Probar velocidad de grabación y reintento USB autorizado.
8. Abrir IA, comprobar detección real de CLI Codex/Claude. Ejecutar una consulta en modo consultar y una edición simple en modo supervisado. Revisar diff y aplicar al editor.
9. Intentar acceso total sin escribir `ACCESO TOTAL`: debe rechazarse. Hacer pruebas de acceso total **solo dentro de VM aislada**.
10. Probar cancelación de tarea larga. Verificar que el proceso no sigue activo y el directorio de la sesión conserva el código anterior.
11. Verificar exportación/importación del proyecto; no debe perderse el sketch previo.
12. Guardar resultados con capturas, logs y versión del firmware. No publicar hasta repetir las pruebas en segundo PC.

Estado: pendientes de realización física/autenticada en el equipo del usuario.
