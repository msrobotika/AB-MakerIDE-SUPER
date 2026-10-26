# Auditoría AB MakerIDE SUPER v0.9.6

Fecha: 24/10/2026. Estado: **privada, pruebas de software**.

## Incidencia de usuario

El buscador v0.9.5 aparece sin Arduino Uno/ESP32 aunque Arduino CLI tiene instalados Arduino AVR Boards 1.8.8 y Espressif ESP32 3.3.12 (confirmados anteriormente en el Windows del usuario).

## Diagnóstico del código

`board_catalog()` dependía exclusivamente de `arduino-cli board listall --json`. El frontend no tenía un refresco dedicado dentro del catálogo y la búsqueda del índice general requería pulsar un botón. No está demostrado todavía cuál fue el fallo exacto en Windows; podría deberse a la respuesta CLI o al estado inicial del frontend.

## Cambios

- Si el CLI falla o devuelve cero modelos, leer **boards.txt** dentro de los núcleos efectivamente instalados (Arduino15). Selección por FQBN validado; no hay catálogo fijo ni detección de placa falsa.
- Reportar `catalog_source`, `catalog_warning`, `catalog_count` y `catalog_error` en `/api/boards`.
- Añadir `↻ Actualizar` y estado del catálogo, búsqueda remota automática con debounce si faltan coincidencias locales. La instalación continúa exigiendo confirmación.
- Conservar distinción entre CH340 y modelo real de placa; mantener perfiles explícitos por puerto/identificador.

## Pruebas

- 166 pruebas unittest superadas, incluidas cinco nuevas de recuperación, JSON CLI simulado, nombres válidos, rechazo de definiciones inválidas y controles del frontend.
- `python -m py_compile server.py` y `node --check app.js`: correctos.
- La v0.9.6 **no** se ha probado sobre hardware ni contra los núcleos reales en el PC del usuario. Las pruebas del parser utilizaron archivos sintéticos de formato `boards.txt`; los resultados no certifican Arduino CLI Windows.

## Próxima validación real

1. `/api/health` => `0.9.6`.
2. `/api/boards?refresh=1` => `choices` incluye `arduino:avr:uno` y `esp32:esp32:esp32`, procedentes del CLI o de `boards.txt`.
3. Buscar `Uno` y `ESP32`, seleccionar COM de la placa (por ejemplo COM4), compilar y grabar con confirmación.
4. Si hay error, conservar exclusivamente `catalog_error`, `catalog_warning`, `catalog_source` y número de modelos para depuración; no compartir claves ni identificadores únicos.
