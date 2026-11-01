# Coherencia

La regla no cambia qué se exige a una entrega: todo archivo técnico escrito por la
rama sigue necesitando su huella. Solo deja de pedir de nuevo lo que main ya entregó
con su propio expediente. Para no abrir una vía de escape, el padre fusionado debe
estar en main (no basta con otra rama), el contenido debe ser idéntico y la excepción
no existe al comprobar main, donde un merge podría traer trabajo no revisado.

Las ejecuciones `pull_request` comparan con main, así que nunca usan la excepción en
la práctica; el cambio afecta a los `push` de ramas que integran main. Si CI no
tuviera la referencia remota, el gate vuelve al comportamiento anterior, más estricto.
