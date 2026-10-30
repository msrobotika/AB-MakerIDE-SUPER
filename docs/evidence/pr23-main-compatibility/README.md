# PR23 y main — 30/10/2026

[Resultados locales](results.json) · [Artefactos exactos](artifacts.json) · [QA Windows anterior](../distribution-20261028/windows-test-lifecycle.json).

La PR original tenía [CI40781222256 verde](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/runs/40781222256). Se reprodujeron dos conflictos de integración con main mediante git merge-tree: gate y manifiesto. Se integró main conservando documentación beta, cambios ZIP, evidencias e historia. Ningún cambio de lógica/instalador/frontend respecto a la rama original; no reescritura ni force-push.

337 unidades (332 correctas, cinco omitidas), diez regresiones ZIP por separado, 21 Node, Ruff/ESLint/Prettier correctos. Los negativos cubren traversal, colisiones Windows, archivo/directorio, aviso ausente, binario no permitido y manipulación de SHA. Manifiesto regenerado con mecanismo oficial. La CI del nuevo commit se evalúa aparte antes de revisión/merge.

Los bytes actuales del TEST siguen coincidiendo con el artefacto de la evidencia anterior de instalación/reinstalación/desinstalación Unicode y conservación de datos. Se contrastó SHA y firma NotSigned de nuevo. No se reinstaló/desinstaló el mismo AppId en el perfil activo, porque podría alterar su registro y programa; la prueba Windows limpia e independiente sigue pendiente. No atribuir el QA anterior al código nuevo de esta integración.

El ZIP RC4 real sigue con 410 archivos, CRC/manifiesto histórico correctos y no conformidad por avisos/documentos/ejemplo vigente ausentes. No se modifica ni se reemplaza; #11 sigue abierta. Inventario, recursos y revisión jurídica completa siguen pendientes de su propio cierre. No se sustituye el instalador ni se publica release.
