# Documentación vigente · AB MakerIDE SUPER

La edición mantenida es **1.0.0-rc.4 (candidato de lanzamiento)**. Antes de instalar consulta el [README del proyecto](../README.md) y [guía de instalación](INSTALACION.md). No se consideran estables las funciones pendientes de validación física.

## Documentación activa

| Necesidad | Guía |
| --- | --- |
| **Descargas: RC4 frente al código actualizado, y estado del instalador** | **[DESCARGAS_Y_VERSIONES.md](DESCARGAS_Y_VERSIONES.md)** |
| Instalación y recuperación | [INSTALACION.md](INSTALACION.md) |
| Primeros pasos en Windows | [PRUEBAS_EN_WINDOWS.md](PRUEBAS_EN_WINDOWS.md) |
| Linux y macOS | [LINUX_MACOS.md](LINUX_MACOS.md) |
| MCP, asistentes y consentimiento | [MCP.md](MCP.md) |
| Proyectos y guardado | [PROYECTOS_DEL_AGENTE.md](PROYECTOS_DEL_AGENTE.md) |
| IA, cuentas y cuotas | [IA_Y_CUOTAS.md](IA_Y_CUOTAS.md) |
| Placas verificadas y limitaciones | [MATRIZ_HARDWARE.md](MATRIZ_HARDWARE.md) |
| Simulador | [SIMULADOR.md](SIMULADOR.md) |
| Desarrollo y GitHub Spec Kit | [DESARROLLO.md](DESARROLLO.md) · [SPEC_KIT.md](SPEC_KIT.md) |
| **Publicaciones: prohibido lanzar por calendario** | [RELEASE_POLICY.md](RELEASE_POLICY.md) |
| Evidencias de RC4 | [evidence/rc4/README.md](evidence/rc4/README.md) · [AUDITORIA_RC4.md](AUDITORIA_RC4.md) |

## Material archivado y de investigación

[Archivo histórico 0.9.x y RC previas](archive/README.md). Su contenido conserva contexto y procedencia, **pero no son instrucciones de instalación actuales**.

La carpeta [evidence](evidence/README.md) contiene pruebas físicas identificadas por placa, ensayos controlados, capturas y registros. Su presencia sirve para trazabilidad, no demuestra automáticamente funcionamiento en cualquier PC o placa.

No borrar indiscriminadamente `.specify/`, `.agents/`, `specs/` ni `tests/`: forman parte del flujo de desarrollo verificable. Los resultados temporales, proyectos personales y binarios compilados deben quedar fuera del repositorio según [`.gitignore`](../.gitignore).
