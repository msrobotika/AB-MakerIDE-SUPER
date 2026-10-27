# Descargas y versiones — AB MakerIDE SUPER

Actualizado: **27 de octubre de 2026**. Hay **dos pre-releases diferenciadas**: un instalador Windows TEST con el código de desarrollo actualizado y la RC4 histórica portátil. También está disponible el ZIP dinámico de fuentes.

## Descargar

| Edición | Enlace | Estado |
| --- | --- | --- |
| **Windows TEST x64 (.exe)** | **[DESCARGAR INSTALADOR WINDOWS](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/download/windows-test-dev-025dd26e85/AB-MakerIDE-SUPER-Windows-x64-dev-025dd26e85-Setup.exe)** | **16,4 MB, Python integrado**. Instalación/arranque/desinstalación verificados mediante CI sobre el commit `025dd26e85d790640f5593b0ffd223267cef8f22`. Sin firma digital y sin pruebas físicas nuevas de placas. |
| **RC4 histórica (ZIP portátil)** | [Descargar RC4](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/download/v1.0.0-rc.4/AB-MakerIDE-SUPER-1.0.0-rc.4-IA-actualizada.zip) | Necesita Python 3.10+, no incluye ScreenLab/MotionLab posteriores; auditoría de distribución #11 pendiente. |
| **Código de desarrollo main.zip** | [Descargar fuentes](https://github.com/msrobotika/AB-MakerIDE-SUPER/archive/refs/heads/main.zip) | Código fuente cambiante; no es un instalador autónomo. |

La [Release de Windows TEST](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/tag/windows-test-dev-025dd26e85) publica el instalador, su `SHA256SUMS.txt`, inventario de dependencias y evidencias de arranque. Puede aparecer un aviso de Windows SmartScreen porque **no está firmado**. No se anuncian pruebas físicas del firmware generado que no se hayan realizado.

## Instalación Windows TEST (sugerida a probadores)

1. Descarga **[AB MakerIDE SUPER Setup.exe](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/download/windows-test-dev-025dd26e85/AB-MakerIDE-SUPER-Windows-x64-dev-025dd26e85-Setup.exe)** y ejecútalo.
2. Instala para tu usuario, sin permisos de administrador; abre AB MakerIDE SUPER desde Inicio.
3. Conserva abierta la consola de diagnósticos mientras utilizas el IDE en el navegador local.
4. El editor, simulador y diseñador ScreenLab no requieren instalar Python. Para **compilar o grabar Arduino/ESP32** sí necesitas Arduino CLI, el núcleo de placa y bibliotecas compatibles instalados aparte. Los proveedores IA usan tus herramientas y cuentas.
5. Exporta/guarda tus proyectos de código. Los registros/datos operativos van a `%LOCALAPPDATA%\\MS Robotika\\AB MakerIDE SUPER` y no se borran automáticamente al desinstalar.

## Qué funcionalidades verás

| Función | ZIP RC4 | Windows TEST y código de desarrollo en `main` |
| --- | --- | --- |
| Editor Arduino/MicroPython, simulador, compilación y serie | Sí, según dependencias externas | Sí, con cambios posteriores |
| Centro de Actividad IA en barra izquierda | Sí, ZIP RC4 actualizado | Sí |
| Diseñador **AB ScreenLab**, JSON y exportación LVGL 8.x | **No** | **Sí** |
| Animaciones **AB MotionLab**, presets y preview | **No** | **Sí** |
| Catálogo MCP Maker con REA, Context7 y Playwright configurables | **No** | **Sí, con conexión real de terceros pendiente de validar** |
| Exportación de sketch estático `.ino` CYD/IdeaSpark mediante Adafruit GFX | **No** | **Sí: compilación en CI, hardware de ese sketch no probado** |
| Instalador autónomo `.exe`/`.msi` | **No** | **Sí, instalador Windows TEST `.exe`, sin firma** |

El exportador `.h` LVGL necesita una aplicación/driver compatibles. El exportador estático `.ino` sí produce un sketch compilable, pero no aporta táctil, animaciones ni control de actuadores y **no hay observación física de ese firmware generado**. No atribuir las pruebas del juego o radar de RC4 al nuevo exportador.

## Primer arranque en Windows — ZIP RC4

1. Descarga el ZIP RC4 desde el enlace directo anterior y extrae **todo** a una carpeta nueva dentro de tu usuario, por ejemplo `Documentos/AB-MakerIDE-RC4/`.
2. Instala **Python 3.10 o posterior** desde [python.org](https://www.python.org/downloads/windows/) si no está presente.
3. Abre `INICIAR_WINDOWS.bat`. La aplicación escucha solo localmente, normalmente en `http://127.0.0.1:8770`. No necesita usuario ni contraseña online para abrir editor/simulador.
4. Si vas a usar puertos serie o MicroPython, ejecuta `PREPARAR_WINDOWS.bat` y reinicia el lanzador. Crea una `.venv` privada; no instala Arduino CLI, drivers, cores ni herramientas MCP.
5. Para compilar/grabar proyectos Arduino, instala **Arduino CLI**, el **núcleo** de la placa y las bibliotecas usadas en el firmware. La cuenta IA es opcional, propia y con su cuota.
6. Exporta tus proyectos antes de cerrar o cambiar de carpeta y revisa los requisitos para grabar hardware real en la [guía de instalación](INSTALACION.md).

## Alternativa: probar ScreenLab y MotionLab desde el código fuente

1. Descarga `main.zip` desde el segundo enlace; extrae en una **carpeta diferente** a RC4. No sobreescribas archivos de la carpeta RC4 ni los proyectos anteriores.
2. Confirma la presencia de `frontend/screenlab.js`, `frontend/screenlab-sketch.js` y `INICIAR_WINDOWS.bat` en esa copia. Ejecuta el lanzador con Python 3.10+.
3. En el IDE, abre **⋯ Herramientas → AB ScreenLab · Pantallas**; selecciona **CYD** o **IdeaSpark**. Añade botones/barras, exporta JSON o código LVGL; en el inspector puedes probar animaciones MotionLab.
4. Para generar `.ino` estático, usa **Descargar sketch completo**; si tienes animaciones activas, el exportador las bloquea de forma explícita hasta retirarlas. Instala las bibliotecas Adafruit necesarias antes de compilar.
5. Si necesitas conservar capturas o colaborar, consulta la [galería real de ScreenLab en Chromium](evidence/screenlab/README.md) y el [manual técnico](SCREENLAB.md). **No se ha verificado instalación/desinstalación en Windows limpio de esta instantánea dinámica.**

El ZIP `main.zip` se genera dinámicamente por GitHub. **No tiene una huella de versión fija**: si necesitas reproducibilidad utiliza un commit SHA concreto y no lo llames `RC5` ni `1.0 estable`.

## Advertencias de distribución

La [incidencia #11](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/11) audita exclusivamente el ZIP RC4 histórico; no se ha sustituido ni se han reinterpretado sus pruebas físicas. La [política de publicaciones](RELEASE_POLICY.md) exige QA y control de la distribución. La Windows TEST se publicó tras CI multiplataforma, smoke test del ejecutable e instalación/desinstalación Windows. **No certifica compatibilidad con cualquier PC, pantalla o placa.** Una nueva modificación en `main` no actualiza por sí sola el instalador; la referencia reproducible es el commit de su Release.
