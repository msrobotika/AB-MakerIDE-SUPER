# AB MakerIDE SUPER 1.0.0-rc.1

Candidato de lanzamiento de MS Robotika, con código bajo licencia MIT. Entrega validada localmente en Windows; se ofrece para revisión y pruebas, todavía sin declarar v1.0 estable.

## Incluido

- Editor Arduino C++ y MicroPython con guardado local, exportación y recuperación.
- Catálogo desde las herramientas instaladas, con modelo de placa separado del puerto USB.
- Integración opcional con agentes: código generado visible, copias previas y descarga del proyecto con auxiliares.
- Robot MS Robotika con estados de trabajo, errores y resultados vinculados a evidencias.
- Simulador lógico de hasta ocho salidas con trazas, pausa, pasos, reinicio y velocidad virtual. No ejecuta firmware ni simula circuitos eléctricos.
- Arranque Windows con diagnóstico y preparación opcional de dependencias en una `.venv` privada.
- Corrección de desconexión del monitor serie: no queda conectado tras un error ni reenvía datos automáticamente.
- Revisión de seguridad local: token obligatorio en todos los POST, Host/Origin exactos y bloqueo de rutas de escape, enlaces y uniones de carpetas. [Alcance y límites](../../SECURITY.md).

## Para empezar

Extrae el ZIP, instala Python 3.10 o posterior si falta y abre INICIAR_WINDOWS.bat. Para serie y MicroPython, ejecuta PREPARAR_WINDOWS.bat y vuelve a iniciar. Arduino CLI y los núcleos de placa se instalan por separado. [Guía de instalación y recuperación](../INSTALACION.md).

La IA no está incluida en la descarga: cada usuario vincula su cuenta y asume su consumo. Codex fue probado en uso real por el autor. Los demás proveedores y agentes se indican como experimentales o pendientes de pruebas equivalentes.

## Evidencias y límites

Se registraron pruebas físicas, con alcances distintos, en IdeaSpark con pantalla ST7789, ESP32-CAM con sensor OV3660, ESP32-WROOM con MicroPython, Nano y Mega. [Matriz de hardware](../MATRIZ_HARDWARE.md). El vídeo y las capturas del autor no constituyen una prueba universal de compatibilidad.

Los tests de interfaz de agentes y fallos de conexión utilizan escenarios controlados. No sustituyen una ejecución real de IA o una operación física sobre el dispositivo. La compilación correcta tampoco confirma una grabación ni el funcionamiento de un periférico.

La extracción nueva y el entorno Python aislado se probaron en el mismo Windows del desarrollo. Siguen pendientes otro PC o sistema limpio, launchers Linux/macOS, desconexiones físicas y cancelaciones durante una carga real, pruebas prolongadas y usuarios externos. La [CI de GitHub](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml) ejecuta pruebas unitarias en Windows/Linux y pruebas de interfaz en Chromium; cada ejecución publica su resultado por revisión. Esa CI no sustituye las pruebas de instalación ni de hardware.

No se distribuyen credenciales, cuentas de IA, controladores, respaldos privados de firmware ni herramientas de terceros dentro del código de MakerIDE. Esas herramientas mantienen sus licencias y condiciones propias. Los resultados locales y el manifiesto acompañan la entrega.

## Informar de un fallo

Indica versión, sistema operativo, pasos para reproducirlo y el resultado esperado y observado. Para hardware, añade el modelo, FQBN, versión del núcleo y mensaje de error, omitiendo secretos e identificadores privados. [Guía de contribución](../../CONTRIBUTING.md).
