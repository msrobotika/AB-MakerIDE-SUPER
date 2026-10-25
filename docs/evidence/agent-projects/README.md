# Proyectos generados por el agente

Validación local de la mejora: 201 pruebas unitarias, 197 correctas y 4 omitidas por falta de g++; 26 comprobaciones de interfaz correctas. Las pruebas usan datos temporales. No ejecutan agentes externos ni escriben en hardware.

Las capturas son de Chromium aislado contra el servidor HTTP real, con el trabajo del agente sustituido por un generador controlado. Demuestran apertura en el editor, botones de guardado y carga del ejemplo; no documentan una sesión real del usuario ni una nueva grabación. El ZIP de prueba contiene sketch.ino y radar_config.h.

La prueba de interfaz cubre consentimiento sin prompt nativo, apertura automática con respaldo, preservación de cambios hechos durante la ejecución, apertura manual, desactivación de apertura automática, ZIP con cabecera, continuidad del proyecto, importación .ino y ejemplo radar con selección ESP32. La prueba unitaria de compilación comprueba que el compilador recibe el código actual y la cabecera; la invocación del compilador se sustituye por una función de prueba.

La suite general de aceptación visual anterior no se ha vuelto a ejecutar para esta mejora. Las evidencias de compilación y grabación reales del radar están en ../radar-ideaspark/.
