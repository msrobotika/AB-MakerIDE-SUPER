# MCP Maker opcionales — MS Robotika

**Característica opt-in de AB MakerIDE SUPER.** El catálogo no instala software, no crea
sesiones ni conecta a Internet por abrir el panel. La configuración se almacena
en el almacén seguro del usuario; se emplea únicamente si se autoriza una tarea
de agente con MCP. Mantener aprobación **manual** para cada llamada en Codex
por defecto. No es un sandbox: el servidor MCP puede ejecutar sus propias
herramientas con permisos del usuario cuando se invoca.

**Tres plantillas disponibles para registrar voluntariamente:** REA (firmware), Context7 (documentación) y Playwright (pruebas web). Son integraciones de configuración comprobables, **no conexiones ni instalaciones probadas en un PC real**. Los otros nombres del menú son candidatos sin botón operativo. Cada nuevo adaptador debe pasar una revisión de origen, permisos y funcionamiento.

## Primer servidor: REA — análisis inverso autorizado

Fuente oficial: <https://github.com/morluto/rea>, paquete npm
`rea-agents`. Versión fijada para la plantilla **6.8.0**; la versión puede
revisarse y actualizarse solo con auditoría y pruebas. No usar `@latest`
silenciosamente. REA exige una versión de Node.js compatible según su guía
vigente y, para descompilación nativa profunda, Ghidra, Hopper o IDA.
REA requiere Node.js 22.23.4+, 24.22.1+ o 26.12.1+ (con ramas soportadas). En Windows, la llamada stdio pasa por `cmd.exe /d /c npx ...`, siguiendo su documentación. Verificar la licencia de la distribución exacta y las dependencias antes de
redistribuir, ya que MakerIDE no incluye REA. REA es de un proveedor externo
sin asociación comercial con MS Robotika.

En **MCP → Catálogo Maker**, seleccionar REA y pulsar **Añadir integración**:
- fusiona solo la entrada `rea` sin revelar, reemplazar ni perder el resto
  de configuraciones o credenciales;
- **no** ejecuta `npx`, no descarga el paquete y no modifica Codex global;
- muestra el servidor como `configurado; conexión aún no comprobada`;
- permite **Quitar REA**, pero no borra una entrada `rea` personalizada.

La primera ejecución autorizada del agente puede hacer que `npx`
descargue la versión fijada, si no está en su caché. Verifica procedencia y
requisitos antes de aceptar llamadas. **No habilites aprobación automática**.
MakerIDE no analiza, lee ni graba placas mediante el simple registro MCP.

Prueba inicial recomendada: analizar un **archivo firmware propio ya
existente** (.elf/.bin/.hex, según soporte real y proveedor configurado)
en una copia temporal, sin puertos USB ni permisos de escritura sobre
firmware. Registrar SHA-256 del original y diferencias entre resultados de
REA y referencia conocida. No afirmar reconstrucción de fuente exacta,
elusión de protecciones, medidas electrónicas ni análisis nativo sin un
proveedor real operativo.

## Context7 — documentación actualizada de APIs (opcional)

Preset HTTP: `https://mcp.context7.com/mcp` según [instrucciones oficiales](https://github.com/upstash/context7).
Al registrarlo **no se envía un API key**, no se efectúan consultas y no se comprueba la conectividad. El servicio puede exigir autenticar alguna funcionalidad o limitar la cuota. Para mayores límites, el usuario debe obtener su propia clave y configurar las cabeceras con el editor JSON protegido. Las consultas pueden enviar fragmentos de contexto al proveedor externo. Respetar políticas del proyecto, privacidad y uso empresarial.

## Playwright MCP — navegador aislado (opcional)

Paquete `@playwright/mcp@0.0.83` conforme a [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp). El preset registra `--headless --isolated --browser=chromium`. Aislado significa **perfil nuevo sin cookies de usuario**, no aislamiento de red o del sistema operativo. El navegador requerido puede precisar instalación adicional; no se descarga al añadir la entrada. Un agente con permisos podría visitar páginas arbitrarias o interactuar con servicios; empezar con un HTML local de ensayo, en modo de agente que pida permiso. No introducir secretos reales en el navegador de pruebas.

## Usar REA en tu Codex personal (independiente de MakerIDE)

La configuración local del usuario de Codex **no puede modificarse desde la
conexión GitHub**. En el ordenador con Codex CLI instalado:

1. Comprobar `node --version`, `npm --version`, `codex --version`.
   Consultar requisitos oficiales:
   <https://github.com/morluto/rea/blob/main/docs/installation.md>.
2. Leer primero un plan de cambios sin aplicarlos:

   ```powershell
   npx -y rea-agents@6.8.0 setup --client codex --dry-run --json
   ```
3. Si el plan solo modifica el perfil Codex deseado y su skill, y tras
   revisar la procedencia del paquete, autorizar conscientemente:

   ```powershell
   npx -y rea-agents@6.8.0 setup --client codex
   ```

4. Reiniciar Codex; comprobar:

   ```powershell
   npx -y rea-agents@6.8.0 doctor --client codex --json
   ```

El *doctor* comprueba registro y prerrequisitos, **no** acredita que una
sesión Codex en marcha ya haya conectado el servidor. Confirmar que
`rea` aparece en las herramientas MCP en una sesión nueva y hacer una
prueba de lectura sobre un archivo de ensayo propio. El setup de REA
declara realizar respaldos de la configuración; inspeccionarlos antes de
repetir instalaciones o restaurar.

## MCP útiles para incorporar después — NO ACTIVADOS

| Categoría | Proyecto candidato | Estado |
| --- | --- | --- |
| Documentación ESP32 | [MCP oficial Espressif](https://developer.espressif.com/blog/2026/04/doc-mcp-server/) | Solo referencia: requiere autenticación OAuth que el panel actual no negocia; no añadir a ciegas |
| Diseño electrónico | [Seeed Studio KiCad MCP](https://github.com/Seeed-Studio/kicad-mcp-server) | **Alta prioridad**: análisis esquemático/PCB, ERC y DRC; KiCad y bindings Python requieren instalación y copia de seguridad |
| Firmware en hardware | [Embedded Debugger MCP](https://github.com/adancurusul/embedded-debugger-mcp) | **Alta**: probe-rs/OpenOCD, lectura de registros y diagnóstico; también puede escribir flash y detener CPU: permisos privilegiados |
| Comunicación USB/UART | [Serial MCP Server](https://github.com/adancurusul/serial-mcp-server) | **Alta**: captura/diagnóstico de serie; escribir bytes, alternar líneas y ejecutar macros puede actuar físicamente sobre la placa |
| Datos de fabricante | [Espressif Documentation MCP](https://developer.espressif.com/blog/2026/04/doc-mcp-server/) | **Alta** para ESP32: referencia oficial; autenticación/configuración propias, no habilitar sin validación |
| Ficheros de proyecto | [Filesystem MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) | **Media**: solo en directorios autorizados; también ofrece herramientas de escritura, no asumir modo lectura |
| Versionado de firmware | [GitHub MCP Server](https://github.com/github/github-mcp-server) | **Media**: PR/commits/issues; requiere autenticación por el usuario y tokens mínimos, no duplicar con integración propia |
| Protocolos industriales | MCP de Modbus, MQTT, CAN, I²C, SPI y SCADA | **Investigación**: candidatos a auditar o adaptadores MS Robotika propios; no habilitar comandos sobre equipos reales por defecto |

Cada nuevo preset tendrá **origen oficial, versión fijada, permisos
declarados, instalación explícita, pruebas de integración, aislamiento por
sesión y eliminación reversible**. Los nombres y enlaces no implican
patrocinio, certificación ni instalación. REA, Context7 y Playwright tienen plantillas de **configuración** en esta fase;
la verificación en un equipo real sigue pendiente.
