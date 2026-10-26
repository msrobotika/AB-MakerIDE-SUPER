// Advisory inspection of the main source, never proof that an LCD works.
export function reviewDisplayTarget(code, fqbn, profile) {
  if (profile !== 'esp32-cyd-28' && !/jczn_2432s028r/.test(fqbn || '')) return '';
  const source = String(code || '').replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
  if (
    /Adafruit_ILI9341|TFT_eSPI|Arduino_GFX|LovyanGFX|LGFX|\b(?:lcd|tft|display)\s*[.>-]/i.test(
      source,
    )
  )
    return '';
  return /MAKER_TETRIS|Serial\.printf\("STATE/.test(source)
    ? 'Este juego envía la imagen por USB/serie y no inicializa la pantalla CYD. Cargarlo puede dejar la pantalla negra. Usa el ejemplo CYD táctil si quieres jugar en la placa.'
    : 'El destino es una CYD con pantalla, pero no se reconoce un controlador LCD en el archivo principal. Puede estar en archivos auxiliares. Comprueba el código y los pines: compilar y grabar no demuestra que la pantalla vaya a funcionar.';
}
