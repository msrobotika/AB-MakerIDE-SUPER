# Descargas y versiones — AB MakerIDE SUPER

Actualizado: **27 de octubre de 2026**. Esta página separa deliberadamente una **descarga publicada** de una **instantánea del código en desarrollo**, para no confundir al usuario con versiones que aún no han sido empaquetadas y ensayadas.

## Descargar

| Edición | Enlace | Estado real |
| --- | --- | --- |
| **RC4 (prerelease)** | **[Descargar RC4 — ZIP portátil para Windows](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/download/v1.0.0-rc.4/AB-MakerIDE-SUPER-1.0.0-rc.4-IA-actualizada.zip)** | Archivo publicado de aprox. 7,1 MB; requiere Python 3.10+; no es instalador EXE/MSI. |
| **Desarrollo más reciente** | **[Descargar código fuente `main` en ZIP](https://github.com/msrobotika/AB-MakerIDE-SUPER/archive/refs/heads/main.zip)** | Instantánea del repositorio, cambia al avanzar el desarrollo; **no es versión empaquetada ni aval de instalación limpia**. |

También puedes consultar [la única Release pública](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/tag/v1.0.0-rc.4), [`main`](https://github.com/msrobotika/AB-MakerIDE-SUPER/tree/main) y su [CI](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml).

**No existe todavía instalador `.exe`/`.msi` publicado.** Prepararlo y probarlo está registrado en la [incidencia #19](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/19). No confundir un `.bat` para iniciar el programa con un instalador autónomo.

## Qué funcionalidades verás

| Función | ZIP RC4 | Código actual en `main` |
| --- | --- | --- |
| Editor Arduino/MicroPython, simulador, compilación y serie | Sí, según dependencias externas | Sí, con cambios posteriores |
| Centro de Actividad IA en barra izquierda | Sí, ZIP RC4 actualizado | Sí |
| Diseñador **AB ScreenLab**, JSON y exportación LVGL 8.x | **No** | **Sí** |
| Animaciones **AB MotionLab**, presets y preview | **No** | **Sí** |
| Catálogo MCP Maker con REA, Context7 y Playwright configurables | **No** | **Sí, con conexión real de terceros pendiente de validar** |
| Exportación de sketch estático `.ino` CYD/IdeaSpark mediante Adafruit GFX | **No** | **Sí: compilación en CI, hardware de ese sketch no probado** |
| Instalador autónomo `.exe`/`.msi` | **No** | **No** |

El exportador `.h` LVGL necesita una aplicación/driver compatibles. El exportador estático `.ino` sí produce un sketch compilable, pero no aporta táctil, animaciones ni control de actuadores y **no hay observación física de ese firmware generado**. No atribuir las pruebas del juego o radar de RC4 al nuevo exportador.

## Primer arranque en Windows — ZIP RC4

1. Descarga el ZIP RC4 desde el enlace directo anterior y extrae **todo** a una carpeta nueva dentro de tu usuario, por ejemplo `Documentos/AB-MakerIDE-RC4/`.
2. Instala **Python 3.10 o posterior** desde [python.org](https://www.python.org/downloads/windows/) si no está presente.
3. Abre `INICIAR_WINDOWS.bat`. La aplicación escucha solo localmente, normalmente en `http://127.0.0.1:8770`. No necesita usuario ni contraseña online para abrir editor/simulador.
4. Si vas a usar puertos serie o MicroPython, ejecuta `PREPARAR_WINDOWS.bat` y reinicia el lanzador. Crea una `.venv` privada; no instala Arduino CLI, drivers, cores ni herramientas MCP.
5. Para compilar/grabar proyectos Arduino, instala **Arduino CLI**, el **núcleo** de la placa y las bibliotecas usadas en el firmware. La cuenta IA es opcional, propia y con su cuota.
6. Exporta tus proyectos antes de cerrar o cambiar de carpeta y revisa los requisitos para grabar hardware real en la [guía de instalación](INSTALACION.md).

## Probar ScreenLab y MotionLab sin Release nueva

1. Descarga `main.zip` desde el segundo enlace; extrae en una **carpeta diferente** a RC4. No sobreescribas archivos de la carpeta RC4 ni los proyectos anteriores.
2. Confirma la presencia de `frontend/screenlab.js`, `frontend/screenlab-sketch.js` y `INICIAR_WINDOWS.bat` en esa copia. Ejecuta el lanzador con Python 3.10+.
3. En el IDE, abre **⋯ Herramientas → AB ScreenLab · Pantallas**; selecciona **CYD** o **IdeaSpark**. Añade botones/barras, exporta JSON o código LVGL; en el inspector puedes probar animaciones MotionLab.
4. Para generar `.ino` estático, usa **Descargar sketch completo**; si tienes animaciones activas, el exportador las bloquea de forma explícita hasta retirarlas. Instala las bibliotecas Adafruit necesarias antes de compilar.
5. Si necesitas conservar capturas o colaborar, consulta la [galería real de ScreenLab en Chromium](evidence/screenlab/README.md) y el [manual técnico](SCREENLAB.md). **No se ha verificado instalación/desinstalación en Windows limpio de esta instantánea dinámica.**

El ZIP `main.zip` se genera dinámicamente por GitHub. **No tiene una huella de versión fija**: si necesitas reproducibilidad utiliza un commit SHA concreto y no lo llames `RC5` ni `1.0 estable`.

## Advertencias de distribución

La [incidencia #11](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/11) requiere auditar el ZIP RC4 real, sus licencias, atribuciones y ejemplo histórico. No está cerrada. La [política de Release](RELEASE_POLICY.md) impide publicar un binario nuevo automáticamente por cada cambio en `main`. Hasta completar esas verificaciones, el botón de descarga pública conduce **honestamente a RC4**, no a una versión posterior inventada.
