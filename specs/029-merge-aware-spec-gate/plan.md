# Plan

Rama aislada desde origin/main. En `tests/specification_gate.py`, separar la llamada
a Git en funciones pequeñas y añadir `integrated_paths`: recorre los merges de la
línea principal entre la base y HEAD, acepta solo padres contenidos en la referencia
de integración y compara la entrada del árbol (modo y objeto) de cada archivo
cambiado en HEAD y en ese padre. Excluye archivos con cambios locales respecto a HEAD.
`validate` y la CLI aceptan la referencia y publican la lista de archivos omitidos.

Pruebas de regresión con repositorios Git temporales: merge desde main aceptado,
archivo fusionado y luego editado (en disco y confirmado), merge de otra rama no
integrada, comprobación sobre main y referencias ausentes o no válidas. Reproducir el
caso real sobre la cabeza del PR #25. Ejecutar unidades aisladas, Node, Ruff,
ESLint, Prettier, manifiesto y gate. No crear tags ni releases ni fusionar PR.
