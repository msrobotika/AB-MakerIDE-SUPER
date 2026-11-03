# Compilaciones reutilizables y límite para compilaciones en frío — 03/11/2026

Base pública: ecc9aa3 (origin/main). Constitución leída. Reparación pedida por Abel tras
fallar «Compilar» en su PC al preparar el tutorial del Reloj Despertador MS.
Preparado con asistencia de IA (Claude Code). No publica versiones ni instaladores.

- **FR-001**: Compilar dos veces el mismo FQBN reutiliza la carpeta de compilación de
  arduino-cli (`--build-path` y ruta del sketch estables por placa), para que la
  segunda compilación no recompile núcleo y librerías.
- **FR-002**: Cada compilación parte solo de los archivos del proyecto actual: los
  archivos auxiliares de un proyecto anterior no se cuelan en el siguiente.
- **FR-003**: Una compilación en frío de un ESP32 que tarda más de 480 s en un PC
  modesto termina en lugar de cortarse; el límite pasa a 900 s.
- **FR-004**: FQBN distintos usan cachés distintas; el árbol de datos rechaza enlaces
  como el resto de almacenes del IDE.

Diagnóstico: síntoma reproducido dos veces (480 s agotados) y causa medida (539 s en
frío con arduino-cli). Clarificación: la caché vive junto a `BuildSessions` en la carpeta
de datos del IDE; sin carpeta de datos (pruebas) se mantiene la temporal de siempre.
