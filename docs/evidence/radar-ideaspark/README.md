# Radar IdeaSpark verificado

Radar visual con barrido verde y cuatro ecos simulados. No mide distancias ni usa un sensor. Archivo único, sin radar_config.h. Pantalla ST7789 de 135x240, rotación 1 (240x135), con los mismos pines del proyecto Salto Robot que el usuario confirmó para esta placa.

Compilación Arduino CLI correcta: 315680 bytes de programa y 23804 bytes de RAM estática. El lienzo de 64800 bytes se reserva además en ejecución. Se cargó en COM4 tras autorización explícita del usuario, con verificación del grabador, salida 0 y cuatro segmentos con «Hash of data verified.». Después el usuario confirmó: «Sí, se ve el radar». Esta comprobación visual procede del usuario; el agente no observó la pantalla con una cámara.

El [ejemplo de archivo único](../../../examples/ideaspark_114_radar.ino) contiene el código reutilizable. La entrega privada del usuario incluye también RadarIdeaSpark.abmaker.json y los binarios en firmware/. compilacion.txt y grabacion.txt, en esta carpeta, son copias con rutas e identificadores omitidos. estado.json recoge el perfil y los hashes de los originales.

La mejora del IDE añade «Abrir radar IdeaSpark», que coloca este mismo código en el editor y elige ESP32. Abrir o importar código no ejecuta una grabación.

Los registros de esta carpeta omiten el perfil local y la MAC. Los originales completos se conservan en la entrega del usuario, fuera del repositorio. La confirmación del radar corresponde al firmware cuyo SHA figura en estado.json; no demuestra que la versión nueva del servidor esté ya activada.
