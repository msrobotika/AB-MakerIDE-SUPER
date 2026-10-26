# MakerIDE frente a sus referentes

Revisión: 25 octubre 2026. Esta comparación combina documentación oficial de los referentes con la inspección y pruebas locales de MakerIDE. No es una prueba comparativa de velocidad, fiabilidad o facilidad de uso con usuarios externos.

## Valoración

MakerIDE tiene una propuesta reconocible para talleres, docentes y makers de habla hispana: conectar una placa, pedir ayuda a un agente opcional, revisar su código y ver qué etapa se ha completado realmente. La recuperación y el guardado de auxiliares permiten convertir una demostración en un proyecto reutilizable. Esta es una oportunidad de producto; su ventaja de uso todavía debe medirse con personas ajenas al desarrollo.

Ser abierto con licencia MIT facilita examinar, modificar y contribuir al código del IDE. No es una diferencia exclusiva: Arduino IDE también se presenta como código abierto y PlatformIO Core publica su código bajo Apache 2.0. Los servicios de IA opcionales conservan sus cuentas y costes; el IDE no debe anunciarse como IA gratuita e ilimitada. [Arduino IDE 2](https://docs.arduino.cc/software/ide-v2/tutorials/getting-started/ide-v2-downloading-and-installing), [licencia de PlatformIO Core](https://github.com/platformio/platformio-core/blob/develop/LICENSE).

| Referente | Fortaleza documentada | Posición actual de MakerIDE |
| --- | --- | --- |
| Arduino IDE 2 | Gestores de placas y bibliotecas, autocompletado, depurador, monitor y plotter serie | MakerIDE puede diferenciar el recorrido guiado con agentes y recuperación. Todavía necesita mayor profundidad de edición y una matriz amplia de dispositivos. [Documentación oficial](https://docs.arduino.cc/software/ide/) |
| PlatformIO | Entornos de proyecto, tareas de compilación/carga/monitor y depuración; pruebas en el equipo y en dispositivos | MakerIDE ofrece una entrada más acotada al sketch. PlatformIO es un referente para reproducibilidad y pruebas de firmware. Los tests del propio IDE no equivalen a ofrecer ese sistema de tests al usuario. [IDE](https://docs.platformio.org/en/latest/integration/ide/vscode.html), [unit testing](https://docs.platformio.org/en/latest/advanced/unit-testing/index.html) |
| ESP-IDF para VS Code | Build/flash/monitor, depuración, particiones, análisis de memoria y trazas para chips Espressif | Para firmware ESP32 complejo, sus herramientas son más profundas. MakerIDE puede servir a prototipos y enseñanza; no tiene paridad con esa depuración. [Documentación oficial](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/) |
| Thonny | Interfaz inicial sencilla, depuración paso a paso y herramientas de aprendizaje de Python | Es un referente directo para la claridad. MakerIDE reúne Arduino C++ y MicroPython; todavía tiene que validar su facilidad de uso y el flujo MicroPython en más equipos. [Sitio oficial](https://thonny.org/) |
| Wokwi | Simulación de microcontroladores, sensores, pantallas y otras piezas en el navegador | MakerIDE debe presentar claramente lo que ejecuta en hardware y lo que solo representa visualmente. El radar con ecos simulados es una animación del firmware; no acredita un simulador de circuitos comparable. [Introducción](https://docs.wokwi.com/), [hardware simulado](https://docs.wokwi.com/getting-started/supported-hardware) |

## Qué merece protagonismo en el lanzamiento

1. Una demostración continua: abrir el radar, mostrar el código, compilar, cargar con permiso y ver la pantalla. Vincular el vídeo futuro a la revisión y al hash del sketch.
2. El estado del robot acompañado de texto y de registros. El verde de una CLI confirma su finalización; el grabador y la observación física aportan pruebas distintas.
3. El código queda a disposición del usuario: apertura con respaldo, sketch portable y ZIP con auxiliares, con una guía clara de reapertura.
4. El proyecto admite contribuciones. Un perfil de placa útil debe incluir modelo, pantalla/pines, versiones probadas y evidencia, evitando tratar CH340 como modelo de placa.

## Qué falta para sostener una v1.0 estable

- Instalar en equipos Windows limpios y probar migración, desconexión USB y recuperación sin depender de la máquina de desarrollo.
- Ampliar la matriz a Uno y varias familias ESP32, con carga autorizada, cancelación y serie; validar MicroPython en placas concretas.
- Mejorar el trabajo con varios archivos, incluido reabrir ZIP dentro del IDE, y la configuración reproducible de dependencias y opciones de placa.
- Mantener la [CI remota](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml) y probar los launchers de otros sistemas. La primera ejecución unitaria remota completó los 219 casos en Linux y 218 en Windows, con un caso omitido por privilegios de enlaces simbólicos; eso no valida instalaciones ni hardware en Linux.
- Medir con usuarios externos tiempo hasta el primer programa funcionando, pérdidas de trabajo y fallos recuperados. Publicar esos resultados antes de afirmar superioridad.

La presentación recomendada es «IDE abierto para pasar de una idea a firmware verificable, con agentes opcionales». La base actual permite lanzar una RC y captar pruebas y contribuciones. No respalda anunciar el IDE más completo o fiable del mercado.
