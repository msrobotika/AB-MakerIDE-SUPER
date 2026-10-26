# Plan técnico — higiene de Releases

Base: `main` de RC4. Rama: `maintenance/release-hygiene-20261026`.

1. Inventariar cuatro Releases reales y confirmar qué es RC4, incluyendo activos, etiquetas y fechas.
2. Verificar que Spec Kit ya está instalado; no duplicar `.specify/`, `.agents/` ni `specs/`.
3. Crear política de publicación, índice de documentación activa y avisos en ambos README, instrucciones para agentes y contribución.
4. Trasladar las dos guías 0.9.x que estaban en `docs/` a `docs/archive/`, preservando su texto, con advertencia visible.
5. Ampliar .gitignore para productos temporales y añadir concurrencia en CI; no crear workflows de lanzamiento.
6. Regenerar manifiesto SHA-256, cubrir cambios técnicos en verification.json y comparar base Git en CI.
7. Constatar que el borrado de tres Releases antiguas **queda pendiente** por limitación de permisos de herramienta y mostrar pasos concretos al titular.

**Diseño y amenazas:** ninguna eliminación de historial Git, de carpetas de evidencia, ni de los tres objetos GitHub Releases mediante CI indirecta. Todo cambio será un PR auditable. La política de publicación no es una medida de enforcement de GitHub UI; requiere disciplina y/o reglas de administrador fuera del alcance del conector.
