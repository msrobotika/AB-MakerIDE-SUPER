# PR25 — reparación confirmada, 30/10/2026

[Resultados locales](results.json). Logs originales: [CI40820358302](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/runs/40820358302).

Antes: Ruff F401, manifiesto tres discrepancias, Playwright1.56 rechaza Ubuntu26.04 y unittest descubre cero pruebas de intención. Al desbloquear Ruff se detecta también una línea vacía final fuera de formato.
Después local: 336 unittest (331 correctos, cinco omitidos), tres de intención ejecutados realmente; 21 Node y nueve recorridos Chromium correctos; Ruff/ESLint/Prettier. AST del clasificador idéntico antes/después, API pública conservada. Manifiesto regenerado mediante tests/manifest.py y puerta Spec Kit sobre main.

Se conserva historia y documentación beta mediante merge de main, sin rebase ni force-push. Solo import innecesario, formato, descubrimiento unittest, runner de navegador compatible e integridad/expediente. La matriz general Windows/Linux/macOS sigue vigente; las pruebas locales aquí son Windows. Chromium existente mediante ruta explícita local; CI instala el navegador correspondiente a Playwright en Ubuntu24.

Aceptación remota y revisión humana permanecen pendientes hasta observar el commit exacto en GitHub. No se instala este refactor en el PC del titular, ni se fusiona, publica release o programa hardware.
