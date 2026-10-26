# AB MakerIDE SUPER 1.0.0-rc.4 · MS Robotika

[![Comprobaciones](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml/badge.svg)](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml) [![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)

**[Única candidata pública: RC4 (pre-release)](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/tag/v1.0.0-rc.4)** · [Comunicar un fallo](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/new/choose) · [Proyectos y pruebas de placas](https://github.com/msrobotika/AB-MakerIDE-SUPER/discussions) · [English](README.en.md)

**Un editor con agente para crear firmware de Arduino, ESP32 y MicroPython.** Pide el proyecto desde el chat, trabaja con el código en el editor y distingue cada resultado: código, compilación, carga verificada y observación física.

## Capturas auténticas del IDE · RC4

Estas imágenes proceden de la **aplicación RC4 en Windows con una placa CYD ESP32-2432S028R**, no de un concepto gráfico ni de un simulador.

[![RC4: carga de firmware desde el IDE y consola de verificación](docs/evidence/cyd-rc4/carga-desde-ide-real.png)](docs/evidence/cyd-rc4/carga-desde-ide-real.png)

*IDE con editor, selección de placa, asistente opcional, verificación de carga y consola. La captura verifica la finalización del grabador; la pantalla/táctil fueron confirmados por separado por el usuario.*

[![RC4: panel de placas y monitor serie conectado](docs/evidence/cyd-rc4/monitor-serie-real.png)](docs/evidence/cyd-rc4/monitor-serie-real.png)

*Panel de placas/COM4, monitor serie y mensajes de inicialización. [Evidencias completas](docs/evidence/cyd-rc4/README.md).*

**[Ver características, descarga, instalación, pruebas y límites de RC4](docs/RC4_PUBLICACION.md)**.

**Descarga histórica sin certificación de licencias actualizadas:** el ZIP público RC4 se empaquetó antes de la PR #10. No se ha verificado que contenga las nuevas atribuciones ni el ejemplo renombrado. [Auditoría pendiente](docs/AUDITORIA_DISTRIBUCION_RC4.md) · [Incidencia #11](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/11).

La aplicación es open source, con [licencia MIT](LICENSE). **AB MakerIDE SUPER es independiente y no oficial**: utiliza Arduino CLI instalada por separado por cada usuario. Arduino® es marca de Arduino S.r.l.; no existe afiliación ni respaldo. [Licencias y avisos de terceros](THIRD_PARTY_NOTICES.md) · [Política de marcas](docs/MARCAS_Y_LICENCIAS.md). **La IA es opcional y no es gratuita por incluir MakerIDE:** cada usuario vincula su propia cuenta y utiliza su cuota. Codex está probado en uso real por el autor. Claude Code, conectores de chat y Ollama siguen pendientes de validación equivalente.

**Publicaciones congeladas:** el desarrollo continúa mediante PR y pruebas; no se crearán lanzamientos cada día. La RC4 es **un candidato, no una versión estable**. [Política estricta de publicación](docs/RELEASE_POLICY.md) · [Índice de documentación vigente](docs/README.md). En la página pública de Releases solo se mantiene RC4. Se conservan los commits históricos y su trazabilidad.

## Centro de actividad IA · integrado en la descarga actual de RC4

Una pestaña **✧ en la barra izquierda** permite seguir el trabajo real de Codex y Claude Code: estado y permisos de la tarea, eventos recibidos, evidencias de compilación/grabación, archivos informados, aprobaciones pendientes y acceso a las diferencias del editor. No se muestran tareas simuladas ni se modifica el sistema de consentimiento. [Cómo funciona y qué verifica](docs/CENTRO_ACTIVIDAD_IA.md).

**Capturas reales de navegador** del Centro de Actividad IA. Son recorridos con worker CLI controlado, sin cuenta IA ni hardware físico conectado.

[![Centro de Actividad IA, sin sesión](docs/evidence/agent-activity/01-panel-sin-sesion.png)](docs/evidence/agent-activity/01-panel-sin-sesion.png)

[![Centro de Actividad IA con una tarea CLI controlada](docs/evidence/agent-activity/02-actividad-cli-controlada.png)](docs/evidence/agent-activity/02-actividad-cli-controlada.png)

La vista utiliza eventos de la CLI y conserva los controles de permisos. No interpreta una tarea terminada como una grabación física verificada.

La etiqueta Git `v1.0.0-rc.4` conserva su historial original. La descarga actualizada se denomina **`AB-MakerIDE-SUPER-1.0.0-rc.4-IA-actualizada.zip`**. [Validación del paquete actualizado](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/runs/40317679226); no sustituye nuevas pruebas físicas.

## Nuevo en RC4

- **MCP manual por defecto en Codex.** Cada solicitud aparece en el IDE con sus argumentos y necesita una decisión. La aprobación automática es una opción visible, desactivada al abrir y limitada a esa ejecución. Claude Code conserva su estado experimental y bloquea el modo MCP manual hasta integrar sus aprobaciones nativas. [Permisos y compatibilidad](docs/MCP.md).
- **Credenciales protegidas:** DPAPI del usuario en Windows; llavero del sistema en Linux/macOS con backend compatible. Sin llavero no se crean nuevos archivos en texto plano: la configuración nueva vive solo en RAM y el panel lo indica. El JSON temporal de Claude contiene referencias a variables, no sus valores.
- **Frontend en módulos ES**, código formateado y sin asignaciones a `innerHTML`. Estilos externos y CSP sin `unsafe-inline`, con `style-src-attr 'none'`. [Arquitectura y desarrollo](docs/DESARROLLO.md).
- **VERSION es la fuente de la versión** del servidor, interfaz y cuadernos de prueba. Ruff, ESLint, Prettier, Dependabot e integridad SHA-256 forman parte de CI.
- Servicios Python en `ab_makeride/`, tests por funcionalidad y documentos históricos en `docs/archive/`. El vídeo original pasa a los adjuntos de Releases; no se reescribe el historial Git.
- Preparación y arranque equivalentes en Linux/macOS, más CI en macOS. [Instalación y permisos serie](docs/LINUX_MACOS.md). La validación física sigue siendo en Windows.

Se conservan el **inicio vacío**, el guardado manual con **Ctrl+S**, la importación del proyecto y la separación entre compilación, carga verificada y observación física. Recuperar un registro no repite una grabación.

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

Hay pruebas físicas documentadas de **seis dispositivos concretos**: radar IdeaSpark, ESP32-CAM, WROOM con MicroPython, Nano con cargador antiguo, Mega 2560 y CYD con pantalla táctil. La CYD recibió primero bloques y después [un ensayo histórico de juego arcade de naves](docs/evidence/cyd-space-invaders/README.md): dos respaldos de flash coincidentes, firmware compilado y cuatro bloques verificados. **Estas pruebas pertenecen al firmware histórico, no al ejemplo renombrado.** El ejemplo de desarrollo actual, [Defensa Orbital](examples/defensa_orbital/defensa_orbital.ino), todavía requiere compilación y validación física independientes. Esto no acredita cualquier revisión ni una prueba prolongada de todos sus periféricos.

[Matriz de hardware](docs/MATRIZ_HARDWARE.md) · [Radar](docs/evidence/radar-ideaspark/README.md) · [Cámara](docs/evidence/esp32cam/README.md) · [MicroPython](docs/evidence/wroom-micropython/README.md) · [Nano](docs/evidence/arduino-nano/README.md) · [Mega](docs/evidence/arduino-mega/README.md) · [Bloques CYD](docs/evidence/cyd/README.md)

La suite local RC4 pasa **294 de 299 pruebas unitarias**, con cinco omisiones por herramientas/privilegios/plataforma. Los ocho flujos de navegador suman **196 comprobaciones**. Se incluyen pruebas de inyección y CSP, una aprobación MCP con el Codex instalado y una compilación real Uno sin grabación. [Resultados y límites](docs/evidence/rc4/README.md) · [Respuesta punto por punto a la revisión](docs/AUDITORIA_RC4.md).

**Estado: candidato de lanzamiento, validado físicamente en Windows.** CI ejecuta unidades en Windows, Ubuntu y macOS y navegador en Chromium; no acredita por sí sola instalación interactiva, controladores USB ni hardware de Linux/macOS.

[Seguridad local](SECURITY.md): loopback, Host/Origin exactos, token por proceso y límites de rutas/archivos. Los permisos del agente son los de su CLI; el modo supervisado no constituye un sandbox del sistema operativo.

[Contribuir](CONTRIBUTING.md) · [Licencia MIT](LICENSE) · [Compartir pruebas de Linux y macOS](https://github.com/msrobotika/AB-MakerIDE-SUPER/discussions)

[IA, cuentas y opción online con cuota gratuita](docs/IA_Y_CUOTAS.md).

El desarrollo de nuevas mejoras sigue [GitHub Spec Kit y un control de entrega en CI](docs/SPEC_KIT.md).
La adopción del proceso no altera la RC4 publicada ni sus resultados de hardware.

[Prueba real de carga manual CYD desde RC4](docs/evidence/cyd-rc4/README.md): respaldo comprobado, una carga desde la interfaz, cuatro hashes verificados, guardado con Ctrl+S y pantalla/táctil confirmados por el usuario.
