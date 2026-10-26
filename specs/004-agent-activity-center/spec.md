# Centro de actividad IA · AB MakerIDE (funcionalidad original)

## Alcance

Agregar un centro de observación de tareas **Codex y Claude Code** en la barra lateral izquierda, reutilizando la ejecución de agentes, consentimiento, historial y comparación ya existentes. No imitar ni usar marcas, diseños, código ni activos de terceros. Es un producto propio MS ROBOTIKA.

## Requisitos

- **FR-001**: Nuevo acceso visible con teclado y lectura de estado en la barra lateral; editor central sin perder foco o área de código, consola y opciones existentes operativas.
- **FR-002**: Mostrar únicamente estado, proveedor, permisos, salida de eventos de la CLI, evidencias recibidas, archivos reportados y aprobaciones reales. No inventar plan, herramienta ejecutada, test, compilación ni hardware probado.
- **FR-003**: Acciones de configurar, recuperar, ver cambios, consola y detener reusan los controles existentes; se mantienen aprobación explícita y consentimiento para modo total.
- **FR-004**: Nunca afirmar funcionamiento físico por la mera salida de compilación/flasheo. Mostrar estado desconocido si se interrumpe; bounded y sin persistencia de logs de ejecución en navegador.
- **FR-005**: Pruebas de reductor de eventos y regresión de navegador con agente controlado; captura identificada como prueba de navegador con CLI simulada. CI en los sistemas existentes.

## Criterios de aceptación

La actividad se muestra solo tras obtener job_id del servidor o recuperar sesión. Filtrar por tipo de evento, ver resumen sin confundir prueba simulada con ejecución física; hacer clic en los botones abre los controles ya existentes. Si no existen eventos, se muestra mensaje vacío, no una lista ficticia. Las autorizaciones de herramientas siguen siendo responsabilidad de la CLI y la política del backend.
