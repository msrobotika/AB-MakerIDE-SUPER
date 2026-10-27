# Análisis técnico

- El perfil define solo geometría: CYD ILI9341 240×320, lienzo horizontal 320×240; IdeaSpark ST7789 135×240, lienzo horizontal 240×135. Esos tamaños no verifican pines, chip revision, calibración táctil o BSP.
- UI editada sobre canvas escalado en navegador, datos de usuario aplicados con textContent y estilos validados, no innerHTML dinámico. El importador limita tamaño y comprueba esquema/colores/IDs/rangos.
- Salida es .h C++ con llamada explícita a API LVGL 8.x; no incluye firmware host o driver/tick/loop. Eventos de botón entregan ID, sin acciones eléctricas automáticas.
- Resguardos: sin llamadas HTTP de grabación, sin MCP, sin escrituras al firmware, sin keys, sin subidas de datos; proyectos ScreenLab independientes y reversibles. Importante verificarlo en Chromium/CI.
- Pruebas automáticas no prueban aún render real de LVGL sobre TFT, compatibilidad LVGL 9, touchscreen ni presupuestos de memoria. Quedan como fase con placas y consentimiento.
