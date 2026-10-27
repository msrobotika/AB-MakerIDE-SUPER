# Instalador Windows x64 (paquete de pruebas)

Esta carpeta describe **la compilación actual de desarrollo de `main`**. No
reutiliza ni altera el ZIP histórico `v1.0.0-rc.4`.

## Compilación reproducible y alcance

GitHub Actions ejecuta `.github/workflows/windows-installer.yml` en un runner
`windows-latest`: Python 3.13 x64, PyInstaller 6.16.0, pyserial 3.5,
e Inno Setup 6, descargados en el runner. El instalador
incluye intérprete y librerías de ejecución para el editor local. Se incorporan copias de las licencias de CPython y pyserial en `third_party_licenses/`. Se entrega
**sin firma Authenticode** y puede activar SmartScreen. No se instala ninguna
herramienta o core de placa, no se graba firmware ni se autoriza IA.

Pruebas CI: `exe --check --json`, instalación silenciosa en carpeta con espacios,
segundo `exe --check`, servidor HTTP en 127.0.0.1, desinstalación y conservación
de datos de usuario. La CI no verifica las pantallas físicas ni la experiencia
de un tercero en su ordenador. El programa se abre con una consola que debe
mantenerse abierta para que siga funcionando el servidor local.

Instalación por usuario (sin elevación); programa en el directorio de
instalación y datos en `%LOCALAPPDATA%\MS Robotika\AB MakerIDE SUPER`.
Los proyectos deben guardarse/exportarse antes de cerrar; desinstalar no
borra la carpeta de datos. Si el puerto 8770 está ocupado, cierra el otro
servidor o arranca con `--port 8771`.

**Dependencias externas voluntarias:** Arduino CLI, núcleos y librerías de
cada placa, herramientas CLI de Codex/Claude, y `mpremote` si se utiliza.
Las cuentas de IA usan cuota propia. El programa no incorpora Arduino CLI
ni firmware de fabricantes.

La descarga directa pública solo se crea si los controles del commit
en Windows, Linux y macOS finalizaron correctamente, el instalador pasó
el smoke test en Windows y el commit integrado lleva el marcador de
aprobación `[publish-installer]`. En otro caso, el paquete se mantiene como
artefacto CI, no como Release certificada. Toda publicación debe exhibir
su commit, su SHA-256 y el carácter de **TEST / pre-release**.

Código fuente y condiciones: `LICENSE`, `THIRD_PARTY_NOTICES.md`, licencia
del scaffolding Spec Kit en `.specify/UPSTREAM_LICENSE`. No se afirma
que esta prueba técnica resuelva por sí sola las revisiones legales de #11.
