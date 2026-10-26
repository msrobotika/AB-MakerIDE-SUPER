# Validación reproducible

Desde la raíz, con Python 3.10+ y Git:

1. Ejecutar `python -m unittest discover -s tests -p test_specification_gate.py -v`.
   Debe aceptar el expediente válido y rechazar todas sus variantes negativas.
2. Ejecutar `python tests/specification_gate.py --base c13864910810c4e9d69642efaaa32688e9bd066f --json`.
   Debe terminar con passed=true, siete requisitos y comparación de base activa.
3. Ejecutar `python tests/run_isolated.py`, Ruff, ESLint, Prettier y manifiesto.
   No conectar hardware ni iniciar agentes para estas comprobaciones.

Para la siguiente mejora usar las skills oficiales instaladas y crear otro directorio
specs/. El desarrollo mantiene abierto su expediente; antes de entregar se actualizan
quality-gate.json y verification.json tras ejecutar las pruebas correspondientes.
Los pasos completos y los límites están en [SPEC_KIT.md](../../docs/SPEC_KIT.md).
