# Origen de Spec Kit

Repositorio: https://github.com/github/spec-kit
Etiqueta estable: **v1.2.3**
Commit: `5ea8b1cf0a38699340a38e00d02770308997d8c0`
Adopción: 2026-10-26, sobre RC4 `c13864910810c4e9d69642efaaa32688e9bd066f`.

Instalación oficial: Specify CLI construido desde ese checkout en un entorno aislado.
Inicialización: `specify init --here --force --integration codex --script py --non-interactive --integration-options="--skills --events false"`.

Scaffolding generado en `.specify/` y `.agents/skills/`, sin extensiones comunitarias.
Los scripts y plantillas oficiales se conservan; únicamente se normalizan sus finales de
línea al formato LF del repositorio. La constitución, quality-gate.json y los documentos
de la mejora son propios de MakerIDE. Los hashes del registro de instalación reflejan
los bytes normalizados que se distribuyen.

La licencia original se conserva en [UPSTREAM_LICENSE](UPSTREAM_LICENSE). El control
`tests/specification_gate.py` es una integración propia de este proyecto: no está incluido
ni certificado por GitHub Spec Kit. El toolkit es para desarrollo; no añade una dependencia
de ejecución al IDE.
