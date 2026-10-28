# Auditoría de la descarga RC4 — bytes verificados, conformidad pendiente

**Corte: 26/10/2026.** Una Release pública: `v1.0.0-rc.4`. ZIP adjunto: `AB-MakerIDE-SUPER-1.0.0-rc.4-IA-actualizada.zip` (7.107.080 bytes). La etiqueta apunta a `c13864910810c4e9d69642efaaa32688e9bd066f`. Las atribuciones y el ejemplo renombrado de la PR #10 se incorporaron DESPUÉS al código de `main` (`c0be556cab6c6ffd63d15f2d4a5587d65fe83faf`).

**Nueva ejecución real: 28/10/2026, Windows.** Se descargó el ZIP público exacto y su `SHA256SUMS.txt`. Tamaño: 7.107.080 bytes. SHA-256 observado y coincidente: `2337121a9709b1371a4cd910073521b4d93632dc35a2b16bce831cbf9bba2862`.

CRC de todas las entradas e integridad del manifiesto interno: sin errores detectados. El comprobador devuelve **`passed:false`**: faltan `THIRD_PARTY_NOTICES.md` y los tres archivos de `examples/defensa_orbital/`; permanece el directorio histórico del juego. Se conserva la descarga intacta. La [incidencia #11](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/11) sigue abierta por estas discrepancias y la revisión humana pendiente.

REA inspeccionó el ZIP sin ejecutarlo; su resumen conserva identidad, cobertura y límites. Se adjuntan [inventario de 410 archivos con SHA-256 y CRC](evidence/distribution-20261028/rc4-inventory.json), [resultado del comprobador](evidence/distribution-20261028/rc4-audit.json) y [evidencia REA](evidence/distribution-20261028/rea-rc4-summary.json). La licencia de cada archivo no se ha dictaminado individualmente.

## Instalador Windows TEST, distinto de RC4

El Setup publicado del commit `025dd26e85d790640f5593b0ffd223267cef8f22`, SHA-256 `ecb25a3d7f021c5f0c3f26a2d3a06b96c26e586366e206847a56ba4599602f7c`, se instaló en una ruta temporal con acentos. Pasó registro Windows por usuario, `--check --json`, arranque HTTP local, reinstalación ES/EN y desinstalación conservando datos externos. [Resultados](evidence/distribution-20261028/windows-test-lifecycle.json) y [entorno](evidence/distribution-20261028/environment.json).

Windows informa `NotSigned`; REA observa ausencia de tabla de certificados PE. No se realizó interacción con SmartScreen ni prueba en Windows limpio. El diagnóstico de dependencias no prueba comunicación serie, firmware físico ni ejecución de cuentas IA/MCP. El código actual de `main` y este instalador corresponden a commits diferentes.

## Verificación offline reproducible

1. Descargar desde [la Release](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/tag/v1.0.0-rc.4) el **ZIP real** y `SHA256SUMS.txt`. No utilizar un ZIP reconstruido desde `main` para simular la descarga histórica.
2. Con una copia del código actual de MakerIDE y Python 3.10+, ejecutar:

```powershell
python scripts/audit_distribution.py --zip "AB-MakerIDE-SUPER-1.0.0-rc.4-IA-actualizada.zip"
```

Opcional: aportar `--sha256` seguido de los 64 caracteres de la huella oficial para ese ZIP, comprobados en `SHA256SUMS.txt`.

El comprobador trabaja **sin extraer ni ejecutar** archivos, y devuelve JSON con `passed` y `errors`. Verifica SHA256 completo (cuando se proporciona el oficial), CRC, rutas peligrosas, enlaces, conjunto completo de archivos del manifiesto interno, licencia MIT, atribución de GitHub Spec Kit, ausencia del ejecutable Arduino CLI y denominación de ejemplo vigente. También rechaza alias de mayúsculas/minúsculas en componentes de ruta y conflictos archivo/directorio; es una comprobación conservadora de alias, no un validador completo de nombres Win32.

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
| Descarga RC4, bytes, checksum, CRC y manifiesto interno | **Verificados; conformidad global FAIL por archivos ausentes y ejemplo histórico** |
| Instalador Windows TEST exacto | **Ciclo silencioso aprobado en este Windows; sin firma, SmartScreen y equipo limpio pendientes** |
| Derechos de recursos y contenido del juego | **Revisión humana pendiente** |
| Hardware con el firmware renombrado | **No probado aún** |

No crear nuevas Releases ni modificar los assets actuales sin procedimiento de publicación, controles completos y aprobación del responsable.
