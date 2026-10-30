# Plan
1. Worktree exclusivo, base/CI originales y conflictos de merge documentados antes de tocar código.
2. Merge main sin reescritura. Resolver gate a expediente028 y regenerar manifiesto; abortar planificación si aparecen conflictos de código inesperados.
3. Confirmar scripts/tests de guard sin cambios respecto a PR23 original; ejecutar diez casos ZIP, suite, Ruff/ESLint/Prettier y prueba fuente/recursos. Reauditar RC4/TEST por hashes y conservar diagnósticos originales.
4. Preparar avance fast-forward en la misma PR; CI estándar pública gratuita, revisión pendiente y main protegido. No instalar/desinstalar paquete real en el perfil del titular: AppId compartido puede alterar registro de su instalación. QA Windows limpia sigue pendiente.
