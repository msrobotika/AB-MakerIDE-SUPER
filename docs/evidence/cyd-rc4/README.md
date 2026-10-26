# CYD: carga manual desde la interfaz RC4 · 26 octubre 2026

Prueba real de la instalación RC4 de Windows con la CYD ESP32-2432S028R del usuario en COM4. El navegador abrió la aplicación normal, eligió el modelo desde el catálogo, abrió el ejemplo CYD, pulsó **Compilar y grabar** y aceptó el diálogo del IDE. No hubo peticiones interceptadas, grabador simulado ni una orden externa de escritura de flash.

## Antes de cargar

El sketch anterior (`MAKER_TETRIS`) dibujaba por USB/serie y no inicializaba la pantalla. Sus cargas podían estar verificadas aunque la LCD quedase negra. Se conservaron los intentos originales en un respaldo privado.

Se leyó una copia completa de **4.194.304 bytes** y se contrastaron **274.320 bytes** del programa con otra lectura independiente. El intento de lectura a 460800 falló por un paquete corrupto; el respaldo completo y la carga se hicieron a **115200 baudios**. Copias binarias y registros con identificadores/rutas permanecen fuera del repositorio.

## Resultado de las herramientas

- Sketch completo compilado: **317.879 bytes**, 24% del espacio de aplicación del perfil.
- Una sola petición de carga desde el botón del IDE; **141,0 segundos** entre compilación y final.
- Verificación solicitada con `--verify`, **cuatro hashes de datos verificados**, salida **0**, trabajo inactivo y progreso final **100**.
- Revisión del editor/carga: `9fda3a0583fa8e298eb29fadba6dec2363faeb39879081927ec98a435319d648`.
- Consola y estado de la interfaz finalizaron. El proyecto se descargó usando **Ctrl+S** del editor, no reconstruyendo un archivo a mano.
- El monitor del propio IDE abrió el puerto a 115200 y recibió `MSR_CYD_START` y `MSR_CYD_CALIBRATION point=1`. El marcador `GAME_READY` no se recogió durante la ventana automática; no se afirma que se haya leído.

![Carga real cerrada y verificada en el IDE](carga-desde-ide-real.png)

![Arranque y calibración recibidos en el monitor del IDE](monitor-serie-real.png)

## Observación física separada

Después de pedir tocar las tres cruces y probar izquierda, giro, derecha y caída, el usuario confirmó: **«Sí, aparece el juego y responde al táctil»**. Esta es la evidencia visual/funcional del usuario; no procede de inferir una pantalla correcta a partir del compilador o de los hashes. No es una prueba prolongada de estabilidad ni valida otras revisiones de pantalla.

[Registro sin rutas privadas ni MAC](result.json) · [Proyecto descargado desde el IDE, importable](BloquesCYD-guardado-desde-IDE.abmaker.json) · [Ejemplo fuente](../../../examples/cyd_28_bloques_tactil.ino).
