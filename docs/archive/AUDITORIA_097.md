# Auditoría AB MakerIDE v0.9.7 — 24/10/2026

## Cambios revisados

- Eliminar dependencia del límite fijo de salida de 8 MB que disparaba «Catálogo demasiado grande». Nuevo umbral explícito 48 MB y tratamiento de error, conservando lectura desde `boards.txt` para núcleos instalados.
- Endpoints: catálogo instalado filtrado y paginado (`/api/board-catalog/installed`), búsqueda Boards Manager paginada y `/api/boards` reducido a un conjunto inicial de 60, más el FQBN elegido si está instalado.
- Interfaz: búsqueda local de 40 en 40, «Anteriores/Siguientes», búsqueda remota explícita, selector superior compacto, preservación de FQBN escogido durante actualización.
- Flujo de usuario: herramientas avanzadas ocultas; aviso cuando la plantilla Uno coincide exactamente con el sketch abierto y se selecciona otra placa; cambio de plantilla con confirmación y respaldo local.

## Comprobaciones y resultado

- `python -m unittest discover -s tests -q`: **171/171** (166 preexistentes + 5 nuevas pruebas; los tests que fijaban literal 0.9.6 se actualizan a 0.9.7).
- `node --check app.js`: correcto. `python -m compileall -q .`: correcto.
- UI en Chromium mediante `page.set_content` y respuestas API sintéticas: **602 modelos**, 40 elementos por página, página 2, búsqueda ESP32, selección ESP32, asociación COM4 CH340 conservada, botón de plantilla básica confirmado con copia y sin errores JS.
- `GET /api/health` en servidor iniciado localmente: devuelve 0.9.7. La política de Chromium en este entorno bloquea navegación directa a localhost y file://; las pruebas visuales usan `page.set_content`.

## Qué no se ha verificado

- No se dispone de la placa IdeaSpark ni del Arduino Uno reales del usuario, ni de Arduino CLI 1.5.1 instalado en este contenedor. No se realizaron grabaciones físicas.
- Los datos de catálogo de la prueba visual son **sintéticos**, no una medición de 602 placas reales reconocidas.
- No se midió latencia sobre un índice Arduino real de decenas de MB. La consulta remota sigue condicionada por su tiempo de respuesta, el índice y el límite de seguridad de 48 MB.
- No se validó simulación de firmware real, depuración HW ni funcionalidad de agentes Codex/Claude en sesión autenticada.
- No se han ejecutado tests exploratorios con usuarios externos ni evaluación certificada de seguridad de equipos industriales.

## Riesgos remanentes

- Si una versión de Arduino CLI produce más de 48 MB JSON, la consulta remota se rechaza con mensaje explícito. Esto necesita futura indexación incremental o consulta de paquete específico, no aumentar infinitamente el límite.
- El selector de puerto debe comprobarse en Windows con CH340, CP210x y dispositivos nativos USB.
- Los archivos de proyecto todavía dependen en parte de almacenamiento del navegador: exportar copias sigue siendo imprescindible.
- El modo total de Codex/Claude puede operar fuera de su carpeta de sesión; solo activarlo con conocimiento expreso.

## Próxima aceptación

1. Instalar la v0.9.7 en carpeta nueva; verificar `/api/health`.
2. Buscar Uno y ESP32 reales de los núcleos instalados con paginación, sin errores.
3. Conectar IdeaSpark y detectar COM sin suponer automáticamente modelo por VID/PID.
4. Cargar sketch mínimo conocido, compilar, grabar y verificar desde MakerIDE sin Codex.
5. Cerrar y reabrir el programa; comprobar persistencia y ausencia de estados de éxito falsos.
