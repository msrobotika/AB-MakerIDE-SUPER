# Plan

1. Revisar la interfaz y el contrato existente de servidor de sesiones, eventos y evidencias.
2. Diseñar panel original MS ROBOTIKA con fases verificables, acciones y lectura de sesión, sin copiar marcas ni estilos ajenos.
3. Añadir módulo de observación JS con funciones puras y DOM seguro (textContent), UI en rail, CSS responsive.
4. Conectar al ciclo de vida existente `start/poll/recover/cancel` sin crear rutas nuevas ni duplicar permisos; mantener la identidad del job.
5. Añadir tests Node de ausencia de evidencias inventadas y pruebas Chromium sobre worker controlado.
6. Incluir documentación de uso, limitaciones, gate Spec Kit y actualizar SHA-256.
7. Publicar en PR: integrar solo con CI verde; **ninguna Release nueva**.

Seguridad: salida de CLI tratada como texto no confiable. Evitar innerHTML, datos de proveedor externo se muestran como registros limitados; secretos en servidor ya sujetos a redacción. Reinicios, interrupciones y error de red no deben interpretarse como éxito.
