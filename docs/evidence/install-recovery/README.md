# Instalación y recuperación · revisión local de RC1

25 octubre 2026. Las fuentes de ejecución se vinculan por SHA-256 en validation.json y coinciden byte por byte con la copia del ZIP candidata que se extrajo y probó. El ZIP final añade documentación y evidencias; su manifiesto se verifica aparte al empaquetar.

- Suite general: 219 pruebas, 215 correctas y cuatro omitidas (tres por falta de g++ y una por privilegios de enlaces simbólicos en Windows). Incluye 15 regresiones nuevas de arranque, transporte y cancelación.
- Instalación: 17 comprobaciones. Extracción en una ruta nueva con espacios y &, entorno Python sin paquetes heredados, lanzamiento real mediante el BAT y el servidor propio de prueba. Editor, guardado/recarga y simulador funcionan sin Arduino CLI, pyserial ni mpremote. Puerto TCP ocupado y destino de datos no escribible explicados sin cerrar otros programas ni sobrescribir datos.
- Preparación opcional real en esa copia: pyserial 3.5 y mpremote 1.29.0 en .venv. Se eligió automáticamente ese Python y se resolvieron sus herramientas. No se modificó el Python global ni se incluyó el entorno en el ZIP.
- Recuperación: 21 comprobaciones Chromium con HTTP real, transporte controlado COM999 y diario de operación interrumpida. Puerto ocupado, fallo de lectura, fallo de envío sin duplicación, reconexión explícita, Enviar deshabilitado sin conexión, código/puerto conservados y resultado interrumpido nunca verde ni rotulado Preparando.
- Cancelación: una regresión termina un proceso Python de prueba propio y comprueba liberación del bloqueo, conservación del sketch y que la referencia repetida no vuelve a ejecutar. No se cancela una carga de firmware real.
- Regresiones adicionales: 26 comprobaciones del simulador y 37 de agentes/proyectos. Total de esos tres recorridos de navegador: 84. Las 17 de instalación se documentan aparte e incluyen su propia revisión de navegador.

Las capturas son reales bajo las condiciones indicadas. clean-install-desktop.png usa una lista de puertos controlada vacía; serial-disconnected-controlled.png y restart-unknown-controlled.png no representan una placa física ni una operación interrumpida sobre hardware.

Esto se ejecutó en el mismo Windows de desarrollo. No acredita un sistema operativo limpio, otro PC, Linux/macOS, retirada física del USB ni una cancelación real del grabador. Las cinco placas físicas previas y sus límites siguen en la matriz. La configuración de CI se amplió, pero no se ha ejecutado remotamente.

La revisión de patrones de credenciales de textos actuales y de blobs históricos se guarda en publication-text-audit.json. No incluye OCR de medios, reflogs ni detección exhaustiva de secretos. No se distribuyen respaldos binarios privados ni .venv.

Reproducción: python tests/run_isolated.py; con Playwright, tests/browser_connection_recovery.py --outputs work/connection-checks. tests/clean_package_smoke.py admite --package, --work (carpeta nueva), --outputs, --browser y --prepare; este último descarga dependencias únicamente en la copia aislada. No publicar ni hacer push forma parte del alcance respetado.
