# Cambios

## 1.0.0-rc.1 · actualización de proyectos · 25 octubre 2026

- Apertura del código generado en el editor al terminar, con respaldo previo y protección de las ediciones hechas durante la ejecución.
- Botones para abrir el último código, guardar el sketch y descargar el proyecto con archivos auxiliares en ZIP.
- Continuidad de auxiliares entre sesiones del agente y compilación con las cabeceras del proyecto.
- Importación de .ino y .py, además del formato .abmaker.json.
- Ejemplo radar de archivo único para IdeaSpark ST7789, compilado y grabado con autorización; funcionamiento visual confirmado por el usuario.
- Consentimiento del agente mediante diálogo dentro de la página, compatible con el navegador integrado.
- Capturas aportadas por el usuario y pruebas aisladas documentadas. 197 pruebas Python correctas, 4 omitidas y 26 comprobaciones de interfaz correctas.
- Presentación del proyecto abierto, guía de contribución y configuración inicial de CI preparada para GitHub.

## Base RC1

Catálogo real paginado, modelo separado de puerto, estados de trabajo verificables, recuperación de sesiones y resultados, protección ante pestañas en conflicto y pruebas locales. [Informe de la base RC1 y sus límites](docs/RELEASE_RC1.md).

## Antes de v1.0 estable

Quedan por validar la matriz de placas, desconexiones y cancelación durante carga, serie y MicroPython en dispositivos concretos, instalación y migración en equipos limpios, y launchers Linux/macOS. También faltan resultados remotos de CI y pruebas con usuarios externos. La grabación correcta del radar no sustituye esa matriz.
