# Guardar y reutilizar el código del agente

Al terminar una tarea correctamente, el código generado se abre en el editor si está activada la opción «Abrir código generado al terminar» y el código inicial sigue intacto. Primero se guarda una copia del código anterior. Si editaste mientras trabajaba el agente, el editor conserva tus cambios y puedes revisar las diferencias y usar «Abrir último código» cuando quieras. Si no se puede guardar el respaldo, la sustitución se detiene. Se conservan las siete últimas copias en el almacenamiento local del navegador.

## Guardado

- **Guardar proyecto (.zip)** descarga el sketch y sus archivos auxiliares, por ejemplo radar_config.h. El ZIP usa una carpeta sketch/ con sketch.ino para Arduino y añade los datos declarados del destino; esos datos no prueban la identidad de la placa. Es la opción adecuada si el agente creó varios archivos.
- **Guardar solo sketch** descarga el archivo .ino o .py que propuso el agente. Puedes volver a abrirlo con **Importar**. Un sketch que incluya cabeceras propias necesita también sus archivos auxiliares.
- **Exportar**, en el panel de proyecto, conserva el formato .abmaker.json compatible con el IDE para los dos archivos del editor y la selección de placa. Los auxiliares se conservan mediante el ZIP del agente.

El importador abre .abmaker.json, .ino y .py. No importa ZIP: para usarlo en Arduino IDE, descomprímelo y abre sketch/sketch.ino. En MakerIDE, la sesión del agente conserva los auxiliares para continuar y compilar mientras su carpeta de datos siga disponible. La copia ZIP permite conservarlos fuera de esa carpeta.

## Continuidad

Las siguientes tareas del mismo proyecto copian los auxiliares a una nueva sesión, junto con la versión actual del archivo principal que tienes en el editor. Las sesiones originales se mantienen. «Compilar» y «Compilar y grabar» también reciben esos auxiliares, evitando perder una cabecera que creó el agente. Una importación, un proyecto nuevo o un ejemplo desvinculan los auxiliares del proyecto anterior.

La recuperación después de reiniciar necesita la misma carpeta de datos. Si una sesión ya no está disponible, se informa del error al guardar o compilar; no se reconstruyen sus auxiliares a partir del sketch. No borres .makeride-data sin guardar tus proyectos.

Se exportan hasta 128 archivos y 8 MB en un máximo de 64 carpetas. Se omiten carpetas ocultas, cachés y compilaciones, enlaces, binarios y nombres reservados para credenciales o copias internas. Si se supera un límite se muestra un error, sin entregar silenciosamente un proyecto incompleto. Antes de continuar mediante una CLI externa se comprueban posibles credenciales en los auxiliares de texto.

## Radar IdeaSpark

«Abrir radar IdeaSpark» coloca en el editor el ejemplo de archivo único y selecciona ESP32 Dev Module. La pantalla ST7789 usa MOSI 23, SCLK 18, CS 15, DC 2, RST 4 y retroiluminación 32; resolución 135x240 y rotación 1. Se recuperó del proyecto Salto Robot que el usuario confirmó para su placa.

El radar se compiló y cargó en COM4 con autorización explícita y verificación del grabador. El usuario confirmó que lo ve en pantalla. Los cuatro ecos son simulados: no hay medición de distancias. [Evidencia de la grabación y confirmación](evidence/radar-ideaspark/README.md).

## Verificación de esta mejora

197 pruebas unitarias correctas y 4 omitidas por falta de g++; 26 comprobaciones de interfaz correctas. [Capturas y alcance de las pruebas](evidence/agent-projects/README.md). Se volvieron a comprobar los 711 archivos de proyectos originales: ninguno cambió ni falta.

La copia ejecutada del servidor debe incluir las capacidades agent-project-export, agent-project-continuation y agent-editor-open en /api/health. Una pestaña abierta contra un servidor anterior necesita reiniciar el servidor desde esta carpeta y recargar la página para activar las nuevas funciones.
