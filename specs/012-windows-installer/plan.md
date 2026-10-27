# Plan
1. Congelar el punto de partida y el alcance limitado del instalador Windows.
2. Empaquetar CPython y recursos UI/servidor con PyInstaller desde fuente de desarrollo.
3. Compilar un instalador Inno Setup por usuario sin borrar datos fuera de {app}.
4. Probar binario antes y después de instalar, servidor HTTP y desinstalación.
5. Sellar SHA256 y mantener entrega pública bloqueada hasta checks verdes y autorización marcada.
6. Verificar Spec Kit y documentación; publicar únicamente hito probado.
