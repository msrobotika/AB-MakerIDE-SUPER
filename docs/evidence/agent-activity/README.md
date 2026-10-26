# Centro de actividad IA · evidencias del navegador

Estas son **capturas reales de AB MakerIDE en Chromium**, tomadas con el
servidor HTTP del IDE y un **worker de agente controlado de pruebas**.
No son fotomontajes, pero tampoco demuestran una cuenta de Codex o Claude
Code conectada ni ejecución de firmware físico.

- [Panel izquierdo sin sesión](01-panel-sin-sesion.png): interfaz limpia inicial
- [Resultado de tarea controlada](02-actividad-cli-controlada.png):
  estado de CLI, eventos recibidos, filtros y ausencia de falsos éxitos
  de compilación/grabación

El test `tests/browser_agent_consent.py` produce ambas imágenes y
verifica permiso explícito, recuperación y exportación de proyectos.
Las capturas se conservan para inspección; no sustituye validación real
con las cuentas IA y hardware del usuario.
