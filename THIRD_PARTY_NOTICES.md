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
| **pyserial, mpremote, keyring** | Instalación opcional mediante pip en `.venv` privada. No se entregan paquetes/ruedas en el ZIP fuente. | Consultar licencias e inventario del entorno resuelto al distribuir binarios. |
| **Ruff, Playwright, ESLint, Prettier** | Herramientas de CI/desarrollo, no parte del paquete de ejecución. | Titulares y licencias originales de cada proveedor. |
| **Codex CLI, Claude Code, Gemini, Ollama** | Integraciones opcionales externas, instalación, cuentas y cuotas del usuario. | Sus condiciones, licencias y marcas; sin patrocinio declarado. |

## Alcance de MIT y GPL-3.0

MakerIDE propio: [MIT](LICENSE). Arduino CLI: **GPL-3.0 externo** según su titular; no se distribuye ni enlaza su código en este proyecto. Ejecutarlo por CLI **no garantiza por sí solo** la ausencia de obligaciones según las circunstancias de derivación, vinculación, distribución o uso comercial. **No incluir la CLI, núcleos ni bibliotecas dentro de nuevas descargas/instaladores sin evaluación jurídica y de licencias previa.** Revisar cada compilación de firmware, pues puede incorporar licencias de bibliotecas y núcleos externas. Referencia primaria: [README Arduino CLI](https://github.com/arduino/arduino-cli).

## Marcas y terceros

**AB MakerIDE SUPER** es un producto propio, independiente y no oficial de MS Robotika. No existe alianza, certificación ni respaldo de Arduino, Espressif, Adafruit, OpenAI, Anthropic, Google, Microsoft, GitHub ni franquicias de videojuegos. Arduino® es marca de Arduino S.r.l. Solo emplear los nombres de empresas ajenas como referencia a compatibilidad o proveedor, nunca sus logos como identidad. Normas: [Arduino trademarks](https://www.arduino.cc/en/trademark/).

La versión en desarrollo del ejemplo arcade se denomina **Defensa Orbital**, `examples/defensa_orbital/`. Los logs y el tag `v1.0.0-rc.4` mantienen nombres técnicos antiguos **exclusivamente como evidencia histórica**; no se reescriben hashes ni se finge equivalencia del firmware corregido.

## Antes de publicar

Comprobar los **bytes exactos** del paquete, dependencias internas, recursos visuales, atribuciones, licencias transitorias, derechos de código/arte/sonido generado con IA, y marcas. Registrar revisión humana y bloquear una nueva Release con dudas materiales pendientes. Sin nueva Release en esta corrección.

## Versión descargable anterior a esta revisión

La RC4 pública precede al inventario completo de este documento. **Sus bytes no se han auditado aquí.** No confundir las atribuciones de `main` con el contenido histórico de la descarga. [Estado y procedimiento](docs/AUDITORIA_DISTRIBUCION_RC4.md) · [bloqueante #11](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/11).
