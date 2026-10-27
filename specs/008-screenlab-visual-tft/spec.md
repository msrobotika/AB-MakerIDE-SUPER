# AB ScreenLab — diseñador TFT opcional

## Objetivo
Incorporar a MakerIDE un editor visual auténtico de pantallas embebidas sin reemplazar el editor, alterar placas ni publicar nueva Release.

## Requisitos
- **FR-001**: Editor oculto de complejidad detrás de Herramientas, accesible de forma explícita, con lienzo visual, perfiles CYD e IdeaSpark y componentes arrastrables editables.
- **FR-002**: Proyecto JSON de esquema estricto con importación/exportación, guardado independiente del sketch, deshacer y validación de posiciones/tamaño/contenido.
- **FR-003**: Generador de cabecera LVGL 8.x con etiquetas/botones/barras/contendedores y puente de eventos de botones, sin fingir la configuración BSP, pines, drivers ni firmware probado.
- **FR-004**: Pruebas Node del motor y prueba Chromium que interactúe realmente con el editor sin abrir COM, iniciar agentes o grabar placas.
- **FR-005**: Documentar perfiles, alcance, limitaciones y compatibilidad, proteger manifest SHA256/Spec Kit y mantener RC4 inmutable.
