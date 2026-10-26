# Investigación comparativa de IDEs — 24 octubre 2026

**Alcance**: selección de referentes relevantes para el desarrollo electrónico, firmware y edición profesional. No es un censo de absolutamente todos los IDE existentes ni una evaluación empírica de rendimiento. Se consultaron páginas y manuales oficiales. No confundir «la funcionalidad existe en un IDE» con «AB MakerIDE ya la implementa».

| Referente | Acierto observado | Qué adoptar sin copiar su interfaz | Qué evitar |
| --- | --- | --- | --- |
| Arduino IDE 2 | Compilar/grabar claros, selección de placa, gestor de bibliotecas, monitor serie y plotter | Flujo inmediato placa → compilar → grabar → monitor | Catálogo que requiera conocer nombres técnicos |
| PlatformIO | Proyectos reproducibles, >1.000 modelos, dependencias, tests y entornos | Manifiesto de proyecto e infraestructura de pruebas | Poner demasiada configuración en el primer uso |
| Thonny | Inicio mínimo, aprendizaje progresivo, depuración paso a paso | Apariencia simple; mostrar detalles según necesidad | Configuración obligatoria para operaciones básicas |
| VS Code | Editor central, paneles opcionales, command palette y espacio restaurado | Editor primero, búsqueda universal y layout persistente | Convertir el inicio en una cuadrícula saturada de herramientas |
| ESP-IDF para VS Code | Build, flash, monitor, doctor y debugging integrados | Ejecución por etapas y diagnóstico accionable | Éxito ambiguo después de una tarea automatizada |
| CLion | Refactorización y depuración por periféricos, RTOS y test | Modo avanzado opcional para firmware complejo | Sobreconfiguración visible para un Blink |
| STM32CubeIDE | Configuración de periféricos, herramientas de depuración, análisis de memoria | Perfiles de hardware verificables y trazabilidad de memoria | Suponer que un esquema de pines es universal |
| MPLAB X | I/O View, Data Visualizer, osciloscopio lógico y diagnóstico | Plotter, datos serie y estados reales del firmware | Diagnósticos sin vínculo con el dispositivo real |
| Wokwi | Simulación de binarios y periféricos, analizador lógico, depuración | Simulador real solo si está probado para arquitectura y componentes | Llamar «simulación» a una animación que no ejecuta firmware; la extensión de VS Code tiene licencia propia |
| Eclipse Theia | Plataforma abierta de IDE de escritorio/navegador y extensión | Evaluar arquitectura extensible y plugins vendor-neutral | Cambiar de tecnología sin pruebas de que mejora la UX |

## Hallazgos técnicos concretos

**Arduino CLI 1.5.1** diferencia `board list` (dispositivos detectados), `board listall [boardname]` (placas de núcleos instalados) y `board search [boardname]` (Boards Manager). No debe pedirse el catálogo remoto en cada pulsación; el filtrado local con paginación tiene un coste y una latencia menores. La identificación por conversor serie CH340/CP210x no prueba el modelo del microcontrolador.

**Estado de firmware**: una tarea de IA que termina, un sketch creado, una compilación correcta, una transferencia completada y un funcionamiento visible son estados diferentes. Cada etapa necesita sus pruebas y una salida legible.

**Simulación**: AVR, ESP32 y ESP32-S3 requieren implementaciones distintas; es preferible declarar «no soportado» a inventar el resultado. Wokwi ofrece un referente de simulación, pero sus condiciones comerciales y de licencia no permiten asumir que su extensión sea un componente libre de redistribuir.

## Fuentes oficiales

- Arduino IDE 2: https://docs.arduino.cc/software/ide/
- Arduino CLI `board listall`: https://docs.arduino.cc/arduino-cli/commands-reference/arduino-cli_board_listall
- Arduino CLI `board search`: https://docs.arduino.cc/arduino-cli/commands-reference/arduino-cli_board_search
- Arduino CLI `board list`: https://docs.arduino.cc/arduino-cli/commands-reference/arduino-cli_board_list
- PlatformIO IDE: https://docs.platformio.org/en/latest/integration/ide/pioide.html
- Thonny: https://thonny.org/
- VS Code UI: https://code.visualstudio.com/docs/editing/getting-started/userinterface
- ESP-IDF extensión: https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/
- CLion embedded: https://www.jetbrains.com/clion/embedded/
- STM32CubeIDE: https://www.st.com/en/development-tools/stm32cubeide.html
- MPLAB X IDE: https://www.microchip.com/en-us/tools-resources/develop/MPLAB-X-ide
- MPLAB Data Visualizer: https://www.microchip.com/en-us/tools-resources/debug/mplab-data-visualizer
- Wokwi Docs: https://docs.wokwi.com/
- Wokwi VS Code / licencias: https://docs.wokwi.com/vscode/getting-started
- Eclipse Theia IDE: https://github.com/eclipse-theia/theia-ide

## Oportunidad diferencial MS Robotika

La propuesta no es replicar íntegramente VS Code o PlatformIO, sino simplificar la combinación «dispositivo físico + firmware + diagnóstico + asistente opcional», manteniendo transparencia de permisos, ejecución local y estado real del hardware. La competitividad aún no está demostrada: debe evaluarse con usuarios, fiabilidad y tiempos medidos.
