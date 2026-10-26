# IA, cuentas y cuota gratuita online

MakerIDE es open source; las cuentas y condiciones de IA pertenecen al proveedor. No incluye créditos ni una cuenta compartida. Nunca cambia a un proveedor de pago o a otra cuenta cuando se agota una cuota.

| Opción | Uso en el IDE | Estado |
| --- | --- | --- |
| Codex CLI | Agente con proyecto, herramientas, permisos, MCP y evidencias de comandos | Probado en uso real. La cuenta necesita cuota disponible; una llamada completada no salva un turno que termine por cuota agotada. |
| Claude Code | Adaptador de agente CLI y MCP explícito por tarea | Experimental; ejecución real pendiente. MCP manual bloqueado hasta integrar su protocolo. |
| Google Gemini API | Consulta online y propuesta de código revisable, con clave propia de AI Studio | Gemini Flash y Flash-Lite configurables. Pruebas controladas del contrato y la UI; cuenta real pendiente. No ejecuta MCP ni graba hardware por el conector de chat. |
| Ollama | Propuestas con modelos ejecutados en el equipo del usuario | No requiere un servicio de inferencia de pago; consume recursos locales y necesita instalación/modelos. Validación equivalente pendiente. |
| Plantillas | Ejemplos y ayudas locales | No son IA ni consumen cuota. |

## Gemini con nivel gratuito

La documentación oficial consultada el **26 de octubre de 2026** ofrece nivel gratuito para determinados modelos Gemini. El panel incluye `gemini-3.8-flash` y `gemini-3.5-flash-lite`. La disponibilidad, cuotas y facturación dependen de la cuenta y región; no es una promesa de uso ilimitado ni de que cualquier modelo sea gratuito. El IDE no puede conocer por sí solo el plan de facturación de una clave.

En **Proveedor → Gemini online**, el usuario obtiene su propia clave desde AI Studio, elige un modelo, configura y prueba la conexión. La clave del conector permanece en memoria del servidor. El código solo se adjunta cuando el usuario lo permite. El nivel gratuito puede utilizar contenidos para mejorar productos de Google según sus términos; revisa las condiciones antes de enviar proyectos privados.

Fuentes: [precios y nivel gratuito](https://ai.google.dev/gemini-api/docs/pricing), [obtener una clave](https://aistudio.google.com/apikey).

## Experiencia de agente y evolución

La dirección del producto es una experiencia de trabajo con chat, archivos editables, contexto de la placa, decisiones revisables y resultados de herramientas. Una ventana de chat que devuelve un sketch no equivale a ese recorrido completo. Codex es el recorrido de agente validado actualmente; no se anuncia la misma cobertura para las otras integraciones.

Gemini CLI también ofrece un nivel gratuito vinculado a la autenticación del usuario, según sus [cuotas oficiales](https://geminicli.com/docs/resources/quota-and-pricing/). Integrarlo como agente completo exige un adaptador, aprobaciones, cancelación, manejo de cuota y pruebas reales; aún no forma parte de los agentes ejecutables de esta entrega. No se instala ni autentica silenciosamente al elegir Gemini API.
