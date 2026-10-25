# Identificación automática y destino del proyecto · RC2

Con una sola placa conectada, el IDE selecciona el puerto y consulta el chip para elegir un perfil de compilación instalado. Así puede corregir una selección antigua de Arduino Uno al conectar un ESP32. No modifica el sketch. Con varias placas conserva la selección y requiere elegir cuál consultar.

La consulta utiliza metadatos de Arduino CLI cuando hay una única coincidencia instalada. Para los ESP sin modelo USB inequívoco utiliza `esptool chip_id --no-stub`, con dos intentos y tiempo acotado. No borra ni escribe la flash, pero puede reiniciar la placa mediante DTR/RTS. Se aplaza si hay un agente, monitor serie u operación de hardware del IDE en curso. Un puerto ocupado por otra aplicación se informa sin cerrarla.

CH340 y CP210x siguen siendo conversores USB. Leer ESP32-D0WD-V3 permite elegir ESP32 Dev Module; no identifica un modelo comercial ni descubre el controlador o los pines de una pantalla. Si el núcleo necesario no está instalado, se informa y no se instala automáticamente. Las placas no identificables con estas herramientas permanecen pendientes de selección; no se inventa un modelo.

El desplegable permite elegir o dejar sin seleccionar el puerto. La elección manual de puerto o modelo prevalece sobre las búsquedas periódicas mientras no cambien las conexiones. Sus opciones no se reconstruyen cuando siguen siendo las mismas. Al desconectar o conectar dispositivos se vuelve a evaluar la identificación automática.

El botón de actualizar permite volver a consultar explícitamente; con varias placas consulta únicamente el puerto elegido. La selección automática se aplica a una respuesta vigente: si cambias de puerto o modelo durante la consulta, incluso si luego vuelves al mismo puerto, o desconectas el dispositivo, se descarta la respuesta anterior. Una referencia COM guardada tampoco acredita que siga presente.

## Pantallas y agentes

En el panel del agente elige **Pantalla y placa del proyecto**. Este dato es declarado por el usuario, separado del chip consultado. El perfil CYD ESP32-2432S028R es documental y requiere confirmar revisión, controlador y serigrafía; no se asigna automáticamente al encontrar cualquier ESP32.

El destino predeterminado es la placa. Si un juego necesita una pantalla cuyo perfil se desconoce, el agente debe preguntar por ella y dejar pendiente esa fase. No debe sustituirla por una ventana Tkinter, pygame o Qt en el PC. **Permitir también una ventana auxiliar en el ordenador** es una opción explícita, desactivada de entrada.

Además del contrato del prompt, al terminar se inspeccionan los imports Python de los archivos exportables. Una interfaz de escritorio detectada sin esa opción produce `target_mismatch`: la salida 0 de la CLI se conserva, pero la tarea no se declara correcta ni abre automáticamente su código. También se mantienen por separado las evidencias de compilación y grabación que haya reportado el agente.

La inspección no detecta todas las formas posibles de crear interfaces ni impide que un agente con permisos amplios use herramientas externas. No sustituye el sandbox de la CLI ni el aislamiento del sistema operativo.

## Ejemplo CYD de pantalla física

**Abrir juego CYD · con copia** abre `cyd_28_bloques_tactil.ino` en el editor, conserva el código anterior y selecciona el perfil ESP32. No inicia una grabación. Es un ejemplo incluido en MakerIDE, no una ejecución nueva de IA.

El ejemplo usa Adafruit ILI9341/GFX y XPT2046_Touchscreen, con buses separados para LCD y táctil. No cambia `User_Setup.h` global ni usa Wi-Fi, altavoz o microSD. Tras arrancar solicita tres cruces para calibrar en RAM. Los controles del juego se dibujan en la propia pantalla.

El dibujado conserva el fondo y repinta únicamente las celdas y valores modificados. El borrado de pantalla completa se limita a la calibración y a la creación inicial del panel; no ocurre en cada caída de la pieza.

Referencias del perfil: [pines de CYD](https://github.com/witnessmenow/ESP32-Cheap-Yellow-Display/blob/main/PINS.md), [ejemplo del autor para el táctil](https://github.com/witnessmenow/ESP32-Cheap-Yellow-Display/blob/main/Examples/Basics/2-TouchTest/2-TouchTest.ino), [Adafruit ILI9341](https://github.com/adafruit/Adafruit_ILI9341), [XPT2046_Touchscreen](https://github.com/PaulStoffregen/XPT2046_Touchscreen).
