# AB MakerIDE SUPER · MS Robotika

**BETA gratuita y de código abierto para crear proyectos con Arduino, ESP32 y MicroPython.**
El proyecto mejora paso a paso con pruebas, incidencias y aportaciones de la comunidad.

## Qué puedes hacer

- Escribir, guardar e importar proyectos de firmware.
- Compilar y grabar con las herramientas externas de la placa y consultar el monitor serie.
- Diseñar interfaces con ScreenLab y explorar animaciones con MotionLab.
- Usar asistentes y MCP opcionales, con tus propias herramientas, cuentas y permisos.

Puedes usar el editor sin contratar una IA. Los proveedores externos tienen sus
propias condiciones y posibles costes; el proyecto no incluye créditos ni los activa.

## Empezar

**[Descargar instalador Windows x64 TEST](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/download/windows-test-dev-025dd26e85/AB-MakerIDE-SUPER-Windows-x64-dev-025dd26e85-Setup.exe)**
· [Detalles, SHA-256 y evidencias del paquete](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/tag/windows-test-dev-025dd26e85)

1. Lee la [guía de instalación y versiones](docs/DESCARGAS_Y_VERSIONES.md).
2. Guarda tus proyectos antes de cerrar, actualizar o probar otro firmware.
3. Instala las herramientas externas que necesite tu placa; Arduino CLI y los núcleos no vienen incluidos.
4. Confirma el modelo, revisión y puerto antes de grabar: la carga reemplaza el programa de la placa.

El instalador TEST incluye Python, funciona localmente y no está firmado digitalmente;
Windows puede mostrar advertencias. Verifica el origen y el SHA-256 de la descarga.
La RC4 portátil se conserva como histórica, con [auditoría de distribución abierta (#11)](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/11).

## Qué significa «beta» aquí

Hay funciones y dispositivos con pruebas documentadas, junto a trabajo pendiente.
**Código generado, compilación, carga verificada y funcionamiento físico son resultados distintos.**
Consulta la [matriz de hardware](docs/MATRIZ_HARDWARE.md) para conocer el alcance de cada prueba.

La descarga TEST, el código de `main` y las pruebas locales pueden ser diferentes.
**Cuttlefish todavía no está integrado en la descarga ni en este código público**;
su integración HTML/CSS sigue en preparación local. Tampoco se presentan los parches
locales de arranque y seguridad como actualizaciones ya distribuidas.

**[Estado y prioridades](docs/ESTADO_BETA.md)** · **[Checklist de 227 controles](compliance/CHECKLIST.md)**

La checklist es un seguimiento abierto: un punto pendiente no significa que no
exista ninguna prueba, y publicar la lista no significa haber superado sus 227 controles.
No anunciamos esta beta como estable, certificada o libre de fallos.

## Colaborar

[Comunica un fallo](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/new/choose)
indicando versión, sistema, placa y pasos para reproducirlo, sin claves ni datos personales.
También son útiles mejoras pequeñas, documentación y pruebas en otras placas.
[Cómo contribuir](CONTRIBUTING.md) · [Conversaciones de la comunidad](https://github.com/msrobotika/AB-MakerIDE-SUPER/discussions).

## Licencia y límites

El código propio usa [MIT](LICENSE); los componentes ajenos conservan sus
[licencias y atribuciones](THIRD_PARTY_NOTICES.md). MakerIDE es independiente y no oficial.
No está validado para usos médicos, protección de personas o control industrial crítico.
La revisión de seguridad, privacidad y distribución continúa; compartir avances
con transparencia forma parte del desarrollo, no equivale a una certificación jurídica.

[Seguridad](SECURITY.md) · [Manuales](docs/README.md) · [Estado de revisión](compliance/README.md)
· [Publicación de versiones](docs/RELEASE_POLICY.md) · [English](README.en.md)

[Código fuente](https://github.com/msrobotika/AB-MakerIDE-SUPER/archive/refs/heads/main.zip) · [ZIP RC4 histórico](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/download/v1.0.0-rc.4/AB-MakerIDE-SUPER-1.0.0-rc.4-IA-actualizada.zip)
