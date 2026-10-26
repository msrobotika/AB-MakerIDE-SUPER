# Análisis técnico y riesgos

La implementación no incorpora software ni activos de Antigravity o Windsurf. Utiliza un patrón común de ingeniería de interfaces: lista de eventos, detalle y control de tareas. Los eventos reales `/api/agents/poll` llevan `kind`, `text` e `id`; los logros de hardware solo se marcan con los indicadores positivos de `evidence` remitidos por el backend.

- Riesgo de divulgar datos: los eventos ya se redactan en el servidor, pero la vista muestra texto corto y no persiste transcripciones en navegador. Se muestra como salida técnica y no se recomienda compartir capturas con secretos sin revisarlas.
- Riesgo de permisos: botones del sidebar solo llaman a control existente de permisos; la pestaña nunca inicia automáticamente un proceso o modifica el modo.
- Riesgo de confianza: el evento finalizada indica éxito de CLI, no prueba física. Estado de conexión desconocido no equivale a cancelación verificable.
- Riesgo de rendimiento: memoria acotada a 70 eventos y DOM construido con textContent; no se interpretan etiquetas recibidas como HTML.
- Riesgo de desplazamiento: el filtro y scroll del panel se conservan durante las actualizaciones.

No hay integración nativa de navegador agente, subagentes paralelos ni checkpoint reversible en esta entrega: anunciar tales capacidades sería engañoso.
