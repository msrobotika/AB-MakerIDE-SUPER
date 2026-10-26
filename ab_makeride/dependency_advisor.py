"""Deterministic, offline first library advisor. Never installs automatically.

A suggestion is not a dependency guarantee: Arduino libraries can define arbitrary
headers and cores supply other headers. Compile is the authoritative check.
"""

from __future__ import annotations
import re

# Exact filename -> Arduino Library Manager display name (only tested, curated matches).
KNOWN = {
    "Adafruit_GFX.h": "Adafruit GFX Library",
    "Adafruit_ST7789.h": "Adafruit ST7735 and ST7789 Library",
    "Adafruit_ST7735.h": "Adafruit ST7735 and ST7789 Library",
    "Adafruit_BusIO_Register.h": "Adafruit BusIO",
    "Adafruit_Sensor.h": "Adafruit Unified Sensor",
    "DHT.h": "DHT sensor library",
    "DHT_U.h": "DHT sensor library",
    "ArduinoJson.h": "ArduinoJson",
    "ESP32Servo.h": "ESP32Servo",
    "PubSubClient.h": "PubSubClient",
    "FastLED.h": "FastLED",
    "Adafruit_NeoPixel.h": "Adafruit NeoPixel",
    "DallasTemperature.h": "DallasTemperature",
    "OneWire.h": "OneWire",
    "TFT_eSPI.h": "TFT_eSPI",
    "U8g2lib.h": "U8g2",
    "LiquidCrystal_I2C.h": "LiquidCrystal I2C",
    "MFRC522.h": "MFRC522",
    "AccelStepper.h": "AccelStepper",
    "HX711.h": "HX711 Arduino Library",
}
BUILTIN = {
    "Arduino.h",
    "SPI.h",
    "Wire.h",
    "WiFi.h",
    "WiFiClient.h",
    "WiFiClientSecure.h",
    "EEPROM.h",
    "FS.h",
    "SD.h",
    "BLEDevice.h",
    "Preferences.h",
    "HardwareSerial.h",
    "HTTPClient.h",
    "ESPmDNS.h",
    "WebServer.h",
    "esp_now.h",
    "esp_wifi.h",
    "pgmspace.h",
    "math.h",
    "stdio.h",
    "stdint.h",
    "string.h",
    "stdlib.h",
}
HEADER = re.compile(r'^\s*#\s*include\s*[<"]([^>"\r\n]{1,120})[>"]', re.M)
MISSING_ERROR = re.compile(
    r"(?P<header>[A-Za-z0-9_./+\-]+\.h)(?::\s*No such file or directory|\s+file not found)", re.I
)
SECRET = re.compile(
    r'(?i)(?:api[_-]?key|password|passwd|wifi[_-]?pass|mqtt[_-]?pass|pwd|pass|token|secret|private[_-]?key|ssid)\s*[:=]\s*["\']([^"\'\r\n]{3,})["\']'
)


def clean_comments(code: str) -> str:
    # Preserve preprocessor include lines while masking all other comments.
    return re.sub(r"//[^\n]*|/\*[\s\S]*?\*/", lambda m: "\n" * m.group().count("\n"), code)


def redact_secrets(code: str) -> tuple[str, int]:
    count = 0

    def mask(m):
        nonlocal count
        count += 1
        return m.group(0).replace(m.group(1), "<REDACTADO>")

    filtered = SECRET.sub(mask, code)
    # Credentials can also appear as positional arguments in common maker APIs.
    wifi_call = re.compile(r'(?i)(WiFi\.begin\s*\(\s*"[^"\n]*"\s*,\s*")([^"\n]+)(")')

    def redact_wifi(m):
        nonlocal count
        count += 1
        return m.group(1) + "<REDACTADO>" + m.group(3)

    filtered = wifi_call.sub(redact_wifi, filtered)
    wlan_call = re.compile(
        r'(?i)(wlan\.connect\s*\(\s*["\'][^"\'\n]*["\']\s*,\s*["\'])([^"\'\n]+)(["\'])'
    )
    filtered = wlan_call.sub(redact_wifi, filtered)
    return filtered, count


def summarize(
    code: str, installed: list[str] | None = None, *, fqbn: str = "", error_output: str = ""
) -> dict:
    if not isinstance(code, str) or len(code) > 300_000:
        raise ValueError("Código inválido o demasiado grande.")
    installed_set = {str(name).strip().casefold() for name in (installed or [])}
    headers = list(dict.fromkeys(HEADER.findall(clean_comments(code))))
    found = []
    unresolved = []
    for header in headers:
        target = KNOWN.get(header)
        if target:
            found.append(
                {
                    "header": header,
                    "name": target,
                    "installed": target.casefold() in installed_set,
                    "confidence": "alta",
                    "source": "catálogo local verificado",
                    "action": "none" if target.casefold() in installed_set else "suggest_install",
                }
            )
        elif header not in BUILTIN and not header.startswith(
            ("esp_", "freertos/", "driver/", "soc/")
        ):
            unresolved.append(header)
    missed = [m.group("header") for m in MISSING_ERROR.finditer(error_output or "")]
    for header in missed:
        target = KNOWN.get(header)
        if target and not any(x["header"] == header for x in found):
            found.append(
                {
                    "header": header,
                    "name": target,
                    "installed": target.casefold() in installed_set,
                    "confidence": "alta",
                    "source": "error real del compilador",
                    "action": "none" if target.casefold() in installed_set else "suggest_install",
                }
            )
        elif header not in KNOWN and header not in unresolved:
            unresolved.append(header)
    warnings = []
    if "#include <WiFi.h>" in code and fqbn.startswith("arduino:avr:"):
        warnings.append(
            "WiFi.h no está garantizada para esta placa AVR: revisa el módulo Wi-Fi específico."
        )
    if re.search(r"\b(pinMode|digitalWrite)\s*\(\s*(?:0|2|12|15)\s*,", code) and fqbn.startswith(
        "esp32:esp32:esp32"
    ):
        warnings.append(
            "Se usa un GPIO de arranque (0/2/12/15). Verifica el esquema de tu placa antes de cablear."
        )
    if fqbn == "esp32:esp32:esp32":
        aliases = {}
        for alias, n in re.findall(r"\b(?:const\s+)?int\s+([A-Za-z_]\w*)\s*=\s*(\d+)\s*;", code):
            aliases[alias] = int(n)
        for rawpin in re.findall(r"\bpinMode\s*\(\s*([A-Za-z_]\w*|\d+)\s*,\s*OUTPUT\s*\)", code):
            number = aliases.get(rawpin, int(rawpin) if rawpin.isdecimal() else -1)
            if number in (34, 35, 36, 39):
                warnings.append(
                    f"GPIO {number} del ESP32 clásico es solo entrada; no sirve como OUTPUT."
                )
            if 6 <= number <= 11:
                warnings.append(
                    f"GPIO {number} suele estar reservado para la Flash SPI interna del ESP32 clásico."
                )
        if "Adafruit_ST7789.h" in code and re.search(
            r"\b(?:pinMode|digitalWrite)\s*\(\s*2\s*,", code
        ):
            warnings.append(
                "GPIO2 se usa como DC en algunos montajes IdeaSpark: evita compartirlo con un LED sin comprobar el esquema."
            )
        if "analogRead(" in code and ("WiFi.begin(" in code or "WIFI_STA" in code):
            warnings.append(
                "En ESP32 clásico, comprueba que las entradas ADC usen ADC1 cuando Wi-Fi está activo; ADC2 puede entrar en conflicto."
            )
    if "while (true)" in code and "delay(" not in code and fqbn.startswith("esp32:"):
        warnings.append(
            "Bucle infinito potencialmente sin espera: verifica watchdog y planificación de tareas."
        )
    _, n_secrets = redact_secrets(code)
    if n_secrets:
        warnings.append(
            f"Posibles credenciales detectadas ({n_secrets}). No compartas el código sin revisarlas."
        )
    return {
        "ok": True,
        "headers": headers,
        "recommendations": found,
        "unknown_headers": unresolved,
        "warnings": warnings,
        "verified": False,
        "message": "Sugerencias estáticas: la compilación real confirma compatibilidad.",
    }
