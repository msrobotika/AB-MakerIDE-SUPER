# Tasks: Desarrollo verificable con Spec Kit

## Phase 1: Setup

- [x] T001 [US1] Inicializar Spec Kit oficial en .specify/ y .agents/ desde base RC4.
- [x] T002 [US1] Revisar constitución, spec.md, plan.md y checklists/requirements.md.

## Phase 2: Foundations

- [x] T003 [US2] Escribir casos de rechazo y aceptación en tests/test_specification_gate.py y comprobar fallo previo.
- [x] T004 [US2] Implementar contrato en tests/specification_gate.py sin ejecutar los documentos.

## Phase 3: User Story 1 - Proceso reproducible

- [x] T005 [US1] Añadir AGENTS.md, docs/SPEC_KIT.md, atribución oficial y guía CONTRIBUTING.md.
- [x] T006 [US1] Conservar scripts upstream sin reformatear y delimitar Ruff en pyproject.toml.

**Independent test**: instrucciones enlazadas, licencia y versión fijadas, sin tocar producción.

## Phase 4: User Story 2 - Entrega verificable

- [x] T007 [US2] Ejecutar el gate en .github/workflows/checks.yml con base Git validada.
- [x] T008 [US2] Ejecutar pruebas locales, registrar evidencia y verificar cobertura actual.

**Independent test**: fixtures inválidos rechazados; expediente real aceptado con hashes vigentes.

## Phase 5: Polish and Cross-Cutting Concerns

- [x] T009 Revisar convergencia con la skill oficial; resolver hallazgos sin ampliar alcance.
- [x] T010 Actualizar MANIFEST_SHA256.txt, comprobar calidad y preparar commit revisable con CI configurada.

## Dependencies and Execution

T001 → T002 → análisis de consistencia → T003 → T004 → T005/T006 → T007 → T008 → T009 → T010.
No se lanzan agentes paralelos. Las lecturas independientes pueden agruparse; los cambios
del mismo archivo y las actualizaciones de evidencias se ejecutan secuencialmente.

## Implementation Strategy

Primero demostrar el rechazo de expedientes incompletos y el caso válido mínimo. Después
integrar sin alterar módulos del IDE. Finalmente ejecutar suite y CI, registrar límites y
cerrar solo las tareas comprobadas. No se necesita hardware ni proveedor IA.
