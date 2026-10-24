# AB MakerIDE SUPER 1.0.0-rc.1 · MS Robotika

IDE local para Arduino C++ y MicroPython, sobre la base v0.9.7. **Candidato de lanzamiento; no versión estable.** Se han verificado el catálogo y la compilación real en Windows. Falta validar grabación y funcionamiento físico del hardware con autorización.

## Arranque en Windows

1. Conserva la carpeta anterior. No sobrescribas v0.9.5 ni tus proyectos.
2. Ejecuta `INICIAR_WINDOWS.bat` (Python 3.10+). Usa **http://127.0.0.1:8770**, dejando libre de cambios el servidor anterior de 8765.
3. `/api/health` debe devolver `1.0.0-rc.1`. Arduino CLI se busca en PATH y en `C:\Program Files\Arduino CLI`. Para una ruta específica, define `AB_MAKERIDE_ARDUINO_CLI` antes de arrancar. El servidor no cambia PATH ni configuración global.
4. Elige **modelo** y **puerto** por separado. «Placas» busca los modelos instalados, en páginas de 40. CH340 y CP210x identifican un conversor USB, nunca prueban el modelo de placa. Una sugerencia de la CLI no reemplaza tu modelo.
5. Pulsa **Compilar** y revisa la consola. La grabación y el monitor serie son acciones independientes que requieren intervención explícita; no se han ejercitado contra hardware en esta entrega.

Arranque directo: `python server.py --no-browser --port 8770`. Linux/macOS: `./iniciar_linux_mac.sh`. Las funciones serie/MicroPython usan las dependencias opcionales de `requirements.txt`; no hacen falta para abrir el editor ni para Arduino CLI.

## Robot y resultados

El robot SVG local lleva antena, ojos, brazos y distintivo MS. También informa con texto accesible, sin depender del color. Respeta «reducir movimiento».

| Estado | Significado |
| --- | --- |
| Neutro | Reposo, cancelación, interrupción o resultado sin verificar |
| Ámbar pulsante | Hay tareas en curso; no se inventan porcentajes de compilación |
| Verde | Resultado concreto verificado: compilador/grabador con salida 0, CLI de agente con salida 0 y registro, o comprobación de sintaxis Python |
| Rojo | Fallo de herramienta o consulta de red; un resultado desconocido no se convierte en éxito |

El éxito del agente **solo confirma la finalización de su CLI**. No prueba compilación, grabación ni funcionamiento físico. Una tarea pendiente impide el verde global; un fallo no desaparece por el éxito de otra tarea. Al editar o cambiar placa se invalida la compilación anterior. Los resultados incluyen FQBN y SHA-256 de la revisión compilada.

## Recuperación y compatibilidad

- Los dos archivos, nombre, FQBN y puerto conservan la clave compatible `ab-makeride-project-v2`. Se guarda al editar y al abandonar/recargar la página. Un puerto desconectado permanece como referencia sin confirmar su presencia.
- Cada origen del navegador tiene su almacenamiento: **8770 no puede leer automáticamente los proyectos de 8765**. Exporta `.abmaker.json` en la versión anterior e impórtalo aquí. No se accede a perfiles de navegador existentes.
- El launcher y el servidor usan `.makeride-data` dentro de esta carpeta. `AB_MAKERIDE_DATA_DIR` permite elegir otra carpeta. Para recuperar sesiones antiguas, copia primero su carpeta `AgentWorkspaces` a ese directorio de datos; no es necesario modificar el original.
- `BuildSessions/<id>` conserva `sketch.ino`, destino y registro de compilación. La referencia se guarda antes del POST; repetir la misma referencia no ejecuta otra operación. «Recuperar compilación» consulta el resultado; nunca repite una grabación.
- Tras reiniciar, una tarea que figuraba activa se presenta como interrumpida y con resultado desconocido. La lectura de sesiones antiguas no reescribe sus archivos. Los registros antiguos sin `exit_code` no encienden el verde del agente.
- Si otra pestaña cambia el proyecto, se pausa el guardado para evitar sobrescribirla: exporta la copia que quieras conservar antes de recargar. Un almacenamiento dañado también pausa el guardado y conserva el valor original. No borres datos del navegador sin exportar.

## Verificación reproducible

`python tests/run_isolated.py` ejecuta toda la suite en datos temporales. `node --test tests/robot_status.test.cjs` verifica los estados del robot. No se necesita cuenta de IA ni placa para estas regresiones. Los uploads de tests están aislados con mocks.

La aceptación visual utiliza Playwright/Chromium con un servidor HTTP real, un perfil propio y directorios temporales. Instalación opcional, siempre local:

```powershell
python -m venv C:\ruta\work\test-venv
C:\ruta\work\test-venv\Scripts\python.exe -m pip install playwright==1.56.0
$env:PLAYWRIGHT_BROWSERS_PATH='C:\ruta\work\browsers'
C:\ruta\work\test-venv\Scripts\python.exe -m playwright install chromium
C:\ruta\work\test-venv\Scripts\python.exe tests/browser_acceptance.py --work C:\ruta\work\acceptance-nueva --outputs C:\ruta\outputs --port 8770
```

Usa un directorio de aceptación nuevo y un puerto libre. Esta prueba compila con los núcleos instalados, bloquea operaciones reales de grabación/serie/agentes y distingue sus escenarios interceptados. Auditoría de solo lectura: `python tests/audit_real_arduino.py --output C:\ruta\outputs\arduino-audit.json`.

Resultados, capturas, cambios y pendientes: [informe RC1](docs/RELEASE_RC1.md), [evidencias](docs/evidence/README.md). Los informes v0.9.x son históricos y no sustituyen esta verificación. No se ha hecho push, publicación ni PR.

Licencia MIT para MakerIDE. Marcas, herramientas, núcleos y bibliotecas externas mantienen sus propias licencias.
