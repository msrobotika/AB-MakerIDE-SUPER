# Arquitectura y desarrollo

La distribución de usuario sigue siendo un ZIP ejecutable con Python. No necesita npm, un servidor Node ni un paso de compilación del frontend para arrancar.

| Ruta | Responsabilidad |
| --- | --- |
| `server.py` | HTTP loopback, validación de origen/token, endpoints y activos permitidos |
| `launch.py`, `prepare_windows.py` | Diagnóstico y preparación privada compartidos por los lanzadores Windows/POSIX |
| `ab_makeride/` | Servicios Python: trabajos, agentes, proyectos, identidad, herramientas, MCP, credenciales y versión |
| `app.js` | Punto de entrada pequeño que carga `frontend/bootstrap.js` |
| `frontend/` | Módulos ES: editor, layout, boards, build, workspace, serial, simulation, assistant, ai, hardware, agent, startup; CSS externo |
| `activity.js`, `board_trials.js`, `simulator.js` | Motores independientes que también se prueban con Node |
| `tests/` | Regresiones por funcionalidad y recorridos reales/controlados de navegador |
| `docs/archive/` | Informes históricos, conservando fechas y alcance original |

Bootstrap crea un contexto privado compartido. Primero registra las funciones de todos los módulos (`define`), después inicializa sus datos y eventos (`initialize`) en orden. No exporta ese contexto a `window`. Una nueva función debe declararse en el módulo responsable; evita dependencias de inicialización entre módulos y conserva pruebas de los flujos que cruza.

`VERSION` es la fuente de la versión de ejecución. El servidor la incorpora al HTML y a salud; el frontend la entrega al cuaderno. Las notas históricas y títulos de Releases mantienen su versión propia.

## Comprobaciones

En un entorno de desarrollo propio con Python 3.10+ y Node 24:

```sh
python -m pip install -r requirements-dev.txt
npm ci --ignore-scripts
python tests/run_isolated.py
python -m ruff check .
python -m ruff format --check .
npm run lint
npm run format:check
python tests/manifest.py
```

Ruff comprueba errores Python y formato; ESLint comprueba JavaScript y prohíbe sinks HTML; Prettier formatea los activos de interfaz. Ninguna herramienta está configurada para instalarse durante el arranque del usuario. Dependabot propone actualizaciones semanales; no las fusiona automáticamente.

Los recorridos `tests/browser_*.py` usan Playwright/Chromium y directorios de resultados nuevos. El consentimiento, reconexión, guardado, identidad, simulación, MCP y CSP usan operaciones controladas; `browser_acceptance.py` distingue una compilación real de sus escenarios interceptados. Una prueba controlada no es evidencia física. No ejecutes pruebas de grabación sin autorización del propietario.

## Integridad y publicación

`.gitattributes` fija LF para texto y CRLF para `.bat`. Normaliza los bytes antes de regenerar `python tests/manifest.py --write`; incluye todos los archivos que vayas a publicar. El manifiesto excluye únicamente su propio hash. CI falla ante bytes alterados, archivos seguidos sin entrada, rutas inválidas o versión incoherente. El ZIP se vuelve a verificar tras extraerlo y tras descargarlo de Releases.

No incluyas `.makeride-data`, cuentas, binarios de flash, proyectos personales, `node_modules` ni `.venv`. Los vídeos grandes van como adjuntos de Releases. Retirar un vídeo del árbol actual no lo borra de commits anteriores; cualquier migración del historial requiere una decisión separada y coordinación con quienes hayan clonado el repositorio.
