> **DOCUMENTO HISTÓRICO (0.9.2).** No seguir sus instrucciones de versión, puerto ni instalación en la RC4. Véase [documentación vigente](../README.md).

# Guía rápida — AB MakerIDE 0.9.2

## Abrir

1. Exporta los proyectos de la v0.9.1 antes de cambiar.
2. Detén el servidor anterior (`Ctrl+C` en su propia ventana).
3. Descomprime esta carpeta **sin sobrescribir** versiones antiguas.
4. Ejecuta `INICIAR_WINDOWS.bat`.
5. Verifica http://127.0.0.1:8765/api/health → `version: 0.9.2`.

## Usar Arduino Uno clónico CH340

1. Conecta solamente el Uno por USB de datos.
2. Pulsa ↻ en la barra superior.
3. Selecciona `Arduino UNO R3` aunque el puerto aparezca como CH340/Unknown.
4. Selecciona COM4, o el que Windows haya asignado **realmente**.
5. Pulsa **Compilar**. Si no hay errores, **Compilar y grabar** (sustituye el firmware que hubiera).
6. LED `L` debe parpadear con el ejemplo inicial si la grabación es exitosa.

## Consola grande

- Arrastra hacia arriba la barra fina horizontal situada sobre **Consola**.
- `⤢ Ampliar` ocupa el máximo disponible; `↙ Restaurar` recupera la altura anterior.
- Doble clic sobre el separador también alterna.
- Con foco sobre el separador: ↑ ↓ para ajustar; Mayús acelera; Inicio reduce; Fin maximiza.
- Atajo: `Ctrl+Alt+T`.
- La altura elegida queda guardada para el próximo arranque del mismo navegador.

## Interfaz menos cargada

- Placa/COM en la barra superior, sin visitar ajustes.
- Iconos de la izquierda abren u ocultan el explorador/placas/librerías.
- IA, simulación y laboratorio solamente al pulsar sus botones.
- La alerta de librerías se abre cuando hay advertencias relevantes.
- Botón `?` muestra instrucciones básicas.

## Atención

El campo `IDE>` de la consola ejecuta comandos **guiados** (`help`, `ports`, `cores`, `install avr`...) y no es una shell de PowerShell completa. Codex puede ejecutar comandos a través de su propia CLI bajo el nivel de permisos concedido, no mediante ese campo.
