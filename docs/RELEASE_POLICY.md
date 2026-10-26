# Política de versiones y publicaciones · AB MakerIDE SUPER

**Ámbito:** todas las publicaciones públicas de MS ROBOTIKA para este IDE. **Situación a 26/10/2026:** `1.0.0-rc.4` es el último candidato; **no** es una versión estable.

## Regla principal

**Desarrollar en Git no equivale a publicar una Release.** Las actualizaciones frecuentes van a ramas y Pull Requests. No se crean Releases a diario por el mero hecho de haber modificado código. Se publica únicamente un hito funcional, probado y aprobado expresamente por el responsable de MS ROBOTIKA. Ningún agente, script, plantilla o CI tiene autorización implícita para crear etiquetas, Releases o publicar descargas.

## Puertas antes de autorizar otra Release

1. Requisitos concretos, cambios y limitaciones documentados mediante [Spec Kit](SPEC_KIT.md). El expediente activo debe estar convergido con pruebas contrastables.
2. CI correcta para **el commit exacto** a publicar: Windows, Linux y macOS; pruebas unitarias, Chromium, lint, formato, seguridad y manifiesto SHA-256. No se aceptan jobs cancelados, omitidos sin justificación o fallidos como «verde».
3. Prueba desde carpeta limpia y del ZIP que se distribuirá: arranque real, inicio vacío, abrir/guardar/importar, compilación, monitor serie, permisos del agente, recuperación y cierre. Registrar sistemas/plataformas **realmente** probados.
4. Cuando se anuncie compatibilidad física: dispositivo exacto, versión del core, compilación, carga y verificación, y **observación del usuario** por separado. No extrapolar a otras placas.
5. Cambios de seguridad y API revisados, secretos y datos personales excluidos, inventario de dependencias/licencias, retrocompatibilidad, recuperación y riesgos pendientes.
6. `VERSION`, changelog, README ES/EN, comprobantes de integridad y archivos del paquete corresponden al mismo commit. Comprobar los enlaces, hashes, ZIP y contenido **antes** de publicar.
7. Un responsable aprueba explícitamente nombre, tipo **pre-release** o **estable**, artefactos y texto. Sin esa aprobación el software permanece en desarrollo, aunque CI esté verde.

## Etiquetado y visibilidad

- Usar SemVer. Mientras el funcionamiento general no esté aceptado, marcar **pre-release**; no anunciar «1.0 estable».
- Mantener **un único candidato visible** cuando se decida consolidar la página de Releases. Conservar los tags y el historial Git para trazabilidad salvo solicitud específica de eliminación de etiquetas.
- No reescribir el historial ni borrar documentación técnica validada para dar una falsa apariencia de madurez.
- Los artefactos CI no son automáticamente Releases públicas. La CI existente solo verifica; **no publica**.
- Incidencias: issues reproducibles; mejoras: ramas con PR; experimentos: documentación interna. Nunca anunciar pruebas controladas como hardware físico verificado.

## Inventario público de Releases (26/10/2026)

Solo figura **una Release pública: `v1.0.0-rc.4`**. Las RC anteriores no aparecen ya en la ficha pública. Esto no implica eliminar tags ni reescribir historial.

El ZIP de RC4 se creó antes de integrar las nuevas atribuciones de terceros. Su contenido no puede acreditarse desde la rama `main`. [Auditoría de la distribución pendiente](AUDITORIA_DISTRIBUCION_RC4.md) · [bloqueante #11](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/11). Ningún cambio documental constituye una verificación del ZIP antiguo.

## Históricos y documentación

La documentación que corresponda a 0.9.x, RC1–RC3 y pruebas ya superadas se etiqueta como **histórica** y se consulta desde [archivo](archive/README.md). No debe figurar como guía de instalación vigente ni confundirse con evidencias actuales. La documentación actual se encuentra en [índice](README.md).

## Próximo lanzamiento

En estado **congelado para publicación**, salvo decisión explícita y puertas verificadas. El siguiente cambio se incorpora como PR y no desencadena por sí mismo una RC nueva.
