# Centro de actividad IA · MS ROBOTIKA

El **Centro de actividad IA** abre desde el símbolo **✧ en la barra lateral izquierda** de AB MakerIDE. Es una vista del trabajo de Codex y Claude Code que ya se ejecuta mediante el motor local de MakerIDE. **No representa razonamiento privado ni crea agentes nuevos.**

## Cómo se usa

1. Abre el proyecto y pulsa ✧ en la barra izquierda. Al principio verás «Sin tarea activa o recuperada».
2. Pulsa **Configurar / ejecutar**. Se abrirá el panel original «Codex / Claude Code · Ejecutar tarea real», donde eliges proveedor, placa, permisos y tarea.
3. Pulsa **Ejecutar agente** y confirma el permiso. Si eliges **Acceso total**, el IDE solicita el consentimiento especial. La nueva vista no puede eludir ese control.
4. Regresa a ✧ para observar eventos **recibidos del proceso CLI** con hora de recepción. Filtra Todo, Herramientas, Evidencias o Errores.
5. Revisa las señales de **firma de placa**, **compilación observada** y **grabación verificada por la herramienta**. Solo aparecen como confirmadas cuando lo dice el servidor; ninguna demuestra por sí sola lo que se ve en la pantalla física.
6. Cuando termine, consulta archivos informados y pulsa **Revisar código / diferencias** para utilizar la revisión/copia del editor original; **Abrir consola** para los registros completos; **Recuperar sesión** para buscar trabajos del backend local, o **Detener tarea** mientras esté activa.

## Principios de confianza

- «CLI FINALIZADA» significa que el proceso externo devolvió salida satisfactoria. **No significa proyecto listo ni hardware funcionando**.
- Las herramientas son autorizadas por la política ya vigente de Codex/Claude Code, no por el panel lateral.
- Sin eventos recibidos no aparecen pasos simulados, tareas o estados de éxito.
- La conexión perdida muestra **CONEXIÓN PERDIDA**; antes de repetir grabaciones, recuperar sesión y verificar el estado físico.
- No se almacenan los eventos en `localStorage`: son datos de sesión en memoria, máximo **70 entradas** visibles. El backend mantiene el histórico con su propia política.
- La salida puede contener nombres de archivos, rutas y otros datos del usuario, aunque el servidor redacta secretos conocidos: **revisar antes de compartir capturas**.

## Funciones no incluidas

La primera versión observa **una tarea CLI en el panel**. No inventa subagentes en paralelo, no incluye grabaciones de navegador, no reproduce todo el trabajo del modelo y no presenta planes como «ejecutados» si no existen datos de la CLI.

**QA:** pruebas del reductor de estados con Node y recorrido de Playwright sobre el IDE real con un **worker CLI controlado** (sin placas ni cuenta IA). La captura de CI no es una ejecución de Codex real. No hay nueva Release; el trabajo se integra mediante un PR validado.
