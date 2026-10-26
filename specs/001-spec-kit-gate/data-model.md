# Modelo de datos

- Configuración: schema_version=1 y feature, ruta de la mejora activa bajo specs/.
- Verificación: schema_version=1, convergence=converged y requirements.
- Requisito verificado: id FR-NNN único definido en spec.md, result=passed,
  notes no vacío y evidence como lista no vacía de rutas a archivos del repositorio.
- Huellas: changed_files, mapa no vacío ruta técnica relativa → SHA-256 actual.
- Base: SHA Git opcional de 40 caracteres hexadecimales; ceros equivale a primer push
  sin comparación. No se admiten nombres de rama ni expresiones Git arbitrarias.

Los documentos se mantienen abiertos durante el trabajo; el control de entrega rechaza
convergence distinta de converged, casillas abiertas o huellas desactualizadas. Declarar
convergencia exige revisar los resultados reales; escribir el valor no prueba su verdad.
