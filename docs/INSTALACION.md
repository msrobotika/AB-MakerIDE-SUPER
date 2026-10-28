# Sesiones nuevas en RC4

RC4 abre el editor, el chat y la tarea vacíos. Guarda el código explícitamente con Guardar proyecto o Ctrl+S antes de cerrar si lo quieres conservar. Importar reabre JSON/INO/PY o ZIP con auxiliares. Solo se recuerdan automáticamente las preferencias de IA; los registros operativos pueden recuperarse mediante una acción explícita. Las credenciales CLI siguen en sus herramientas oficiales y las claves de chat permanecen en memoria del servidor.

El arranque también configura UTF-8 para evitar que una consola/redirección cp1252 de Windows detenga el servidor al imprimir su dirección. Los fallos de instalación y puertos ocupados siguen explicándose sin detener procesos ajenos.

## Descargas actuales

**[Descargar instalador Windows x64 TEST (.exe)](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/download/windows-test-dev-025dd26e85/AB-MakerIDE-SUPER-Windows-x64-dev-025dd26e85-Setup.exe)** — Python integrado, instalación para usuario actual, pruebas automáticas de instalación, arranque HTTP y desinstalación superadas en el commit `025dd26e85d790640f5593b0ffd223267cef8f22`. No hay firma Authenticode ni pruebas físicas nuevas del exportador; puede aparecer SmartScreen.

**[Descargar ZIP portátil RC4 histórico](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/download/v1.0.0-rc.4/AB-MakerIDE-SUPER-1.0.0-rc.4-IA-actualizada.zip)** — requiere Python 3.10+ y `INICIAR_WINDOWS.bat`; mantiene la auditoría #11 pendiente. **[Descargar código fuente actualizado main.zip](https://github.com/msrobotika/AB-MakerIDE-SUPER/archive/refs/heads/main.zip)** — copia mutable para desarrollo, no instalador.

[Elegir edición y consultar diferencias](DESCARGAS_Y_VERSIONES.md) · [Release instalador Windows TEST](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/tag/windows-test-dev-025dd26e85) · [Manual técnico del instalador](../installer/README.md).

## Usar el instalador Windows TEST

1. Descarga `AB-MakerIDE-SUPER-Windows-x64-dev-025dd26e85-Setup.exe` desde el enlace directo y ejecútalo.
2. Sigue el asistente; no necesitas Python instalado ni permisos de administrador. Abre **AB MakerIDE SUPER** desde Inicio.
3. Mantén la consola de diagnóstico abierta mientras el servidor del IDE está en uso. El navegador abre la interfaz local en `http://127.0.0.1:8770`.
4. Instala Arduino CLI, el núcleo de la placa y bibliotecas externas solo si necesitas compilar o grabar firmware Arduino; las cuentas/agentes IA son opcionales y externos.
5. Los datos operativos se guardan bajo `%LOCALAPPDATA%\\MS Robotika\\AB MakerIDE SUPER` y se conservan tras desinstalar. **Guarda/exporta tus proyectos antes de cerrar**, pues los borradores pueden estar solo en RAM.

No mezcles las carpetas y recursos de la edición RC4 con el nuevo instalador. Esta validación automatizada no constituye una prueba física de un ESP32 ni confirma Windows SmartScreen en todas las máquinas.

### Edge muestra «no se descarga habitualmente»

El aviso observado el 28/10/2026 corresponde al archivo `AB-MakerIDE-SUPER-Windows-x64-dev-025dd26e85-Setup.exe` en el panel Descargas de Edge. Es un aviso de reputación de descarga anterior a la ejecución del instalador. Por sí solo no demuestra un fallo de instalación ni certifica que el archivo sea seguro. Este TEST no está firmado: Windows informa `NotSigned` y la inspección REA no encuentra tabla de certificados PE.

Comprueba que el enlace procede de la Release oficial indicada arriba. Si decides conservar la descarga desde sus opciones en Edge, contrasta el archivo completo antes de abrirlo:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath "$env:USERPROFILE\Downloads\AB-MakerIDE-SUPER-Windows-x64-dev-025dd26e85-Setup.exe"
```

La huella esperada para ese archivo exacto es `ecb25a3d7f021c5f0c3f26a2d3a06b96c26e586366e206847a56ba4599602f7c`, publicada con la Release. Una huella distinta identifica otros bytes: no atribuyas a ese archivo las pruebas del TEST auditado. Si aparece una detección explícita de malware o una restricción de organización, conserva ese diagnóstico por separado.

No hace falta desactivar SmartScreen, Defender ni las políticas de Windows. Una distribución futura deberá resolver la identidad de firma y su validación; firmar tampoco garantiza la desaparición inmediata de todos los avisos de reputación. [Explicación oficial de Microsoft para desarrolladores](https://learn.microsoft.com/windows/apps/package-and-deploy/smartscreen-reputation).

# Instalación y recuperación en Windows

## Primer arranque — ZIP RC4 portátil

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
