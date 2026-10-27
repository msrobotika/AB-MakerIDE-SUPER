# Evidencia y semáforo de entrega

- Primer intento técnico: `40511176554` produjo un ejecutable e instalador
  en Windows, pero el smoke test **FALLÓ** al resolver la ruta de instalación
  con espacios. No es un instalador apto para distribuir.
- Corrección: el argumento Inno `/DIR` ahora pasa la ruta citada.
- Controles definitivos deben consultarse en un run posterior y en el
  comprobador `Comprobaciones` (Windows/Linux/macOS/Chromium) del SHA
  exacto; sin ellos no procede liberar asset público.
- La preservación se audita con un archivo centinela independiente del
  directorio de instalación. No equivale a probar un firmware en MCU.
