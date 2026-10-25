# AB MakerIDE SUPER · MS Robotika

[![Checks](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml/badge.svg)](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml) [![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**[Download RC2](https://github.com/msrobotika/AB-MakerIDE-SUPER/releases/tag/v1.0.0-rc.2)** · [Report an issue](https://github.com/msrobotika/AB-MakerIDE-SUPER/issues/new/choose) · [Share your projects and board tests](https://github.com/msrobotika/AB-MakerIDE-SUPER/discussions)

**From an idea to verifiable firmware, with a local, open IDE.**

AB MakerIDE brings Arduino C++, MicroPython, board tools and optional coding agents into a Spanish-language interface. The application source is available under the [MIT license](LICENSE). External tools and AI providers retain their own licenses, accounts and costs.

MakerIDE does not include AI credits, subscriptions or free AI access. Each user connects their own provider account and uses their own quota. Codex has been tested in real use by the project author. Claude Code, chat connectors and Ollama remain experimental pending equivalent validation. An installed CLI does not establish a valid login or available quota.

Current status: **1.0.0-rc.2**, a release candidate validated locally on Windows. It is not yet a stable release or a fully validated cross-platform package.

## Features

- Local editor, project export and session recovery.
- Board catalog from installed toolchains, with automatic port/installed profile selection for an identifiable single board. Manual choices take priority; USB bridges do not identify a screen or commercial model.
- Compile, upload, serial monitor and hardware diagnostics.
- A physical CYD ILI9341/XPT2046 touch game opens in the editor with a backup. Agents target the board; an auxiliary desktop window requires explicit opt-in. [Identification and limits](docs/IDENTIFICACION_AUTOMATICA.md).
- Optional Codex CLI and Claude Code integration with explicit execution permissions.
- Generated code can open in the editor with a backup, be saved as a sketch, or be exported with auxiliary files in a ZIP. Continuing a task and compiling preserve those files.
- A robot status indicator distinguishes running work, tool success, errors and unknown outcomes. Agent completion does not establish that firmware was uploaded or works on hardware.
- A bounded [digital sequence simulator](docs/SIMULADOR.md) displays up to eight Arduino C++ or MicroPython outputs with traces, pause, stepping, reset and playback speed. It does not connect to hardware or execute firmware.
- A local board test notebook records tool results separately from user observations, ties Arduino job results to the current source/target, and exports JSON. It does not run or upload firmware.

## Start on Windows

Install Python 3.10+ and run INICIAR_WINDOWS.bat from the extracted project folder. It checks required files, the data directory and the local port before starting. The editor and simulator work without optional tools. PREPARAR_WINDOWS.bat installs serial/MicroPython dependencies in this copy's private .venv; restart the launcher afterward. Arduino builds also require Arduino CLI and the board core, installed separately. AI features require each user's own provider account and usage costs. [Installation and recovery guide](docs/INSTALACION.md).

Keep previous versions and export existing projects before migrating. INICIAR_WINDOWS_8771.bat can start a separate copy on port 8771 when an earlier instance occupies 8770; browser projects are separate per origin. The local server stores its data under .makeride-data unless AB_MAKERIDE_DATA_DIR is set. Do not expose the server to a public network. Agent permissions are described in the UI; supervised mode is not an operating-system sandbox.

## Evidence

The [CYD touch game](examples/cyd_28_bloques_tactil.ino) was backed up, compiled and uploaded with user authorization and programmer verification. The user confirmed that pieces fall without flicker and touch controls work. This is a specific board observation, not universal compatibility. [Scope and evidence](docs/evidence/cyd/README.md).

The single-file [IdeaSpark radar](examples/ideaspark_114_radar.ino), using ESP32 and ST7789, was compiled and uploaded to COM4 with user authorization and programmer verification. The user confirmed the radar appeared on the display. Its four echoes are simulated, with no distance sensor. [Exact profile and logs](docs/evidence/radar-ideaspark/README.md).

An AI-Thinker pinout ESP32-CAM was also backed up and programmed with user authorization. Serial diagnostics detected PSRAM and an OV3660 sensor, reporting five 320x240 JPEG buffers without errors over 16 seconds. Images were not transmitted or visually evaluated. [Exact tested code and logs](docs/evidence/esp32cam/README.md). These board-specific tests do not establish universal compatibility.

An ESP32-WROOM with a CP2102 bridge was backed up and flashed with official MicroPython 1.29.0 after user authorization. A finite RAM test passed five memory/arithmetic/JSON/timing samples and read filesystem capacity. The missing Windows driver was installed from a signed Microsoft Catalog package. No GPIO or networking was tested, and no main.py was saved. [Code and logs](docs/evidence/wroom-micropython/README.md).

An **ATmega328P Arduino Nano using the old-bootloader profile** passed an authorized upload with prior flash/EEPROM backup and independent verification. Five serial diagnostic samples passed and EEPROM contents remained unchanged. GPIO and external peripherals were not tested. [Exact code and logs](docs/evidence/arduino-nano/README.md).

An **Arduino Mega 2560** passed an authorized upload with prior 256 KB flash and 4 KB EEPROM backups, independent verification and five successful serial diagnostic samples. EEPROM contents remained unchanged. External GPIO and other peripherals were not tested. [Exact code and logs](docs/evidence/arduino-mega/README.md).



The RC2 local suite has 254 passing Python tests and 4 skipped (three require g++; one requires Windows symlink privileges). Agent projects and connection recovery pass 38 and 21 browser checks, respectively; the simulator has 26 and automatic selection has 19. Browser agent execution and serial failures are controlled; these checks do not flash hardware. [Local security evidence](docs/evidence/local-security/README.md). [GitHub Actions](https://github.com/msrobotika/AB-MakerIDE-SUPER/actions/workflows/checks.yml) runs the unit suite on Windows and Linux and the browser checks in Chromium. CI results do not establish launcher or physical device compatibility on those operating systems. The [security policy](SECURITY.md) explains loopback binding, exact Host/Origin checks, per-process POST tokens and path restrictions.

[Spanish documentation](README.md) · [Contributing](CONTRIBUTING.md) · [Project saving](docs/PROYECTOS_DEL_AGENTE.md) · [Release notes](CHANGELOG.md)
