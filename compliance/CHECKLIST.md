# Checklist de revisión — 227 controles

Actualizada el 30/10/2026. Referencia de trabajo, **no certificación de cumplimiento**.
210 criterios priorizados y 17 finales. Se adapta la checklist aportada por el titular; se conservan sus IDs para seguimiento.
Prioridades: P1 antes de distribuir lo afectado; P2 antes de ampliar el uso; P3 mejora continua. Evaluar siempre aplicabilidad.
«Pendiente» significa cobertura completa abierta, aunque existan pruebas parciales. «Avance local» no significa distribuido.
Las formulaciones jurídicas se revisan contra fuentes vigentes y el contexto; ver [notas y fuentes](README.md).

| ID | Prioridad | Revisión | Estado |
|---|---|---|---|
| ACT-001 | P1 | Requisitos escritos y criterios de aceptación verificables para cada función | Pendiente de revisión completa y aplicabilidad. |
| ACT-002 | P1 | Pruebas unitarias en la lógica crítica (cobertura mínima acordada, p. ej. 70 % en el núcleo) | Pendiente de revisión completa y aplicabilidad. |
| ACT-003 | P1 | Pruebas de integración de los flujos principales (alta, login, pago, borrado de cuenta) | Pendiente de revisión completa y aplicabilidad. |
| ACT-004 | P1 | Pruebas de casos límite: entradas vacías, enormes, Unicode, nulos, fechas/zonas horarias, números negativos | Pendiente de revisión completa y aplicabilidad. |
| ACT-005 | P1 | Manejo de errores: ningún fallo muestra trazas, rutas internas ni datos sensibles al usuario | Pendiente de revisión completa y aplicabilidad. |
| ACT-006 | P1 | Linter, formateador y análisis estático (tipado) sin errores en CI | Pendiente de revisión completa y aplicabilidad. |
| ACT-007 | P1 | Sin restos de la generación con IA: datos de ejemplo, usuarios o claves de prueba, TODO, código muerto, endpoints de depuración ni funciones que nadie ha pedido | Pendiente de revisión completa y aplicabilidad. |
| ACT-008 | P1 | Cada función hace lo que dice la documentación: la IA a veces escribe código que compila pero no cumple la especificación; comprobarlo con pruebas, no a ojo | Pendiente de revisión completa y aplicabilidad. |
| ACT-009 | P2 | Pruebas end-to-end automáticas de los recorridos de usuario clave | Pendiente de revisión completa y aplicabilidad. |
| ACT-010 | P2 | Pruebas de rendimiento y carga: tiempos de respuesta objetivo, consumo de memoria/CPU, fugas | Pendiente de revisión completa y aplicabilidad. |
| ACT-011 | P2 | Comportamiento sin red, con red lenta y ante caída de servicios externos (timeouts, reintentos con backoff) | Pendiente de revisión completa y aplicabilidad. |
| ACT-012 | P2 | Migraciones de base de datos probadas, reversibles y con copia previa | Pendiente de revisión completa y aplicabilidad. |
| ACT-013 | P2 | Compatibilidad: navegadores, sistemas operativos, versiones de runtime soportadas | Pendiente de revisión completa y aplicabilidad. |
| ACT-014 | P3 | Pruebas de regresión por cada bug corregido | Pendiente de revisión completa y aplicabilidad. |
| ACT-015 | P3 | Monitorización de errores y métricas en producción (tasa de error, latencia) | Pendiente de revisión completa y aplicabilidad. |
| ACT-016 | P1 | Toda entrada externa se valida en el servidor (tipo, longitud, formato, lista blanca); nunca confiar en el cliente | Pendiente de revisión completa y aplicabilidad. |
| ACT-017 | P1 | SQL: solo consultas parametrizadas u ORM; cero concatenación de cadenas en consultas | Pendiente de revisión completa y aplicabilidad. |
| ACT-018 | P1 | Comandos del sistema: evitar shell=True / exec con datos del usuario; usar listas de argumentos y listas blancas | Pendiente de revisión completa y aplicabilidad. |
| ACT-019 | P1 | XSS: escapado de salida según contexto, Content-Security-Policy estricta, sin innerHTML con datos no saneados | Pendiente de revisión completa y aplicabilidad. |
| ACT-020 | P1 | NoSQL, LDAP, XPath, plantillas (SSTI) y cabeceras HTTP: mismas reglas de parametrización/escapado | Pendiente de revisión completa y aplicabilidad. |
| ACT-021 | P1 | Subida de archivos: tipo real (no solo extensión), tamaño máximo, nombre aleatorio, fuera de la raíz web, análisis antimalware | Pendiente de revisión completa y aplicabilidad. |
| ACT-022 | P1 | Path traversal: normalizar rutas y prohibir ../ | Pendiente de revisión completa y aplicabilidad. |
| ACT-023 | P1 | SSRF: lista blanca de destinos al hacer peticiones desde el servidor; bloquear IPs internas y metadatos cloud | Pendiente de revisión completa y aplicabilidad. |
| ACT-024 | P1 | Deserialización insegura: no deserializar datos no confiables (pickle, yaml.load, etc.) | Pendiente de revisión completa y aplicabilidad. |
| ACT-025 | P2 | CSRF: tokens o cookies SameSite en acciones que cambian estado | Pendiente de revisión completa y aplicabilidad. |
| ACT-026 | P2 | Asignación masiva (mass assignment): el servidor acepta solo los campos permitidos; el usuario no puede enviar role, is_admin, price, etc. | Pendiente de revisión completa y aplicabilidad. |
| ACT-027 | P2 | Redirecciones abiertas: validar la URL de destino tras login o pago | Pendiente de revisión completa y aplicabilidad. |
| ACT-028 | P2 | Si hay IA/LLM: defensa contra prompt injection (separar instrucciones y datos, sin ejecutar salidas del modelo sin validar, permisos mínimos a las herramientas, filtrar datos sensibles en la salida) | Pendiente de revisión completa y aplicabilidad. |
| ACT-029 | P2 | Si hay agentes/MCP: lista cerrada de herramientas, confirmación humana en acciones destructivas o irreversibles, sin credenciales de producción en el entorno del agente, y servidores MCP o extensiones de terceros revisados antes de instalarlos | Pendiente de revisión completa y aplicabilidad. |
| ACT-030 | P1 | Contraseñas con Argon2id o bcrypt (nunca MD5/SHA simple); mejor delegar en un proveedor de identidad probado | Pendiente de revisión completa y aplicabilidad. |
| ACT-031 | P1 | 2FA disponible, límite de intentos y bloqueo progresivo contra fuerza bruta | Pendiente de revisión completa y aplicabilidad. |
| ACT-032 | P1 | Control de acceso en el servidor en cada endpoint (evitar IDOR: comprobar que el recurso es del usuario); ocultar un botón en la interfaz no es seguridad | Pendiente de revisión completa y aplicabilidad. |
| ACT-033 | P1 | Principio de mínimo privilegio en usuarios, tokens, claves API y base de datos | Pendiente de revisión completa y aplicabilidad. |
| ACT-034 | P1 | Sesiones/JWT con caducidad corta, rotación y revocación; cookies HttpOnly, Secure, SameSite | Pendiente de revisión completa y aplicabilidad. |
| ACT-035 | P1 | HTTPS en todo (TLS moderno), HSTS; datos sensibles cifrados en reposo | Pendiente de revisión completa y aplicabilidad. |
| ACT-036 | P1 | Base de datos como servicio (Supabase, Firebase u otras): reglas de acceso activadas (Row Level Security, reglas de Firestore); nunca allow read, write: if true ni tablas públicas por defecto | Pendiente de revisión completa y aplicabilidad. |
| ACT-037 | P1 | Credenciales por defecto cambiadas y paneles de administración (/admin, phpMyAdmin, Swagger, consolas de depuración) no expuestos a Internet o protegidos con 2FA | Pendiente de revisión completa y aplicabilidad. |
| ACT-038 | P2 | Recuperación de contraseña con tokens de un solo uso y caducidad corta; mensajes iguales para usuario existente e inexistente (evita enumerar cuentas) | Pendiente de revisión completa y aplicabilidad. |
| ACT-039 | P2 | Pagos: importes, descuentos y permisos se calculan en el servidor; los webhooks (Stripe, etc.) verifican la firma | Pendiente de revisión completa y aplicabilidad. |
| ACT-040 | P1 | Ningún secreto en el código ni en el historial de Git (usar gestor de secretos o variables de entorno) | Pendiente de revisión completa y aplicabilidad. |
| ACT-041 | P1 | Claves privadas o de servicio (p. ej. service_role, claves de pago, tokens de IA) nunca en el frontend ni en la app móvil; en el cliente solo claves públicas restringidas por dominio y cuota | Pendiente de revisión completa y aplicabilidad. |
| ACT-042 | P1 | Configuración segura por defecto; depuración desactivada en producción; mensajes de error genéricos y sin trazas (stack traces) | Pendiente de revisión completa y aplicabilidad. |
| ACT-043 | P1 | CORS con lista blanca de orígenes; nunca * junto con credenciales | Pendiente de revisión completa y aplicabilidad. |
| ACT-044 | P1 | No exponer .env, .git, copias de seguridad ni archivos de configuración en el servidor web | Pendiente de revisión completa y aplicabilidad. |
| ACT-045 | P2 | Cabeceras de seguridad (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) | Pendiente de revisión completa y aplicabilidad. |
| ACT-046 | P2 | Rate limiting y protección contra abuso/DoS en APIs públicas, incluidos login, registro y formularios que envían correo | Pendiente de revisión completa y aplicabilidad. |
| ACT-047 | P2 | Límite de gasto y alertas de coste en las APIs de IA y en la nube (evita que un abuso te genere una factura enorme) | Pendiente de revisión completa y aplicabilidad. |
| ACT-048 | P2 | Registro de eventos de seguridad (logins fallidos, cambios de permisos) sin guardar datos sensibles en los logs | Pendiente de revisión completa y aplicabilidad. |
| ACT-049 | P1 | SAST (análisis estático) y escaneo de secretos automáticos en CI | Pendiente de revisión completa y aplicabilidad. |
| ACT-050 | P1 | Si un secreto se ha expuesto alguna vez: revocarlo y rotarlo de inmediato, aunque el repositorio sea privado o ya lo hayas borrado | Pendiente de revisión completa y aplicabilidad. |
| ACT-051 | P2 | DAST y pruebas de penetración sobre tu propia app, en entorno de pruebas y con autorización escrita si no es tuya | Pendiente de revisión completa y aplicabilidad. |
| ACT-052 | P2 | Revisión de amenazas (modelado STRIDE) de los flujos con datos sensibles | Pendiente de revisión completa y aplicabilidad. |
| ACT-053 | P3 | Política de divulgación responsable (SECURITY.md y security.txt) | Pendiente de revisión completa y aplicabilidad. |
| ACT-054 | P1 | Inventario de dependencias (SBOM en CycloneDX o SPDX) generado automáticamente en cada versión | Avance local: inventario parcial de un candidato; SBOM completo de las distribuciones pendiente. |
| ACT-055 | P1 | Escaneo de vulnerabilidades conocidas (Dependabot, npm audit, pip-audit, OSV-Scanner, Trivy) en CI | Pendiente de revisión completa y aplicabilidad. |
| ACT-056 | P1 | Versiones fijadas con archivo de bloqueo (package-lock.json, poetry.lock, requirements con hashes) | Avance local; fijación y hashes de todos los componentes pendientes. |
| ACT-057 | P1 | Cada dependencia: ¿mantenida?, ¿necesaria?, ¿de origen fiable? (cuidado con typosquatting y paquetes abandonados) | Pendiente de revisión completa y aplicabilidad. |
| ACT-058 | P1 | Paquetes sugeridos por una IA: comprobar que existen, que son el oficial y su fecha y mantenimiento; los modelos inventan nombres y los atacantes los registran después (slopsquatting) | Pendiente de revisión completa y aplicabilidad. |
| ACT-059 | P1 | Licencias de todas las dependencias revisadas y compatibles con la tuya (ver sección legal) | Avance local en avisos; revisión completa de componentes y recursos pendiente. |
| ACT-060 | P2 | Actualizaciones automáticas revisadas por PR, nunca directo a producción | Pendiente de revisión completa y aplicabilidad. |
| ACT-061 | P2 | Imágenes Docker mínimas, de fuente oficial, sin ejecutar como root, escaneadas | Pendiente de revisión completa y aplicabilidad. |
| ACT-062 | P2 | Acciones de CI fijadas por hash/versión y con permisos mínimos del token | Pendiente de revisión completa y aplicabilidad. |
| ACT-063 | P2 | Commits firmados y protección de la rama principal | Pendiente de revisión completa y aplicabilidad. |
| ACT-064 | P2 | Scripts de instalación (postinstall, curl / bash), extensiones, plugins y servidores MCP de terceros: revisar qué ejecutan antes de instalarlos | Pendiente de revisión completa y aplicabilidad. |
| ACT-065 | P3 | Artefactos de release firmados y con procedencia verificable (SLSA, Sigstore) | Pendiente de revisión completa y aplicabilidad. |
| ACT-066 | P3 | Plan para reemplazar o retirar dependencias sin soporte | Pendiente de revisión completa y aplicabilidad. |
| ACT-067 | P1 | Ningún archivo supera ~300-400 líneas; ninguna función ~40-50 líneas; si lo hace, se divide | Pendiente de revisión completa y aplicabilidad. |
| ACT-068 | P1 | Una responsabilidad por módulo (principio de responsabilidad única): separar interfaz, lógica de negocio, acceso a datos y utilidades | Pendiente de revisión completa y aplicabilidad. |
| ACT-069 | P1 | Dependencias en una sola dirección (UI → servicios → datos); sin imports circulares | Pendiente de revisión completa y aplicabilidad. |
| ACT-070 | P1 | Complejidad ciclomática por función limitada (p. ej. ≤ 10) y comprobada en CI | Pendiente de revisión completa y aplicabilidad. |
| ACT-071 | P1 | Sin código duplicado relevante (comprobar con jscpd, SonarQube o similar) | Pendiente de revisión completa y aplicabilidad. |
| ACT-072 | P2 | Configuración separada del código; sin números/cadenas mágicas | Pendiente de revisión completa y aplicabilidad. |
| ACT-073 | P2 | Interfaces claras entre módulos (contratos/API internas) para poder sustituir una pieza sin tocar el resto | Pendiente de revisión completa y aplicabilidad. |
| ACT-074 | P2 | Un módulo se puede probar de forma aislada (inyección de dependencias, mocks) | Pendiente de revisión completa y aplicabilidad. |
| ACT-075 | P2 | Nombres descriptivos y estructura de carpetas coherente y documentada | Pendiente de revisión completa y aplicabilidad. |
| ACT-076 | P3 | Documentación de decisiones de arquitectura (ADR) breve por cada elección importante | Pendiente de revisión completa y aplicabilidad. |
| ACT-077 | P3 | Presupuesto de deuda técnica: revisar y refactorizar de forma periódica, no solo al final | Pendiente de revisión completa y aplicabilidad. |
| ACT-078 | P1 | Todo código generado se revisa, se prueba y se escanea igual que el escrito a mano; tú eres el responsable | Pendiente de revisión completa y aplicabilidad. |
| ACT-079 | P1 | Pedir y mantener la modularidad en cada petición; límites de tamaño por archivo en el prompt y en CI | Pendiente de revisión completa y aplicabilidad. |
| ACT-080 | P1 | Comprobar los términos de la herramienta de IA: que permiten uso comercial o de distribución de lo generado y qué hace con tu código y tus prompts (entrenamiento, retención) | Pendiente de revisión completa y aplicabilidad. |
| ACT-081 | P1 | No pegar en la IA datos personales reales, secretos ni código o documentos confidenciales de tu empresa o de clientes sin autorización | Pendiente de revisión completa y aplicabilidad. |
| ACT-082 | P2 | Verificar que la IA no ha inventado paquetes inexistentes ni copiado código con licencia incompatible (herramientas de detección de coincidencias, p. ej. ScanCode, FOSSA) | Pendiente de revisión completa y aplicabilidad. |
| ACT-083 | P2 | Guardar qué partes se generaron con IA y qué cambios hiciste tú: sirve para licencias, autoría y auditoría | Pendiente de revisión completa y aplicabilidad. |
| ACT-084 | P1 | PRD (documento de requisitos del producto): qué problema resuelve, para quién, qué hace y qué NO hace | Pendiente de revisión completa y aplicabilidad. |
| ACT-085 | P1 | TRD (documento de requisitos técnicos): stack, arquitectura, servicios externos, límites de rendimiento y de seguridad | Pendiente de revisión completa y aplicabilidad. |
| ACT-086 | P2 | Flujos de usuario y pantallas (registro, login, acciones principales, errores) acordados antes de programar | Pendiente de revisión completa y aplicabilidad. |
| ACT-087 | P2 | Sistema de diseño mínimo (colores, tipografías, componentes, estados) para que la interfaz sea coherente | Pendiente de revisión completa y aplicabilidad. |
| ACT-088 | P1 | Esquema de base de datos (tablas, relaciones, quién puede leer y escribir cada cosa, qué datos son personales) | Pendiente de revisión completa y aplicabilidad. |
| ACT-089 | P2 | Estos documentos se guardan en el repositorio, se pasan a la IA como contexto y se actualizan cuando cambia el producto | Pendiente de revisión completa y aplicabilidad. |
| ACT-090 | P1 | constitution: principios no negociables del proyecto (seguridad, pruebas, modularidad, privacidad, accesibilidad) | Pendiente de revisión completa y aplicabilidad. |
| ACT-091 | P1 | specify: qué y por qué (usuarios, historias, criterios de aceptación), sin hablar aún de tecnología | Pendiente de revisión completa y aplicabilidad. |
| ACT-092 | P1 | clarify: resolver ambigüedades y marcar lo que falta antes de planificar | Pendiente de revisión completa y aplicabilidad. |
| ACT-093 | P1 | plan: arquitectura, tecnologías, modelo de datos y riesgos de seguridad/legales | Pendiente de revisión completa y aplicabilidad. |
| ACT-094 | P1 | tasks: tareas pequeñas, ordenadas y verificables, cada una con su prueba | Pendiente de revisión completa y aplicabilidad. |
| ACT-095 | P2 | analyze: comprobar que especificación, plan y tareas son coherentes entre sí y con la constitución | Pendiente de revisión completa y aplicabilidad. |
| ACT-096 | P2 | checklist (si tu versión lo incluye): generar listas de calidad de los requisitos antes de implementar | Pendiente de revisión completa y aplicabilidad. |
| ACT-097 | P1 | implement: ejecutar tarea a tarea; cada tarea acaba con pruebas en verde y revisión | Pendiente de revisión completa y aplicabilidad. |
| ACT-098 | P1 | La constitución incluye esta checklist como requisito: seguridad, privacidad, licencias y accesibilidad se piden desde el principio, no al final | Pendiente de revisión completa y aplicabilidad. |
| ACT-099 | P2 | Las especificaciones viven en el repositorio y se actualizan cuando cambia el comportamiento | Pendiente de revisión completa y aplicabilidad. |
| ACT-100 | P2 | Cada requisito trazable: especificación → tarea → commit → prueba | Pendiente de revisión completa y aplicabilidad. |
| ACT-101 | P1 | Rama principal protegida: sin push directo, PR obligatorio, CI en verde y al menos una revisión | Pendiente de revisión completa y aplicabilidad. |
| ACT-102 | P1 | Commits pequeños, atómicos y con mensajes claros (Conventional Commits) | Pendiente de revisión completa y aplicabilidad. |
| ACT-103 | P1 | .gitignore correcto; nunca subir .env, claves, bases de datos ni datos personales | Pendiente de revisión completa y aplicabilidad. |
| ACT-104 | P1 | Escáner de secretos (gitleaks, GitHub secret scanning) activo; si se filtra un secreto, se revoca y se rota, no basta con borrarlo | Pendiente de revisión completa y aplicabilidad. |
| ACT-105 | P2 | Plantillas de issue y PR con checklist (pruebas, seguridad, documentación) | Pendiente de revisión completa y aplicabilidad. |
| ACT-106 | P2 | Versionado semántico, etiquetas y CHANGELOG | Pendiente de revisión completa y aplicabilidad. |
| ACT-107 | P2 | CODEOWNERS para zonas críticas | Pendiente de revisión completa y aplicabilidad. |
| ACT-108 | P3 | Autenticación en GitHub con 2FA/claves de acceso y commits verificados | Pendiente de revisión completa y aplicabilidad. |
| ACT-109 | P1 | El usuario entiende en menos de 10 segundos qué hace la app y cuál es la acción principal | Pendiente de revisión completa y aplicabilidad. |
| ACT-110 | P1 | Cada acción da respuesta visible (cargando, éxito, error) y los errores dicen qué pasó y cómo arreglarlo | Pendiente de revisión completa y aplicabilidad. |
| ACT-111 | P1 | Acciones destructivas (borrar, pagar) piden confirmación o permiten deshacer | Pendiente de revisión completa y aplicabilidad. |
| ACT-112 | P1 | Formularios: etiquetas claras, validación en línea, no perder lo escrito al fallar | Pendiente de revisión completa y aplicabilidad. |
| ACT-113 | P1 | Accesibilidad WCAG 2.2 nivel AA: contraste, navegación por teclado, etiquetas para lectores de pantalla, texto alternativo, foco visible | Pendiente de revisión completa y aplicabilidad. |
| ACT-114 | P1 | Funciona en móvil (diseño adaptable, zonas táctiles ≥ 44 px) y en distintos tamaños de pantalla | Pendiente de revisión completa y aplicabilidad. |
| ACT-115 | P1 | Sin patrones engañosos (dark patterns): botones de rechazar tan visibles como los de aceptar, sin cuentas atrás falsas, sin casillas premarcadas, sin dificultar la baja | Pendiente de revisión completa y aplicabilidad. |
| ACT-116 | P2 | Prueba de usabilidad con 5 personas reales que no conozcan el proyecto | Pendiente de revisión completa y aplicabilidad. |
| ACT-117 | P2 | Estados vacíos, carga y error diseñados en todas las pantallas | Pendiente de revisión completa y aplicabilidad. |
| ACT-118 | P2 | Tiempos de carga aceptables (Core Web Vitals: LCP < 2,5 s) y uso sin conexión razonable | Pendiente de revisión completa y aplicabilidad. |
| ACT-119 | P2 | Textos claros, coherentes y revisados; preparados para varios idiomas (español/inglés) si procede | Pendiente de revisión completa y aplicabilidad. |
| ACT-120 | P2 | Onboarding corto; ayuda y contacto fáciles de encontrar | Pendiente de revisión completa y aplicabilidad. |
| ACT-121 | P2 | Banner de cookies y consentimiento sin patrones engañosos (el rechazar debe ser tan fácil como aceptar); el consentimiento se puede retirar en cualquier momento | Pendiente de revisión completa y aplicabilidad. |
| ACT-122 | P2 | Declaración de accesibilidad publicada y canal para comunicar problemas, si la ley te obliga (ver nota) | Pendiente de revisión completa y aplicabilidad. |
| ACT-123 | P3 | Modo oscuro, preferencias de movimiento reducido y tamaño de texto respetados | Pendiente de revisión completa y aplicabilidad. |
| ACT-124 | P3 | Métricas de uso respetuosas con la privacidad para mejorar la experiencia | Pendiente de revisión completa y aplicabilidad. |
| ACT-125 | P1 | Mapa de datos: qué datos personales recoges, para qué, dónde se guardan, quién accede y cuánto tiempo | Pendiente de revisión completa y aplicabilidad. |
| ACT-126 | P1 | Minimización: no pedir ni guardar datos que no necesitas | Pendiente de revisión completa y aplicabilidad. |
| ACT-127 | P1 | Base legal para cada tratamiento (consentimiento, contrato, interés legítimo...) documentada | Pendiente de revisión completa y aplicabilidad. |
| ACT-128 | P1 | Política de privacidad clara, accesible y real (que describa lo que de verdad hace la app); si la genera una IA, revisarla línea a línea contra el código real | Pendiente de revisión completa y aplicabilidad. |
| ACT-129 | P1 | Derechos del usuario implementados: acceso, rectificación, supresión, portabilidad, oposición; con plazo de respuesta de un mes | Pendiente de revisión completa y aplicabilidad. |
| ACT-130 | P1 | Borrado de cuenta real: elimina o anonimiza los datos también en copias de seguridad (con plazo definido), logs y proveedores externos | Pendiente de revisión completa y aplicabilidad. |
| ACT-131 | P1 | Contratos de encargado de tratamiento (DPA) con cada proveedor que toque datos (hosting, analítica, email, IA) | Pendiente de revisión completa y aplicabilidad. |
| ACT-132 | P1 | Transferencias fuera del EEE con garantías (cláusulas tipo, Data Privacy Framework) | Pendiente de revisión completa y aplicabilidad. |
| ACT-133 | P1 | Recursos de terceros que reciben la IP del visitante (Google Fonts, CDN, reCAPTCHA, mapas, vídeos incrustados): autoalojarlos o pedir consentimiento. Un tribunal de Múnich condenó en 2022 por usar Google Fonts desde los servidores de Google | Ensayo local limitado de arranque; otros recorridos y servicios pendientes. |
| ACT-134 | P1 | Grabación de sesiones, mapas de calor y analítica de comportamiento: desactivados por defecto, con consentimiento previo y con campos sensibles enmascarados | Pendiente de revisión completa y aplicabilidad. |
| ACT-135 | P1 | Cifrado y medidas de seguridad apropiadas; registro de actividades de tratamiento | Pendiente de revisión completa y aplicabilidad. |
| ACT-136 | P2 | Evaluación de impacto (EIPD) si hay datos sensibles, perfilado o tratamiento a gran escala | Pendiente de revisión completa y aplicabilidad. |
| ACT-137 | P2 | Procedimiento de brecha de seguridad: notificar a la AEPD en 72 horas y a los afectados si hay alto riesgo | Pendiente de revisión completa y aplicabilidad. |
| ACT-138 | P2 | Datos de menores: edad mínima y consentimiento parental (en España, 14 años); verificación de edad razonable si el público puede ser infantil | Pendiente de revisión completa y aplicabilidad. |
| ACT-139 | P2 | Usar datos personales para entrenar o ajustar modelos de IA exige base legal, información al usuario y posibilidad de oposición | Pendiente de revisión completa y aplicabilidad. |
| ACT-140 | P2 | Designar DPO si te obliga la norma | Pendiente de revisión completa y aplicabilidad. |
| ACT-141 | P1 | Aviso legal con identidad del titular (LSSI-CE) y datos de contacto | Pendiente de revisión completa y aplicabilidad. |
| ACT-142 | P1 | Términos y condiciones de uso, con limitación de responsabilidad, uso aceptable y ley aplicable; sin cláusulas abusivas con consumidores | Pendiente de revisión completa y aplicabilidad. |
| ACT-143 | P1 | Política de cookies y consentimiento previo para cookies no esenciales (incluye analítica salvo que cumpla las exenciones de la AEPD) | Pendiente de revisión completa y aplicabilidad. |
| ACT-144 | P1 | Correos comerciales solo con consentimiento previo (LSSI art. 21), identificando al remitente, con enlace de baja funcional y dirección de contacto | Pendiente de revisión completa y aplicabilidad. |
| ACT-145 | P1 | Reseñas, valoraciones y testimonios solo reales y verificables: prohibido inventarlos, comprarlos o pedir solo las positivas (Directiva de prácticas comerciales desleales y Ley de Competencia Desleal) | Pendiente de revisión completa y aplicabilidad. |
| ACT-146 | P2 | Si cobras: IVA, facturación, derecho de desistimiento de 14 días, condiciones de pago claras (consumidores) | Pendiente de revisión completa y aplicabilidad. |
| ACT-147 | P2 | Contratos a distancia con consumidores: función o botón de desistimiento visible en la interfaz (Directiva 2023/2673, obligatoria desde el 19 de junio de 2026) | Pendiente de revisión completa y aplicabilidad. |
| ACT-148 | P2 | Si hay suscripciones: precio total y renovación indicados antes de pagar, facilidad para cancelar (tan fácil como contratar) y avisos previos de renovación | Pendiente de revisión completa y aplicabilidad. |
| ACT-149 | P2 | Si alojas contenido de usuarios (comentarios, imágenes, perfiles): procedimiento de aviso y retirada, punto de contacto y moderación proporcionada (Reglamento de Servicios Digitales) | Pendiente de revisión completa y aplicabilidad. |
| ACT-150 | P2 | Si tienes usuarios en EE. UU. o tu dominio está allí: menores de 13 años (COPPA), baja de correos (CAN- SPAM), grabación de sesiones y wiretapping (CIPA en California), renovaciones automáticas, agente DMCA registrado y reseñas falsas (norma de la FTC). Las multas que citan los vídeos son por infracción y varían; verifica con un abogado del país | Pendiente de revisión completa y aplicabilidad. |
| ACT-151 | P1 | Elegir licencia para tu código (MIT, Apache-2.0, AGPL, propietaria) con archivo LICENSE y cabeceras | Pendiente de revisión completa y aplicabilidad. |
| ACT-152 | P1 | Compatibilidad de licencias de dependencias (cuidado con GPL/AGPL si quieres código cerrado) | Pendiente de revisión completa y aplicabilidad. |
| ACT-153 | P1 | Archivo NOTICE / THIRD-PARTY-LICENSES con atribuciones | Pendiente de revisión completa y aplicabilidad. |
| ACT-154 | P1 | Imágenes, fuentes, iconos, sonidos y datasets con licencia que permita tu uso | Pendiente de revisión completa y aplicabilidad. |
| ACT-155 | P1 | Respetar marcas y logos de terceros, usar referencias descriptivas de compatibilidad correctamente y revisar la disponibilidad del nombre propio. | Pendiente de revisión completa y aplicabilidad. |
| ACT-156 | P2 | Revisar la licencia y los términos de modelos de IA y APIs que uses (restricciones de uso, datos de entrenamiento, límites de uso comercial) | Pendiente de revisión completa y aplicabilidad. |
| ACT-157 | P2 | Contribuciones externas: CONTRIBUTING.md y DCO o CLA para saber con qué licencia entra el código ajeno; cabeceras SPDX en los archivos | Pendiente de revisión completa y aplicabilidad. |
| ACT-158 | P2 | Código, imágenes o textos generados con IA: la protección por derechos de autor exige aportación humana creativa; documenta tu parte y no des por hecho que son tuyos en exclusiva | Pendiente de revisión completa y aplicabilidad. |
| ACT-159 | P2 | Acuerdo de cesión o contrato con colaboradores, y cláusula de propiedad intelectual con tu empleador si el proyecto se hace en tu tiempo libre | Pendiente de revisión completa y aplicabilidad. |
| ACT-160 | P1 | Evaluar el ámbito y papel del proyecto bajo CRA, sus fechas y obligaciones, atendiendo a la actividad y monetización reales. | Pendiente de revisión completa y aplicabilidad. |
| ACT-161 | P1 | Evaluar responsabilidad por productos y transposición aplicable; distinguir software personal no comercial y futura oferta comercial. | Pendiente de revisión completa y aplicabilidad. |
| ACT-162 | P1 | Revisar prácticas prohibidas, transparencia, rol y plazos aplicables del AI Act vigente; no aplicar un calendario universal sin verificar el supuesto. | Pendiente de revisión completa y aplicabilidad. |
| ACT-163 | P2 | AI Act: clasificar tu sistema de IA por riesgo y documentar la conclusión; autoridad supervisora en España: AESIA | Pendiente de revisión completa y aplicabilidad. |
| ACT-164 | P2 | Greenwashing: afirmaciones ambientales ("verde", "eficiente", "sostenible", "Green AI") solo con datos medibles y verificables, sin genéricos ni compensaciones como argumento (Directiva 2024/825, aplicable desde el 27 de septiembre de 2026) | Pendiente de revisión completa y aplicabilidad. |
| ACT-165 | P2 | Sectores regulados (salud, finanzas, menores, educación): comprobar requisitos propios antes de lanzar | Pendiente de revisión completa y aplicabilidad. |
| ACT-166 | P2 | NIS2 si prestas servicios a entidades esenciales o importantes (verifica el estado de la transposición en España) | Pendiente de revisión completa y aplicabilidad. |
| ACT-167 | P2 | Si incluye hardware o dispositivos conectados (ESP32, sensores, pantallas): marcado CE, Directiva de equipos radioeléctricos con requisitos de ciberseguridad (desde el 1 de agosto de 2025), RoHS/RAEE, baterías y, si el producto genera datos de uso, Data Act (en vigor desde el 12 de septiembre de 2025) | Pendiente de revisión completa y aplicabilidad. |
| ACT-168 | P2 | Controles de exportación y sanciones si distribuyes cifrado o tecnología sensible a otros países | Pendiente de revisión completa y aplicabilidad. |
| ACT-169 | P1 | Solo analizas programas que has obtenido legítimamente (comprados, tuyos, con permiso o de código abierto); nada de copias pirata ni filtraciones | Pendiente de revisión completa y aplicabilidad. |
| ACT-170 | P1 | Documentar la base del análisis de software legítimamente obtenido: observación/estudio y, para interoperabilidad, los límites de descompilación; LPI 100.3, 100.5 y 100.6. | Pendiente de revisión completa y aplicabilidad. |
| ACT-171 | P1 | Leer la licencia (EULA) y las condiciones del programa o videojuego: pueden prohibir ciertos usos aunque la ley no; los juegos en línea suelen sancionar con bloqueo de cuenta | Pendiente de revisión completa y aplicabilidad. |
| ACT-172 | P1 | Revisar protección tecnológica y licencias antes de cualquier análisis; no eludir DRM, controles de licencia o anti-trampas ni publicar cracks o bypass. | Pendiente de revisión completa y aplicabilidad. |
| ACT-173 | P1 | No redistribuir código descompilado, recursos extraídos (modelos, texturas, audio, mapas) ni binarios de terceros en tu repositorio | Pendiente de revisión completa y aplicabilidad. |
| ACT-174 | P2 | Usar la ingeniería inversa para entender cómo funcionan tus propias aplicaciones, auditar cadena de suministro o interoperar es el uso más seguro; documenta el objetivo y la fecha en /compliance | Pendiente de revisión completa y aplicabilidad. |
| ACT-175 | P2 | Secretos, claves o datos personales que aparezcan en un binario analizado: no publicarlos, tratarlos con cuidado y avisar al titular | Pendiente de revisión completa y aplicabilidad. |
| ACT-176 | P2 | Vulnerabilidades halladas: divulgación responsable al fabricante, con plazo razonable, antes de publicar detalles | Pendiente de revisión completa y aplicabilidad. |
| ACT-177 | P2 | No subir binarios, código o documentos confidenciales de tu empresa o de clientes a servicios de IA externos sin autorización | Pendiente de revisión completa y aplicabilidad. |
| ACT-178 | P1 | Acceso a sistemas ajenos solo con autorización escrita del titular: el acceso o la interceptación sin permiso son delito (Código Penal, arts. 197 bis y siguientes) | Pendiente de revisión completa y aplicabilidad. |
| ACT-179 | P1 | README con uso permitido y prohibido: solo para sistemas propios o con permiso y fines educativos o de investigación; sin funciones de evasión de antivirus, ransomware, robo de credenciales ni persistencia | Pendiente de revisión completa y aplicabilidad. |
| ACT-180 | P2 | Las herramientas hechas "principalmente" para cometer delitos informáticos tienen riesgo penal (art. 197 ter): que el diseño, los ejemplos y el lenguaje del proyecto reflejen un propósito defensivo y docente | Pendiente de revisión completa y aplicabilidad. |
| ACT-181 | P2 | Controles técnicos mínimos: modo de solo lectura por defecto, confirmación antes de acciones que modifican y registro de lo que ejecuta el agente | Pendiente de revisión completa y aplicabilidad. |
| ACT-182 | P3 | Si recibes un requerimiento o denuncia (DMCA, EULA, fabricante): responder por escrito, retirar lo discutido si procede y consultar a un abogado | Pendiente de revisión completa y aplicabilidad. |
| ACT-183 | P1 | Entornos separados (desarrollo, pruebas, producción) y datos reales nunca en pruebas | Pendiente de revisión completa y aplicabilidad. |
| ACT-184 | P1 | Despliegue automatizado y repetible (CI/CD) con posibilidad de volver atrás en minutos | Pendiente de revisión completa y aplicabilidad. |
| ACT-185 | P1 | Copias de seguridad automáticas, cifradas, fuera del servidor principal y con restauración probada | Pendiente de revisión completa y aplicabilidad. |
| ACT-186 | P1 | Servidores y sistemas actualizados; solo los puertos y servicios necesarios abiertos; firewall activo | Pendiente de revisión completa y aplicabilidad. |
| ACT-187 | P1 | Acceso administrativo con 2FA, claves SSH (sin contraseña) y cuentas nominales | Pendiente de revisión completa y aplicabilidad. |
| ACT-188 | P2 | Registros centralizados, con retención definida y sin datos personales innecesarios | Pendiente de revisión completa y aplicabilidad. |
| ACT-189 | P2 | Alertas de caídas, errores y comportamientos anómalos | Pendiente de revisión completa y aplicabilidad. |
| ACT-190 | P2 | Correo del dominio con SPF, DKIM y DMARC; 2FA y bloqueo en el registrador de dominios; renovación controlada | Pendiente de revisión completa y aplicabilidad. |
| ACT-191 | P2 | Plan de respuesta a incidentes por escrito: quién decide, cómo se contiene, cómo se comunica (usuarios, AEPD, INCIBE-CERT, y CSIRT nacional si aplica el CRA), cómo se aprende | Pendiente de revisión completa y aplicabilidad. |
| ACT-192 | P2 | Seguimiento continuo de vulnerabilidades en tus dependencias y capacidad de publicar un parche rápido | Pendiente de revisión completa y aplicabilidad. |
| ACT-193 | P2 | Plan de continuidad y recuperación (objetivos de tiempo y de pérdida de datos) | Pendiente de revisión completa y aplicabilidad. |
| ACT-194 | P2 | Revisión de permisos y cuentas inactivas cada trimestre | Pendiente de revisión completa y aplicabilidad. |
| ACT-195 | P3 | Simulacro de incidente y de restauración al menos una vez al año | Pendiente de revisión completa y aplicabilidad. |
| ACT-196 | P3 | Política de fin de vida: qué pasa con los datos y los usuarios si cierras el proyecto | Pendiente de revisión completa y aplicabilidad. |
| ACT-197 | P1 | Descargo de responsabilidad claro ("tal cual", sin garantías) en README, licencia y términos; las licencias MIT/Apache ya lo incluyen | Pendiente de revisión completa y aplicabilidad. |
| ACT-198 | P1 | No prometer lo que no está probado: sin afirmaciones de "100 % seguro", "certificado" o "cumple X" si no hay evidencia | Pendiente de revisión completa y aplicabilidad. |
| ACT-199 | P1 | Dejar claro en la documentación para qué NO debe usarse el software (uso médico, industrial crítico, seguridad de personas) salvo validación específica | Pendiente de revisión completa y aplicabilidad. |
| ACT-200 | P1 | Datos personales reales de terceros fuera de repositorios, capturas y demos (incluidas las capturas y vídeos de pantalla) | Pendiente de revisión completa y aplicabilidad. |
| ACT-201 | P1 | Cuentas, dominios y repositorios del proyecto separados de los de tu empresa o empleador | Pendiente de revisión completa y aplicabilidad. |
| ACT-202 | P2 | Comprobar tu contrato laboral: pacto de exclusividad, propiedad intelectual y uso de medios de la empresa; no usar recursos, tiempo ni información confidencial de la empresa en proyectos personales | Pendiente de revisión completa y aplicabilidad. |
| ACT-203 | P2 | Distinguir entre proyecto personal y trabajo para tu empresa; si lo usas con tus técnicos o en la organización, dejarlo por escrito y autorizado | Pendiente de revisión completa y aplicabilidad. |
| ACT-204 | P2 | Decidir y dejar escrito si el proyecto es no comercial (software libre sin actividad económica) o comercial: de eso depende el CRA y la responsabilidad por producto. Revisarlo si añades pagos, soporte de pago, patrocinios a cambio de algo o una versión premium | Declarado: proyecto personal gratuito, sin ingresos ni uso empresarial. Revisar si cambia. |
| ACT-205 | P2 | Considerar una sociedad (SL) o autónomo con seguro de responsabilidad civil y ciber si vendes o das servicio a terceros | Pendiente de revisión completa y aplicabilidad. |
| ACT-206 | P2 | Contratos con clientes: alcance, responsabilidad limitada, propiedad intelectual, confidencialidad, mantenimiento | Pendiente de revisión completa y aplicabilidad. |
| ACT-207 | P2 | Guardar evidencias en /compliance: pruebas realizadas, informes de auditoría, decisiones, fechas y versión de cada norma consultada (tu defensa si hay reclamación) | Pendiente de revisión completa y aplicabilidad. |
| ACT-208 | P2 | Canal de contacto para vulnerabilidades y plan de respuesta; corregir rápido y comunicar con honestidad | Pendiente de revisión completa y aplicabilidad. |
| ACT-209 | P3 | Revisión anual por abogado de tecnología y protección de datos de la documentación legal | Pendiente de revisión completa y aplicabilidad. |
| ACT-210 | P3 | Cursos o certificación en seguridad y privacidad (ISO 27001/ENS como referencia) si el proyecto crece | Pendiente de revisión completa y aplicabilidad. |

## Revisión de una futura entrega

Estas casillas se aplican a la futura distribución evaluada. Este anexo documental no constituye esa entrega.

- [ ] **ACT-L01** P1 de secciones 1–10 con evidencia.
- [ ] **ACT-L02** CI, pruebas, análisis, secretos y dependencias sin altas/críticas abiertas.
- [ ] **ACT-L03** Tamaños de archivos/funciones dentro de límites acordados.
- [ ] **ACT-L04** PRD, TRD y Spec Kit coherentes.
- [ ] **ACT-L05** Revisión de inyecciones, acceso, secretos, CORS, datos y pruebas de intrusión.
- [ ] **ACT-L06** Sin secretos en frontend/historial; los expuestos revocados y rotados.
- [ ] **ACT-L07** SBOM, licencias, atribuciones y existencia/origen de paquetes IA verificados.
- [ ] **ACT-L08** Privacidad, términos, avisos y cookies fieles; recursos remotos revisados.
- [ ] **ACT-L09** Analítica, sesiones, correo con consentimiento y testimonios reales.
- [ ] **ACT-L10** Restauración real de respaldo superada.
- [ ] **ACT-L11** Plan de incidentes y contacto disponibles.
- [ ] **ACT-L12** Accesibilidad AA y pruebas con usuarios reales.
- [ ] **ACT-L13** Clasificación AI Act y transparencia documentadas.
- [x] **ACT-L14** Naturaleza comercial/no comercial decidida y documentada. Declaración personal documentada; revisar cambios de actividad.
- [ ] **ACT-L15** Descargos, límites de uso y uso autorizado en seguridad visibles.
- [ ] **ACT-L16** Revisión jurídica o decisión expresa documentada sobre esta fase.
- [ ] **ACT-L17** Vuelta atrás probada y responsable de seguimiento definido.

[Volver al resumen](README.md) · [Estado de la beta](../docs/ESTADO_BETA.md)
