# Trabajar con el agente y guardar el proyecto · RC3

Cada apertura empieza con editor, chat y tareas vacíos. El código de un borrador se conserva si el usuario lo guarda; no se restaura automáticamente al volver. Se recuerdan proveedor/modelo, CLI elegida, modo de permisos y preferencia de apertura del código generado. No se almacenan prompts ni claves API en esas preferencias. Las cuentas de Codex/Claude pertenecen a sus herramientas oficiales y los conectores de chat mantienen sus claves en memoria del servidor.

## Pedir y ejecutar

Con Codex o Claude seleccionado, el chat prepara una tarea real y abre su autorización. La CLI recibe una copia del código actual y sus auxiliares, el puerto/FQBN declarados y el perfil físico disponible. El permiso elegido se conserva como preferencia, pero no autoriza silenciosamente una ejecución posterior. Acceso total mantiene su consentimiento textual por tarea.

Un modelo CYD expresado en la petición o seleccionado como perfil concreto proporciona la referencia LCD/táctil local. La ausencia de nombre comercial en `board list` no borra esos datos. El agente debe consultar las referencias antes de volver a preguntar por información ya incluida. Si queda una incertidumbre física imprescindible, debe explicar qué falta; no debe sustituir el firmware por Tkinter u otra ventana PC.

Cuando la petición incluye una carga autorizada, debe compilar el firmware completo y cargarlo con verificación. Una CLI que termina sin esa evidencia devuelve `upload_pending`. Los registros anteriores se interpretan con ese límite al recuperarlos, sin repetir ninguna operación. Las evidencias de Codex se extraen de eventos de comandos completados con salida 0. No equivalen a ver personalmente una pantalla ni son una garantía contra un agente con permisos totales que falsifique sus propias salidas.

Durante una tarea activa se bloquean en la interfaz las compilaciones/cargas paralelas y el uso del monitor. Si el monitor del propio IDE ocupa el puerto de la nueva tarea, se cierra antes de arrancar la CLI; no se reconecta ni reenvía datos automáticamente. Los programas externos y las CLI con acceso total quedan fuera del aislamiento del IDE.

## Código y archivos

El código generado puede abrirse automáticamente si no has cambiado el original. Una edición concurrente se conserva. Las copias para deshacer una sustitución viven en RAM durante esa apertura. Cerrar o volver a abrir el IDE inicia una sesión vacía.

- **Guardar proyecto / Ctrl+S:** descarga JSON para un borrador simple; si el código pertenece a un proyecto de agente/importado, descarga ZIP con la versión actual del editor y sus auxiliares.
- **Guardar proyecto del agente:** permite descargar una sesión terminada con sus archivos. Si corresponde al editor actual, incluye sus últimas ediciones.
- **Importar:** abre `.ino`, `.py`, JSON de MakerIDE o un ZIP guardado. El ZIP conserva cabeceras y archivos auxiliares, pero no ejecuta nada ni programa una placa.
- **Continuar pendiente:** hereda código/auxiliares y perfil de la sesión elegida. Requiere una nueva tarea autorizada y no repite cargas desconocidas a ciegas.

Los ZIP se leen sin extraer rutas arbitrarias. Se rechazan enlaces, rutas ascendentes/absolutas, duplicados, ficheros ocultos y contenidos cifrados; se limitan a 128 archivos y 8 MB de proyecto. No se importan afirmaciones de compilación o grabación como evidencia nueva.

Las sesiones operativas permanecen en `.makeride-data/AgentWorkspaces` para diagnóstico y descarga explícita; son un archivo de trabajo, no guardado automático del borrador del editor. Las copias de versiones anteriores se conservan y una migración no carga su código por sí sola. Las copias completas de flash siguen fuera de los proyectos públicos.
