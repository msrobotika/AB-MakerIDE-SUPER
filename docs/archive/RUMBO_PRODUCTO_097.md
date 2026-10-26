> **DOCUMENTO HISTÓRICO (0.9.7).** No seguir sus instrucciones de versión, puerto ni instalación en la RC4. Véase [documentación vigente](../README.md).

# Rumbo del producto — criterios antes del plan maestro

Esto **no es el plan definitivo de ejecución**; son los principios resultantes de la investigación que servirán para construirlo y estimarlo después de validar la v0.9.7 físicamente.

## Regla de diseño

1. Un objetivo por pantalla. Editor protagonista; placa, puerto, compilar y grabar siempre accesibles. Funciones secundarias ocultas hasta solicitarse.
2. Cero falsas confirmaciones: agente concluido ≠ compilación correcta ≠ firmware verificado ≠ comportamiento físico comprobado.
3. Identidad de placa honesta: USB VID/PID identifica interfaz o familia cuando hay evidencia, nunca un clon inequívocamente sin pruebas.
4. Datos locales primero: proyecto exportable, respaldo fácil, no requerir nube, cuentas ni créditos para compilar o grabar.
5. IA opcional y revocable: modos de permisos granulares, revisión del diff, logs y copia del proyecto. Acceso total jamás por defecto.
6. Rendimiento medido, no promesas: catálogos paginados, procesos cancelables, memoria acotada y pruebas de interfaz.
7. Simulación auténtica o limitación explícita: nada de representar como firmware real una lógica animada.

## Criterios medibles para el próximo plan

- Usuario nuevo: conectar una placa reconocida y compilar Blink sin entrar en PowerShell (se debe medir tasa de éxito y tiempo en Windows).
- Portabilidad: proyecto exportable y reproducible con descripción de FQBN, núcleo, bibliotecas y versiones.
- Recuperación: cerrar la interfaz o el servidor durante una tarea no puede convertirla en éxito ni perder la referencia a archivos salvados.
- Evidencia: build y flash con códigos de salida, artefactos y verificación externa; vista compacta y registros técnicos ampliables.
- Accesibilidad y mantenimiento: navegación por teclado, contrastes, pruebas de frontend, arquitectura modular.
- Diversidad de placas: AVR, ESP32 clásica, ESP32-S3, RP2040 y MicroPython con matrices de soporte verificadas por dispositivo.

## Priorización tentativa para debatir después

**P0 (fiabilidad de base):** catálogo/USB, detección de herramientas, empaquetado Windows, recuperación robusta, flujo real de compilación y grabación.

**P1 (usabilidad):** selector por dispositivo, primer proyecto asistido, documentación contextual, búsqueda global, modo sencillo/experto opcional.

**P2 (plataforma):** proyectos multiarchivo y dependencias reproducibles, monitor serie+plotter, depuración compatible con hardware, asistentes con resultados trazables.

**P3 (producto diferencial):** laboratorio de periféricos, simulación real por objetivo, generadores inteligentes auditables y extensión abierta.

Ninguna de estas prioridades es todavía un compromiso de entrega; se verificará qué funciona en el hardware del usuario y qué requiere nueva arquitectura antes de aprobar el plan.
