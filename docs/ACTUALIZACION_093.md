# Actualizar a AB MakerIDE SUPER v0.9.3

1. En la versión instalada (por ejemplo v0.9.2), pulsa **Exportar** para guardar una copia de los sketches actuales.
2. Detén el servidor antiguo pulsando `Ctrl + C` en su ventana de PowerShell o CMD. Cierra la pestaña anterior.
3. Descomprime el ZIP completo en una carpeta **nueva** del escritorio; no sobreescribas versiones anteriores.
4. Abre la carpeta hasta localizar `server.py` e `INICIAR_WINDOWS.bat`; ejecuta `INICIAR_WINDOWS.bat`.
5. En `http://127.0.0.1:8765/api/health` comprueba que `version` sea `0.9.3`, no `0.9.2`.
6. En la barra superior selecciona **Arduino Uno R3** y el puerto COM del dispositivo conectado (tu Uno clónico aparecía como COM4, pero puede cambiar).
7. Pulsa `✦ IA`, despliega **Codex / Claude Code · Ejecutar tarea real** y elige **Diagnosticar placa** o **Probar Blink**. Ambos solo rellenan la tarea: revisa texto, permisos y pulsa **Ejecutar agente** si deseas proceder.
8. Para uso autónomo de hardware, el usuario debe elegir voluntariamente `total` y escribir `ACCESO TOTAL` en cada ejecución. Solo úsalo si comprendes el alcance; un agente con permisos completos no está confinado al proyecto.
9. Durante la tarea aparecerán señales de firma, compilación y grabación **solo si constan en el registro**. Abre «Ver registro técnico» para ver el detalle. Si necesitas más espacio, amplía la consola inferior arrastrando la barra superior.
10. Antes de aplicar un cambio al editor, despliega el diff, revisa el contenido y confirma. El archivo original se respalda localmente.

**No es necesario reinstalar Arduino CLI ni los núcleos AVR/ESP32 si ya funcionan.**

Una verificación de `avrdude` en una tarea anterior no demuestra por sí sola que un LED se haya observado encendido: revisa físicamente la placa.
