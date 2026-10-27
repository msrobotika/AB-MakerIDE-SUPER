# Instalador de pruebas Windows x64 — 27/10/2026

## Situación y objetivos
Sin instalador descargable para el usuario. La RC4 histórica se conserva
inalterada; se genera un paquete etiquetado de desarrollo con su commit
exacto y sin simular validación de hardware.

## Requisitos
- **FR-001**: Construir `.exe` autocontenido respecto a CPython x64 a partir del código `main`, sin empaquetar Arduino CLI ni presuponer cuentas de IA.
- **FR-002**: Instalación/desinstalación por usuario sin privilegios de administrador, con datos operativos fuera de la carpeta desinstalable.
- **FR-003**: Comprobar el binario Windows real: diagnóstico, servicio HTTP, instalación en ruta con espacios, desinstalación y retención de archivo de usuario; calcular SHA256 del setup.
- **FR-004**: Impedir descarga pública automática desde PR/push ordinarios; publicar únicamente con aprobación explícita del commit, checks multiplataforma verdes y build de Windows exitoso, como pre-release de pruebas sin firma.
- **FR-005**: Documentar versión/código exactos, límites, dependencias no incluidas, licencias y SmartScreen; conservar ZIP RC4 histórico.
