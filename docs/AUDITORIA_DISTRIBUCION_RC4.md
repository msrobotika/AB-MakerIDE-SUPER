# Auditoría de la descarga RC4 — BLOQUEADA HASTA INSPECCIONAR EL ZIP

**Corte: 26/10/2026.** Una Release pública: `v1.0.0-rc.4`. ZIP adjunto: `AB-MakerIDE-SUPER-1.0.0-rc.4-IA-actualizada.zip` (7.107.080 bytes). La etiqueta apunta a `c13864910810c4e9d69642efaaa32688e9bd066f`. Las atribuciones y el ejemplo renombrado de la PR #10 se incorporaron DESPUÉS al código de `main` (`c0be556cab6c6ffd63d15f2d4a5587d65fe83faf`).

**No se pudieron obtener los bytes de la descarga pública durante esta auditoría.** Por tanto, no se puede afirmar que el ZIP antiguo incluya `THIRD_PARTY_NOTICES.md`, el ejemplo nuevo ni licencias actualizadas. Tampoco se han verificado sus hashes por inspección directa. La [incidencia #11](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/11) permanece abierta hasta reunir evidencia.

## Verificación offline reproducible

1. Descargar desde [la Release](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/tag/v1.0.0-rc.4) el **ZIP real** y `SHA256SUMS.txt`. No utilizar un ZIP reconstruido desde `main` para simular la descarga histórica.
2. Con una copia del código actual de MakerIDE y Python 3.10+, ejecutar:

```powershell
python scripts/audit_distribution.py --zip "AB-MakerIDE-SUPER-1.0.0-rc.4-IA-actualizada.zip"
```

Opcional: aportar `--sha256` seguido de los 64 caracteres de la huella oficial para ese ZIP, comprobados en `SHA256SUMS.txt`.

El comprobador trabaja **sin extraer ni ejecutar** archivos, y devuelve JSON con `passed` y `errors`. Verifica SHA256 completo (cuando se proporciona el oficial), CRC, rutas peligrosas, enlaces, conjunto completo de archivos del manifiesto interno, licencia MIT, atribución de GitHub Spec Kit, ausencia del ejecutable Arduino CLI y denominación de ejemplo vigente.

**La descarga RC4 podría fallar justamente porque precede a estas condiciones.** No corregir la salida del programa para obtener un verde artificial ni reescribir el tag/ZIP histórico.

## Controles humanos que ningún script puede certificar

- Comparar **cada asset** y huella publicada, y realizar un inventario de binarios, bibliotecas, núcleos, voces, imágenes, vídeo y material de terceros. El test de nombres de ejecutables no detecta binarios camuflados.
- Verificar licencias de versiones concretas de Arduino CLI (GPLv3 y advertencia de licencia comercial), cores, Adafruit GFX/ILI9341 y XPT2046, especialmente si se redistribuye firmware.
- Comprobar procedencia y derechos del código generado con IA, arte/sonido y expresión original del juego. Renombrar no acredita que un trabajo sea independiente.
- Volver a **compilar y probar físicamente** el firmware renombrado en la CYD exacta con autorización: la carga de RC4 solo prueba su firmware anterior.
- Revisar legalmente denominación comercial, marcas, distribución comercial y atribuciones antes de una nueva Release. CI no es certificación legal.

## Semáforo

| Control | Resultado |
| --- | --- |
| Código de `main` y avisos de licencias | Documentado y revisado en PR #10 |
| CI del commit concreto | Consultar Actions; no sustituye verificación del ZIP |
| Descarga RC4, bytes y checksum real | **NO VERIFICADO / BLOQUEANTE #11** |
| Derechos de recursos y contenido del juego | **Revisión humana pendiente** |
| Hardware con el firmware renombrado | **No probado aún** |

No crear nuevas Releases ni modificar los assets actuales sin procedimiento de publicación, controles completos y aprobación del responsable.
