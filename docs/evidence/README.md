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
