# AB MakerIDE SUPER · instrucciones para agentes

## Spec Kit obligatorio

Antes de crear o mejorar software leer [.specify/memory/constitution.md](.specify/memory/constitution.md)
y la mejora activa indicada en [.specify/memory/quality-gate.json](.specify/memory/quality-gate.json).
Usar las skills oficiales de `.agents/skills/`: constitución → especificación →
aclaración → plan → checklist → tareas → análisis → implementación → convergencia.
Repetir implementación/convergencia hasta cerrar criterios con evidencia. Las etapas
pueden ser breves en cambios pequeños, pero no se omiten. No cerrar por una afirmación
del agente o por casillas marcadas sin pruebas. [Guía](docs/SPEC_KIT.md).

Cada nueva mejora crea `specs/NNN-nombre/`. Mantener los expedientes terminados como
históricos; no modificar sus huellas para atribuirles trabajo posterior. Actualizar la
referencia compartida del gate y el puntero local de Spec Kit. Las reparaciones requieren
diagnóstico y verificación del síntoma, además de cobertura de requisitos.

## Publicación y limpieza de versiones

No crear `git tag`, GitHub Releases, distribuciones públicas ni anuncios por defecto. **Cada publicación exige autorización específica del titular** y cumplir [la política de publicación](docs/RELEASE_POLICY.md), incluyendo los resultados reales de los checks del commit y las pruebas de instalación. Nunca anunciar éxito físico por pruebas simuladas, ni dar por borradas Releases si no se verificó la lista en GitHub.

Todo mantenimiento debe separar material vigente de archivos históricos; no eliminar `docs/evidence/`, `.specify/` ni `specs/` a ciegas. Evitar múltiples archivos de arranque alternativos sin justificación. No reescribir historia Git para ocultar un lanzamiento anterior.

## Validación y límites

- `python tests/run_isolated.py` ejecuta unidades con datos temporales.
- `python tests/specification_gate.py --base SHA --json` verifica cobertura respecto
  al commit de base. Sin base, informar que no se compararon cambios.
- `python -m ruff check .` y `python -m ruff format --check .`.
- `npm run lint` y `npm run format:check`.
- `python tests/manifest.py --write` tras normalizar texto; luego comprobar sin `--write`.
- Ejecutar los recorridos Chromium pertinentes si cambia la interfaz o el servidor.

No confundir fixtures con hardware, bytes grabados con pantalla funcionando o compilación
con carga. No repetir grabaciones al recuperar una sesión. Proteger proyectos y no ampliar
permisos por una plantilla. No lanzar agentes adicionales ni extensiones automáticamente.
Las cuentas IA son individuales; no hay créditos incluidos. La guía de desarrollo no
añade pasos al usuario final del IDE. La RC4 publicada es la base, no se reescribe.
