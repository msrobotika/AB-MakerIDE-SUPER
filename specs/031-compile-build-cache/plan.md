# Plan

Rama aislada desde origin/main. En `ab_makeride/jobs.py`: carpeta `BuildCache/<hash del
FQBN y opciones de placa>` con `sketch/` (se vacía en cada trabajo) y `cache/` pasada como `--build-path`;
`--output-dir` y la grabación siguen en la carpeta temporal. Límite de compilación 900 s.
Prueba unitaria en `tests/test_upload_controls.py`. Medición real con el servidor de la
rama. Manifiesto, gate y PR sin fusionar; sin tags ni releases.
