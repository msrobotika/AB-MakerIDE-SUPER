# Especificación: higiene de Releases y documentación visible

Fecha: 2026-10-26. Alcance: mantenimiento del repositorio AB MakerIDE SUPER RC4, sin tocar firmware, hardware ni API pública. La solicitud exige menos publicaciones prematuras, una portada ordenada y adoptar el Spec Kit ya existente.

## Historias de usuario

**P1, propietario del proyecto:** necesita que cada publicación corresponda a un hito validado, no a un commit diario. Prueba de aceptación: política visible, sin acciones automáticas de publicación y condición explícita de aprobación.

**P1, usuario nuevo:** necesita hallar la descarga RC4 y guías vigentes sin confundir instrucciones de v0.9.x. Prueba: README ES/EN e índice actual, documentos obsoletos solo en archivo con aviso.

**P2, colaborador:** debe saber qué pruebas y documentación debe aportar antes de pedir una Release. Prueba: CONTRIBUTING, plantilla PR, AGENTS y Spec Kit enlazan la misma política.

## Requisitos

- **FR-001**: Documentar que los desarrollos rutinarios no producen Releases y exigir autorización del propietario y pruebas del commit/paquete antes de cualquier publicación.
- **FR-002**: Indicar RC4 como único candidato recomendado sin ocultar que siguen existiendo RC1–RC3 y que su eliminación en GitHub Releases es una operación externa pendiente.
- **FR-003**: Separar guías vigentes de instrucciones 0.9.x preservando el contenido histórico, sin borrar evidencia de hardware ni plantillas de Spec Kit.
- **FR-004**: Documentar el uso obligatorio de Spec Kit y la revisión de cambios, sin conferir a agentes permisos implícitos para publicar.
- **FR-005**: Evitar que la CI siga acumulando ejecuciones solapadas de la misma rama; excluir resultados temporales del control de versiones.

## Límites y seguridad

No se ejecutan operaciones contra placas, agentes CLI o cuentas. El conector disponible no permite borrar objetos Release, así que se documentan las tres operaciones manuales pendientes; no se afirma que se hayan borrado. No se reescribe historia ni se eliminan tags. La CI prueba coherencia documental y de código, pero nunca sustituye validación física.
