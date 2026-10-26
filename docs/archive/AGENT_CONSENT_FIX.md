# Corrección de autorización del agente · 25 de octubre de 2026

El usuario confirmó que el agente inicia tras cerrar la instancia anterior v0.9.7 y arrancar desde la carpeta nueva. No se ha reiniciado ni sustituido su proceso durante este cierre del diagnóstico.

También se observó directamente en la consola del navegador integrado el error `prompt() is not supported` en la autorización de acceso total, antes de enviar la solicitud al servidor. Se sustituye la secuencia de ventanas nativas por un diálogo del IDE con la tarea, el nivel de permisos y un campo visible para ACCESO TOTAL. Se mantiene la validación exacta en el servidor y no se amplían los permisos por defecto.

Verificación: 13 comprobaciones Chromium correctas contra el controlador HTTP real y un trabajador CLI simulado. Se comprueban entrada vacía/incorrecta, cancelar, Escape, consentimiento nuevo por tarea, entrada exacta, envío único, modo de lectura y vista móvil. Las funciones nativas confirm/prompt se configuran para lanzar error durante esta regresión. No se lanzó el agente real del usuario ni se ejecutó su tarea de hardware. La suite existente terminó con 189 pruebas, 185 correctas y 4 omitidas por falta de g++; sintaxis JavaScript correcta.

La corrección queda en la carpeta nueva AB-MakerIDE-SUPER-v1.0.0-rc.1, rama release-v1-local. El paquete ZIP anterior conserva sus bytes; la corrección es posterior al paquete. Evidencias controladas en docs/evidence/agent-consent, y prueba reproducible en tests/browser_agent_consent.py.
