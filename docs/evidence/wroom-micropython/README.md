# ESP32-WROOM con MicroPython: prueba física autorizada

25 octubre 2026. El usuario conectó una ESP32-WROOM antigua con USB no tipo C y LED rojo encendido, según su descripción. Inicialmente Windows enumeraba CP2102 USB–UART, VID 10C4 PID EA60, con código 28 y sin COM; Arduino CLI y pyserial tampoco encontraban puertos.

## Controlador y dispositivo

Se instaló Silicon Labs CP210x 11.0.0.509 AMD64 desde [el paquete oficial de Microsoft para Windows 10 y posteriores](https://www.catalog.update.microsoft.com/ScopedViewInline.aspx?updateid=2e593f35-1f5b-4806-a77f-bd3841a6c9fb), tras comprobar el identificador compatible y la firma válida de su catálogo. La instalación con permisos de administrador terminó con salida 0. Después Windows declaró estado OK, código 0 y COM7. controlador.json conserva proveedor, versión, firma y hash del CAB. El binario del controlador no se redistribuye en el repositorio.

La lectura con esptool 5.3.1 identificó ESP32-D0WDQ6 revisión 1.0, cristal de 40 MHz y flash de 4 MB. No se infirió el chip a partir del CP2102. La consulta inicial no respondió al protocolo raw REPL; eso no identifica por sí solo el firmware anterior.

## Respaldo e instalación

El usuario autorizó expresamente: «Sí, instalar MicroPython y probar en COM7», incluyendo borrar firmware y archivos después de guardar copia completa. Se conservaron los 4194304 bytes de flash y su SHA-256. El respaldo binario permanece privado, fuera del repositorio y de los ZIP del IDE. Se comprobó la identidad antes del respaldo y de borrar.

Se descargó [MicroPython ESP32_GENERIC 1.29.0](https://micropython.org/download/ESP32_GENERIC/), versión de 24 agosto 2026. Sus cabeceras de bootloader y aplicación admiten revisión mínima 0.0 y máxima 3.99; las sumas internas se validaron. El hash del archivo oficial está en estado.json. Tras borrar la flash, se escribió en 0x1000. Escritura y verificación independiente terminaron con salida 0 y «Verification successful (digest matched)» para los 1790544 bytes. El firmware de terceros se conserva solo en la entrega local.

## Ejecución real

[El diagnóstico](../../../examples/esp32_wroom_micropython_diag.py) se ejecutó con mpremote 1.29.0 mediante run, en RAM, sin guardarlo como main.py. No acciona salidas GPIO ni utiliza la red. No evalúa un LED, sensores o Wi-Fi.

El dispositivo respondió MicroPython v1.29.0, plataforma esp32 y Generic ESP32 module. CPU declarada: 160 MHz. Sistema de archivos: 2097152 bytes, 2084864 libres al consultar. Cinco muestras completaron pruebas de aritmética y JSON, con memoria libre de aproximadamente 163 KB y tiempos 1, 507, 1010, 1513 y 2016 ms. La salida terminó con MSR_MICROPYTHON_PASS y código 0. La lectura del sistema de archivos no es una prueba de escritura ni de duración.

El test terminó y la herramienta cerró la conexión. MicroPython queda instalado; el diagnóstico no se ejecuta automáticamente al reiniciar. La prueba se hizo con herramientas oficiales desde el equipo, sin atribuirla a una ejecución de la interfaz del IDE. Los logs versionados omiten MAC y rutas del perfil local; los originales completos quedan en la entrega privada.
