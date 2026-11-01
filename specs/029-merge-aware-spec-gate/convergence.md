# Convergencia

FR-001 a FR-004 contrastados con las pruebas del gate, el caso real del PR #25 y
los controles locales registrados en `docs/evidence/merge-aware-spec-gate/results.json`.
La versión anterior rechaza el commit a45e329 con base b69f541; la nueva lo acepta e
informa del archivo recibido desde main. Contra main el resultado no cambia.

Converge esta reparación del gate. El PR #25 seguirá en rojo en su push antiguo hasta
que su rama integre este cambio; esa integración y cualquier fusión las decide Abel.
