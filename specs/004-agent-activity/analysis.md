# Análisis de integración

Contrato existente: `/api/agents/start`, `/api/agents/poll`, `/api/agents/history`, `/api/agents/cancel`. El flujo principal ya usa un diálogo de aprobación y verifica identidad/hardware antes de ejecutar; el panel se integra a las mismas acciones. Los atributos públicos de una sesión incluyen evidencias de compilación, verificación informada, estado de tarea, eventos con ID, diffs y archivos.

Decisión: **vista de observación, no motor de agente nuevo**. La salida CLI puede incluir ruido; un evento es información de registro y no garantiza ejecución satisfactoria. Diferenciar `job.active` de `outcome`. `flash_verified` es mensaje del grabador, **no** imagen física del dispositivo.

No hay reproducción de interfaz ni código de terceros. Uso de botones, panel, tipografía y color de MS ROBOTIKA; documentación cita principios generales y la inspiración funcional sin afiliación.
