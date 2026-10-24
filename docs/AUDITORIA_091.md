# Auditoría AB MakerIDE SUPER 0.9.1 (24/10/2026)

## Alcance comprobado
- Backend Python: `python -m py_compile *.py`.
- Frontend JavaScript: `node --check app.js`.
- Suite regresiones y nuevas pruebas: `PYTHONPATH=. python -m pytest -q` → **130 passed, 21 subtests passed**.
- Pruebas de flujos CLI ejecutadas con **scripts falsos controlados** (no servicios externos): iniciar, editar en carpeta de trabajo, comparar diff, cancelar procesos y restringir acceso total sin consentimiento.
- Servidor HTTP: respuestas de salud, protección de origen/sesión, rutas de ejemplo, validación de entradas.
- Placas: parser probado con una respuesta JSON controlada de `arduino-cli board list --json`, incluyendo VID/PID y FQBN. No prueba reconocimiento físico del hardware del usuario.
- Interfaz Chromium: HTML + JS incorporados en documento aislado, panel IA desplegado, 4 permisos seleccionables, aviso de acceso total; **sin errores JavaScript** en esa prueba. Navegación HTTP a localhost bloqueada por política del entorno: prueba end-to-end en navegador no completada.

## Resultados de la revisión
- No existe firmware simulado presentado como real en el núcleo de compilación/carga.
- Porcentajes de grabación solo cuando proceden de la salida del uploader; compilación indeterminada.
- La IA ofrece propuestas de código en proyectos locales. El agente CLI puede modificar/copiar archivos según su modo, pero el contenido activo del editor solo se reemplaza tras revisión y autorización de aplicación.
- Cada ejecución de CLI exige consentimiento; acceso total exige consentimiento textual adicional. No se usa `shell=True` para interpolar el prompt.
- Se muestran restricciones y riesgos de la ejecución privilegiada. **No existe sandbox de sistema propio en AB MakerIDE.**
- Bibliotecas recomendadas por analizador de encabezados; no prueba automáticamente compatibilidad eléctrica.

## Riesgos abiertos: NO-GO publicación estable
1. Probar **en Windows** la integración con Codex CLI y Claude Code CLI instaladas/autenticadas. Las flags de ambos productos evolucionan; adaptarlas a su versión efectiva.
2. Probar COM real (Arduino Uno, ESP32, ESP32-CAM), recompilación AVR, grabación, recuperación USB y monitor serie bidireccional.
3. Simulador: Blink lógico no es emulación de firmware AVR/ESP32 ni simulación eléctrica completa.
4. No hay auditoría de pentesting independiente de backend local, prompt injection ni supply chain.
5. Los agentes con acceso total pueden alcanzar el sistema y dispositivos: usar VM, usuario limitado, copia de seguridad y revisión de registros.
6. No hay gestor completo de proyectos multarchivo ni importación automática de archivos generados fuera del editor.
7. La prueba Chromium aislada no valida la conectividad API en la UI real.

## Conclusión
**Release de pruebas privada** adecuada para evaluación incremental. **No afirmar seguridad certificada ni compatibilidad universal.** No publicar repositorio aún.
