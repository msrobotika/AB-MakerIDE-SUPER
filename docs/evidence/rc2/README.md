# Regresiones de RC2

Validación local del código RC2 en Windows, Python 3.13.7. Suite aislada: 258 casos, 254 correctos, cuatro omitidos (tres necesitan g++; uno necesita privilegios para enlaces simbólicos). Sin puertos físicos en estas regresiones.

Chromium y servidor HTTP local reales, con respuestas de identidad, agentes y transporte controladas:

| Flujo | Comprobaciones correctas | Registro |
| --- | ---: | --- |
| Identificación, elección manual, reconexión y código conservado | 19 | [JSON](identificacion.json) |
| Proyectos/agente, permisos y recuperación | 38 | [JSON](agente.json) |
| Recuperación y fallos del transporte serie | 21 | [JSON](recuperacion.json) |
| Simulador de secuencias digitales | 26 | [JSON](simulador.json) |

La selección manual se prueba durante el intervalo periódico de 12 segundos, con varios COM y con una respuesta de chip retenida mientras se cambia de puerto y se vuelve al original. El resultado tardío no debe sobrescribir el perfil. También se comprueba que cambiar de modelo no quite las opciones COM existentes.

Estas pruebas no ejecutan una IA real ni graban placas. La [observación de CYD física](../cyd/README.md) se registra por separado. GitHub Actions ejecuta unidades en Windows/Linux y estos cuatro flujos de navegador en Linux; su resultado publicado se consulta en Actions y no acredita hardware de esos sistemas.
