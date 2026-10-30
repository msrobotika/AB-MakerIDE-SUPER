# Estado de la beta

Actualizado: **30/10/2026**. Proyecto personal gratuito, sin ingresos ni uso empresarial declarados.
El código propio conserva MIT; esta declaración no elimina las condiciones de terceros.

| Área | Disponible o documentado públicamente | Pendiente |
|---|---|---|
| Editor, archivos y guardado | Editor C++/MicroPython e importación/exportación; [manual](PROYECTOS_DEL_AGENTE.md) | Seguir comprobando recuperación y cambios concurrentes. |
| Compilación, grabación y serie | Flujos con herramientas externas y [pruebas por dispositivo](MATRIZ_HARDWARE.md) | Validar cada revisión, controlador y programa; una carga correcta no demuestra imagen o táctil. |
| ScreenLab / MotionLab | Diseño visual y exportadores descritos en el [manual](SCREENLAB.md) | Distinguir diseño, código exportado, compilación y prueba física. |
| Cuttlefish HTML/CSS | Investigación y pruebas locales en curso | Integración en la interfaz, seguridad ampliada, empaquetado y prueba instalada. No disponible en esta entrega pública. |
| Asistentes / MCP | Integraciones opcionales, [permisos y límites](MCP.md) | Continuar revisando inyecciones, permisos, retención y condiciones de proveedores. |
| Windows TEST | Paquete del commit `025dd26e85d790640f5593b0ffd223267cef8f22`; evidencias en su [Release](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/tag/windows-test-dev-025dd26e85) | Firma digital, más pruebas interactivas y validación de futuras actualizaciones. |
| RC4 portátil | Archivo histórico conservado | Auditoría de atribuciones y contenido [#11](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/11) abierta. |

## Prioridades

1. Proteger proyectos y revisar seguridad, arranque, permisos y recuperación.
2. Completar licencias y procedencia de cada distribución, incluidos recursos y firmware.
3. Integrar Cuttlefish y comprobarlo primero en la instalación de pruebas.
4. Mantener avisos de privacidad, pruebas reproducibles y seguimiento de errores.

Los cambios locales no se consideran distribuidos hasta estar revisados y publicados
como tales. Esta actualización añade documentación; **no cambia el programa ni los instaladores**.

## Cómo leer las pruebas

- Una prueba controlada acredita ese escenario, no todos los equipos o ataques.
- Una compilación acredita código aceptado por esa herramienta y configuración.
- Una verificación del grabador acredita bytes; la imagen y los periféricos requieren observación física.
- Un resultado histórico se mantiene ligado a su versión; no se traslada a otro firmware o paquete.

Los manuales y sus evidencias conservan los detalles. La [checklist completa](../compliance/CHECKLIST.md)
recoge pendientes y criterios condicionales; su publicación no certifica cumplimiento integral.
Puedes colaborar con pruebas, incidencias o PR pequeños, sin compartir credenciales ni datos privados.
