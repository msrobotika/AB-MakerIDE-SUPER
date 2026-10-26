# Política de marcas, dependencias y publicación

**MS Robotika — AB MakerIDE SUPER.** Criterios prácticos; no dictamen jurídico.

1. Identidad propia. Publicar como **AB MakerIDE SUPER**, compatible con Arduino® y ESP32, nunca «Arduino IDE oficial» o un producto avalado por Arduino. Arduino® es marca de Arduino S.r.l. No usar sus logos ni marcas de proveedores como identidad de MakerIDE. [Guía oficial de Arduino](https://www.arduino.cc/en/trademark/guides/trademark-guide-for-compatible-products/).
2. **Arduino CLI externa** detectada en el sistema; licencia GPL-3.0 y advertencia comercial de su titular: [arduino-cli](https://github.com/arduino/arduino-cli#license). No copiar su código ni instalar un binario empaquetado junto con MakerIDE sin revisión expresa; no afirmar automáticamente que el uso por CLI resuelve toda cuestión jurídica.
3. Los núcleos de placas, bibliotecas, drivers, IA y credenciales son independientes. Su software y sus licencias no quedan relicenciados bajo el MIT de MakerIDE.
4. Referencias correctas a terceros (Codex, Claude Code, etc.) y su estado real de pruebas. No anunciar asociación comercial, marcas oficiales, créditos incluidos ni funcionalidad sin evidencia.
5. Juego: el **ejemplo de desarrollo actual** pasa a `examples/defensa_orbital/defensa_orbital.ino`, con clase `DefensaOrbital` y marcadores nuevos. Las mecánicas arcade genéricas no autorizan copiar arte, código, logos, música o una presentación distintiva de otra franquicia; revisar material del ejemplo antes de redistribución comercial. **No sustituir pruebas físicas históricas:** tag y evidencias previas permanecen intactos.
6. Antes de una Release: auditar ZIP, fuentes/bibliotecas, dependencias/avisos y origen de assets, integridad y términos de uso; revisar TODO riesgo material y aprobar explícitamente. No publicar basándose solo en CI.

[Inventario tercero](../THIRD_PARTY_NOTICES.md) · [Política de Releases](RELEASE_POLICY.md) · [Marca Arduino](https://www.arduino.cc/en/trademark/).
