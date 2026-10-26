"""Deterministic wiring preflight; conservative advisory, never a safety certification.

Does not assume an electrical circuit is safe or physically wired correctly.
All module endpoints accept JSON data only, without executing user inputs.
"""

from __future__ import annotations
import re

ESP_PROFILE = {
    "board": "esp32:esp32:esp32",
    "chip": "ESP32 clásico",
    "max_gpio_voltage": 3.3,
    "reserved_flash": [6, 7, 8, 9, 10, 11],
    "strap": [0, 2, 4, 5, 12, 15],
    "input_only": [34, 35, 36, 39],
    "adc1": [32, 33, 34, 35, 36, 39],
    "adc2": [0, 2, 4, 12, 13, 14, 15, 25, 26, 27],
}
PROFILES = {
    "board-unspecified": {
        "title": "Placa/pantalla sin perfil físico confirmado",
        "pins": {},
        "resolution": None,
        "verified": False,
        "notes": "El FQBN es el perfil de compilación seleccionado. No presupone un ESP32 ni identifica pantalla, táctil o conexiones. Preguntar por los datos físicos que necesite el proyecto.",
    },
    "esp32-cyd-28": {
        "title": "CYD ESP32-2432S028R · 2,8″ ILI9341 + XPT2046",
        "pins": {
            "MISO": 12,
            "MOSI": 13,
            "SCLK": 14,
            "CS": 15,
            "DC": 2,
            "BL": 21,
            "TOUCH_CLK": 25,
            "TOUCH_MOSI": 32,
            "TOUCH_MISO": 39,
            "TOUCH_CS": 33,
            "TOUCH_IRQ": 36,
            "SD_CS": 5,
            "SD_CLK": 18,
            "SD_MISO": 19,
            "SD_MOSI": 23,
        },
        "resolution": [240, 320],
        "verified": False,
        "notes": "Perfil documental para ESP32-2432S028R original. Confirmar serigrafía/revisión. No detectado por CH340 ni por firma ESP32. Pantalla y táctil usan buses separados; TFT RST ligado a reset (-1). SD no inicializada por defecto.",
        "source": "https://github.com/witnessmenow/ESP32-Cheap-Yellow-Display/blob/main/PINS.md",
    },
    "esp32-generic": {
        "title": "ESP32 clásico — Dev Module",
        "pins": {},
        "resolution": None,
        "verified": False,
        "notes": "Perfil genérico: verificar pines de tu revisión física.",
    },
    "ideaspark-19": {
        "title": "IdeaSpark ESP32 + TFT ST7789 1,9″",
        "pins": {"MOSI": 23, "SCLK": 18, "CS": 15, "DC": 2, "RST": 4, "BL": 32},
        "resolution": [170, 320],
        "verified": True,
        "notes": "Combinación ensayada con el dispositivo del usuario. No implica compatibilidad con otras revisiones.",
    },
    "ideaspark-114": {
        "title": "IdeaSpark ESP32 + TFT ST7789 1,14″",
        "pins": {"MOSI": 23, "SCLK": 18, "CS": 15, "DC": 2, "RST": 4, "BL": 32},
        "resolution": [135, 240],
        "verified": False,
        "notes": "Mapeo provisional. Confirmar serigrafía y documentación de la placa.",
    },
}
COMPONENTS = {
    "led": {"label": "LED + resistencia", "direction": "output"},
    "button": {"label": "Pulsador", "direction": "input"},
    "analog": {"label": "Sensor analógico 0–3,3 V", "direction": "analog"},
    "dht22": {"label": "DHT22 (GPIO digital)", "direction": "bidir"},
    "relay": {"label": "Módulo relé", "direction": "output"},
    "servo": {"label": "Servomotor", "direction": "output"},
}
VALID_GPIO = set(range(0, 20)) | set(range(21, 24)) | set(range(25, 28)) | set(range(32, 40))


def public_profiles():
    return {"ok": True, "profiles": PROFILES, "components": COMPONENTS, "esp32": ESP_PROFILE}


def check(profile: str, connections: list, *, wifi: bool = False) -> dict:
    if profile not in PROFILES:
        raise ValueError("Perfil de hardware no reconocido.")
    if not isinstance(connections, list) or len(connections) > 32:
        raise ValueError("Se admite una lista de hasta 32 conexiones.")
    if not isinstance(wifi, bool):
        raise ValueError("El estado de Wi-Fi debe ser booleano.")
    used: dict[int, int] = {}
    issues = []
    boardpins = PROFILES[profile]["pins"]
    board_used = {p: name for name, p in boardpins.items()}

    def issue(severity, code, message, row=None):
        issues.append({"severity": severity, "code": code, "message": message, "row": row})

    for i, conn in enumerate(connections):
        if not isinstance(conn, dict):
            raise ValueError(f"Conexión {i + 1} no es un objeto.")
        kind, gpio, voltage = conn.get("kind"), conn.get("gpio"), conn.get("voltage", 3.3)
        if kind not in COMPONENTS:
            raise ValueError(f"Componente no admitido en conexión {i + 1}.")
        if isinstance(gpio, bool) or not isinstance(gpio, int) or gpio not in VALID_GPIO:
            raise ValueError(f"GPIO inválido en conexión {i + 1}.")
        if (
            isinstance(voltage, bool)
            or not isinstance(voltage, (float, int))
            or not 0 <= voltage <= 24
        ):
            raise ValueError(f"Tensión inválida en conexión {i + 1}.")
        if gpio in used:
            issue(
                "error",
                "gpio_conflict",
                f"GPIO{gpio}: dos componentes comparten señal; verificar bus y cableado.",
                i,
            )
        used[gpio] = i
        if gpio in board_used:
            issue(
                "error",
                "display_conflict",
                f"GPIO{gpio} reservado a pantalla {board_used[gpio]} en este perfil.",
                i,
            )
        if gpio in ESP_PROFILE["reserved_flash"]:
            issue("error", "flash_reserved", f"GPIO{gpio} suele reservarse para Flash interna.", i)
        if gpio in ESP_PROFILE["input_only"] and COMPONENTS[kind]["direction"] in (
            "output",
            "bidir",
        ):
            issue("error", "input_only", f"GPIO{gpio} solo admite entrada en ESP32 clásico.", i)
        if kind == "analog" and gpio not in ESP_PROFILE["adc1"] + ESP_PROFILE["adc2"]:
            issue(
                "error", "no_adc", f"GPIO{gpio} no es un canal ADC utilizable en ESP32 clásico.", i
            )
        if kind == "analog" and wifi and gpio in ESP_PROFILE["adc2"]:
            issue(
                "warning",
                "wifi_adc2",
                f"GPIO{gpio} usa ADC2, que puede entrar en conflicto con Wi-Fi.",
                i,
            )
        if gpio in ESP_PROFILE["strap"]:
            issue(
                "warning",
                "strapping",
                f"GPIO{gpio} es pin de arranque; la carga externa puede impedir iniciar o grabar.",
                i,
            )
        if voltage > 3.3:
            issue(
                "error",
                "overvoltage",
                f"{voltage:g} V en GPIO{gpio}: los GPIO del ESP32 NO son tolerantes a 5 V.",
                i,
            )
        if kind == "led":
            issue(
                "info",
                "led_resistor",
                "LED: incorporar resistencia limitadora y comprobar polaridad.",
                i,
            )
        if kind == "button":
            issue(
                "info",
                "button_bias",
                "Pulsador: utilizar pull-up/pull-down adecuado. GPIO34–39 no tienen pull-up/down interno.",
                i,
            )
        if kind == "dht22":
            issue(
                "info",
                "dht_pullup",
                "DHT22: verificar alimentación de 3,3 V y resistencia pull-up en la línea de datos.",
                i,
            )
        if kind == "relay":
            issue(
                "warning",
                "relay_driver",
                "Relé: no alimentar la bobina directamente del GPIO. Usar driver/aislamiento y diodo apropiado.",
                i,
            )
        if kind == "servo":
            issue(
                "warning",
                "servo_power",
                "Servo: fuente adecuada externa, masa compartida y señal de nivel compatible.",
                i,
            )
    severity = {"error": 0, "warning": 1, "info": 2}
    issues.sort(key=lambda x: severity[x["severity"]])
    errors = sum(i["severity"] == "error" for i in issues)
    warnings = sum(i["severity"] == "warning" for i in issues)
    return {
        "ok": True,
        "profile": profile,
        "connections": len(connections),
        "errors": errors,
        "warnings": warnings,
        "issues": issues,
        "ready_for_review": errors == 0,
        "disclaimer": "Análisis lógico preliminar: NO comprueba físicamente tensión, consumo, continuidad, polaridad ni aislamiento.",
    }


def inspect_sketch(profile: str, code: str) -> dict:
    """Report explicit TFT pin macros; never infer physical connections from all source."""
    if not isinstance(code, str) or len(code) > 300_000:
        raise ValueError("Sketch demasiado grande o inválido.")
    if profile not in PROFILES:
        raise ValueError("Perfil desconocido.")
    pinmap = PROFILES[profile]["pins"]
    warnings = []
    for signal, physical in pinmap.items():
        found = re.search(r"^\s*#define\s+(?:TFT|LCD)_" + signal + r"\s+(\d+)\s*$", code, re.M)
        if found and int(found.group(1)) != physical:
            warnings.append(f"{signal}={found.group(1)} difiere del perfil GPIO{physical}.")
    return {"ok": True, "warnings": warnings, "profile": profile, "pins": pinmap}
