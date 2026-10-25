# Seguridad del servidor local

MakerIDE se ejecuta en el equipo del usuario. No está diseñado para publicarse en una red, detrás de un proxy, mediante un túnel ni como servicio multiusuario.

## Límites comprobados en RC1

| Pregunta | Comportamiento del código |
| --- | --- |
| ¿Dónde escucha? | `server.py` enlaza únicamente `127.0.0.1`. Acepta Host `127.0.0.1:<puerto>` o `localhost:<puerto>`, con el puerto real del servidor, y rechaza cabeceras duplicadas. El puerto habitual es 8770. |
| ¿Puede otra página lanzar tareas? | Todo POST exige `X-AB-Session`, generado aleatoriamente al iniciar el proceso. Host y Origin deben corresponder al servidor local; cuando existe Origin, debe coincidir en esquema HTTP, nombre y puerto. Sec-Fetch-Site bloquea peticiones de otros sitios y de otros orígenes del mismo sitio. No se habilita CORS. |
| ¿Cómo obtiene el editor el token? | Lee `/api/session` desde su propio origen. La respuesta no se almacena en caché y está sujeta a los mismos controles de Host/Origin. El token no va en URLs, HTML ni cookies. Las herramientas locales sin Origin pueden usar la API si obtienen y envían el token. |
| ¿Cómo se ejecutan comandos? | Los procesos del IDE reciben listas de argumentos; no se activa `shell=True`. La tarea del agente se transmite por stdin. Modelo, puerto, bibliotecas y acciones tienen validación o listas permitidas. |
| ¿Pueden los nombres escapar de la carpeta? | Los archivos principales son nombres fijos y las sesiones usan identificadores generados/validados. Los auxiliares rechazan rutas absolutas, `..`, barras de Windows, ADS, nombres reservados, caracteres de control y colisiones. La lectura/escritura del almacén rechaza enlaces simbólicos, uniones y puntos de reanálisis. No se exportan archivos con enlaces duros. |

El token es una defensa frente a peticiones cruzadas del navegador, no una contraseña contra otros procesos del mismo usuario. Un proceso local puede consultar la API. MakerIDE tampoco aísla un agente al que el usuario haya concedido permisos amplios: ese agente y las herramientas de compilación conservan sus capacidades propias. Revisa código, dependencias y permisos antes de ejecutar proyectos ajenos.

Las comprobaciones de rutas bloquean enlaces preexistentes. No son una garantía frente a un proceso con los mismos permisos que altere el sistema de archivos de manera concurrente. Para ejecutar código o agentes no confiables, utiliza aislamiento del sistema operativo.

## Revisión y pruebas

La [revisión del 25 de octubre de 2026](docs/evidence/local-security/README.md) incluye peticiones HTTP reales, directorios temporales, una unión NTFS real en Windows y pruebas controladas de interfaz. No es una auditoría independiente ni una certificación de ausencia de vulnerabilidades. Los resultados de cada revisión en GitHub se pueden consultar en [Comprobaciones](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml).

## Comunicar un problema

Usa el apartado Security del repositorio para comunicar vulnerabilidades de forma privada cuando esté disponible. Incluye versión o commit, pasos de reproducción y alcance, sin credenciales ni datos personales. Los fallos ordinarios de interfaz se pueden comunicar mediante Issues.
