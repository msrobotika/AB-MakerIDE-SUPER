# Cuaderno de placas y cuentas propias

203 pruebas Python ejecutadas: 199 correctas y 4 omitidas por falta de g++. La suite incluye 9 regresiones Node del cuaderno (no se suman de nuevo al total Python). 37 comprobaciones de interfaz correctas, con HTTP real y Chromium aislado, en escritorio y a 390 px.

Estas pruebas usan operaciones de agente y resultados de trabajos controlados. No consumen una cuenta de IA ni graban hardware. El caso de grabación simulada corresponde a COM4 con una selección sin puerto; se comprueba que no se atribuya al destino actual. La captura y el JSON exportado son datos de prueba, no pruebas de la ESP32-CAM conectada.

Se comprueban recuperación tras recarga, observación física sin completar automáticamente, comparación de código/placa/puerto/proyecto auxiliar, exportación, conflicto entre pestañas y bloqueo sin sobrescribir almacenamiento dañado. Los avisos de cuenta propia y Claude experimental también se comprueban.

Las evidencias previas del radar y los proyectos permanecen en sus carpetas. La inspección real de la ESP32-CAM, separada de estas pruebas de interfaz, está en ../esp32cam/.
