# Centro de actividad IA · MS ROBOTIKA

AB MakerIDE SUPER incluye un panel lateral izquierdo propio para observar el trabajo de agentes **Codex CLI** y **Claude Code CLI**. Su estilo y estructura están creados para MS ROBOTIKA. Se inspira en principios generales de herramientas de desarrollo agéntico: una tarea visible, acceso a archivos, auditoría de comandos y evidencias.

## Cómo abrirlo

1. Arranca MakerIDE y pulsa **✦ Actividad IA**, el nuevo botón en la barra izquierda.
2. La parte superior muestra la **última tarea en uso** (si existe), proveedor, permisos y tiempo registrado. Sin sesión se muestra **Sin sesión**, nunca progreso ficticio.
3. Escribe la tarea en el campo de la izquierda y pulsa **Solicitar tarea**. Se abre el panel existente con los permisos del agente. La solicitud pasa por el **mismo consentimiento obligatorio** de siempre; no hay una vía oculta que eluda las advertencias de acceso total.
4. Durante la ejecución, consulta **Etapas y evidencia** y **Registro en directo**. Son datos del servidor local de la CLI, con actualización periódica; no son pensamientos internos del modelo ni una barra de progreso inventada.
5. Tras finalizar, consulta **Archivos resultantes**, **Diferencias reales** y **Ver resultado completo**. Abre el código únicamente desde el flujo existente que crea una copia de seguridad, o exporta el proyecto en ZIP.
6. Utiliza **Actualizar lista** y **Abrir sesión** para recuperar registros anteriores. Recuperar un registro **no** inicia la CLI, no regraba una placa ni repite los comandos. **Detener** hace una solicitud de cancelación a la tarea en curso.

## Significado de las etapas

- **Solicitud:** hay un identificador aceptado por el backend.
- **Herramientas:** hay un proceso activo o eventos recibidos de una sesión.
- **Archivos:** hay archivos registrados o un diff de código. Sin cambios detectados no se afirma que los haya.
- **Compilación:** el sistema ha detectado el resumen de compilación en la salida de las herramientas.
- **Grabación:** el grabador ha informado verificación del firmware. **No** acredita que pantalla, LEDs o sensores funcionen físicamente. Comprobar por separado con el operador y pruebas de hardware.

La interfaz distingue tareas **terminadas**, **canceladas**, **fallidas**, **con grabación pendiente** e **interrumpidas**. El indicador de estado corresponde al resultado registrado, no es una prueba automática de calidad.

## Seguridad y permisos

El panel es una vista del **motor existente**; no instala un proveedor nuevo ni concede acceso adicional. Los permisos siguen siendo los configurados por el usuario: lectura, supervisado, autónomo o acceso total. El acceso total no ofrece un sandbox real y permanece sujeto a confirmación expresa. Las salidas de CLI se muestran como **texto**, nunca HTML ejecutable, con límites de longitud. No se almacenan contraseñas, claves de IA ni registros completos de mensajes en el almacenamiento del navegador por esta función.

No hay integración de navegador automatizado de terceros, orquestación paralela de subagentes ni características exclusivas de otros productos. No se muestra razonamiento privado del modelo.

## Estado de entrega

Implementación en rama con pruebas Node y Chromium controlado. Para declarar esta experiencia lista para uso real con ambas CLIs se requieren pruebas manuales con Codex y Claude Code instalados, permisos diversos, reinicio del servidor, sesiones grandes y hardware físico. **No** se emite una nueva Release por esta mejora.
