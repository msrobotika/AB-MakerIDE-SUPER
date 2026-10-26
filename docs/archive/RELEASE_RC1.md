# AB MakerIDE SUPER 1.0.0-rc.1 · 25 de octubre de 2026

Este informe describe la base RC1. La mejora posterior de guardado, continuidad y radar, con grabación autorizada, se documenta en [el registro de cambios](../../CHANGELOG.md), [la guía de proyectos](../PROYECTOS_DEL_AGENTE.md) y [sus evidencias](../evidence/radar-ideaspark/README.md). Los resultados y pendientes que siguen corresponden a la ejecución original.

Mejora local verificable sobre el commit base `cea7bcb` de v0.9.7. No se declara estable y no se ha publicado. Se conserva el ZIP de respaldo previo.

## Defectos y correcciones

| Área | Defecto observado | Resultado |
| --- | --- | --- |
| Arduino CLI | Disponible en Program Files, ausente del PATH de esta sesión | Resolución común para consultas y trabajos; override explícito; sin configuración global |
| Catálogo | Recuperación mezclaba versiones y confundía `.debug....name` con una placa; mostraba modelos ocultos | 433 FQBN reales, iguales entre CLI y recuperación `boards.txt`; exclusión de `.hide` y propiedades anidadas |
| Consulta | Fallos silenciados o presentados como cero coincidencias | Aviso visible, total desconocido al fallar, recuperación conservando selección |
| USB | Una sugerencia única podía reemplazar el FQBN | Modelo y puerto independientes; CH340/CP210x solo conversores; referencias desconectadas conservadas |
| UX | Consola coloreaba «sin errores» como error; barra estrecha desbordaba | Clasificación corregida, barra adaptable, foco visible, editor protagonista y compilación visible |
| Resultados | No existía indicador MS Robotika asociado a evidencia | Robot SVG con reductor de múltiples tareas, texto accesible y movimiento reducido |
| Compilación | Identificador solo en memoria y archivos temporales eliminados | Copia y registro por trabajo; ID previo al POST; referencia repetida no reejecuta; recuperación tras reinicio |
| Revisión | Un resultado anterior podía parecer válido tras editar | SHA-256 y FQBN de compilación; editar/cambiar placa retira el verde |
| Sesiones | Recuperar un registro activo antiguo podía reescribirlo | Lectura sin modificar originales; estado interrumpido, sin repetición automática |
| Navegador | Debounce pendiente, colisión entre pestañas, almacenamiento dañado | Guardado al abandonar página; pausa ante conflicto/daño, valor anterior conservado |
| Reinicio | Token CSRF en memoria quedaba obsoleto | Renovación y un único reintento tras rechazo 403 anterior a la ejecución |
| Codex | `exec --ask-for-approval` rechazado por la CLI instalada | Argumento global antes de `exec`, comprobado con ayuda local; sin cambiar modelo |

`server.py`, `toolchain.py`, `jobs.py`, `agent_runtime.py`, `app.js`, `activity.js` e `index.html` contienen los cambios funcionales. Launchers, VERSION, manifest, README y pruebas acompañan la entrega.

## Resultados reales y alcance

- Suite original en Windows: 171 ejecutadas, 4 fallos y 4 omisiones. Los fallos revelaron dependencia de dispositivos/núcleos del equipo en tests que se declaraban aislados.
- Suite RC1: **189 pruebas Python ejecutadas; 185 correctas, 4 omitidas por ausencia de g++**. Incluye las 171 existentes, actualizadas donde cambió el comportamiento esperado, y 18 regresiones nuevas.
- **14 casos Node** del robot correctos (su ejecución también se comprueba desde una prueba Python; no sumar ambos como casos independientes).
- Arduino CLI **1.5.1**, AVR **1.8.8**, ESP32 **3.3.12**. Catálogo CLI y fallback: **433/433 FQBN idénticos**. Páginas reales de 40 modelos. Los puertos observados durante la sesión variaron; las capturas de API registran COM4/COM6 con CH340, sin modelo asignado. No se infiere la placa.
- Chromium se conecta directamente a `http://127.0.0.1:8770`; no se utiliza `set_content`. **41 comprobaciones de aceptación correctas**, sin errores JavaScript sin capturar ni errores inesperados de consola. Compilaciones reales de un sketch sin acceso a GPIO: salida 0, y fallo deliberado de C++: salida 1. Resultados exactos, comprobaciones, errores y peticiones están en [browser-results.json](../evidence/browser-results.json).
- Capturas reales de escritorio y 390 × 844, pruebas de recarga, reinicio del servidor, proceso de navegador nuevo con perfil aislado, guardado pendiente, conflicto entre pestañas y almacenamiento dañado.
- Catálogo caído, CP210x con sugerencia conflictiva, interrupción, grabación, agente y fallos de red: **escenarios controlados**. Playwright intercepta las rutas de grabación/agente; los tests Python usan procesos stub o mocks. No se atribuyen a hardware ni a una cuenta real de IA.
- Comprobaciones sintácticas: `node --check` para los tres JavaScript y `compileall` para Python. Manifest SHA-256 verificado mediante `python tests/manifest.py`.
- **711/711 archivos originales sin cambios**, según los hashes previos disponibles; evidencia en [original-projects-integrity.json](../evidence/original-projects-integrity.json). No se ha modificado almacenamiento de navegadores existentes.

La tabla completa de aceptación y sus errores esperados están en el JSON; `console_errors` conserva incluso los fallos de red provocados y el 403 del ensayo de renovación de sesión. `unexpected_console_errors` y `page_errors` deben quedar vacíos para aceptar la ejecución.

## Recuperación y límites

El nuevo origen 8770 no comparte localStorage con 8765. Para migrar, exportar/importar `.abmaker.json`; copiar sesiones antiguas al nuevo directorio de datos si se desean consultar. Se mantienen claves y esquema anteriores; los campos nuevos son opcionales al leer registros viejos. Ver README para ubicaciones y overrides.

Los registros de compilación conservan una ventana acotada de consola, el sketch y destino; los builds binarios siguen siendo temporales. No es un sistema de historial de versiones de todos los archivos ni una sincronización entre navegadores. Un cierre forzado anterior al guardado de una pulsación aún puede perder esa última pulsación; exportar sigue siendo el respaldo portable. No hay reanudación automática de procesos tras reiniciar.

La recuperación de `boards.txt` usa la versión local más reciente de cada arquitectura. No sustituye opciones de menú ni prueba variantes físicas; los modelos personalizados con overrides especiales deben comprobarse con la CLI. El resultado del agente no acredita hardware y sus permisos no constituyen una VM. La retención de sesiones puede consumir disco; no se han borrado sesiones del usuario.

## Pendientes para una versión estable

1. Con autorización nueva: grabación física de Uno/ESP32, cancelación durante carga, reconexión USB y monitor serie. En esta sesión no se ha grabado, abierto serie ni accionado placas.
2. Verificar pantalla, cámara, GPIO, alimentación y periféricos en los modelos concretos; no se deduce funcionamiento por salida 0 del compilador o agente.
3. Prueba de extremo a extremo de agentes con una cuenta real en un entorno apropiado y autorización acotada; aquí se validó el contrato local con stubs/mocks y ayuda CLI.
4. Ejecutar los cuatro tests g++ omitidos en un entorno con compilador, y validar los launchers en Linux/macOS. Windows fue el entorno real de esta entrega.
5. Revisar empaquetado, migración con copias representativas y retención antes de etiquetar estable. No se hizo push, PR, publicación ni despliegue.

## Evidencia de campo posterior a esta entrega

El usuario aportó un vídeo de 36,79 s que muestra MakerIDE en 8765, un juego en una pantalla física y una placa UNO con indicadores encendidos. Se conserva sin edición en [la ficha del vídeo](../evidence/videos/README.md), con SHA-256 y observaciones temporales. La versión y el firmware exactos no quedan vinculados al commit RC1; se mantienen los pendientes de aceptación anteriores. Esta incorporación documental no ejecuta ninguna operación de hardware.
