# Herramientas MCP y permisos en MakerIDE RC4

**Nuevo catálogo opcional:** [REA y candidatos MCP Maker](CATALOGO_MCP_MAKER.md). Añadir REA fusiona la plantilla sin alterar los demás MCP, pero no instala ni ejecuta el paquete ni modifica la cuenta personal de Codex. Otros servidores son solo candidatos documentados.

El panel admite **stdio** y **Streamable HTTP**. La conexión la establece el cliente MCP de Codex CLI o Claude Code, con la cuenta del usuario; seleccionar cualquier modelo de chat no le aporta ejecución MCP. La IA y sus herramientas no incluyen cuota gratuita de MakerIDE.

## Configurar y ejecutar

1. Pega una configuración estándar `mcpServers` y pulsa **Guardar conexiones**. Valida el formato; no descarga, arranca ni comprueba los servidores. Reemplaza la lista completa; `{ "mcpServers": {} }` la vacía.
2. Selecciona Codex y Autónomo o Acceso total. Marca **Usar los MCP configurados aquí en esta tarea**. Esta casilla y la de aprobación automática empiezan desactivadas en cada apertura.
3. Con **aprobación manual** (predeterminada), Codex utiliza su app-server. La solicitud aparece en el IDE con servidor, descripción, argumentos y opciones disponibles. Revisa y pulsa **Autorizar esta vez** o **Rechazar**. No se concede aprobación para el resto de la sesión. Las respuestas caducadas o repetidas se rechazan.
4. Si eliges **aprobar automáticamente**, la autorización inicial lo advierte y los MCP adicionales pueden actuar sin nuevas preguntas durante esa ejecución. Su alcance puede salir del proyecto: el permiso del MCP depende de su servidor y sus credenciales. Acceso total conserva además su confirmación textual.
5. El registro conserva servidor/herramienta/estado de llamadas Codex. Una llamada MCP correcta no acredita compilación ni hardware. Un error de herramienta sin recuperar impide declarar éxito.

**Claude Code sigue experimental.** Su modo MCP manual se bloquea antes de iniciar porque su protocolo de aprobaciones no está integrado. Puede seleccionarse su aprobación automática por tarea de forma explícita; la CLI, cuenta y ejecución real de Claude aún requieren validación. No se presenta como equivalente al recorrido probado de Codex.

Los formularios MCP con campos o flujos URL que no están implementados se rechazan sin enviar datos. No se automatizan inicios de sesión OAuth. Las solicitudes de permisos desconocidas se rechazan; no se amplía acceso por una respuesta genérica. Los argumentos excesivamente grandes para revisión tampoco se autorizan truncados.

Ejemplo local (el ejecutable debe existir y ser de confianza):

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

HTTP admite `url` y `headers`; stdio admite `command`, `args` y `env`. HTTPS es obligatorio excepto HTTP loopback. No se admiten secretos en URL, fragmentos o parámetros de consulta. No pongas claves en los argumentos. SSE antiguo y WebSocket no están implementados en este panel. La configuración propia de las CLI puede añadir herramientas, plugins y políticas: desmarcar la casilla de MakerIDE solo omite sus servidores adicionales, sin cambiar los archivos globales del usuario.

## Almacenamiento de secretos

| Sistema | Persistencia |
| --- | --- |
| Windows | DPAPI vinculado al usuario que ejecuta MakerIDE. `.makeride-data/ai-settings/mcp.json` contiene un sobre cifrado, no los tokens. No es un cifrado compartido entre todos los usuarios del equipo. |
| Linux/macOS con llavero compatible | La configuración vive en el llavero; el archivo guarda una referencia. Se admiten los backends de sistema de `keyring` para Keychain, SecretService o KWallet, no alternativas en texto plano. Puede requerirse desbloquear el llavero. |
| Sin llavero seguro | La configuración nueva permanece solo en RAM y el panel informa de que no se conservará al reiniciar el servidor. No se crea un archivo en claro como alternativa. |

Una configuración antigua en texto plano se migra en su lugar al abrirla si hay un almacén seguro, sin crear otra copia en claro. Sin almacén, se conserva el archivo original y se bloquea su uso con un mensaje de migración; no se carga silenciosamente ni se elimina. El cifrado no puede retirar copias antiguas que el usuario haya guardado en otro lugar.

Codex recibe valores sensibles en el entorno del proceso, no en sus argumentos. El JSON temporal de Claude contiene `${AB_MCP_...}` y los valores reales viajan por el entorno del hijo. Se crea fuera del proyecto, con `0600` en POSIX, y se retira al terminar. En Windows, `chmod` no equivale a una ACL POSIX; la protección persistente de los valores la aporta DPAPI. Los registros del IDE ocultan los secretos configurados. Un proceso o agente con los mismos permisos del usuario sigue pudiendo acceder a su entorno o a su cuenta: esto no es aislamiento de código hostil.

## Validación y límites

- Unidades y Chromium: política manual por defecto, selección automática explícita, aprobación de un solo uso, rechazo de repetición, texto hostil inerte, migración y ausencia de valores en el JSON temporal.
- Windows real: cifrado/descifrado y migración DPAPI. Los llaveros POSIX se prueban con dobles controlados, no como validación física de todos los escritorios Linux/macOS.
- Codex instalado/cuenta real: MCP stdio, descubrimiento y una llamada autorizada manualmente con marcador de respuesta. HTTP con autenticación fue probado en RC3; no se presenta como un nuevo ensayo manual HTTP de RC4.
- Claude: construcción de configuración controlada; ejecución real pendiente. Sin hardware ni firmware en estas comprobaciones.

Referencias: [Codex app-server](https://learn.chatgpt.com/docs/app-server), [MCP en Codex](https://learn.chatgpt.com/docs/extend/mcp), [MCP y expansión de entorno en Claude](https://code.claude.com/docs/en/mcp), [DPAPI](https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptprotectdata), [keyring](https://keyring.readthedocs.io/en/latest/).
