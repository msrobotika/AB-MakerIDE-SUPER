# Instalación y recuperación en Windows

## Primer arranque

1. Extrae el ZIP completo en una carpeta propia. Conserva las versiones anteriores y tus proyectos; no mezcles los archivos de dos versiones.
2. Necesitas Python 3.10 o posterior. Si falta, el lanzador lo indica; puedes obtenerlo desde [python.org](https://www.python.org/downloads/windows/).
3. Abre **INICIAR_WINDOWS.bat**. Comprueba archivos, escritura de datos y disponibilidad del puerto antes de abrir el servidor. No cierra otros programas ni instala herramientas automáticamente.
4. El editor, guardado local y simulador funcionan sin Arduino CLI, pyserial, mpremote o cuenta de IA. Las funciones que dependen de una herramienta ausente muestran su limitación.

**PREPARAR_WINDOWS.bat** instala las dependencias opcionales de serie y MicroPython en `.venv`, dentro de esta misma copia del IDE. Necesita Internet. No modifica el Python global ni instala firmware, controladores, Arduino CLI o núcleos de placas. Después abre de nuevo **INICIAR_WINDOWS.bat**, que elegirá ese entorno privado automáticamente. No hace falta activar el entorno manualmente.

Para compilar Arduino también necesitas Arduino CLI y el núcleo de la placa. Se busca la CLI en PATH y en `C:\Program Files\Arduino CLI`. Una ruta específica puede indicarse con `AB_MAKERIDE_ARDUINO_CLI`. La preparación de Python no sustituye esa instalación.

Las funciones de IA son opcionales: cada usuario configura su proveedor y cuenta, con su propio consumo. El IDE no incluye saldo ni una suscripción. Codex fue probado en uso real por el autor; las otras integraciones siguen pendientes de validación equivalente.

## Cuando algo falla

| Mensaje o situación | Qué hacer |
| --- | --- |
| Falta Python o es demasiado antiguo | Instala Python 3.10 o posterior y abre otra vez el lanzador. No se han cambiado tus proyectos. |
| Falta algún archivo del programa | Extrae de nuevo el ZIP completo en otra carpeta. No copies archivos sueltos de una versión antigua. |
| Puerto 8770 ocupado | Revisa si ya tienes una ventana del IDE abierta. Usa la instancia existente o cierra tú la anterior cuando haya terminado sus tareas. El lanzador conserva el proceso que ocupa el puerto. |
| No se puede escribir en los datos | Usa una carpeta del usuario donde puedas guardar archivos, o configura `AB_MAKERIDE_DATA_DIR`. No ejecutes como administrador solo para ocultar ese problema. |
| Falta pyserial o mpremote | Ejecuta PREPARAR_WINDOWS.bat y vuelve a iniciar el IDE. |
| Preparación interrumpida por la red | Vuelve a ejecutar PREPARAR_WINDOWS.bat. Conserva proyectos y sesiones; la preparación no los borra. Si `.venv` está incompleta y no contiene proyectos tuyos, conserva esa carpeta con otro nombre antes de preparar un entorno nuevo. |
| Puerto serie ocupado o desconectado | Cierra el monitor de otro programa y revisa el cable. Pulsa Conectar monitor serie cuando vuelva a estar disponible. No se reenvían datos automáticamente. |
| Se perdió la conexión al servidor | El estado del monitor pasa a desconocido. Al recuperar el servidor se consulta su estado; una conexión física nueva requiere tu acción. |
| Operación interrumpida tras cerrar el servidor | Recupera el registro para revisar qué ocurrió. El resultado queda desconocido y no se repite automáticamente la operación. Comprueba el dispositivo antes de decidir una nueva carga. |

El monitor cierra su conexión si falla una lectura o un envío y vuelve a ofrecer la conexión explícita. El botón Enviar queda deshabilitado mientras está desconectado. Un error tardío de un lector anterior no desconecta una sesión nueva. Si el envío falla, el texto permanece para revisión y no se reenvía al reconectar; su recepción en el dispositivo puede ser desconocida.

## Datos y copias

El proyecto abierto se conserva en el almacenamiento del navegador y se puede exportar. Las sesiones del servidor se guardan en `.makeride-data` o en la carpeta indicada por `AB_MAKERIDE_DATA_DIR`. No borres ni sustituyas esas carpetas sin conservar antes tus datos. Los orígenes 8765 y 8770 tienen almacenamientos distintos: exporta e importa el proyecto para migrar.

La preparación opcional y el diagnóstico no abren puertos serie, no graban placas ni configuran cuentas de IA. Las copias binarias de las cinco placas probadas se conservan fuera del repositorio y del ZIP público.

## Alcance de la comprobación de instalación

Se ha ensayado una extracción nueva con espacios y `&` en su ruta y un entorno Python sin paquetes heredados, en el mismo Windows del desarrollo. El editor/simulador arrancó sin herramientas opcionales; después la preparación instaló pyserial y mpremote en la `.venv` privada. También se comprobaron puerto TCP ocupado y datos no escribibles. Los registros y límites están en [las evidencias](evidence/install-recovery/README.md).

Esto no acredita una máquina virtual recién instalada, otro PC, otro sistema operativo ni una desconexión física de USB. Los fallos de transporte se prueban de forma controlada sin abrir un puerto real. Las cinco pruebas físicas anteriores siguen documentadas por separado.

Para diagnóstico técnico sin iniciar un servidor: `python launch.py --check --json --port 8770`. El resultado conserva errores obligatorios y avisos opcionales por separado. La preparación y el lanzador usan únicamente el entorno del proceso y la carpeta de esta instalación.
