# Coherencia

El valor viaja como texto de una lista cerrada; no se compone ningún argumento con texto del
usuario. «Por defecto» no añade opciones, así que los proyectos existentes compilan igual y
reutilizan su caché. Como la clave de caché ya incluye las opciones de placa, Huge APP compila
en su propia carpeta (la primera vez en frío). El reintento a 115200 conserva el esquema para no
grabar un binario con una tabla de particiones distinta de la compilada. No cambia nada para
placas que no son ESP32 (se rechaza en el servidor y la interfaz manda siempre «default»).
