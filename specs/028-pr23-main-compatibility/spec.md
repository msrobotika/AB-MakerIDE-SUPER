# PR23 — compatibilidad con main y contraste de artefactos
Base a1bf4820941c84dc64f5195660f952d2ec2e4b39; main e3353eedbf69fff7c418dd98fbd906e3d8b52692. Constitución 1.0.0. Spec Kit oficial y artefactos breves revisados manualmente.
Diagnóstico real: CI40781222256 verde para la rama original, pero main avanzó con #27; git merge-tree reproduce conflictos en quality-gate.json y MANIFEST_SHA256.txt. Sin cambios en la lógica original de distribución ni en el instalador.
- **FR-001**: Integrar main preservando todo el trabajo de PR23 y documentación beta, sin rebase/force-push; resolver solo dos conflictos de metadatos confirmados.
- **FR-002**: Ejecutar guard ZIP y regresiones; comprobar hashes de ZIP RC4/TEST y auditar el ZIP exacto sin extraer; registrar no conformidad histórica sin cambiar artefactos.
- **FR-003**: Conservar evidencia histórica de instalación Unicode/reinstalación/desinstalación/datos y distinguirla de pruebas nuevas; no reinstalar el mismo AppId en el perfil activo ni declarar Windows limpio.
- **FR-004**: Manifiesto oficial, calidad y runner local; preparar PR23 actualizada y CI sobre SHA nuevo antes de revisión/merge. No fusionar, publicar ni sustituir instalador.
Convergencia local acredita integración de código y verificaciones, no cierre de #11/#19/#26 ni auditoría jurídica. La aceptación remota es gate separado sobre el commit exacto.
