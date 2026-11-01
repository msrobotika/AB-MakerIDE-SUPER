# Gate Spec Kit consciente de merges desde main — 01/11/2026

Base pública: e3353ee (origin/main). Constitución leída. Reparación pedida por Abel
para el PR #25. Cambio preparado con asistencia de IA (Claude Code) y revisado con
pruebas; no se publican versiones ni instaladores.

Síntoma: la ejecución `push` del PR #25 (commit a45e329, merge de main en la rama)
falla en «Spec Kit delivery gate» con «archivos técnicos sin cobertura:
docs/evidence/public-beta-docs/results.json». La base de push es la cabeza anterior
de la rama (b69f541), así que el diff incluye archivos que solo llegan de main y que
ya tienen su expediente (024). La ejecución `pull_request`, con base main, pasa.

- **FR-001**: Con base Git, un archivo técnico que llega por merge desde la rama de
  integración sin ninguna modificación no exige nueva cobertura y se informa en
  `integrated_files_skipped`.
- **FR-002**: La excepción es estricta: solo merges de la línea principal posteriores
  a la base, padre fusionado contenido en la referencia de integración, mismo objeto
  Git y sin cambios locales. Nunca se aplica al comprobar la propia rama de
  integración; si la referencia falta, no hay excepción; una referencia no válida
  se rechaza.
- **FR-003**: Reproducir el síntoma del PR #25 con la versión anterior y comprobar
  que la nueva lo resuelve sin relajar la comparación contra main.
- **FR-004**: Documentar la regla, sin cambiar workflows, interfaz, servidor ni
  funciones existentes, y pasar los controles del proyecto.

Clarificaciones resueltas: la referencia por defecto es `refs/remotes/origin/main`,
disponible en CI porque el checkout usa `fetch-depth: 0`. La rama del PR #25 no se
modifica; necesitará integrar este cambio cuando su titular lo decida.
