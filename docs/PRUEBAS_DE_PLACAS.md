# Pruebas de mis placas

Abre **Herramientas → Pruebas de mis placas**. Pon un nombre que te ayude a distinguir cada placa o revisión, elige qué has observado y añade las condiciones de la prueba: pantalla, alimentación, versión del núcleo y resultado esperado. Pulsa **Guardar prueba actual**.

Guardar una prueba consulta el resultado de compilación/grabación disponible y guarda un registro local. No compila, graba, abre serie, ejecuta IA ni identifica automáticamente la placa. El nombre, modelo y puerto seleccionados son datos declarados, no una firma del dispositivo.

## Qué conserva

- Fecha, nombre que has dado a la placa, modelo y puerto seleccionados.
- SHA-256 del archivo principal que había en el editor y referencia del proyecto auxiliar, si existe. El hash no describe por sí solo todos los auxiliares ni el binario completo.
- Referencia, acción, salida y estado del último trabajo Arduino recuperado del servidor.
- Tu observación, atribuida al usuario: sin comprobar, funciona o falla. Nunca se completa automáticamente porque el compilador o el grabador terminaran correctamente.

La compilación con salida 0 se registra como compilación, sin acreditar carga. La grabación con salida 0 solo se atribuye a la selección actual cuando coinciden revisión, FQBN, proyecto auxiliar y puerto. Si cambiaste el código o el destino, se indica que el resultado corresponde a otra selección. Si el resultado antiguo no contiene puerto, no se atribuye a una carga nueva. Una interrupción, cancelación o error no se transforma en éxito. Si el trabajo ya no existe o el servidor no responde, puedes conservar la observación manual con estado «resultado no recuperable», sin inventar evidencia de herramienta.

En esta primera versión la recuperación automática de resultados corresponde a los trabajos Arduino de los botones del IDE. No extrae resultados de MicroPython ni de comandos ejecutados por una CLI de agente: puedes registrar observaciones manuales, pero no se les inventa evidencia de compilación/carga. El cuaderno es local y editable, no una certificación ni un registro firmado.

## Conservación

**Exportar cuaderno** descarga JSON con todos los registros y su procedencia. Se conservan hasta 100 pruebas en este navegador y origen, sin borrar automáticamente las antiguas. No incluye el sketch ni todo el registro de herramientas; guarda también tu proyecto y sus logs cuando necesites reproducir una prueba. La importación del cuaderno queda pendiente.

Si el almacenamiento está dañado, el guardado se bloquea y la exportación conserva su contenido original. Si otra pestaña lo modificó desde que lo abriste, se pide cerrar y reabrir el cuaderno antes de guardar. Exporta antes de borrar los datos del navegador o cambiar de puerto del servidor.

## Cuentas de IA

Cada usuario debe vincular su cuenta con el proveedor que elija y asumir sus cuotas y consumo. MakerIDE es abierto bajo MIT; no incluye saldo ni suscripciones de IA. Codex está probado en uso real por el autor. Las demás integraciones siguen pendientes de validación equivalente. «CLI instalada» no significa «cuenta conectada» ni «cuota disponible».
