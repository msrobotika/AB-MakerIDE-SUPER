# Contrato del control de entrega

`python tests/specification_gate.py [--base SHA] [--json]`

Sin dependencias opcionales, red, cuentas, subprocess shell ni acceso serie.
Salida 0 si el expediente es consistente; 1 y errores concretos si no lo es.
El modo JSON devuelve passed, feature, requirements, changed_files_checked,
base_compared y errors. Los mensajes no incluyen el contenido de documentos.

Archivos obligatorios de la mejora: spec.md, plan.md, tasks.md, analysis.md,
checklists/requirements.md, convergence.md y verification.json. Deben estar dentro
del repositorio sin enlaces, no vacíos y sin marcadores de ambigüedad o plantilla
sin resolver. Las tareas y el checklist deben tener casillas y estar cerradas.
Los requisitos se declaran como `- **FR-001**: ...` en spec.md; no se aceptan duplicados.

Cada requisito debe aparecer exactamente una vez en verification.json y apuntar a
evidencias existentes. changed_files debe contener las huellas actuales de todos
los archivos técnicos modificados desde la base cuando esta se proporciona.
Un archivo técnico eliminado se cubre con el valor `deleted`.

Se consideran técnicos .py, .js, .cjs, .mjs, .html, .css, .json, .toml, .yml,
.yaml, .bat y .sh, además de VERSION y archivos de dependencias. Se excluyen
specs/, .specify/ y .agents/ porque son expedientes/scaffolding. Su contenido sigue
en el manifiesto y revisión humana; el control no certifica la seguridad de una skill.

La invocación con una base válida requiere Git y un commit accesible; si falta,
falla. Sin base válida el control no omite silenciosamente la comparación. Un
primer push con SHA de ceros se anuncia como base_compared=false.

El control detecta omisiones estructurales, no demuestra que las pruebas declaradas
se ejecutaron. Las pruebas CI independientes y la revisión de convergence.md siguen
siendo necesarias. No existe una garantía contra quien cambie el control y su CI.
