# AB MakerIDE SUPER · MS Robotika

[![Checks](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml/badge.svg)](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml) · [MIT](LICENSE) · [Download RC3](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/tag/v1.0.0-rc.3) · [Spanish documentation](README.md)

A local editor and optional coding agent for Arduino, ESP32 and MicroPython. Ask for a project in chat, work with its code, and distinguish code generation, compilation, verified upload and physical observation.

**AI credits are not included.** Each user connects their own provider account and uses their own quota. Codex has been tested in real use by the author. Claude Code, chat connectors and Ollama remain experimental pending equivalent validation.

RC3 opens with an **empty editor, chat and task**. AI preferences are remembered per browser profile. Save explicitly using **Guardar proyecto / Ctrl+S**; agent projects download as source ZIPs with current editor changes and auxiliary files. Import reopens the saved project without running an agent or firmware. Drafts and undo copies live in RAM. Operational agent workspaces/journals remain available for explicit diagnostics or recovery and are never replayed automatically.

Codex/Claude chat now routes to a real task with its execution consent. The selected physical profile and a local LCD/touch reference accompany the agent. Codex evidence is read from successful completed command events, not from quoted code or assistant claims. If an upload was requested but verification is absent, the task remains incomplete even when the CLI exits with zero. A known firmware marker can report a CYD profile; it is not independent LCD detection and USB bridges do not establish a commercial model.

On Windows, install Python 3.10+, extract to a new folder and open INICIAR_WINDOWS.bat (default http://127.0.0.1:8770). PREPARAR_WINDOWS.bat prepares optional serial/MicroPython dependencies in that copy's private venv. Arduino builds also need Arduino CLI and the board core. Preserve existing installations and files. [Installation guide](docs/INSTALACION.md).

Six specific physical devices are documented: IdeaSpark radar, ESP32-CAM, WROOM/MicroPython, Nano, Mega and CYD. The CYD [Space Invaders test](docs/evidence/cyd-space-invaders/README.md) includes two matching flash backups, a complete build, four verified upload blocks and a serial marker; the user subsequently confirmed the game. It does not establish every screen revision, touch control or long-duration scenario. [Hardware matrix](docs/MATRIZ_HARDWARE.md).

The [MCP panel](docs/MCP.md) accepts standard stdio and Streamable HTTP configurations for CLI agents, with explicit per-task consent. Both transports have been exercised with the installed Codex/account and controlled local MCP tools, including authenticated HTTP. Claude Code remains pending equivalent live validation; selecting a chat model alone does not provide MCP execution.

Local RC3 validation: 277 passing unit tests out of 281, four skipped for g++/Windows symlink privileges; 148 browser checks across six controlled flows and 41 additional acceptance checks including a real Uno compile. Real installed Codex CLI/account and chat routing were also checked in read-only mode without hardware. CI runs units on Windows/Linux and browser checks on Chromium; these are not physical device or interactive installation validations for those platforms. [Evidence](docs/evidence/rc3/README.md).

This is a release candidate, physically validated on Windows. [Security policy](SECURITY.md) · [Contributing](CONTRIBUTING.md) · [Discussions](https://github.com/msrobotika/AB-MakerIDE-SUPER/discussions)
