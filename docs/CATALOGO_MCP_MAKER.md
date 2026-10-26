# MCP Maker opcionales — MS Robotika

**Característica opt-in de AB MakerIDE SUPER.** El catálogo no instala software, no crea
sesiones ni conecta a Internet por abrir el panel. La configuración se almacena
en el almacén seguro del usuario; se emplea únicamente si se autoriza una tarea
de agente con MCP. Mantener aprobación **manual** para cada llamada en Codex
por defecto. No es un sandbox: el servidor MCP puede ejecutar sus propias
herramientas con permisos del usuario cuando se invoca.

## Primer servidor: REA — análisis inverso autorizado

Fuente oficial: <https://github.com/morluto/rea>, paquete npm
`rea-agents`. Versión fijada para la plantilla **6.8.0**; la versión puede
revisarse y actualizarse solo con auditoría y pruebas. No usar `@latest`
silenciosamente. REA exige una versión de Node.js compatible según su guía
vigente y, para descompilación nativa profunda, Ghidra, Hopper o IDA.
Verificar la licencia de la distribución exacta y las dependencias antes de
redistribuir, ya que MakerIDE no incluye REA. REA es de un proveedor externo
sin asociación comercial con MS Robotika.

En **MCP → Catálogo Maker**, pulsar **Añadir REA**:
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
| Electrónica y PCB | [Seeed Studio KiCad MCP](https://github.com/Seeed-Studio/kicad-mcp-server) | Candidato, necesita revisión de dependencias, licencia, permisos y pruebas |
| Esquemáticos/PCB avanzados | [KiCad MCP Server](https://github.com/mixelpixx/KiCAD-MCP-Server) | Candidato comunitario: puede modificar proyectos; requiere pruebas en copias |
| Herramientas locales maker | Puertos serie, análisis I²C, lógica y registros, depuración | Solo como futuros adaptadores auditados, sin paquetes inventados |

Cada nuevo preset tendrá **origen oficial, versión fijada, permisos
declarados, instalación explícita, pruebas de integración, aislamiento por
sesión y eliminación reversible**. Los nombres y enlaces no implican
patrocinio, certificación ni instalación. Solo REA dispone de plantilla
operativa en esta fase.
