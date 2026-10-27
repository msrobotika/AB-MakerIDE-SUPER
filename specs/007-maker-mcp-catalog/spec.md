# Catálogo MCP Maker opcional — AB MakerIDE SUPER

## Alcance
Proveer un catálogo seguro y reversible de integraciones MCP que amplía MakerIDE sin cargar los recursos de terceros en el instalador, con interfaz de opciones genuinas y requerimientos documentados.

## Requisitos
- **FR-001**: REA versión fijada 6.8.0, Context7 HTTP oficial y Playwright 0.0.83 en modo aislado son **presets configurables**; registro no implica instalación/conexión/prueba real.
- **FR-002**: Cualquier preset debe fusionarse sin sobrescribir, perder o mostrar los MCP/secretos existentes; baja reversible solo de entrada sin personalizar.
- **FR-003**: Candidatos de electrónica, depuración, UART, documentación, ficheros y control de versiones son visibles sin botón activo; no inventar comandos ni instalar paquetes.
- **FR-004**: API local protegida, consentimiento manual por tarea, sin autoactivar agentes ni modificar la cuenta global Codex; pruebas unitarias y de navegador.
- **FR-005**: Documentación de integración opcional, terceros, requisitos/versión, privacidad, seguridad hardware y script de revisión previa de REA para Codex personal.

## Fuera de alcance
Instalar REA en la máquina del usuario, validar npm/Ghidra/placa físicamente, soportar descifrado o extracción protegida, distribuir herramientas de terceros, nuevas Releases.
