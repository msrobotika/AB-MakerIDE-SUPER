# Herramientas MCP en MakerIDE RC3

El panel **Conexiones MCP** admite servidores estándar **stdio** (un proceso local) y **Streamable HTTP**. No dependen de la marca del modelo: la conexión la establece el cliente MCP del agente. MakerIDE entrega la configuración a **Codex CLI** o **Claude Code**, con la cuenta y permisos de cada usuario. Los conectores de chat de Google, OpenRouter u Ollama no se convierten en agentes MCP por seleccionar un modelo.

## Configurar desde el IDE

1. Abre el panel MCP y pega la configuración `mcpServers` del servidor. Se admiten hasta 16 servidores; los nombres deben comenzar por una letra y usar letras, números, guion o guion bajo.
2. Pulsa **Guardar conexiones**. Esto valida y guarda el formato; no descarga paquetes, inicia procesos ni verifica una conexión. Reemplaza la lista completa anterior. Para quitar todos, guarda `{"mcpServers": {}}`.
3. Elige Codex o Claude Code y modo **Autónomo** o **Acceso total**. Marca **Usar los MCP configurados aquí en esta tarea**.
4. Describe la tarea. La autorización muestra los servidores adicionales y permite usar sus herramientas durante esa ejecución sin nuevas aprobaciones interactivas de la CLI. Un servidor puede actuar fuera del directorio del proyecto. Acceso total conserva su autorización textual propia.
5. Consulta el registro. Codex registra el servidor, herramienta y estado de sus llamadas estructuradas. Una llamada MCP correcta no acredita compilación, grabación ni funcionamiento físico. Un fallo MCP sin recuperación produce un resultado fallido aunque la CLI salga con código 0.

Al abrir de nuevo el IDE, la lista guardada sigue disponible como configuración de IA; su casilla de uso vuelve a estar desactivada. No se guardan tareas ni código como parte de esta configuración. La configuración propia de la CLI también puede aportar MCP, plugins y políticas; desmarcar esta casilla solo omite los servidores adicionales de MakerIDE.

Ejemplo HTTP de documentación pública (introducirlo no conecta el servidor):

```json
{
  "mcpServers": {
    "documentacion_openai": {
      "url": "https://developers.openai.com/mcp"
    }
  }
}
```

Para un servidor local, usa su ejecutable y argumentos separados:

```json
{
  "mcpServers": {
    "mi_herramienta": {
      "command": "python",
      "args": ["C:/Mis herramientas/servidor_mcp.py"]
    }
  }
}
```

La configuración admite `env` para procesos locales y `headers` para HTTP. Las URLs necesitan HTTPS salvo loopback HTTP; no admiten credenciales, fragmentos ni parámetros de consulta. SSE antiguo, WebSocket y campos específicos de otros clientes no están implementados en este panel. Para esos casos, o para OAuth, utiliza la configuración y autenticación oficial del agente; MakerIDE no implementa un flujo OAuth propio.

## Credenciales y límites

La configuración adicional se guarda en `.makeride-data/ai-settings/mcp.json` (o bajo `AB_MAKERIDE_DATA_DIR`), fuera del proyecto y de los ZIP exportados. Puede contener secretos: protege la cuenta Windows y esa carpeta. No es una caja fuerte cifrada. La respuesta del panel muestra solo nombres y transportes; no devuelve cabeceras, variables ni URLs.

Codex recibe cabeceras y valores de `env` mediante el entorno privado del proceso; estos valores no se insertan en sus argumentos. Dos servidores no pueden definir la misma variable con valores distintos. Claude recibe un JSON temporal privado, fuera de la carpeta del proyecto, que se elimina al finalizar. No pongas claves en los argumentos de un ejecutable ni en su URL. Los valores de cabeceras y variables configurados se ocultan del registro y respuesta de MakerIDE; un agente con acceso a herramientas sigue sujeto a su propia configuración y permisos.

Los servidores explícitos de Codex se marcan como requeridos: si no pueden inicializarse, la CLI debe fallar en lugar de continuar como si estuvieran disponibles. Los modos de solo consulta o edición de MakerIDE no habilitan estos servidores adicionales. No se cambian los archivos globales de Codex/Claude.

## Qué se ha probado

- Configuración, protección del endpoint, guardado, autorización e inicio limpio mediante unidades y Chromium controlado.
- **Codex instalado y cuenta real:** inicialización, descubrimiento y una llamada a una herramienta local stdio; el mismo recorrido mediante Streamable HTTP local con cabecera de autenticación, verificada por el servidor de prueba. Sin hardware ni firmware.
- **Claude Code:** construcción de parámetros y configuración privada comprobadas con pruebas controladas. La CLI no estaba instalada en el equipo de validación; su cuenta, OAuth y ejecución real siguen pendientes.
- No se certifican todos los servidores, plugins, modelos ni políticas de empresa. Un formato válido no demuestra que un servicio responda o que sus credenciales sean correctas.

Referencias: [MCP en Codex](https://learn.chatgpt.com/docs/extend/mcp), [MCP en Claude Code](https://code.claude.com/docs/en/mcp), [OpenAI Docs MCP](https://developers.openai.com/resources/docs-mcp).
