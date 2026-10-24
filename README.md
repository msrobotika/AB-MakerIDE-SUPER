# AB MakerIDE SUPER v0.9.7 — MS Robotika

**Objetivo:** un IDE open source para hardware real, claro para principiantes y útil para perfiles avanzados. **No se presenta como el mejor del mercado ni como versión estable**: esta entrega es una mejora incremental sobre v0.9.6 y sigue necesitando pruebas físicas en Windows.

## Novedades verificadas

1. **Buscador de placas paginado**: consulta los modelos instalados con `/api/board-catalog/installed?query=esp32&page=1&limit=40`. Hasta 50 resultados por petición, filtrado y paginado en el servidor. El desplegable superior presenta la placa elegida y las placas reconocidas relevantes, en lugar de miles de modelos.
2. **Búsqueda separada en Boards Manager**: tras escribir al menos dos caracteres, pulsa «Buscar también en gestor de placas». Consulta `arduino-cli board search` con parámetros sin shell, devuelve como máximo 40 resultados por página y no instala nada sin autorización. La búsqueda en el equipo no depende de que Boards Manager funcione.
3. **Arreglo del límite de 8 MB**: Arduino CLI puede responder con un JSON mayor; el umbral de seguridad de lectura se amplía a 48 MB y se añaden pruebas con una respuesta de más de 8 MB. Si el resultado excede 48 MB, se informa del límite y no se declara que existan cero placas. Se mantiene la recuperación `boards.txt` cuando falla la enumeración instalada.
4. **Selección prudente del dispositivo**: la pantalla no confunde el conversor USB CH340 con una identificación inequívoca de Arduino Uno. El puerto COM y el modelo son dos selecciones independientes. Se conserva la asociación manual confirmada.
5. **Interfaz más sencilla**: los accesos menos frecuentes «Simulación lógica» y «Conexiones GPIO» se agrupan en «⋯ Herramientas». Permanecen visibles «Compilar» y «Compilar y grabar».
6. **Aviso de destino equivocado**: si el ejemplo inicial es para Arduino Uno y eliges otra placa, aparece un aviso contextual. «Preparar sketch básico» pide permiso, conserva copia del código anterior en el almacenamiento local y crea una plantilla neutra para el FQBN seleccionado; no asigna GPIO de forma imaginaria.

El editor, la compilación y grabación reales mediante Arduino CLI, el monitor serie, los espacios de trabajo y la integración opcional con Codex/Claude se mantienen de v0.9.6. La herramienta de «Simulación lógica» **no ejecuta firmware real**, y una tarea Codex «finalizada» **no confirma** que el firmware haya sido grabado o que la pantalla funcione.

## Instalación desde v0.9.5/0.9.6

1. **Exporta tu proyecto** en la versión actual (archivo `.abmaker.json`). Cierra el servidor anterior con `Ctrl+C`.
2. Descomprime el ZIP **en otra carpeta**. No sobrescribas tu versión anterior.
3. Ejecuta `INICIAR_WINDOWS.bat` en Windows 11. Requiere Python 3.10+ y Arduino CLI accesible mediante `PATH`. Las dependencias Python están en `requirements.txt`.
4. Verifica `http://127.0.0.1:8765/api/health`: debe decir `0.9.7`. Si se ve otra versión, sigues ejecutando el servidor antiguo.
5. Conecta la placa y revisa el puerto COM. Pulsa «⌕ Placas», busca `Uno` o `ESP32` y elige un modelo **de los núcleos instalados**. Si no aparece, consulta Boards Manager; revisa el núcleo antes de aceptar su instalación.
6. Si pasas de Uno a ESP32 y el editor conserva el código de bienvenida de Uno, pulsa «Preparar sketch básico» **solo si quieres reemplazarlo**. Compila antes de grabar.

### API del catálogo (para diagnósticos)

- `GET /api/boards`: puertos físicos, selección inicial **limitada a 60 opciones** y `catalog_count` total. Para solicitar que se incluya un FQBN instalado concreto en el resultado inicial: `/api/boards?selected=esp32:esp32:esp32`.
- `GET /api/board-catalog/installed?query=ESP32&page=1&limit=40`: busca en los núcleos instalados, incluso si el catálogo es grande.
- `GET /api/board-catalog/search?query=ESP32&page=1&limit=40`: consulta otros modelos en Arduino Boards Manager si el índice local está disponible.
- `page` debe ser positivo; `limit` de 1 a 50. No hay instalación automática de núcleos.

## Estado de pruebas

- **171 pruebas automatizadas correctas** (incluidos cinco casos nuevos sobre paginación, respuesta JSON grande, selección segura y salida de frontend).
- JavaScript: `node --check app.js` correcto; Python: `compileall` correcto.
- Chromium aislado: se probaron 602 modelos **sintéticos**, 40 resultados por página, navegación, elección explícita de ESP32, conservación de COM4, aviso de sketch incorrecto y cambio a plantilla con respaldo. Sin errores JavaScript.
- HTTP local: la versión `/api/health` fue consultada en servidor real. El navegador del entorno de pruebas bloquea la navegación directa a localhost; la prueba visual se realizó con HTML aislado y respuestas simuladas.
- **No se ha probado** esta versión con tu Arduino CLI de Windows, Uno físico, IdeaSpark ni un dispositivo de cámara. No se ha validado un emulador ESP32 real.

Consulta `docs/AUDITORIA_097.md` para el detalle, `docs/COMPARATIVA_IDES_2026.md` para la investigación y `docs/RUMBO_PRODUCTO.md` para principios y criterios de aceptación. No se ha publicado en GitHub.

Licencia del código de MakerIDE: MIT. Las marcas, bibliotecas, núcleos, herramientas externas y simuladores de otros fabricantes conservan sus propias condiciones de uso.
