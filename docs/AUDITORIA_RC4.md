# Respuesta a la revisión RC4 · 26 octubre 2026

Esta es una revisión de implementación y regresiones del propio proyecto, no una auditoría independiente ni una garantía de ausencia de fallos. Las pruebas de seguridad no graban placas. Además se realizó una carga CYD autorizada desde la interfaz para cerrar el fallo manual, documentada por separado.

| Hallazgo | Cambio y comprobación |
| --- | --- |
| Aprobación automática MCP implícita | Manual por defecto con app-server de Codex y decisiones de un uso en la interfaz. Automática explícita por tarea. Claude manual se bloquea por integración pendiente. Pruebas de rechazo/repetición y llamada stdio con Codex instalado. |
| Secretos en texto plano | DPAPI usuario Windows, llaveros compatibles POSIX, alternativa RAM, migración sin copia en claro. JSON Claude con referencias de entorno. DPAPI real probado; llaveros POSIX con dobles. |
| app.js monolítico | Entrada pequeña, bootstrap y doce módulos por función; Prettier y ESLint. Recorridos de navegador ejercitan los flujos entre módulos. |
| CSP permisiva | CSS externo y clases, sin estilos inline en HTML/plantillas. `style-src 'self'; style-src-attr 'none'`. Chromium registra cero violaciones en flujos controlados que incluyen redimensionar y simular. |
| Versión repetida/RC1 en cuadernos | VERSION leído por backend y transmitido a HTML/contexto del cuaderno. Prueba del registro contra VERSION y salud del servidor. |
| Higiene | Servicios en `ab_makeride/`, tests funcionales, históricos en archivo. MP4 retirado del árbol actual y adjunto a Releases; commits antiguos sin reescribir. |
| Calidad e integridad | Ruff, ESLint, Prettier, Dependabot, lockfile y puerta de manifiesto en CI. Tests de manipulación y archivo seguido sin hash. |
| Linux/macOS | Preparación/arranque con `.venv`, diagnóstico sin hardware, guía de permisos serie y macOS en matriz CI. No equivale a validación física de esas plataformas. |
| Excepciones amplias | Las siete capturas amplias señaladas registran tipo y contexto sin volcar secretos. Se mantienen para fallos de controladores y limpieza de trabajos/HTTP. |

## Revisión de los siete sinks HTML

| Uso anterior | Sustitución |
| --- | --- |
| Resaltado de código | Fragmento DOM, nodos de texto y spans con clases conocidas |
| Tabla de diagnósticos | Filas/celdas DOM y `textContent` |
| Árbol del proyecto | Elementos y propiedades de texto/valor |
| Opciones de placas | `Option` y propiedades, sin HTML |
| Panel de bibliotecas | Creación DOM y eventos explícitos |
| Ajustes | Formulario DOM y propiedades tipadas |
| Error alternativo de diagnóstico | Texto en un nodo de aviso |

La regla de ESLint prohíbe `innerHTML`, `outerHTML` y `document.write`. El ensayo de seguridad introduce cadenas hostiles en código, catálogo, proyecto y solicitud MCP; comprueba que aparecen como texto, no ejecutan JavaScript y no producen violaciones CSP. Contar llamadas de escape no se usa como evidencia de seguridad.

## Alcance de evidencia

Los [resultados RC4](evidence/rc4/README.md) separan pruebas unitarias, navegador controlado, herramientas instaladas y las pruebas físicas históricas. Las compilaciones/cargas de las seis placas documentadas no se repiten ni se dan por ampliadas a revisiones distintas. Las configuraciones antiguas en texto plano que ya existan en copias personales necesitan migración; no se afirma borrado seguro retroactivo.

## Revisión de carga manual y pantalla CYD

Los registros del incidente mostraron cargas con cuatro hashes verificados y salida 0, pero el sketch solo generaba imágenes por serie (`MAKER_TETRIS`), sin controlador LCD. Se conservan los intentos originales en un respaldo privado. La interfaz advierte de esa combinación antes de sobrescribir una CYD; la inspección del archivo principal es orientativa y no demuestra compatibilidad de todas las bibliotecas.

Se corrige el análisis de porcentajes decimales de esptool (`92.8%`, `100.0%`) y se muestra el porcentaje del bloque actual, no el de toda la operación. Los reintentos no heredan evidencia del intento fallido. La carga manual solicita `--verify`, separa el resultado del grabador de la observación física y cierra su estado terminal. Las confirmaciones de funciones manuales se muestran en el IDE, sin depender de `window.confirm`.

El servidor rechaza inmediatamente operaciones que se solapen con una carga o agente; no quedan en cola para ejecutarse después. La interfaz deshabilita monitor/envío/agente durante una operación manual. Los recorridos de cancelación, error de compilación, verificación ausente y peticiones concurrentes se comprueban sin hardware.

La [prueba CYD física desde RC4](evidence/cyd-rc4/README.md) confirmó la corrección del recorrido manual con la aplicación instalada: carga verificada, consola cerrada, guardado y observación física del usuario.
