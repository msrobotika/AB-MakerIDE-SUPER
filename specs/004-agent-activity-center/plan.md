# Plan

1. Contrastar conceptos generales de herramientas de agentes de mercado con documentación oficial, sin copiar aspecto visual ni comportamiento propietario.
2. Separar un reductor puro, con límite de 70 eventos y texto corto, de una vista DOM accesible de estilo propio.
3. Conectar start, poll, log, recuperación y errores con las funciones existentes del agente. No tocar el backend de permisos ni crear nuevos endpoints.
4. Crear pestaña en barra izquierda que mantenga editor y panel derecho; acciones reusan UI existente.
5. Añadir pruebas unitarias y de navegador, con captura del caso controlado y sin afirmar funcionamiento de CLI real.
6. Documentar limitaciones, prueba, privacidad y observación de hardware; compilar entregable en rama PR, sin crear Release ni modificar archivos de distribución RC4.

No se envían archivos nuevos a modelos, ni se habilita consentimiento automático. El reductor conserva solo eventos en memoria mientras esté abierta la pestaña.
