# ScreenLab R2A — generador sketch TFT
- **FR-001**: Exportación de sketch `.ino` Arduino para CYD ILI9341 y IdeaSpark ST7789 solo con pinouts documentados, sin utilizar placas al generar.
- **FR-002**: Renderizar elementos ScreenLab estáticos mediante Adafruit GFX. Rechazar animaciones y perfiles no auditados; preservar exportación LVGL y JSON.
- **FR-003**: Cargar en editor solo con FQBN ESP32, confirmación, copia anterior y sin compilar ni grabar automáticamente.
- **FR-004**: Pruebas de unidad, navegador y compilación real con Arduino CLI, núcleo fijado y registros; no confundir compilación con hardware.
- **FR-005**: Documentar bibliotecas externas, alcance físico y límites, cerrar manifiesto y Spec Kit sin Release adicional.
