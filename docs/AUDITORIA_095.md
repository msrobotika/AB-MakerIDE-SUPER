# AB MakerIDE SUPER v0.9.5 — Auditoría técnica

**Fecha:** 24/10/2026. **Autoría:** MS Robotika. **Estado:** versión privada de pruebas, NO certificada.

## Objetivo

Eliminar la lista estática de placas (antes 7) y utilizar el catálogo completo de Arduino CLI desde los núcleos realmente instalados. Mantener el editor limpio, conexiones físicas auténticas, reconocimiento prudente de clones y seguridad de operaciones.

## Implementación

- `GET /api/boards`: obtiene puertos reales desde pyserial / registro de Windows / Arduino CLI y modelos mediante `arduino-cli board listall --json`, con caché TTL 180 s. Se entrega `catalog_ok`, `catalog_error` y procedencia. No se inventa catálogo si la herramienta falla.
- `GET /api/board-catalog/search?query=...`: consulta `arduino-cli board search` en el índice local de Boards Manager, distinguiendo modelos ya instalados de los que necesitan un núcleo.
- `POST /api/terminal/install-core`: solo con token de sesión, confirmación explícita, validación sintáctica del core ID y verificación en el índice, sin shell arbitrario.
- `⌕ Placas`: diálogo buscable por nombre, FQBN y proveedor. Hasta 100 coincidencias visibles por página filtrada; el catálogo completo permanece consultable. Los modelos sin núcleo disponen de acción **Instalar núcleo**.
- Puertos actualizados periódicamente a intervalos de 12 s (mientras la pestaña está visible) y manualmente con `↻`. Evita redibujos si no cambió la lista.
- Asociación FQBN/puerto guardada localmente solo después de una selección explícita. Con número de serie USB se permite recuperar la asociación al cambiar de COM; sin serial, la asociación incluye **el puerto** y el VID/PID. No se identifica un Arduino Uno por el solo hecho de utilizar un CH340.
- Si Arduino CLI detecta exactamente un modelo compatible en un puerto nuevo, el IDE lo propone como valor inicial; recuerda que la identificación debe comprobarse visualmente. El perfil explícito guardado tiene prioridad.

## Pruebas efectuadas

| Comprobación | Resultado |
|---|---|
| `python -m unittest discover -s tests -p 'test*.py'` | **161/161 correctas** |
| Python `py_compile` / JavaScript `node --check` | Correctos |
| Catálogo de 260 modelos simulados | Correcto, lista dinámica |
| JSON >100 KB (1.300 modelos simulados) | Correcto, sin truncamiento |
| Duplicados y FQBN inválidos | Filtrados |
| Caché de catálogo | Correcta en pruebas unitarias |
| CH340 VID:PID 1A86:7523 sin modelo identificado | Correcto (modelo desconocido) |
| Búsqueda por nombre en Chromium aislado | Correcta; 282 modelos simulados |
| Perfil elegido, búsqueda remota simulada y modal | Correcto; 0 errores JS registrados |
| Servidor HTTP local de prueba `/api/health` | Versión 0.9.5 correcta |
| Servidor HTTP `/api/boards` sin CLI disponible | Devuelve catálogo vacío, sin inventar modelos |
| GET con caracteres de inyección en búsqueda | Rechazado HTTP 400 |

**Limitaciones de evidencia:** la prueba de interfaz utiliza datos API simulados y la prueba HTTP se realiza en Linux sin Arduino CLI. **No se ha ejecutado `board listall` contra tu instalación Windows**, no se ha comprobado el hotplug USB real de esta versión ni la instalación de un núcleo de terceros. No hay ejecución real de Codex autenticado, compilación o grabación física verificadas para la v0.9.5. La prueba histórica del Arduino Uno por Codex corresponde a v0.9.2. El simulador sigue siendo lógico, no un emulador completo.

## Riesgos pendientes y próximos pasos

- Confirmar catálogo, búsqueda y perfiles con Arduino CLI **1.5.1** en Windows y los núcleos `arduino:avr` y `esp32:esp32` previamente instalados; verificar modelos no reconocidos y reconexiones COM cambiantes.
- Añadir pruebas end-to-end reales de la instalación de núcleos, con supervisión humana para instalaciones de terceros.
- Mejorar la clasificación de FQBN con opciones de placa y compatibilidad de núcleos; el backend actual valida FQBN en su formato simple de 3 segmentos.
- Test de migración entre navegadores/proyectos y endurecimiento independiente de seguridad del puente localhost.
- La terminal `IDE>` sigue siendo una **consola de comandos guiados**, no un PowerShell general; se indica así expresamente.
- El firmware físico no se graba sin acción/consentimiento. Los agentes en modo total tienen privilegios efectivos de CLI y pueden eludir restricciones de la propia interfaz; usar con cuidado.

## Referencias técnicas

- https://arduino.github.io/arduino-cli/1.0/commands/arduino-cli_board_listall/
- https://arduino.github.io/arduino-cli/1.0/commands/arduino-cli_board_search/
- https://arduino.github.io/arduino-cli/1.0/commands/arduino-cli_board_list/
- https://arduino.github.io/arduino-cli/dev/FAQ/
