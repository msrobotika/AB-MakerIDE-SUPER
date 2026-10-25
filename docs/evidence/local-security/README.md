# Revisión de los límites locales · 25 octubre 2026

Se revisaron las cuatro preguntas planteadas por el autor antes de publicar la descarga RC1: interfaz de escucha/Host, peticiones cruzadas y token, argumentos de procesos y confinamiento de nombres/rutas.

## Hallazgos y cambios

- El servidor ya escuchaba en 127.0.0.1, comprobaba Origin y exigía un token por proceso en todos los POST. Host limitaba el nombre local, pero no su puerto; ahora valida la autoridad completa.
- Se rechazan Host/Origin/token duplicados, orígenes de otro esquema/nombre/puerto, valores malformados y peticiones de otros orígenes indicadas por Sec-Fetch-Site. También se endurecen tipo de contenido y encuadre del cuerpo JSON.
- Las invocaciones de procesos inspeccionadas usan listas de argumentos y no activan shell=True. Los permisos de un agente externo no equivalen a aislamiento del sistema.
- Existían nombres principales fijos, identificadores validados y controles contra rutas absolutas, `..` y enlaces simbólicos. Se amplían a nombres reservados de Windows, colisiones, uniones/puntos de reanálisis y archivos con enlaces duros. El diagnóstico de arranque tampoco sigue un almacén redirigido.
- La prueba de interfaz del agente ya sustituía su trabajador, pero dependía de encontrar una CLI instalada y podía observar el verde de una tarea anterior antes del POST siguiente. Se controla también la disponibilidad de la CLI y se espera la respuesta de inicio.

## Evidencia local

La suite completa ejecutó **240 casos: 236 correctos y 4 omitidos** en este Windows. Los **21 casos añadidos** incluyen múltiples peticiones maliciosas por caso y comprueban que no se llega a las acciones protegidas. Tres omisiones requieren g++; otra corresponde a un enlace simbólico que necesita privilegios en Windows. La nueva prueba de unión NTFS sí se ejecutó y pasó.

La interfaz del agente pasó **38 comprobaciones** con trabajador simulado; la recuperación de conexión pasó **21** con transporte COM999 controlado. Las pruebas no utilizan cuentas de IA, no abren puertos físicos ni graban firmware. El resto del simulador y las pruebas remotas se registran por separado en la CI.

[Resultados resumidos y hashes](validation.json). [Política y límites](../../../SECURITY.md).

Estos resultados no acreditan resistencia frente a un proceso malicioso con permisos del mismo usuario que cambie rutas concurrentemente, ni constituyen una auditoría independiente. No se atribuye éxito físico a mocks o registros de una CLI.
