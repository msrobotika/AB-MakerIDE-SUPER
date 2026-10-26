# Centro de Agentes · MS Robotika (primera fase)

La barra de herramientas **izquierda** incluye la pestaña original **✦ Centro de Agentes**. No sustituye el editor ni la conversación con IA existente. Presenta de forma compacta información de **sesiones reales** de Codex y Claude Code recopilada por el servidor local de MakerIDE.

## Flujo operativo

1. En la barra izquierda pulsa **✦**. Si aún no existe una sesión aparece **SIN SESIÓN ACTIVA**, sin pasos inventados.
2. Pulsa **+ Nueva tarea** para abrir el asistente actual de agente en el lateral derecho. Introduce la tarea, elige Codex o Claude Code, placa, permisos y autorizaciones correspondientes.
3. Solo **▶ Ejecutar agente** inicia una tarea, tras el diálogo de consentimiento ya existente. El Centro de Agentes **nunca activa ejecuciones ni cambia permisos en silencio**.
4. Durante la ejecución muestra estado, tiempo, autorizaciones pendientes, hitos reales y una cronología abreviada de herramientas y eventos.
5. **Revisar autorizaciones** abre el panel de consentimiento existente. No concede permisos automáticamente, no expone credenciales ni guarda prompts de manera adicional.
6. Al terminar, **Ver diferencias (sin aplicar)** abre y desplaza hasta el diff generado: esta acción **no importa el código**. Desde el panel original, el usuario podrá decidir si abre la propuesta con respaldo.
7. **↻ Recuperar** consulta las sesiones persistidas en el servidor sin generar otra tarea ni repetir una grabación. **■ Detener** utiliza la misma acción de cancelación que el panel original.

## Evidencia, no ficción

El panel marca ✓ solo cuando el servidor registra que la tarea inició, identificó la firma de la placa, observó compilación o detectó la verificación de firmware en el registro de herramientas. No calcula porcentajes ficticios. Un resultado de CLI correcto **no equivale a firmware instalado ni a una pantalla visualmente verificada**. Si no hay evidencia, el estado es ○.

Las anotaciones de la cronología son etiquetas breves de eventos conocidos, por ejemplo comandos terminados, cambios de archivo y llamadas a MCP. La salida técnica no se duplica en la barra izquierda: el botón **Abrir registro técnico** permite consultarla, con su redacción actual, en el panel de agente. Se conservan solo los últimos 50 eventos resumidos de la sesión **en memoria de la pestaña**, no en un nuevo repositorio ni almacenamiento persistente.

## Derechos, inspiración y alcance

Se ha estudiado documentación pública de experiencias de agentes (artefactos verificables, vistas de tareas y tool calls) de productos del sector, pero **no** se reproduce su código, nombres de producto, iconos ni maquetación. Se utiliza la identidad MS Robotika, el sistema de permisos y los datos del backend ya existentes.

**No incluidos en esta primera fase:** razonamiento privado de modelos, plan editable generado autónomamente sin API que lo respalde, reproducción de navegador, flota multiagente y aislamiento con worktrees. No deben fingirse mediante la interfaz. En una fase posterior podrían añadirse artefactos estructurados y plan de tareas **si** el backend los emite con identificadores y evidencias trazables.

**Ensayos:** tests de navegador con CLI simulado, sin llamadas a placa ni cuentas de IA, además de pruebas de regresión de los permisos, historial y editor. Validación física adicional antes de ofrecerlo como capacidad independiente de firmware.
