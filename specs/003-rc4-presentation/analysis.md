# Análisis de consistencia

Las capturas seleccionadas son `docs/evidence/cyd-rc4/carga-desde-ide-real.png` y `docs/evidence/cyd-rc4/monitor-serie-real.png`: ambas existen en el tag RC4 y no se trata de imágenes simuladas. Muestran estado del grabador y señales serie, mientras que el funcionamiento físico de pantalla/táctil procede de confirmación posterior del usuario.

La tercera edición del código en `main` no modifica el firmware verificado anteriormente: la referencia al código de aquella prueba se fijó a `v1.0.0-rc.4`. Los nombres de algunas rutas internas y marcadores seriales históricos se conservan por compatibilidad documental. Cambiar solo el nombre no basta para asegurar ausencia de derechos ajenos.

No se altera ninguna Release ni su ZIP. La publicación de capturas en la página Releases requiere el pegado manual del texto de `docs/RC4_PUBLICACION.md` desde la interfaz de GitHub, por el titular de la cuenta.
