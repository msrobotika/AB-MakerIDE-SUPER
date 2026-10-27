# AB ScreenLab — capturas auténticas de Chromium

Se generaron automáticamente ejecutando `tests/browser_screenlab.py` en un navegador Chromium real, durante una ejecución controlada de CI. **No hay ESP32 conectada; no son fotografías ni capturas del TFT físico.**

- Workflow: [40441275739](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/runs/40441275739) · commit de origen: `0537441bd8afb3e4214b9544580dc82ed94bfee5`.
- Pruebas: archivo [report.json](report.json) con 8 verificaciones y lista de errores/acciones hardware vacías.
- CYD / lienzo 320×240: [captura](screenlab-cyd-real.png), SHA256 `4d867bd8b7200f72b51cd9e392c60bfd821036cc3ae51b120a8392408210b6fd`.
- IdeaSpark / lienzo 240×135: [captura](screenlab-ideaspark-real.png), SHA256 `f2e97e98bcea38323677987c7fc0f04c5399a5aac4056955b4b53691a5672235`.

La salida del generador es una cabecera UI para LVGL 8.x, no código con BSP/driver/flash acreditado.
