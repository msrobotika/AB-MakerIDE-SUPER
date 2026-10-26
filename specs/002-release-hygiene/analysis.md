# Análisis de consistencia

- RC4 es pre-release, no estable. El nuevo README la recomienda sin falsear compatibilidad de hardware.
- Se conservan tags, commits y evidencias de hardware; solo las dos guías obsoletas pasan a docs/archive.
- Spec Kit preexistente sigue como mecanismo de desarrollo; este expediente es nuevo para preservar el histórico de adopción.
- La CI existente usa push y PR; no contiene publicación GitHub Release. Añadir concurrencia solo cancela ejecuciones solapadas, no oculta fallos históricos ni sustituye verificaciones.
- La política advierte que eliminar Releases requiere permiso especial de la cuenta; la conexión disponible no lo ofrece. Publicar un workflow de borrado como rodeo de permisos sería inapropiado.
- Los hashes de archivos técnicos y el manifiesto se actualizan tras editar la rama y antes de converger.

No hay operaciones sobre placas, credenciales ni agentes durante este mantenimiento.
