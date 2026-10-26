# Desarrollo con GitHub Spec Kit

Desde el 26 de octubre de 2026 todas las nuevas creaciones y mejoras de este proyecto
deben seguir Spec Kit. No basta con generar código y darlo por terminado.

## Proceso

1. Leer la constitución y establecer el alcance del cambio sobre una base Git revisable.
2. Especificar historias, escenarios de aceptación, requisitos y resultados medibles.
3. Aclarar datos materiales; investigar lo disponible antes de preguntar al usuario.
4. Preparar plan técnico, decisiones, modelo y contratos cuando correspondan.
5. Revisar checklist de requisitos y generar tareas ordenadas.
6. Analizar coherencia, cobertura y cumplimiento de la constitución antes de implementar.
7. Implementar, ejecutar pruebas y registrar resultados con su alcance real.
8. Contrastar el código con cada criterio mediante convergencia; añadir tareas si faltan
   obligaciones, implementarlas y repetir. Solo entonces cerrar el expediente.

Las skills oficiales están en `.agents/skills/`. En Codex se invocan como
`$speckit-specify`, `$speckit-plan`, `$speckit-tasks`, `$speckit-analyze`,
`$speckit-implement` y `$speckit-converge`; las aclaraciones, constitución y checklist
también están instaladas. Son instrucciones de agente, no comandos de PowerShell.
La ejecución de esta adopción usó dichas skills en el agente actual; no inició otro
Codex ni una cadena de agentes con consumo de cuota.

## Expedientes y control de entrega

Cada mejora vive en `specs/NNN-nombre/`. La [constitución](../.specify/memory/constitution.md)
establece las reglas. El [expediente inicial](../specs/001-spec-kit-gate/spec.md) aplica
el proceso al propio control de entrega. La mejora activa de CI se indica en
`.specify/memory/quality-gate.json`; `.specify/feature.json` es un puntero local de
Spec Kit, ignorado por su scaffolding y no compartido entre máquinas.

El control propio `python tests/specification_gate.py --base SHA --json` exige documentos
no vacíos, ausencia de marcadores pendientes, tareas/checklists cerrados, correspondencia
exacta entre requisitos y evidencias y hashes actuales de los archivos técnicos cubiertos.
El [contrato](../specs/001-spec-kit-gate/contracts/gate.md) detalla formato y errores.
Con base Git, comprueba además todos los cambios técnicos desde ese commit. Sin base,
declara `base_compared=false`: no oculta la diferencia. La CI aporta la base de push/PR.

Los expedientes completos se conservan como registros históricos. La siguiente mejora
crea otro y cambia la referencia activa; no sobrescribe el resultado anterior.
Dependabot también necesita una especificación de mantenimiento y actualizar el manifiesto
antes de integrar una actualización. No hay excepción automática para sus PR.

## Puerta de publicación

Spec Kit estructura el trabajo; **no obliga a lanzar versiones** ni sustituye una validación real. El expediente activo y el check de coherencia son condiciones necesarias, no suficientes, para crear una Release. [Política de publicación y congelación de versiones](RELEASE_POLICY.md).

## Lo que verifica y lo que no

El gate comprueba estructura y correspondencia de archivos. **No demuestra que una prueba
declarada se ejecutó ni que el hardware funciona.** Las pruebas de CI se ejecutan aparte y
la revisión de convergencia contrasta el comportamiento con los requisitos. Tampoco protege
contra un cambio deliberado del propio control y del workflow: estos necesitan revisión.

Esta obligación es del desarrollo, no un formulario para usar el IDE. No modifica la RC4
publicada, no graba placas ni amplía permisos. Los resultados de seis placas y la prueba
CYD RC4 conservan su alcance original; no se presentan como pruebas nuevas.

## Procedencia

[GitHub Spec Kit](https://github.com/github/spec-kit), v1.2.3, licencia MIT conservada.
[Origen, commit e instalación](../.specify/UPSTREAM.md).
Fuentes: [adopción en proyectos existentes](https://github.github.com/spec-kit/guides/existing-projects.html)
y [proceso oficial](https://github.github.com/spec-kit/quickstart.html).

La preferencia global de Abel se guarda fuera del repositorio en su configuración local
Codex, conforme a la [guía de AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
No se distribuyen sus rutas, credenciales ni configuración personal en el producto.
