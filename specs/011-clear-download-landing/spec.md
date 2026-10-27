# Portada de descargas y límites de versiones

## Requisitos
- **FR-001**: Mostrar enlaces directos y diferenciados a RC4 ZIP portátil publicado y código `main.zip` en el primer bloque del README ES/EN.
- **FR-002**: Dejar inequívoco que no existe instalador Windows `.exe`/`.msi`, que RC4 no incluye ScreenLab/MotionLab/MCP ni Sketch R2A, y que `main` no es una Release certificada.
- **FR-003**: Guía accesible de elección de versión, arranque Windows, dependencias Python/Arduino CLI y prohibición de mezclar carpetas. Corregir la descripción ambigua de exportación LVGL frente a Arduino estático.
- **FR-004**: Prueba automatizada que verifique en README ES/EN y manual URLs, diferenciación e instalación; conectarla a CI multiplataforma.
- **FR-005**: Mantener RC4 inmutable y el bloqueo de auditoría #11, registrar instalador real pendiente #19, verificar Spec Kit y huellas SHA-256 antes de integrar; no publicar una nueva Release.
