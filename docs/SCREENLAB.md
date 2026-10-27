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
