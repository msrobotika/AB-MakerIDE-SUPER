# Secuencia logica MicroPython para el simulador de AB MakerIDE.
# Pines numericos de ejemplo: no valida su disponibilidad fisica.
from machine import Pin
import time

rojo = Pin(2, Pin.OUT)
amarillo = Pin(4, Pin.OUT)
verde = Pin(5, Pin.OUT)
while True:
    rojo.on()
    amarillo.off()
    verde.off()
    time.sleep_ms(1000)
    rojo.off()
    amarillo.on()
    time.sleep_ms(500)
    amarillo.off()
    verde.on()
    time.sleep_ms(1000)
