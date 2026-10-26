# AB MakerIDE v0.9.4 — Auditoría y pruebas

Fecha: 24/10/2026. Edición privada MS Robotika, sin publicación.

## Problema original y límites de evidencia

En la v0.9.3, el usuario solicitó un juego para su ESP32 IdeaSpark y cerró MakerIDE accidentalmente. No contamos con el registro original del juego, por lo que **no podemos afirmar** que se haya generado, compilado ni grabado. Los ficheros de sesiones antiguas pueden permanecer en `Documentos/AB MakerIDE/AgentWorkspaces` aunque el registro no se hubiera persistido.

## Cambios reales de esta revisión

1. Registro en disco por sesión de agente (escritura atómica + `fsync`) con eventos acotados, estado, evidencia declarada y resumen. Persistencia periódica y al finalizar. Copia del sketch original para calcular diferencias tras reiniciar.
2. Recuperación tras cierre: tareas finalizadas conservan su informe y diff; tareas activas al reiniciar pasan a **interrumpidas**, resultado de hardware desconocido, sin reintentos automáticos.
3. Compatibilidad con carpetas antiguas de sesiones sin registro: previsualización manual del sketch, sin afirmar compilación o grabación.
4. Distinción entre fin de CLI, compilación observada, memoria Flash verificada según log y resultado visible en TFT, que requiere observación humana. El parser de hitos no es certificación independiente: un agente con acceso total podría incluir texto similar sin realizar operaciones.
5. Nuevos botones discretos «Recuperar última sesión», «Continuar pendiente» y tarea de ejemplo Pong para IdeaSpark; todos requieren interacción del usuario. El preset Pong rechaza un perfil Arduino Uno y un puerto sin seleccionar.
6. Protección de cambios concurrentes: antes de importar código propuesto se compara la huella SHA-256 del sketch de partida cuando está disponible y se guarda copia local previa. Los proyectos se guardan también al iniciar cada tarea.
7. Permisos CLI mantienen modo supervisado como predeterminado y consentimiento textual `ACCESO TOTAL` por tarea.

## Pruebas realizadas

- `python -m unittest discover -s tests -p "test_*.py" -q`: **152 pruebas correctas**.
- `python -m py_compile` de backend y `node --check app.js`: correcto.
- Pruebas nuevas de caída del servidor, restauración de cambios, recuperación de sesiones antiguas, ocultación de credenciales obvias en eventos, historial de sesiones y UI.
- Chromium aislado (HTML/JS y respuestas de API de prueba): botones de Pong y recuperación, propuesta de importación y continuación; sin errores JavaScript. La navegación directa a localhost estaba restringida en el navegador de este entorno, por lo que **no** se declara validación navegador-servidor real.
- Pruebas de CLI/Arduino restantes usan dobles de prueba o registros de ejecución previos. **No se ha grabado una IdeaSpark ni llamado a Codex autenticado en esta versión.**

## Seguridad y limitaciones abiertas

- El modo total Codex/Claude puede realizar cambios fuera del proyecto e incluso operaciones físicas. El almacenamiento de sesiones **no es un sandbox**. Utiliza una máquina virtual para experimentos peligrosos y confirma el perfil físico antes de grabar.
- No se han auditado exhaustivamente fugas de secretos, integridad criptográfica de logs, prompts maliciosos ni acceso local multiusuario. Las expresiones de redacción de credenciales son defensas parciales, no garantías.
- El IDE actualmente guarda un solo archivo abierto por proyecto en su editor, no un proyecto multarchivo completo; ficheros adicionales del agente permanecen en su workspace.
- Sin emulación CPU/firmware ESP32 completa; no se ha validado un juego en la pantalla de la placa.
- Faltan PTY interactivo general y diagnóstico avanzado de pantallas reales.

## Próximo criterio de aceptación

En Windows, seleccionar ESP32 IdeaSpark, COM correcto, tarea Pong, verificar que se guardó el código y que Arduino CLI compiló/grabó, reiniciar el navegador y recuperar la sesión. Verificación visual de juego en la TFT por el usuario. Sin evidencia de los pasos, estado pendiente.
