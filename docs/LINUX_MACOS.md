# Linux y macOS

Se incluyen lanzadores POSIX y comprobaciones de arranque en CI para Ubuntu y macOS. La validación física publicada de las placas sigue siendo en Windows; CI no verifica controladores USB, llaveros de escritorio, pantallas ni dispositivos conectados.

## Preparación

Con Python 3.10 o posterior, extrae la entrega completa y conserva tus proyectos anteriores. En un terminal situado en esa carpeta:

```sh
bash preparar_linux_mac.sh
bash iniciar_linux_mac.sh
```

La preparación instala `requirements.txt` en la `.venv` de esa copia (serie, MicroPython y acceso a llavero); no usa `sudo pip`, no modifica Python global ni instala firmware. Algunas distribuciones separan `python3-venv` en su gestor de paquetes. El arranque elige `.venv/bin/python` y, si no existe, `python3`; editor y simulador pueden funcionar sin dependencias opcionales.

Arduino necesita Arduino CLI y el núcleo correcto, instalados por separado. `AB_MAKERIDE_ARDUINO_CLI` permite indicar una ruta. La IA es opcional y cada usuario autentica su CLI oficial. La preparación no instala Codex/Claude ni incluye suscripciones.

```sh
bash iniciar_linux_mac.sh --check --json --port 8770
bash iniciar_linux_mac.sh --port 8771
```

El diagnóstico no abre puertos serie ni escribe firmware. Un puerto TCP ocupado se informa sin cerrar el proceso existente. La escucha sigue siendo solo `127.0.0.1`.

El almacén rechaza rutas con enlaces simbólicos. Si eliges una carpeta de datos temporal en macOS, usa su ruta física (por ejemplo `/private/var/...`), porque `/var` es un alias del sistema. Las fixtures de CI usan la ruta temporal canónica sin desactivar estas comprobaciones.

## Puertos serie

**Linux:** revisa los permisos del dispositivo (`/dev/ttyUSB*` o `/dev/ttyACM*`). En distribuciones que usan el grupo `dialout`, añade tu usuario a ese grupo siguiendo la guía de Arduino y vuelve a iniciar sesión. Otras usan `uucp`; comprueba el grupo real. No ejecutes el IDE como root ni apliques permisos universales `666` para ocultar el problema.

Algunas placas cambian de puerto al entrar en su bootloader y necesitan las reglas udev del fabricante o del núcleo oficial. Instala únicamente reglas para el dispositivo correspondiente, con permisos de grupo limitados; no una regla general de acceso a todos los USB. Un proceso como un monitor serie también puede mantener el puerto ocupado.

**macOS:** suele utilizarse `/dev/cu.*` para conexiones salientes. El cable debe transportar datos; ciertos conversores necesitan el controlador oficial correspondiente. No se identifica una pantalla por el nombre del conversor. Si hay varios puertos o perfiles ambiguos, selecciona el destino explícitamente.

Guía oficial: [Arduino: resolver acceso al puerto en Linux](https://support.arduino.cc/hc/en-us/articles/360016495679-Fix-port-access-on-Linux).

## Credenciales MCP

macOS usa Keychain mediante `keyring`; Linux necesita un servicio compatible, por ejemplo SecretService o KWallet. Un entorno headless o un llavero bloqueado puede impedir persistir. El IDE informa del estado y nunca utiliza un archivo en texto plano como alternativa. La configuración nueva puede permanecer solo en RAM hasta cerrar el servidor. Consulta [MCP](MCP.md) para migración de configuraciones antiguas y límites de la protección.
