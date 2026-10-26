# Research · 2026-10-26

## Decision: Adopción brownfield oficial

Usar Specify CLI 1.2.3, etiqueta estable del repositorio github/spec-kit.
La [guía oficial](https://github.github.com/spec-kit/guides/existing-projects.html)
recomienda base revisable, inicialización en el sitio y una mejora acotada.
Se creó una rama desde c138649 antes de inicializar. La alternativa de reescribir
las especificaciones de todo el IDE se descarta: falsearía el historial y retrasaría
la mejora verificable solicitada.

## Decision: Proceso obligatorio, ejecución de IA separada

Se instalaron skills oficiales Codex y scripts Python con la CLI. El agente actual
ejecuta las etapas leyendo estas skills y escribiendo/revisando sus artefactos;
no se lanza otro Codex ni un workflow que consuma cuota. No hay extensiones ni
eventos nativos automáticos. Las instrucciones globales se guardan en la configuración
del equipo según la [guía de OpenAI](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
No se garantiza su aplicación en otros equipos que no carguen esa configuración.

## Decision: Consistencia y cobertura en CI

Un control propio de biblioteca estándar comprueba expedientes cerrados y contenido
verificado. No es una función oficial de Spec Kit ni un auditor semántico. El registro
compartido vive en memory/quality-gate.json: el puntero feature.json de upstream es
estado local y permanece ignorado. Las evidencias históricas no se reinterpretan.

## Decision: Referencias y cambios

Los hashes se comprueban solo para la mejora activa. La comparación usa una base Git
explícita de CI; sin base se verifica el expediente pero se declara ese límite.
Solo se gobiernan archivos técnicos fuera de scaffolding oficial y expedientes.
Documentación y manifiesto conservan revisión humana e integridad existente.
Un enlace, ruta absoluta o salida del repositorio se rechaza antes de leer referencias.
Las especificaciones nunca se ejecutan como código.

No quedan incógnitas de diseño. No se afirma que el vídeo adjunto sea documentación
oficial ni se copia su contenido al producto; se contrastó con las fuentes primarias.
