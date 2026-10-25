# AB MakerIDE SUPER · presentación de la RC

De una idea a firmware verificable, con un IDE local y abierto.

AB MakerIDE SUPER reúne Arduino C++, MicroPython, herramientas de placa y agentes opcionales en una interfaz en español. El código que genera el agente puede abrirse con respaldo, guardarse como sketch y exportarse con sus archivos auxiliares. El robot MS Robotika informa de cada tarea con color, texto y registros para que puedas comprobar el resultado.

La primera demostración verificada utiliza una IdeaSpark con ESP32 y pantalla ST7789: un radar visual en un único sketch, compilado y grabado con autorización, con confirmación del usuario de que aparece en pantalla. Los ecos son simulados y no representan medidas de un sensor.

El código del IDE está disponible bajo licencia MIT. Puedes estudiarlo, adaptarlo y proponer mejoras. Las funciones de IA son opcionales y requieren los servicios y cuentas de sus proveedores.

Esta entrega es 1.0.0-rc.1: buscamos pruebas y contribuciones antes de declarar estable la v1.0. Especialmente útiles: perfiles de placa comprobados, instalación en equipos limpios, accesibilidad, traducción y regresiones reproducibles. La entrega incluye los resultados de las pruebas y sus límites.

## Material preparado

- README principal en español y resumen en inglés.
- Guía para guardar/reabrir sketches y conservar auxiliares.
- Capturas del servidor real y escenarios controlados identificados.
- Vídeo aportado por el usuario conservado sin editar y con hash.
- Registros de compilación y grabación del radar, perfil y confirmación visual del usuario.
- Guía de contribución, plantillas de incidencias y propuesta de cambio.
- CI para Windows/Linux y Chromium aislado, pendiente de primera ejecución remota.
- Comparativa con referencias oficiales y pendientes concretos para v1.0.

Este documento es material de lanzamiento preparado localmente. No acredita publicación en GitHub, ejecución de CI, una etiqueta estable ni una medición frente a otros IDEs.
