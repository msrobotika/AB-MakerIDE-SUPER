# Sesiones nuevas en RC4

RC4 abre el editor, el chat y la tarea vacíos. Guarda el código explícitamente con Guardar proyecto o Ctrl+S antes de cerrar si lo quieres conservar. Importar reabre JSON/INO/PY o ZIP con auxiliares. Solo se recuerdan automáticamente las preferencias de IA; los registros operativos pueden recuperarse mediante una acción explícita. Las credenciales CLI siguen en sus herramientas oficiales y las claves de chat permanecen en memoria del servidor.

El arranque también configura UTF-8 para evitar que una consola/redirección cp1252 de Windows detenga el servidor al imprimir su dirección. Los fallos de instalación y puertos ocupados siguen explicándose sin detener procesos ajenos.

## Descarga: RC4 portátil o funciones nuevas de desarrollo

**No existe actualmente un instalador `.exe` o `.msi`.** Las dos opciones son:

- **[Descargar ZIP portátil RC4](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/download/v1.0.0-rc.4/AB-MakerIDE-SUPER-1.0.0-rc.4-IA-actualizada.zip)**: contiene el programa de RC4 y el Centro de Actividad IA; no contiene ScreenLab/MotionLab ni el generador reciente de sketches de pantalla. Es una pre-release con auditoría de distribución pendiente [#11](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/11).
- **[Descargar código `main` con ScreenLab/MotionLab](https://github.com/msrobotika/AB-MakerIDE-SUPER/archive/refs/heads/main.zip)**: para probar las mejoras desarrolladas, no un instalador ni un paquete certificado. Extraer en una carpeta **nueva y distinta**.

[Tabla de diferencias y opciones de descarga](DESCARGAS_Y_VERSIONES.md). `INICIAR_WINDOWS.bat` arranca el editor local con Python 3.10+; `PREPARAR_WINDOWS.bat` instala solo las dependencias opcionales en una `.venv` de esta carpeta. Ni uno ni otro instalan Arduino CLI ni las librerías de pantalla. No mezclar ni sustituir carpetas sin exportar primero los proyectos.

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
| Puerto 8770 ocupado | Puedes abrir una copia nueva con INICIAR_WINDOWS_8771.bat en http://127.0.0.1:8771, sin detener la anterior. Sus proyectos de navegador están separados. Revisa si ya tienes una ventana del IDE abierta. Usa la instancia existente o cierra tú la anterior cuando haya terminado sus tareas. El lanzador conserva el proceso que ocupa el puerto. |
| No se puede escribir en los datos | Usa una carpeta del usuario donde puedas guardar archivos, o configura `AB_MAKERIDE_DATA_DIR`. No ejecutes como administrador solo para ocultar ese problema. |
| Falta pyserial o mpremote | Ejecuta PREPARAR_WINDOWS.bat y vuelve a iniciar el IDE. |
| Preparación interrumpida por la red | Vuelve a ejecutar PREPARAR_WINDOWS.bat. Conserva proyectos y sesiones; la preparación no los borra. Si `.venv` está incompleta y no contiene proyectos tuyos, conserva esa carpeta con otro nombre antes de preparar un entorno nuevo. |
| Puerto serie ocupado o desconectado | Cierra el monitor de otro programa y revisa el cable. Pulsa Conectar monitor serie cuando vuelva a estar disponible. No se reenvían datos automáticamente. |
| Se perdió la conexión al servidor | El estado del monitor pasa a desconocido. Al recuperar el servidor se consulta su estado; una conexión física nueva requiere tu acción. |
| Operación interrumpida tras cerrar el servidor | Recupera el registro para revisar qué ocurrió. El resultado queda desconocido y no se repite automáticamente la operación. Comprueba el dispositivo antes de decidir una nueva carga. |

El monitor cierra su conexión si falla una lectura o un envío y vuelve a ofrecer la conexión explícita. El botón Enviar queda deshabilitado mientras está desconectado. Un error tardío de un lector anterior no desconecta una sesión nueva. Si el envío falla, el texto permanece para revisión y no se reenvía al reconectar; su recepción en el dispositivo puede ser desconocida.

## Datos y copias

El borrador abierto permanece en RAM hasta que el usuario lo descarga. Las copias antiguas no se eliminan ni se restauran automáticamente. Las sesiones del servidor se guardan en `.makeride-data` o en la carpeta indicada por `AB_MAKERIDE_DATA_DIR`. No borres ni sustituyas esas carpetas sin conservar antes tus datos. Los orígenes 8765, 8770 y 8771 tienen almacenamientos distintos: exporta e importa el proyecto para migrar.

La preparación opcional y el diagnóstico no abren puertos serie, no graban placas ni configuran cuentas de IA. Las copias binarias de las cinco placas probadas se conservan fuera del repositorio y del ZIP público.

## Alcance de la comprobación de instalación

Se ha ensayado una extracción nueva con espacios y `&` en su ruta y un entorno Python sin paquetes heredados, en el mismo Windows del desarrollo. El editor/simulador arrancó sin herramientas opcionales; después la preparación instaló pyserial y mpremote en la `.venv` privada. También se comprobaron puerto TCP ocupado y datos no escribibles. Los registros y límites están en [las evidencias](evidence/install-recovery/README.md).

Esto no acredita una máquina virtual recién instalada, otro PC, otro sistema operativo ni una desconexión física de USB. Los fallos de transporte se prueban de forma controlada sin abrir un puerto real. Las cinco pruebas físicas anteriores siguen documentadas por separado.

Para diagnóstico técnico sin iniciar un servidor: `python launch.py --check --json --port 8770`. El resultado conserva errores obligatorios y avisos opcionales por separado. La preparación y el lanzador usan únicamente el entorno del proceso y la carpeta de esta instalación.

## Linux, macOS y credenciales

Consulta [preparación POSIX y permisos serie](LINUX_MACOS.md). La configuración MCP se protege con DPAPI o llavero compatible; [esta guía](MCP.md) explica la migración y la alternativa en RAM cuando no hay almacenamiento seguro.
