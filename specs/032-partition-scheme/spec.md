# Esquema de particiones ESP32 en el panel de la placa — 05/11/2026

Base: f36123c (rama `fix/compile-cache-timeout`, aún sin fusionar). Constitución leída.
Mejora pedida por Abel: el proyecto AstroCYD MS (Wi-Fi + HTTPS + Bluetooth) ocupa 1,5 MB y no
cabe en el esquema por defecto (1,25 MB); el IDE solo acepta FQBN sin opciones y no podía
compilarlo. Preparado con asistencia de IA (Claude Code). No publica versiones ni instaladores.

- **FR-001**: En el panel «Placas y puertos» hay un selector «ESQUEMA DE PARTICIONES ESP32» con
  Por defecto, Huge APP, Minimal SPIFFS y No OTA; por defecto no cambia nada.
- **FR-002**: El esquema elegido llega a arduino-cli como `--board-options PartitionScheme=…` en
  Compilar, en Compilar y grabar y en el reintento a 115200.
- **FR-003**: El servidor solo acepta los cuatro valores de la lista y solo con placas
  `esp32:esp32:*`; cualquier otro valor o placa se rechaza antes de lanzar nada.
- **FR-004**: El diálogo de confirmación de la grabación muestra el esquema de particiones.
- **FR-005**: Un esquema distinto usa su propia caché de compilación (la clave ya incluye las
  opciones de placa), sin invalidar la del esquema por defecto.

Clarificación: la lista se limita a esquemas que existen en el núcleo esp32 3.x para
«ESP32 Dev Module»; no se aceptan archivos `partitions.csv` arbitrarios ni texto libre.
