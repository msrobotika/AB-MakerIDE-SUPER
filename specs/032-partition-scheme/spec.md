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

- **FR-006**: La primera compilación en frío de un proyecto grande (AstroCYD MS con Huge APP)
  termina en el PC del autor: el límite de compilación pasa de 900 s a 1800 s.

- **FR-007**: Tras la publicación aprobada de la pre-release TEST `windows-test-dev-6e17539fc0`, los
  README ES/EN, la guía de descargas y de instalación (y la prueba que las vigila) apuntan a ese
  instalador; la TEST anterior se conserva.

Diagnóstico de FR-006: con el instalador de prueba de esta rama (dev-c3ce5c3293) en el PC del autor,
la compilación en frío de AstroCYD con Huge APP se cortó a los 900 s; desde el servidor de la rama
había tardado 859 s. El margen de 900 s era insuficiente.

Clarificación: la lista se limita a esquemas que existen en el núcleo esp32 3.x para
«ESP32 Dev Module»; no se aceptan archivos `partitions.csv` arbitrarios ni texto libre.
