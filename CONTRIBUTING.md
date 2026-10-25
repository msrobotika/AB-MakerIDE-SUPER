# Contribuir a AB MakerIDE

Son bienvenidas las mejoras de accesibilidad, traducción, perfiles de placa, documentación y regresiones reproducibles. Empieza por una tarea pequeña con un resultado comprobable. El código del proyecto usa la licencia MIT incluida en LICENSE; respeta las licencias de cualquier código o recurso de terceros que aportes.

## Informar de un fallo

Indica la versión, sistema operativo, pasos, resultado esperado y observado. Si afecta a una placa, añade modelo, chip conocido, FQBN, versión del núcleo y conexión. Un conversor CH340 o CP210x no basta para identificar el modelo. Adjunta solo el fragmento necesario del registro, omitiendo claves, rutas privadas e identificadores del dispositivo.

## Proponer cambios

Explica el problema y el comportamiento final, con captura si cambia la interfaz. Mantén la interfaz en español y distingue los hechos observados de las sugerencias de la IA. Una CLI terminada no demuestra compilación ni funcionamiento del hardware.

No incluyas proyectos personales, .makeride-data, credenciales o binarios de compilación. No ejecutes pruebas de grabación en una placa ajena sin autorización para ese firmware y dispositivo.

## Verificar una contribución

Con Python 3.10+ y Node disponibles:

```text
python tests/run_isolated.py
node --check app.js
node --check activity.js
node --check simulator.js
```

La suite usa datos temporales y sustituye las operaciones de hardware. Algunas pruebas C++ necesitan g++. Para cambios en el flujo del agente, instala Playwright en un entorno propio y ejecuta tests/browser_agent_consent.py con --outputs apuntando a una carpeta de evidencias nueva. Esta prueba inicia un servidor temporal y sustituye la CLI; no usa créditos ni graba dispositivos.

MANIFEST_SHA256.txt describe los bytes del paquete local publicado. Sus hashes dependen también de los finales de línea. Al preparar una nueva entrega local, se regenera con python tests/manifest.py --write y se verifica en el ZIP final. La CI comprueba el código; no exige que un checkout con finales de línea diferentes coincida con el paquete anterior.

La automatización de .github/workflows ejecuta la suite en Windows y Linux y una prueba de navegador aislada. Es una configuración preparada: no se presenta como una ejecución remota correcta hasta que GitHub la haya ejecutado.
