# Cambios

## 1.0.0-rc.1 · Nano ATmega328P · 25 octubre 2026

- Firma real por cargador serie y perfil Nano antiguo confirmado a 57600 baudios; CH340 no se interpreta como identificación del modelo.
- Respaldo previo de flash y EEPROM; carga autorizada del diagnóstico, verificación independiente y EEPROM conservada.
- Cinco muestras reales por serie y resultado correcto; ejemplo, proyecto importable, registros y matriz actualizados. Sin pruebas de GPIO ni periféricos externos.

## 1.0.0-rc.1 · ESP32-WROOM y MicroPython · 25 octubre 2026

- Identificada una WROOM con ESP32-D0WDQ6 revisión 1.0 y flash de 4 MB; controlador CP2102 ausente reparado en Windows, pasando de código 28 sin puerto a COM7 con estado correcto.
- Respaldo completo previo, borrado e instalación de MicroPython 1.29.0 autorizados por el usuario, con verificación independiente del firmware.
- Ejemplo reutilizable probado en RAM: cinco muestras de intérprete, memoria, JSON y temporización y lectura del sistema de archivos. Sin GPIO ni red y sin guardado de main.py.
- Registros, código y matriz de hardware actualizados; binarios del respaldo, firmware y controlador fuera del repositorio.

## 1.0.0-rc.1 · prueba física ESP32-CAM · 25 octubre 2026

- Copia completa de 4 MB del firmware previo y carga autorizada con verificación de cuatro segmentos en COM4.
- Diagnóstico real: ESP32-D0WD-V3 revisión 3.1, PSRAM detectada, sensor OV3660 PID 0x3660 y cinco buffers JPEG 320x240, sin errores durante 16 s de lectura.
- Corrección del texto del ejemplo y aviso de cámara: el pinout AI-Thinker no determina que el sensor sea OV2640; se identifica en ejecución.
- Código exacto probado, logs y hashes conservados; respaldo binario privado fuera del repositorio. Matriz de hardware con alcances y pendientes.

## 1.0.0-rc.1 · cuaderno de placas · 25 octubre 2026

- Cuaderno local para guardar y exportar pruebas de varias placas, con resultados de herramienta y observaciones del usuario separados.
- Asociación conservadora con revisión, placa, proyecto auxiliar y puerto; protección ante almacenamiento dañado y cambios en otra pestaña.
- Puerto de grabación conservado en el registro recuperable de los trabajos Arduino.
- Cuenta y consumo de IA propios explicados en la interfaz; Codex probado por el autor y otras integraciones marcadas como experimentales.
- Estado «CLI instalada» separado de inicio de sesión y cuota. Los informes nombran al proveedor que ejecutó la tarea.
- 199 pruebas Python correctas, 4 omitidas y 37 comprobaciones de interfaz. Las pruebas del cuaderno no operan hardware.

## 1.0.0-rc.1 · actualización de proyectos · 25 octubre 2026

- Apertura del código generado en el editor al terminar, con respaldo previo y protección de las ediciones hechas durante la ejecución.
- Botones para abrir el último código, guardar el sketch y descargar el proyecto con archivos auxiliares en ZIP.
- Continuidad de auxiliares entre sesiones del agente y compilación con las cabeceras del proyecto.
- Importación de .ino y .py, además del formato .abmaker.json.
- Ejemplo radar de archivo único para IdeaSpark ST7789, compilado y grabado con autorización; funcionamiento visual confirmado por el usuario.
- Consentimiento del agente mediante diálogo dentro de la página, compatible con el navegador integrado.
- Capturas aportadas por el usuario y pruebas aisladas documentadas. 197 pruebas Python correctas, 4 omitidas y 26 comprobaciones de interfaz correctas.
- Presentación del proyecto abierto, guía de contribución y configuración inicial de CI preparada para GitHub.

## Base RC1

Catálogo real paginado, modelo separado de puerto, estados de trabajo verificables, recuperación de sesiones y resultados, protección ante pestañas en conflicto y pruebas locales. [Informe de la base RC1 y sus límites](docs/RELEASE_RC1.md).

## Antes de v1.0 estable

Quedan por validar la matriz de placas, desconexiones y cancelación durante carga, serie y MicroPython en dispositivos concretos, instalación y migración en equipos limpios, y launchers Linux/macOS. También faltan resultados remotos de CI y pruebas con usuarios externos. La grabación correcta del radar no sustituye esa matriz.
