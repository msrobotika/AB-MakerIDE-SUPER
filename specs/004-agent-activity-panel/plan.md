# Plan de arquitectura

Componentes: `index.html` añade un botón a `.rail`; `frontend/agent_activity.js` es módulo independiente `define/initialize`, conectado por `frontend/bootstrap.js`. `frontend/workspace.js` enruta la pestaña; `frontend/agent.js` emite señales de ciclo de vida al nuevo panel sin alterar el trabajo de la CLI. `frontend/styles.css` introduce estilos originales.

Origen de verdad: `agent_runtime.AgentJob.snapshot()` con `events`, `evidence`, `pending_approvals`, `changed_files`, `diff` y `outcome`. El panel no llama a nuevos endpoints ni inicia herramientas. El registro resumido dura solo en RAM de la pestaña (50 eventos como máximo).

Riesgos: descripción falsa de éxitos físicos, exposición de logs con secretos, botones que importan código sin revisión y recuperación de eventos de otra sesión. Mitigaciones: hitos únicamente de `evidence`, resúmenes fijos sin eco de salida arbitraria, botón diff que nunca invoca abrir código, resets de identidad de sesión.

Pruebas: Playwright sobre HTTP real y worker CLI controlado sin hardware. CI lint, prettier, integridad, Spec Kit, Windows, Ubuntu y macOS. No crear Release de este cambio.
