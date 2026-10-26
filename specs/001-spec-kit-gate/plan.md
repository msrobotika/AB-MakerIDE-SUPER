# Implementation Plan: Desarrollo verificable con Spec Kit

**Branch**: improvement/spec-driven-development | **Date**: 2026-10-26
**Spec**: [spec.md](spec.md)

## Summary

Adoptar scaffolding oficial de Spec Kit 1.2.3 y una constitución del proyecto.
Añadir un control Python sin dependencias que valide el expediente activo, su
cobertura de requisitos, cierre de tareas y huellas de archivos técnicos.
Integrarlo en CI sin modificar ningún módulo de producción del IDE.

## Technical Context

**Language/Version**: Python 3.10+ para el control, Python 3.11+ solo para Specify CLI.
**Primary Dependencies**: Biblioteca estándar; Git para comparar una base explícita.
**Storage**: Markdown y JSON versionados; sin credenciales, vídeos ni datos de usuario.
**Testing**: unittest con carpetas temporales y un repositorio Git de prueba.
**Target Platform**: Windows, Ubuntu y macOS.
**Project Type**: Herramienta interna de desarrollo y CI.
**Performance Goals**: Una invocación Git acotada; hashes solo de archivos declarados.
**Constraints**: No lanzar agentes, instalar dependencias de producción ni abrir puertos serie.
**Scale/Scope**: Una mejora activa; los expedientes anteriores son históricos.

## Constitution Check

PASS antes de investigación y después de diseño: especificación y checklist revisados,
ningún cambio de producción, sin efectos en hardware, sin nuevos permisos, sin cuentas IA.
La validación estructural complementa la revisión semántica y las pruebas; no las sustituye.

## Project Structure

- .specify/: scripts, plantillas, skills oficiales asociadas y constitución.
- .specify/memory/quality-gate.json: referencia compartida a la mejora activa.
- .specify/feature.json: referencia local de Spec Kit, ignorada por upstream.
- .agents/skills/: habilidades oficiales instaladas para Codex.
- specs/001-spec-kit-gate/: requisitos, plan, investigación, modelo, contrato, tareas,
  análisis, guía reproducible, resultados y convergence.md.
- tests/specification_gate.py: validación y CLI sin ejecutar contenido de las specs.
- tests/test_specification_gate.py: casos de aceptación y rechazo.
- .github/workflows/checks.yml: control en los jobs existentes con checkout completo.
- AGENTS.md, docs/SPEC_KIT.md y CONTRIBUTING.md: instrucciones para colaboradores.

## Phases

1. Investigación: fijar versión estable, conservar licencia, revisar archivos generados
   y resolver adopción brownfield sin reconstruir la RC4.
2. Diseño: documentar contrato JSON, límites de confianza, cobertura y comparación Git.
3. Tareas: revisar coherencia y checklist antes de implementar.
4. Implementación: probar rechazos, implementar control, integrarlo y documentarlo.
5. Convergencia: ejecutar suite y calidad, registrar evidencia, revisar cada requisito,
   actualizar manifiesto y comprobar CI del commit.

## Complexity Tracking

No hay excepciones a la constitución. Los scripts oficiales no se reformatean: se excluyen
solo del Ruff del producto y conservan su versión/origen. El control propio sí pasa Ruff.
La referencia de base CI se transmite por variable de entorno y se valida como SHA antes
de usarla en una lista de argumentos Git. No se interpola en un comando shell.
