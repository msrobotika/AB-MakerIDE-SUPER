# Third-party notices / Avisos de terceros

**MS Robotika — AB MakerIDE SUPER.** Inventario técnico inicial, 26 octubre 2026. MIT cubre el código propio, no sustituye condiciones de terceros. **No constituye auditoría jurídica final del ZIP, firmware o derechos de gráficos.**

| Dependencia | Uso/entrega | Licencia y fuente |
| --- | --- | --- |
| **Arduino CLI** | Herramienta **externa**, instalada y gestionada por el usuario. MakerIDE localiza el ejecutable y lo invoca por subproceso; ni fuentes ni binarios de Arduino CLI empaquetados. | GPL-3.0. [Repositorio y licencia Arduino CLI](https://github.com/arduino/arduino-cli#license); el titular advierte además sobre usos comerciales que requieren evaluación específica. |
| **Arduino cores, toolchains y cores ESP32** | Instalación externa del usuario; no se entregan aquí. | Según cada paquete/revisión. Revisar licencias al redistribuir firmware. |
| **Adafruit GFX** | Cabeceras referenciadas desde firmware, biblioteca externa. | BSD, preservar atribuciones según [licencia oficial](https://github.com/adafruit/Adafruit-GFX-Library/blob/master/license.txt). |
| **Adafruit ILI9341** | Biblioteca de pantalla externa. | Verificar la licencia del archivo/version efectivamente instalado: su README upstream indica MIT y otras referencias BSD. Conservar los avisos originales. [Fuente](https://github.com/adafruit/Adafruit_ILI9341). |
| **XPT2046 Touchscreen** | Biblioteca externa de Paul Stoffregen para el panel táctil. | Permiso estilo MIT; requiere conservar aviso y mención de financiación según [cabecera upstream](https://github.com/PaulStoffregen/XPT2046_Touchscreen/blob/master/XPT2046_Touchscreen.h). |
| **GitHub Spec Kit** | Scripts/plantillas scaffolding incluidos en `.specify/` y `.agents/`. | MIT, © GitHub, Inc. Ver [licencia original](.specify/UPSTREAM_LICENSE) y [procedencia](.specify/UPSTREAM.md). |
| **CPython 3.13 (Windows TEST)** | Runtime integrado en el ejecutable Windows de pruebas; el ZIP de código fuente RC4 no lo contenía. Se adjunta la licencia en `third_party_licenses/python/`. | PSF License, [Python Software Foundation](https://docs.python.org/3/license.html). |
| **pyserial 3.5 y keyring 25.6.0** | Bibliotecas integradas en el ejecutable Windows TEST; en el ZIP fuente original se instalaban mediante pip por el usuario. Se incluyen sus archivos de licencia reales en `third_party_licenses/`. | pyserial: licencia BSD-style de su distribución. keyring: MIT ([PyPI versión exacta](https://pypi.org/project/keyring/25.6.0/)). Las dependencias transitivas concretas se relacionan en `dependency-versions.txt` del paquete de pruebas. |
| **mpremote** | No integrado; herramienta MicroPython opcional externa. | Licencia y dependencias de la versión que instale el usuario. |
| **PyInstaller 6.16.0** | Congelador de la aplicación; su bootloader queda integrado en el ejecutable TEST. | GPL-2.0-or-later con [excepción del bootloader](https://github.com/pyinstaller/pyinstaller/blob/develop/COPYING.txt). |
| **Inno Setup 6** | Compilador del instalador Windows; su código de instalación se distribuye en el setup TEST. | [Inno Setup License](https://github.com/jrsoftware/issrc/blob/main/license.txt) © Jordan Russell y Martijn Laan. Para uso comercial, revisar la [política de licencias](https://jrsoftware.org/ishelp/topic_purchase.htm). |
| **Ruff, Playwright, ESLint, Prettier** | Herramientas de CI/desarrollo, no parte del paquete de ejecución. | Titulares y licencias originales de cada proveedor. |
| **Codex CLI, Claude Code, Gemini, Ollama** | Integraciones opcionales externas, instalación, cuentas y cuotas del usuario. | Sus condiciones, licencias y marcas; sin patrocinio declarado. |

## Alcance de MIT y GPL-3.0

MakerIDE propio: [MIT](LICENSE). Arduino CLI: **GPL-3.0 externo** según su titular; no se distribuye ni enlaza su código en este proyecto. Ejecutarlo por CLI **no garantiza por sí solo** la ausencia de obligaciones según las circunstancias de derivación, vinculación, distribución o uso comercial. **No incluir Arduino CLI, sus núcleos ni bibliotecas de firmware dentro de nuevas descargas/instaladores sin evaluación jurídica y de licencias previa.** Revisar cada compilación de firmware, pues puede incorporar licencias de bibliotecas y núcleos externas. Referencia primaria: [README Arduino CLI](https://github.com/arduino/arduino-cli).

## Marcas y terceros

**AB MakerIDE SUPER** es un producto propio, independiente y no oficial de MS Robotika. No existe alianza, certificación ni respaldo de Arduino, Espressif, Adafruit, OpenAI, Anthropic, Google, Microsoft, GitHub ni franquicias de videojuegos. Arduino® es marca de Arduino S.r.l. Solo emplear los nombres de empresas ajenas como referencia a compatibilidad o proveedor, nunca sus logos como identidad. Normas: [Arduino trademarks](https://www.arduino.cc/en/trademark/).

La versión en desarrollo del ejemplo arcade se denomina **Defensa Orbital**, `examples/defensa_orbital/`. Los logs y el tag `v1.0.0-rc.4` mantienen nombres técnicos antiguos **exclusivamente como evidencia histórica**; no se reescriben hashes ni se finge equivalencia del firmware corregido.

## Windows TEST: distribución distinta del ZIP histórico

El instalador Windows de pruebas integra CPython, pyserial, keyring y componentes transitivos. Los avisos originales del código fuente no autorizan asumir que todos esos componentes faltan del instalador. El resultado final debe auditarse contra el fichero de versiones resueltas y los archivos de licencia incluidos; la prueba de CI no acredita por sí sola cumplimiento jurídico.

## Antes de publicar

Comprobar los **bytes exactos** del paquete, dependencias internas, recursos visuales, atribuciones, licencias transitorias, derechos de código/arte/sonido generado con IA, y marcas. Registrar revisión humana y bloquear una nueva Release con dudas materiales pendientes. Sin nueva Release en esta corrección.

## Versión descargable anterior a esta revisión

La RC4 pública precede al inventario completo de este documento. **Sus bytes no se han auditado aquí.** No confundir las atribuciones de `main` con el contenido histórico de la descarga. [Estado y procedimiento](docs/AUDITORIA_DISTRIBUCION_RC4.md) · [bloqueante #11](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/11).

## REA (Reverse Engineer Anything)

Servidor MCP de terceros por [morluto/rea](https://github.com/morluto/rea), paquete npm `rea-agents`. El catálogo referencia una versión exacta (**6.8.0**) para instalación separada y voluntaria, pero **no distribuye** su código, binarios, herramientas Ghidra/Hopper/IDA ni cuentas. Consultar su licencia, condiciones y dependencias de la versión específica antes de redistribuir; MakerIDE no concede licencia sobre ellas ni presenta afiliación.
