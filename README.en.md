# AB MakerIDE SUPER · MS Robotika

**From an idea to verifiable firmware, with a local, open IDE.**

AB MakerIDE brings Arduino C++, MicroPython, board tools and optional coding agents into a Spanish-language interface. The application source is available under the [MIT license](LICENSE). External tools and AI providers retain their own licenses, accounts and costs.

MakerIDE does not include AI credits, subscriptions or free AI access. Each user connects their own provider account and uses their own quota. Codex has been tested in real use by the project author. Claude Code, chat connectors and Ollama remain experimental pending equivalent validation. An installed CLI does not establish a valid login or available quota.

Current status: **1.0.0-rc.1**, a release candidate validated locally on Windows. It is not yet a stable release or a fully validated cross-platform package.

## Features

- Local editor, project export and session recovery.
- Board catalog from installed toolchains, with board model and USB port selected separately.
- Compile, upload, serial monitor and hardware diagnostics.
- Optional Codex CLI and Claude Code integration with explicit execution permissions.
- Generated code can open in the editor with a backup, be saved as a sketch, or be exported with auxiliary files in a ZIP. Continuing a task and compiling preserve those files.
- A robot status indicator distinguishes running work, tool success, errors and unknown outcomes. Agent completion does not establish that firmware was uploaded or works on hardware.
- A local board test notebook records tool results separately from user observations, ties Arduino job results to the current source/target, and exports JSON. It does not run or upload firmware.

## Start on Windows

Install Python 3.10+ and Arduino CLI for Arduino builds. Run INICIAR_WINDOWS.bat from the project folder, then use http://127.0.0.1:8770. Optional serial/MicroPython dependencies are listed in requirements.txt. The editor does not require an AI account. AI features require their provider setup and may incur usage costs.

Keep previous versions and export existing projects before migrating. The local server stores its data under .makeride-data unless AB_MAKERIDE_DATA_DIR is set. Do not expose the server to a public network. Agent permissions are described in the UI; supervised mode is not an operating-system sandbox.

## Evidence

The single-file [IdeaSpark radar](examples/ideaspark_114_radar.ino), using ESP32 and ST7789, was compiled and uploaded to COM4 with user authorization and programmer verification. The user confirmed the radar appeared on the display. Its four echoes are simulated, with no distance sensor. [Exact profile and logs](docs/evidence/radar-ideaspark/README.md).

The latest local suite has 199 passing Python tests and 4 skipped due to missing g++; 37 targeted browser checks pass. Browser agent execution is stubbed and does not flash hardware. Cross-platform CI is prepared but has not run on GitHub. [Evidence](docs/evidence/board-trials/README.md).

[Spanish documentation](README.md) · [Contributing](CONTRIBUTING.md) · [Project saving](docs/PROYECTOS_DEL_AGENTE.md) · [Release notes](CHANGELOG.md)
