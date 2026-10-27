# AB ScreenLab — estudio visual TFT para MakerIDE SUPER

**Estado:** módulo experimental del árbol de desarrollo, separado de la descarga histórica RC4. No supone que un perfil de diseño equivalga a una placa identificada/calibrada.

## Abrir y diseñar

En MakerIDE: **⋯ Herramientas → AB ScreenLab · Pantallas**. Permite crear un diseño editable mediante texto, botón, barra de progreso y contenedor. Se seleccionan y desplazan con ratón/táctil; se modifican texto, color, posición y dimensiones, con validaciones dentro del lienzo y deshacer hasta 30 pasos. Las flechas mueven el objeto enfocado 4 píxeles; Supr elimina. El editor normal continúa intacto.

Los perfiles **solo controlan la resolución de diseño**, no los GPIO:

| Perfil inicial | Lienzo en horizontal | Hardware observado anteriormente |
| --- | --- | --- |
| ESP32 CYD / ESP32-2432S028R | **320×240** | ILI9341 240×320, táctil XPT2046 (rotación según driver) |
| IdeaSpark ESP32 TFT | **240×135** | ST7789 135×240 (rotación según driver) |
| Genérica | **320×240** | Ningún hardware probado |

Cambiar el perfil recoloca los objetos para que quepan: verifica el resultado visual antes de distribuir firmware.

## Exportación y recuperación

- **Proyecto .json:** formato `ab-screenlab-v1` y componentes validados; puede importarse posteriormente.
- **Código .h:** genera función `ab_screenlab_build(lv_obj_t *parent)` con objetos LVGL **8.x**. Incorpora `ab_screenlab_set_tap_handler` para entregar el ID del botón a la aplicación anfitriona.
- **Estado:** se conserva en `localStorage` del navegador del IDE, independiente de los proyectos/sketches. Si el almacenamiento no está disponible se indica explícitamente y queda disponible exportar JSON.
- **Integración:** una aplicación de firmware debe inicializar ESP32, el bus y driver TFT/táctil, crear el display de LVGL, sus buffers y tick/timer, e invocar `ab_screenlab_build(lv_scr_act())`. El código exportado **no contiene un sketch completo**, por lo que NO es válido pulsar «Grabar» directamente. La licencia/versión de LVGL y BSP se instalan y revisan por separado.
- **Eventos:** `ab_screenlab_set_tap_handler(mi_callback)` permite procesar ID de botones; **no genera** por sí solo operaciones GPIO, motores ni acciones físicas.

## Puertas de calidad y pendientes

Pruebas de modelo, validación de archivos, generador de C++, UI Chromium, exportación, estabilidad y CI. No se declara compilación firmware de ScreenLab en la placa física, soporte probado en LVGL 9, autoconfiguración automática de drivers, rendimiento validado, táctil calibrado, ni instalador nuevo. Para uso industrial se requiere especificación de arquitectura, memoria, latencia, seguridad y prueba física.

Fase siguiente: perfil de BSP explícito y comprobado, integración de LVGL en proyectos generados, acciones de widget vinculadas a variables/sensores, simulación de estados con datos, import/export de pantallas múltiples, comparación foto-vs-diseño y ensayo en tu CYD/IdeaSpark con autorización.

## Evidencias visuales publicadas

[Captura CYD 320×240](evidence/screenlab/screenlab-cyd-real.png) · [Captura IdeaSpark 240×135](evidence/screenlab/screenlab-ideaspark-real.png) · [Informe, procedencia y hashes](evidence/screenlab/README.md). Imágenes de Chromium real con placa controlada, no grabación TFT física.

## AB MotionLab — animaciones ligeras inspiradas en CSS (fase R1 experimental)

La captura del vídeo aportado explica la conversión de CSS en gráficos para ESP32. ScreenLab puede evitar almacenar secuencias de bitmaps para **efectos simples** y expresar sus movimientos como animaciones nativas de LVGL 8.x:

- Seleccionar un componente en ScreenLab y escoger **Aparecer**, **Deslizar** o **Pulso de anchura**; duración acotada **200–5000 ms**. **Sin animación** sigue siendo el valor predeterminado.
- Pulsar **Vista previa animada** para ejecutar el movimiento **solo en el navegador**; respeta `prefers-reduced-motion`.
- Exportar la cabecera .h e integrar una aplicación propia con LVGL 8.x. El generador produce `lv_anim_t`, `lv_anim_set_var`, `lv_anim_set_values`, `lv_anim_set_time` y `lv_anim_start`. La ejecución es de una pasada al construir la UI, sin procesos en segundo plano.
- Los proyectos antiguos `ab-screenlab-v1` sin campos de animación siguen válidos. Solo se aceptan nombres de preset conocidos y duraciones enteras acotadas; no se evalúa CSS/JS importado.

**Limitaciones:** esto **no convierte CSS arbitrario, elementos 3D ni vídeos a firmware** y la previsualización no demuestra render idéntico a TFT. Se necesita el BSP/driver y prueba de memoria/velocidad reales. El siguiente módulo deberá convertir gráficos CSS complejos **fuera del ESP32**, con navegador sin red, fotogramas propios, RGB565/paleta, deduplicación, presupuesto de flash/RAM y opciones de almacenamiento externo. Un frame completo CYD RGB565 320×240 ocupa 153.600 bytes antes de compresión; diez frames ocuparían 1.536.000 bytes. En IdeaSpark 240×135 ocupa 64.800 bytes por frame. No copiar recursos del vídeo ni marcas/gráficos de terceros. El motor de animación LVGL 8.4 está documentado por [LVGL Open](https://lvgl.io/docs/open/8.4/overview/animation).
