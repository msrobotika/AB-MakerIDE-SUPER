# Análisis
La RC4 pública es distinta de `main`, que ya contiene ScreenLab/MotionLab.
El ZIP RC4 permanece bajo auditoría #11 y NO se reempaqueta a escondidas.
PyInstaller contiene CPython para no obligar al usuario a instalarlo; las
dependencias de las placas siguen siendo herramientas externas.
El modo consola es intencionado para conservar diagnósticos visibles.
El instalador no tiene certificado de firma verificado: no se simula firma.
El modo `workflow_run` restringe escritura a main con checks verdes y
marcador explícito; los PR generan artefactos no publicados.
Limitación: los smoke tests Windows no equivalen a pruebas físicas de MCU.
