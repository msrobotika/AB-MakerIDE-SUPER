# Plan

1. Auditar la descripción RC4, su etiqueta y adjuntos; utilizar capturas del tag exacto.
2. Elegir dos imágenes reales de carga y monitor serie; excluir la portada vieja que mostraba RC1.
3. Preparar descripción de RC4 y ampliar README ES/EN con galería.
4. Describir la demo como juego arcade de naves, sin afiliación; cambiar su título visible en el código posterior al tag.
5. Fijar los enlaces a fuentes y pruebas antiguas a la etiqueta inmutable RC4 para no falsear los hashes.
6. Ampliar Spec Kit a extensiones de Arduino/C++ y añadir test.
7. Regenerar manifiesto SHA256; ejecutar CI en las plataformas soportadas antes del merge.

Riesgos: la descripción de la Release no puede cambiarse mediante las acciones GitHub disponibles; no hacer una nueva Release ni crear automatizaciones de publicación para sortear esta limitación.
