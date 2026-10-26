# Contribuir a AB MakerIDE

Son bienvenidas las mejoras de accesibilidad, traducción, perfiles de placa, documentación y regresiones reproducibles. Empieza por una tarea pequeña con un resultado comprobable. El código del proyecto usa la licencia MIT incluida en LICENSE; respeta las licencias de cualquier código o recurso de terceros que aportes.

## Informar de un fallo

Indica la versión, sistema operativo, pasos, resultado esperado y observado. Si afecta a una placa, añade modelo, chip conocido, FQBN, versión del núcleo y conexión. Un conversor CH340 o CP210x no basta para identificar el modelo. Adjunta solo el fragmento necesario del registro, omitiendo claves, rutas privadas e identificadores del dispositivo.

## Proponer cambios

Explica el problema y el comportamiento final, con captura si cambia la interfaz. Mantén la interfaz en español y distingue los hechos observados de las sugerencias de la IA. Una CLI terminada no demuestra compilación ni funcionamiento del hardware.

No incluyas proyectos personales, .makeride-data, credenciales o binarios de compilación. No ejecutes pruebas de grabación en una placa ajena sin autorización para ese firmware y dispositivo.

## Verificar una contribución

Consulta [arquitectura y comandos de desarrollo](docs/DESARROLLO.md). Se requieren Python 3.10+ y Node 24 para todas las herramientas de calidad; el usuario final no necesita Node.

CI comprueba unidades en Windows, Ubuntu y macOS, recorridos Chromium en Ubuntu, Ruff, ESLint, Prettier y `MANIFEST_SHA256.txt`. Si cambias un archivo publicado, regenera el manifiesto después de normalizar sus finales de línea con `.gitattributes`. Una entrada ausente o un hash distinto debe hacer fallar la entrega.

La suite usa datos temporales y sustituye operaciones de hardware. Las pruebas C++ requieren g++. Las pruebas de navegador necesitan Playwright y su Chromium. Declara qué casos son controlados y cuáles ejecutan herramientas reales; no infieras una prueba de placa de una captura de interfaz.
