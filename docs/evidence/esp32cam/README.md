# ESP32-CAM: identificación y compilación reales

El usuario conectó una ESP32-CAM y confirmó que es la clásica AI-Thinker, con cámara en cinta y microSD. En COM4 se leyó, con esptool 5.3.1 y --no-stub, ESP32-D0WD-V3 revisión 3.1, cristal de 40 MHz y 4 MB de flash. El conversor USB es CH340; por sí solo no identifica la placa. No se escribió firmware durante esa lectura. El log versionado omite la MAC.

Se compiló [el diagnóstico de cámara](../../../examples/esp32cam_ai_thinker_test.ino) con el perfil esp32:esp32:esp32cam: salida 0, 372737 bytes de programa y 34108 bytes de RAM estática. Los pines se contrastaron con [el ejemplo oficial de Espressif](https://github.com/espressif/arduino-esp32/blob/master/libraries/ESP32/examples/Camera/CameraWebServer/camera_pins.h).

El diagnóstico está preparado para consultar sensor y PSRAM y obtener fotogramas JPEG en memoria, sin Wi-Fi, microSD ni LED flash. La compilación no comprueba el sensor ni la PSRAM física. En esta ficha inicial la grabación y la lectura del diagnóstico de cámara están pendientes de autorización expresa. estado.json recoge el alcance y hash exacto del sketch.
