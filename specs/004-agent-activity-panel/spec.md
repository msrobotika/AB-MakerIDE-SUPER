# Spec Kit: Centro de Agentes en la barra izquierda

Objetivo: mostrar el estado real del agente como un flujo de trabajo legible y verificable, sin replicar elementos protegidos de otro IDE.

## Historias de usuario y aceptación

**P1. Usuario maker:** al pulsar ✦ en el lateral izquierdo, consulta la sesión real, permisos, etapas y cronología. No aparecen porcentajes fabricados; «SIN SESIÓN» no simula ejecución.

**P1. Usuario que delega una tarea a IA:** puede abrir el formulario de tarea, revisar autorizaciones, detener o recuperar la sesión. Todo ello delega en el control de permisos/consentimiento existente sin atajos de seguridad.

**P1. Revisor de cambios:** ve lista de archivos y diffs cuando el backend los genera, sin aplicar automáticamente el código desde el botón «Ver diferencias».

**P2. Investigador/ingeniero:** los hitos de compilación y grabación proceden solo de evidencia del servidor. La validación visual de pantalla no se deduce de la ejecución de la CLI.

## Requisitos

- **FR-001:** botón izquierdo accesible y panel propio responsive, coherente con los colores MS Robotika.
- **FR-002:** actividad procedente de `/api/agents/poll`, `history` y autorizaciones reales, con resumen de events y código seguro frente a inyección HTML.
- **FR-003:** conservar cuatro modos de permisos y aprobaciones del motor anterior, sin ejecución implícita ni acceso total escondido.
- **FR-004:** revisión no destructiva y recuperación sin duplicar sesiones; estados de evidencia fail-closed.
- **FR-005:** pruebas navegador para vacío, flujo simulado, veredicto sin hardware y diff no invasivo.
- **FR-006:** no crear ninguna nueva Release antes de validación; preparar código en rama y PR.
