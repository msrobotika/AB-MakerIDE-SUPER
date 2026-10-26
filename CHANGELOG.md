# Cambios

## 1.0.0-rc.4 · permisos MCP, credenciales y mantenibilidad · 26 octubre 2026

- Codex MCP pide aprobación manual por defecto mediante su app-server y el panel del IDE. Cada respuesta es de un solo uso; rechazar, cancelar o recuperar no concede permisos ni repite llamadas. La aprobación automática exige selección explícita por tarea. Se bloquea MCP manual de Claude hasta disponer de integración nativa.
- Configuración MCP cifrada con DPAPI del usuario Windows o guardada en un llavero compatible; alternativa solo en RAM sin persistencia de secretos. Migración de configuración antigua únicamente con almacén seguro. JSON temporal de Claude con referencias a variables y modo privado en POSIX.
- `app.js` pasa a ser un punto de entrada pequeño; doce módulos ES por función más bootstrap. Eliminados los siete sinks `innerHTML`; texto, nodos DOM y clases CSS. CSP sin estilos inline y con atributos de estilo bloqueados.
- Versión de ejecución central en VERSION, incluidos los cuadernos de placas. Servicios en `ab_makeride/`, tests con nombres funcionales y documentación histórica archivada.
- Ruff, ESLint, Prettier, lockfile npm, Dependabot y manifiesto obligatorio en CI. Finales de línea definidos para que los hashes coincidan entre plataformas. Registros de excepciones amplias con tipo y contexto, sin volcar credenciales.
- Preparación/arranque Linux y macOS con entorno privado; macOS añadido a CI y guía de permisos serie. Sin nuevas afirmaciones de pruebas físicas fuera de Windows.
- Vídeo original trasladado a Releases y retirado del árbol actual. Los commits antiguos se conservan sin reescritura.

- Carga manual: corrección de decimales esptool y progreso por bloque, `--verify`, evidencia sin heredar fallos, aviso de juego serie en CYD y cierre explícito de consola. Confirmaciones dentro del IDE y exclusión inmediata de operaciones concurrentes sin encolarlas.
- Gemini Flash/Flash-Lite añadidos al conector Google con clave propia, aviso de cuota/privacidad y alcance de propuesta de código, sin anunciar ejecución real ni agente Gemini CLI.

- CYD probada desde la interfaz RC4: respaldo completo contrastado, una carga, cuatro hashes verificados, 141 s, guardado con Ctrl+S y confirmación del usuario de pantalla/táctil.

## 1.0.0-rc.3 · agente, sesión limpia y guardado manual · 25 octubre 2026

- Cada apertura comienza con editor, chat y tarea vacíos; no recupera automáticamente sesiones o compilaciones. Se recuerdan las preferencias de IA por navegador. Los archivos operativos del agente siguen disponibles para recuperación explícita.
- Guardado manual con Guardar proyecto o Ctrl+S. ZIP del agente con el código actual del editor y auxiliares, e importación del ZIP sin ejecutar CLI ni hardware. Las copias de deshacer durante la edición quedan en RAM.
- El chat Codex/Claude prepara una tarea real y su consentimiento de ejecución; el asistente guiado respeta las fases solicitadas en lugar de prohibir siempre el hardware. No se cambian silenciosamente los permisos elegidos.
- Contexto físico, referencia LCD/táctil y herramientas locales acompañan al agente. Un modelo CYD declarado o un marcador conocido del firmware permite usar su perfil; CH340 sigue sin identificar la pantalla.
- Codex usa eventos JSONL. Las evidencias se extraen de salidas de comandos completados con salida 0, no de mensajes de la IA, código citado o comandos fallidos. Pedir una carga sin verificación termina como pendiente, incluyendo registros antiguos recuperados, sin repetir escrituras.
- Demostración de juego de naves **similar a los arcades clásicos de invasores espaciales**, compilado y cargado en la CYD con dos respaldos coincidentes, cuatro bloques verificados y marcador serie; el usuario confirmó el juego.
- Arranque UTF-8 corregido para Windows con salida redirigida/cp1252 y regresión con servidor real.
- Panel MCP con configuración stdio/Streamable HTTP para Codex y Claude Code, autorización por tarea y credenciales fuera de los proyectos. Codex registra llamadas estructuradas y no declara éxito si queda un error MCP sin resolver. Ambos transportes comprobados con Codex real y servidores de prueba locales; Claude permanece experimental.
- El análisis de dependencias no consulta sketches vacíos ni aplica una respuesta de una revisión anterior al código nuevo.

## 1.0.0-rc.2 · identificación y pantalla física · 25 octubre 2026

- Consulta acotada del chip y selección de un único puerto/perfil instalado. Corrige referencias antiguas de Uno/COM sin reemplazar código. No identifica pantallas por CH340/CP210x ni elige al azar con varias placas.
- Desplegable COM estable: la elección manual prevalece sobre el escaneo periódico. Actualizar consulta el puerto elegido cuando hay varios; una respuesta tardía no deshace cambios manuales. Lanzador opcional en 8771 para conservar una instancia anterior.
- La identificación se aplaza con agentes, monitor u operaciones activas. Un puerto ocupado por otra aplicación se informa sin cerrarla. La consulta puede reiniciar el dispositivo y nunca escribe la flash.
- Destino de agente: firmware. Perfil físico declarado y opción explícita de ventana auxiliar PC. Los imports de interfaces de escritorio no autorizadas producen un resultado de destino incorrecto, separado de las evidencias de herramientas y de la salida CLI.
- Perfil documental CYD ESP32-2432S028R y juego de bloques ILI9341/XPT2046 de un archivo. Calibración táctil en RAM, sin microSD/red/configuración global de bibliotecas. Repintado de celdas modificadas para evitar el borrado completo en cada caída.
- Regresiones unitarias y de interfaz para selección, reconexión, datos preservados, ambigüedad y destino de los proyectos.

## 1.0.0-rc.1 · publicación y límites locales · 25 octubre 2026

- Repositorio público autorizado por el autor, documentación bilingüe, descarga RC y comunidad.
- Host comprueba el puerto real; Origin exige el mismo esquema, nombre y puerto. Rechazo de cabeceras duplicadas, peticiones de otros orígenes y cuerpos JSON ambiguos. Todos los POST conservan el token aleatorio de proceso.
- Rechazo de uniones NTFS/puntos de reanálisis en almacenes y sesiones, archivos con enlaces duros, nombres reservados de Windows, rutas ambiguas y colisiones en auxiliares. Sin cambios en proyectos originales ni nuevas operaciones físicas.
- 21 regresiones de seguridad añadidas; suite local de 240 casos, con 236 correctos y cuatro omitidos. Nueva unión NTFS real comprobada sin privilegios de enlaces simbólicos.
- Prueba de agente independiente de una CLI instalada y sincronizada con la respuesta de inicio. Política de seguridad y límites publicados.

## 1.0.0-rc.1 · instalación y recuperación · 25 octubre 2026

- Diagnóstico de arranque con errores obligatorios y avisos opcionales; conserva el proceso que ocupa el puerto y los datos que no puede escribir.
- Lanzador Windows que elige la `.venv` local y preparación opcional de pyserial/mpremote sin modificar el Python global.
- Monitor serie corregido: lectura o envío fallidos cierran la conexión; errores de lectores anteriores no afectan a una reconexión. No hay reenvío ni reconexión automática del transporte. Enviar se deshabilita sin conexión.
- Extracción nueva y entorno Python aislado probados en el mismo Windows, sin herramientas opcionales y después de prepararlas. No equivale a otro PC ni un sistema operativo recién instalado.
- Regresiones con transporte controlado, cancelación de un proceso Python de prueba y recuperación sin repetir operaciones. Sin nuevas cargas de hardware.
- Corregidos los selectores que quedaban en «Buscando» con catálogo vacío y el rótulo «Preparando» de una operación recuperada como interrumpida.
- Guía de instalación, notas públicas de RC y evidencias; publicación y push siguen pendientes de autorización.

## 1.0.0-rc.1 · secuencias digitales · 25 octubre 2026

- Cerrada y registrada la ronda de cinco placas disponibles; se continúa sin nuevas cargas de hardware.
- Simulador ampliado de Blink a secuencias lineales de hasta ocho salidas en Arduino C++ y MicroPython, con trazas y niveles por canal.
- Pausa, continuación, reinicio, avance al final de cada espera y velocidades virtuales de 0,25× a 4×. Ediciones y cambios de placa o lenguaje descartan modelos obsoletos.
- Corregida la fase de los patrones que comienzan en LOW y el estado inicial entre ciclos. LED_BUILTIN se resuelve únicamente en perfiles AVR Uno/Nano/Mega conocidos. Salidas MicroPython sin escritura inicial permanecen N/D.
- Retirados controles de ADC y botón sin efecto. Instrucciones desconocidas y llamadas a otros objetos rechazan el modelo completo. No se ejecuta firmware ni se declara éxito de hardware.
- Ejemplos de semáforo, regresiones del motor y pruebas de interfaz aisladas; capturas y alcance en docs/evidence/simulator.

## 1.0.0-rc.1 · Mega ATmega2560 · 25 octubre 2026

- Mega reconocido en COM8 y firma ATmega2560 leída por el cargador wiring.
- Copia previa de 256 KB de flash y 4 KB de EEPROM, carga autorizada y verificación independiente. EEPROM conservada.
- Cinco muestras reales por serie correctas; ejemplo, proyecto importable, registros y matriz actualizados. Sin pruebas de GPIO externos ni otros periféricos.

## 1.0.0-rc.1 · Nano ATmega328P · 25 octubre 2026

- Firma real por cargador serie y perfil Nano antiguo confirmado a 57600 baudios; CH340 no se interpreta como identificación del modelo.
- Respaldo previo de flash y EEPROM; carga autorizada del diagnóstico, verificación independiente y EEPROM conservada.
- Cinco muestras reales por serie y resultado correcto; ejemplo, proyecto importable, registros y matriz actualizados. Sin pruebas de GPIO ni periféricos externos.

## 1.0.0-rc.1 · ESP32-WROOM y MicroPython · 25 octubre 2026

- Identificada una WROOM con ESP32-D0WDQ6 revisión 1.0 y flash de 4 MB; controlador CP2102 ausente reparado en Windows, pasando de código 28 sin puerto a COM7 con estado correcto.
- Respaldo completo previo, borrado e instalación de MicroPython 1.29.0 autorizados por el usuario, con verificación independiente del firmware.
- Ejemplo reutilizable probado en RAM: cinco muestras de intérprete, memoria, JSON y temporización y lectura del sistema de archivos. Sin GPIO ni red y sin guardado de main.py.
- Registros, código y matriz de hardware actualizados; binarios del respaldo, firmware y controlador fuera del repositorio.

## 1.0.0-rc.1 · prueba física ESP32-CAM · 25 octubre 2026

- Copia completa de 4 MB del firmware previo y carga autorizada con verificación de cuatro segmentos en COM4.
- Diagnóstico real: ESP32-D0WD-V3 revisión 3.1, PSRAM detectada, sensor OV3660 PID 0x3660 y cinco buffers JPEG 320x240, sin errores durante 16 s de lectura.
- Corrección del texto del ejemplo y aviso de cámara: el pinout AI-Thinker no determina que el sensor sea OV2640; se identifica en ejecución.
- Código exacto probado, logs y hashes conservados; respaldo binario privado fuera del repositorio. Matriz de hardware con alcances y pendientes.

## 1.0.0-rc.1 · cuaderno de placas · 25 octubre 2026

- Cuaderno local para guardar y exportar pruebas de varias placas, con resultados de herramienta y observaciones del usuario separados.
- Asociación conservadora con revisión, placa, proyecto auxiliar y puerto; protección ante almacenamiento dañado y cambios en otra pestaña.
- Puerto de grabación conservado en el registro recuperable de los trabajos Arduino.
- Cuenta y consumo de IA propios explicados en la interfaz; Codex probado por el autor y otras integraciones marcadas como experimentales.
- Estado «CLI instalada» separado de inicio de sesión y cuota. Los informes nombran al proveedor que ejecutó la tarea.
- 199 pruebas Python correctas, 4 omitidas y 37 comprobaciones de interfaz. Las pruebas del cuaderno no operan hardware.

## 1.0.0-rc.1 · actualización de proyectos · 25 octubre 2026

- Apertura del código generado en el editor al terminar, con respaldo previo y protección de las ediciones hechas durante la ejecución.
- Botones para abrir el último código, guardar el sketch y descargar el proyecto con archivos auxiliares en ZIP.
- Continuidad de auxiliares entre sesiones del agente y compilación con las cabeceras del proyecto.
- Importación de .ino y .py, además del formato .abmaker.json.
- Ejemplo radar de archivo único para IdeaSpark ST7789, compilado y grabado con autorización; funcionamiento visual confirmado por el usuario.
- Consentimiento del agente mediante diálogo dentro de la página, compatible con el navegador integrado.
- Capturas aportadas por el usuario y pruebas aisladas documentadas. 197 pruebas Python correctas, 4 omitidas y 26 comprobaciones de interfaz correctas.
- Presentación del proyecto abierto, guía de contribución y configuración inicial de CI preparada para GitHub.

## Base RC1

Catálogo real paginado, modelo separado de puerto, estados de trabajo verificables, recuperación de sesiones y resultados, protección ante pestañas en conflicto y pruebas locales. [Informe de la base RC1 y sus límites](docs/archive/RELEASE_RC1.md).

## Antes de v1.0 estable

Quedan por validar la matriz de placas, desconexiones y cancelación durante carga, serie y MicroPython en dispositivos concretos, instalación y migración en equipos limpios, y launchers Linux/macOS. También faltan resultados remotos de CI y pruebas con usuarios externos. La grabación correcta del radar no sustituye esa matriz.
