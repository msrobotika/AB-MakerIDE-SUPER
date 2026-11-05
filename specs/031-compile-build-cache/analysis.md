# Coherencia

Las operaciones de hardware ya se serializan con un cerrojo, así que dos trabajos no
escriben a la vez en la misma caché. arduino-cli invalida su caché si cambian las opciones
de placa (velocidad de grabación incluida), por lo que no se reutilizan binarios ajenos.
La carga sigue usando `--input-dir` de la carpeta temporal y `--verify`. Solo cambia el
tiempo de compilación; no se anuncia nada sobre hardware.
