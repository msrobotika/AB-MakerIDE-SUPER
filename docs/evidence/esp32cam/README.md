# ESP32-CAM: prueba física autorizada

El usuario conectó la placa y confirmó el pinout clásico AI-Thinker. COM4 contiene un ESP32-D0WD-V3 revisión 3.1, cristal de 40 MHz y 4 MB de flash. El conversor CH340 no identifica por sí solo el modelo. La lectura inicial con esptool 5.3.1 --no-stub no escribió firmware.

## Respaldo, compilación y carga

Con la autorización «Sí, cargar y probar la cámara en COM4», se guardaron antes los 4194304 bytes de flash, comprobando que correspondían al dispositivo identificado. El hash del respaldo está en respaldo-metadata.json. El binario y el registro originales permanecen en la entrega privada del usuario y no se versionan.

Se compiló con esp32:esp32:esp32cam: salida 0, 372737 bytes de programa y 34108 bytes de RAM estática. Se cargó a 115200 baudios con --verify: salida 0 y cuatro segmentos «Hash of data verified.». Después se leyó el diagnóstico durante 16 segundos a 115200 baudios, cerrando el puerto al terminar.

## Resultado observado

- PSRAM detectada por el firmware; esta prueba no mide su capacidad.
- Sensor PID 0x3660, correspondiente a OV3660 según [sensor.h de Espressif](https://github.com/espressif/esp32-camera/blob/master/driver/include/sensor.h), también comprobado en los encabezados instalados del núcleo 3.3.12.
- Cinco fotogramas reportados por el controlador JPEG, todos de 320x240: 2588, 3147, 3098, 3094 y 3093 bytes. Sin errores registrados; RAM libre declarada de 261 KB durante esas muestras.
- Wi-Fi, microSD y LED flash no se utilizan. No se enviaron imágenes ni se visualizó o conservó el contenido de los JPEG. Esta prueba de inicialización y metadatos no evalúa enfoque, orientación ni calidad visual, ni sustituye una prueba prolongada.

## Reproducción y alcance

[ESP32CamDiagnostico-verificado.ino](ESP32CamDiagnostico-verificado.ino) conserva exactamente el código compilado y cargado, con SHA-256 en estado.json. El archivo .abmaker.json permite importarlo en el editor. Los logs versionados omiten la MAC y rutas del perfil local; estado.json conserva hashes de los registros originales completos.

El ejemplo general del IDE conserva el mismo pinout y corrige la antigua suposición textual de OV2640: el controlador identifica el sensor en ejecución. El código exacto de esta prueba se conserva por separado para que esa corrección no cambie la evidencia. El [pinout oficial](https://github.com/espressif/arduino-esp32/blob/master/libraries/ESP32/examples/Camera/CameraWebServer/camera_pins.h) es la referencia del perfil.

La carga se hizo directamente con Arduino CLI y la lectura con pyserial. No se presenta como una ejecución de los botones de la sesión del usuario ni como una nueva prueba de una cuenta de IA.
