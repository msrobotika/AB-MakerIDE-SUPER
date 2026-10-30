# Reparar PR25 con evidencias
Base PR b69f541d8b0d3fab509bba37af1dbba7c3869759; main integrado e3353eedbf69fff7c418dd98fbd906e3d8b52692 sin reescritura. Constitución 1.0.0 y directiva 30/10/2026. Spec Kit con CLI oficial y artefactos breves revisados manualmente.
Diagnóstico: CI40820358302 confirma F401 unicodedata, tres discrepancias de manifiesto y Playwright1.56 no compatible con ubuntu26.04. Reproducción local Ruff/manifiesto idéntica y unittest descubre cero tests nuevos.
- **FR-001**: Retirar solo import sin uso; conservar API pública requests_upload y comportamiento original.
- **FR-002**: Tres regresiones descubribles por unittest real: importación pública, órdenes y negaciones; sin alterar clasificador.
- **FR-003**: Fijar solo navegador en ubuntu-24.04 y conservar matriz, nueve recorridos y permisos.
- **FR-004**: Regenerar manifiesto oficial y ejecutar calidad, unidades y navegador local; preparar actualización de la misma PR sin mezclar ramas experimentales ni fusionar/publicar versiones.
La aceptación externa exige CI verde Windows/Linux/macOS, Chromium y revisión sobre SHA exacto. Convergencia local no afirma ejecuciones remotas todavía pendientes.
