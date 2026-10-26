"""Diagnostico en RAM para ESP32 con MicroPython; sin GPIO, red ni escritura de archivos."""

import sys
import os
import gc
import time
import machine
import json


def main():
    if sys.implementation.name != "micropython":
        raise RuntimeError("Esta prueba debe ejecutarse en MicroPython.")
    print("MSR_MICROPYTHON_BEGIN")
    print("VERSION", sys.version)
    print("PLATAFORMA", sys.platform)
    print("PLACA", os.uname().machine)
    print("CPU_HZ", machine.freq())
    stats = os.statvfs("/")
    print("FILESYSTEM_BYTES", stats[0] * stats[2])
    print("FILESYSTEM_FREE_BYTES", stats[0] * stats[3])
    gc.collect()
    assert gc.mem_free() > 0
    assert sum(range(100)) == 4950
    start = time.ticks_ms()
    for sample in range(1, 6):
        gc.collect()
        data = {
            "sample": sample,
            "elapsed_ms": time.ticks_diff(time.ticks_ms(), start),
            "heap_free": gc.mem_free(),
            "arithmetic_ok": sum(range(100)) == 4950,
        }
        assert json.loads(json.dumps(data))["sample"] == sample
        print("MSR_SAMPLE", json.dumps(data))
        time.sleep_ms(500)
    print("MSR_MICROPYTHON_PASS")


main()
