# AB MakerIDE SUPER · 1.0.0-rc.4

**MS ROBOTIKA — IDE local, código abierto (MIT).** Versión candidata (*pre-release*), publicada el 26 de octubre de 2026. **No es una edición estable** ni garantiza compatibilidad universal con cualquier placa. Esta ficha describe el código y los artefactos de la etiqueta `v1.0.0-rc.4`; las mejoras de documentación posteriores en `main` no modifican el ZIP ya publicado.

## Capturas reales de la aplicación RC4

[![AB MakerIDE RC4 — editor, grabación real y verificación](https://raw.githubusercontent.com/msrobotika/AB-MakerIDE-SUPER/v1.0.0-rc.4/docs/evidence/cyd-rc4/carga-desde-ide-real.png)](https://github.com/msrobotika/AB-MakerIDE-SUPER/blob/v1.0.0-rc.4/docs/evidence/cyd-rc4/carga-desde-ide-real.png)

*Aplicación RC4 en Windows: selección de CYD/COM4, editor, agente opcional, compilación y grabación real verificada desde el IDE. La pantalla y el táctil se comprobaron por separado mediante confirmación del usuario.*

[![AB MakerIDE RC4 — monitor serie con hardware real](https://raw.githubusercontent.com/msrobotika/AB-MakerIDE-SUPER/v1.0.0-rc.4/docs/evidence/cyd-rc4/monitor-serie-real.png)](https://github.com/msrobotika/AB-MakerIDE-SUPER/blob/v1.0.0-rc.4/docs/evidence/cyd-rc4/monitor-serie-real.png)

*Panel de puertos y monitor serie. Se recibieron los mensajes de inicialización y calibración; no se recogió un marcador final de juego durante la ventana automatizada.*

[Prueba física y sus límites](https://github.com/msrobotika/AB-MakerIDE-SUPER/blob/v1.0.0-rc.4/docs/evidence/cyd-rc4/README.md) · [Auditoría técnica de RC4](https://github.com/msrobotika/AB-MakerIDE-SUPER/blob/v1.0.0-rc.4/docs/AUDITORIA_RC4.md)

## Qué se puede hacer

- **Editor integrado** para Arduino C++ y MicroPython, gestor de proyectos con guardado explícito (`Ctrl+S`), importación/exportación, diagnósticos y editor vacío en una sesión nueva.
- **Herramientas maker locales**: búsqueda de placas y puertos, compilación Arduino CLI, grabación solicitada y verificada por el grabador, monitor serie y simulador de secuencias digitales (no emulador de firmware).
- **Agente de programación opcional**: integración Codex con permisos de herramienta supervisados, elección de acceso por tarea y aprobaciones MCP manuales de forma predeterminada. El usuario aporta su propia cuenta y cuota.
- **Seguridad y trazabilidad**: almacén seguro DPAPI en Windows, alternativa llavero compatible o memoria temporal según plataforma, respaldo autorizado de firmware cuando se documenta, controles de origen y tokens locales.
- **Firmware de demostración en una CYD física**: juego de naves de estilo arcade clásico, *similar a los arcades históricos de invasores espaciales*, y juego de bloques. No son productos oficiales ni están afiliados a una franquicia de videojuegos. La validación física no certifica el funcionamiento de otras revisiones.

## Validación registrada de la candidata

| Verificación | Resultado documentado |
| --- | --- |
| Pruebas unitarias locales Windows | **294 correctas / 299** (5 omitidas por entorno/herramientas/privilegios) |
| Navegador Chromium | **196 comprobaciones** en 8 recorridos controlados |
| Carga desde el IDE a CYD ESP32-2432S028R | Una petición desde la interfaz, salida correcta, **4 bloques verificados**, 141 s |
| Confirmación física | El usuario confirmó funcionamiento de pantalla y táctil; comprobación separada de la verificación de flash |
| CI | Windows, Ubuntu y macOS, según el commit publicado; no equivalente a hardware real en los tres sistemas |

Hay evidencias sobre seis dispositivos concretos, con alcances diferentes. Consulta [la matriz de hardware](https://github.com/msrobotika/AB-MakerIDE-SUPER/blob/v1.0.0-rc.4/docs/MATRIZ_HARDWARE.md). Claude Code MCP sigue experimental y no se anuncia como integrado y verificado. Gemini API requiere clave y cuota propias. No se incluyen créditos de IA.

## Descargar y comenzar

**[Descargar los archivos de RC4](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/tag/v1.0.0-rc.4)** — seleccionar `AB-MakerIDE-SUPER-1.0.0-rc.4.zip` en *Assets*. Los archivos `SHA256SUMS.txt`, `validacion-RC4.json` y un vídeo de demostración están adjuntos a la misma ficha.

**Windows:** necesitas Python 3.10 o posterior. Descomprime todo en **una carpeta nueva**, sin mezclar versiones, ejecuta `PREPARAR_WINDOWS.bat` si necesitas funciones opcionales de serie y MicroPython, y abre `INICIAR_WINDOWS.bat`. Interfaz local predeterminada: `http://127.0.0.1:8770`. Para compilar Arduino necesitas **Arduino CLI** y el core de la placa, por separado.

**Linux/macOS:** preparación y arranque documentados, con comprobaciones automáticas pero sin validación física de placas equivalente a Windows.

[Guía de instalación y recuperación](https://github.com/msrobotika/AB-MakerIDE-SUPER/blob/v1.0.0-rc.4/docs/INSTALACION.md) · [Linux/macOS](https://github.com/msrobotika/AB-MakerIDE-SUPER/blob/v1.0.0-rc.4/docs/LINUX_MACOS.md) · [Política de seguridad](https://github.com/msrobotika/AB-MakerIDE-SUPER/blob/v1.0.0-rc.4/SECURITY.md)

## Límites conocidos

Esta es una versión candidata: ciertas capacidades de agentes y proveedores necesitan pruebas adicionales con cuentas reales; las pruebas controladas de navegador no acreditan por sí mismas una carga física. El grabador puede verificar bytes sin demostrar lo que se ve en pantalla; ambas evidencias se separan. No se garantiza compatibilidad con todas las placas, pantallas o periféricos de una misma familia.

**No hay afiliación con propietarios de videojuegos clásicos.** El estilo arcade utilizado en las demostraciones sirve de referencia descriptiva. Antes de redistribuir ejemplos de videojuegos como producto comercial, corresponde revisar y diferenciar efectivamente nombre, arte, sonido, código y licencias; un mero cambio de título no demuestra ausencia de infracción.

---

**Mantenimiento:** esta página de presentación puede actualizarse sin crear una RC5. La etiqueta y los binarios originales de RC4 se mantienen para integridad y reproducibilidad.
