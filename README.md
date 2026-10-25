# AB MakerIDE SUPER 1.0.0-rc.3 · MS Robotika

[![Comprobaciones](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml/badge.svg)](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml) [![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)

**[Descargar RC3](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/tag/v1.0.0-rc.3)** · [Comunicar un fallo](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/new/choose) · [Proyectos y pruebas de placas](https://github.com/msrobotika/AB-MakerIDE-SUPER/discussions) · [English](README.en.md)

**Un editor con agente para crear firmware de Arduino, ESP32 y MicroPython.** Pide el proyecto desde el chat, trabaja con el código en el editor y distingue cada resultado: código, compilación, carga verificada y observación física.

La aplicación es open source, con [licencia MIT](LICENSE). **La IA es opcional y no es gratuita por incluir MakerIDE:** cada usuario vincula su propia cuenta y utiliza su cuota. Codex está probado en uso real por el autor. Claude Code, conectores de chat y Ollama siguen pendientes de validación equivalente.

![Sesión nueva de MakerIDE RC3](docs/evidence/rc3/sesion-limpia-real.png)

## Nuevo en RC3

- Cada apertura empieza con **editor, chat y tarea vacíos**. Se recuerdan las preferencias de IA; las tareas anteriores no se recuperan ni ejecutan automáticamente.
- **Guardar proyecto o Ctrl+S** descarga el trabajo cuando tú lo decides. Un proyecto de agente se guarda como ZIP con el código actual y sus auxiliares; Importar vuelve a abrirlo sin ejecutar hardware. Los borradores y el deshacer de la sesión quedan en RAM.
- El chat Codex/Claude abre una tarea real y su autorización, en lugar de sustituir la ejecución por una respuesta de consulta. El perfil físico y una referencia de pantalla/táctil acompañan al agente.
- Codex utiliza eventos JSONL: las evidencias proceden de la salida de comandos completados con código 0. Citar una frase de verificación en código o en un mensaje no convierte la tarea en una grabación correcta.
- Si pides cargar y no consta verificación, el resultado queda **pendiente**, aunque la CLI termine con salida 0. Una recuperación nunca repite una grabación.
- La CYD puede informar de su perfil mediante un marcador conocido del firmware. No es una lectura independiente del controlador LCD ni identificación universal por CH340.
- **Panel MCP:** configuración estándar de servidores stdio y Streamable HTTP para los agentes CLI, activación explícita por tarea y registro de llamadas de Codex. Ambos transportes se han probado con el Codex instalado y servidores locales controlados; Claude Code sigue pendiente de ejecución real. [Conectar herramientas MCP](docs/MCP.md).

[Flujo del agente, guardado y límites](docs/PROYECTOS_DEL_AGENTE.md) · [Identificación](docs/IDENTIFICACION_AUTOMATICA.md) · [Cambios](CHANGELOG.md)

## Empezar en Windows

1. Extrae el ZIP en una carpeta nueva y conserva tus versiones y archivos anteriores.
2. Con Python 3.10 o posterior, abre **INICIAR_WINDOWS.bat**. La dirección predeterminada es **http://127.0.0.1:8770**. El lanzador no cierra un proceso que ya ocupe el puerto.
3. El editor y el simulador funcionan sin dependencias opcionales. **PREPARAR_WINDOWS.bat** prepara serie/MicroPython en la `.venv` de esta copia. Arduino necesita Arduino CLI y el núcleo de la placa.
4. Conecta la placa. Cuando puede identificar una única conexión, el IDE selecciona puerto y perfil instalado. La elección manual prevalece. El modelo comercial, la pantalla y su revisión necesitan datos suficientes; no se adivinan por el conversor USB.
5. Describe el proyecto en el chat y elige el permiso del agente. Una carga necesita una petición inequívoca y el puerto confirmado. El resultado de la herramienta y lo que observas en el dispositivo se registran por separado.
6. Pulsa **Guardar proyecto** si quieres conservar el código. Una nueva apertura empieza vacía.

[Instalación y recuperación](docs/INSTALACION.md). La consulta del chip puede reiniciar la placa; no escribe firmware. Los datos operativos del agente se guardan en `.makeride-data`, o en `AB_MAKERIDE_DATA_DIR`, para diagnóstico y recuperación explícita. No convierten el borrador del editor en un archivo guardado por el usuario. Las claves de los conectores de chat permanecen en memoria del servidor; las cuentas CLI se gestionan mediante sus herramientas oficiales.

## Herramientas y evidencia

Incluye editor Arduino C++/MicroPython, catálogo de modelos instalados, compilación, carga, monitor serie, diagnóstico, agente opcional, exportación/importación y un [simulador de secuencias digitales](docs/SIMULADOR.md). El simulador no emula firmware ni acredita funcionamiento físico. El [cuaderno de placas](docs/PRUEBAS_DE_PLACAS.md) guarda pruebas cuando el usuario lo solicita.

Hay pruebas físicas documentadas de **seis dispositivos concretos**: radar IdeaSpark, ESP32-CAM, WROOM con MicroPython, Nano con cargador antiguo, Mega 2560 y CYD con pantalla táctil. La CYD recibió primero bloques y después [Space Invaders](docs/evidence/cyd-space-invaders/README.md): dos respaldos de flash coincidentes, firmware completo compilado, cuatro bloques de grabación verificados y marcador serie. El usuario confirmó que tenía el juego. Esto no acredita cualquier revisión ni una prueba prolongada de todos sus periféricos.

[Matriz de hardware](docs/MATRIZ_HARDWARE.md) · [Radar](docs/evidence/radar-ideaspark/README.md) · [Cámara](docs/evidence/esp32cam/README.md) · [MicroPython](docs/evidence/wroom-micropython/README.md) · [Nano](docs/evidence/arduino-nano/README.md) · [Mega](docs/evidence/arduino-mega/README.md) · [Bloques CYD](docs/evidence/cyd/README.md)

La suite local RC3 pasa **277 pruebas unitarias de 281**, con cuatro omitidas por g++/privilegios de enlaces simbólicos. Los seis flujos de interfaz suman **148 comprobaciones**. También se ha probado el Codex CLI instalado, el recorrido del chat real en modo de lectura y herramientas MCP locales, sin hardware. Las pruebas controladas de navegador no se presentan como cargas físicas. [Resultados y alcance](docs/evidence/rc3/README.md).

**Estado: candidato de lanzamiento, validado físicamente en Windows.** CI ejecuta unidades en Windows y Linux y navegador en Chromium; no acredita por sí sola instalación interactiva, controladores USB ni hardware de Linux/macOS.

[Seguridad local](SECURITY.md): loopback, Host/Origin exactos, token por proceso y límites de rutas/archivos. Los permisos del agente son los de su CLI; el modo supervisado no constituye un sandbox del sistema operativo.

[Contribuir](CONTRIBUTING.md) · [Licencia MIT](LICENSE) · [Compartir pruebas de Linux y macOS](https://github.com/msrobotika/AB-MakerIDE-SUPER/discussions)
