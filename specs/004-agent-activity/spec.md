# MS ROBOTIKA · Actividad IA, una vista de agente centrada en evidencias

## Objetivo

Agregar en la barra izquierda de AB MakerIDE SUPER un centro propio de actividad de Codex y Claude Code que muestre **el trabajo efectivamente observado**: solicitud, evento real, cambios en archivos, compilación, grabación informada por herramienta y revisión del operador. Inspirado por buenas prácticas generales de IDEs agénticos; no reproducir arte, paneles, etiquetas de marca, iconos, flujos propietarios ni código de Antigravity/Windsurf.

## Historias de usuario y aceptación

- **P1 — operador:** selecciona "✦ Actividad IA" y ve proveedor, acceso, tiempo, tarea y pasos registrados sin perder editor ni monitor serie. No aparecen estados OK inventados.
- **P1 — responsable de seguridad:** puede iniciar desde la izquierda pero se abre **el mismo** diálogo de consentimiento de Codex/Claude y se aplican los mismos permisos, aprobación y validaciones de placa existentes. Nunca autorizar herramientas ni grabar sin permiso.
- **P1 — auditor:** ve qué eventos CLI llegaron (orden, texto seguro y cota de longitud), archivos comprobados, diff cuando exista y evidencia separada de compilación/grabación. Si la ejecución termina sin evidencia, mostrar "No consta"; no inferir estado físico de un éxito de CLI.
- **P2 — usuario recurrente:** lista sesiones del propio servidor, las reabre sin relanzarlas ni repetir flash, puede solicitar detener la actual o continuar desde las opciones existentes.
- **P2 — usuario de pantalla pequeña:** los controles y estados se adaptan a 1280×720 y móvil, sin tapar todo el editor cuando no están seleccionados.

## Requisitos

- **FR-001**: botón propio en la rail izquierda y diseño original MS ROBOTIKA.
- **FR-002**: panel y fases basados solo en `/api/agents/poll`, con `evidence`, `events`, `changed_files`, `diff`; sin fabricar planes, porcentajes o "razonamientos" privados de LLM.
- **FR-003**: control de inicio/detención/revisión delegado a `execRun`/`execStop`, respetando la autorización y modos (consultar, supervisado, autónomo, total).
- **FR-004**: recuperación manual por ID listado en `/api/agents/history`, sin arrancar tareas ni duplicar ejecución.
- **FR-005**: pruebas de funciones puras, sesión Chromium con worker controlado y CI Windows/Linux/macOS.
- **FR-006**: no se crean Releases ni versiones nuevas por esta funcionalidad.

## Fuera de alcance

No se implementa motor de multiagentes concurrentes, agente navegador, reanudación automática, terminal fuera de los permisos existentes, vista de razonamiento interno del modelo ni grabación física automatizada nueva. Estas funciones necesitarían diseño y seguridad independientes.
