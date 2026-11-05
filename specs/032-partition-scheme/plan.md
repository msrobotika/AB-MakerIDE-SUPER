# Plan

Rama `feat/partition-scheme` sobre `fix/compile-cache-timeout`. En `ab_makeride/jobs.py`:
lista cerrada `ESP_PARTITIONS` y `esp_board_options()` que añade `PartitionScheme` a las opciones
de compilación, grabación y reintento. `server.py` pasa `partition_scheme`. Interfaz: estado
`partitionScheme`, selector en `frontend/workspace.js`, envío y texto del diálogo en
`frontend/build.js`. Pruebas en `tests/test_upload_controls.py`. Medición real con AstroCYD MS
en una CYD. Manifiesto, gate y PR sin fusionar; sin tags ni releases.
