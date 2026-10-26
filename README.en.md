# AB MakerIDE SUPER · MS Robotika

[![Checks](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml/badge.svg)](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml) · [MIT](LICENSE) · [Download RC4](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/tag/v1.0.0-rc.4) · [Spanish documentation](README.md)

A local editor and optional coding agent for Arduino, ESP32 and MicroPython. Ask for a project in chat, work with its code, and distinguish code generation, compilation, verified upload and physical observation.

**AI credits are not included.** Each user connects their own provider account and uses their own quota. Codex has been tested in real use by the author. Claude Code, chat connectors and Ollama remain experimental pending equivalent validation.

RC4 opens with an **empty editor, chat and task**. AI preferences are remembered per browser profile. Save explicitly using **Guardar proyecto / Ctrl+S**; agent projects download as source ZIPs with current editor changes and auxiliary files. Import reopens the saved project without running an agent or firmware. Drafts and undo copies live in RAM. Operational agent workspaces/journals remain available for explicit diagnostics or recovery and are never replayed automatically.

Codex/Claude chat now routes to a real task with its execution consent. The selected physical profile and a local LCD/touch reference accompany the agent. Codex evidence is read from successful completed command events, not from quoted code or assistant claims. If an upload was requested but verification is absent, the task remains incomplete even when the CLI exits with zero. A known firmware marker can report a CYD profile; it is not independent LCD detection and USB bridges do not establish a commercial model.

On Windows, install Python 3.10+, extract to a new folder and open INICIAR_WINDOWS.bat (default http://127.0.0.1:8770). PREPARAR_WINDOWS.bat prepares optional serial/MicroPython dependencies in that copy's private venv. Arduino builds also need Arduino CLI and the board core. Preserve existing installations and files. [Installation guide](docs/INSTALACION.md).

Six specific physical devices are documented: IdeaSpark radar, ESP32-CAM, WROOM/MicroPython, Nano, Mega and CYD. The CYD [Space Invaders test](docs/evidence/cyd-space-invaders/README.md) includes two matching flash backups, a complete build, four verified upload blocks and a serial marker; the user subsequently confirmed the game. It does not establish every screen revision, touch control or long-duration scenario. [Hardware matrix](docs/MATRIZ_HARDWARE.md).

The [MCP panel](docs/MCP.md) accepts stdio and Streamable HTTP. **Codex defaults to manual approvals in the IDE.** Automatic approval is explicit, off on opening, and applies only to that run. Claude Code manual MCP approvals are not integrated: that combination is blocked rather than silently approving tools. Claude live execution remains unvalidated.

MCP settings use Windows user-bound DPAPI or a supported system keyring on Linux/macOS. Without a secure keyring, new settings remain in memory only. Claude's temporary file uses environment references rather than secret values. Existing plaintext settings migrate only when secure storage is available.

RC4 splits the frontend into ES modules and Python services into `ab_makeride/`, removes HTML string sinks and inline styles, and tightens CSP. The version comes from `VERSION`. Ruff, ESLint, Prettier, manifest verification, Dependabot and Windows/Ubuntu/macOS CI are included. [Development](docs/DESARROLLO.md) · [Linux/macOS preparation and serial permissions](docs/LINUX_MACOS.md).

Local RC4 validation: **294 passing unit tests out of 299**, five platform/tool/privilege skips, and **196 browser checks** across eight controlled flows. The installed Codex/account exercised a manually approved local MCP tool. No new firmware was uploaded for this security review. [Evidence and limits](docs/evidence/rc4/README.md). The original video is a Release asset; it remains in older Git commits because history has not been rewritten.

This is a release candidate, physically validated on Windows. [Security policy](SECURITY.md) · [Contributing](CONTRIBUTING.md) · [Discussions](https://github.com/msrobotika/AB-MakerIDE-SUPER/discussions)

[AI accounts and an online free-tier option](docs/IA_Y_CUOTAS.md).

[Real RC4 manual CYD upload](docs/evidence/cyd-rc4/README.md): checked backup, one submission through the IDE, four verified images, Ctrl+S export and user-confirmed display/touch.
