# AB MakerIDE SUPER Constitution

## Core Principles

### I. Specification Before Implementation

Every new creation or improvement MUST use GitHub Spec Kit: specify intent and acceptance
scenarios, clarify material uncertainty, plan, review requirements, create ordered tasks,
analyze consistency, implement, then converge against evidence. Specifications MUST remain
in specs/. Completed features become historical records; a subsequent change gets its own
active feature. Small changes MAY use short artifacts, never omit the stages.

### II. Observable Completion

The IDE MUST distinguish source generation, compilation, verified firmware bytes and
physical observation. A successful subprocess or an agent statement MUST NOT certify
physical behavior. Tests and reports MUST identify fixtures, actual tools, hardware and
user observations separately. Unverified requirements MUST stay open with an explanation.

### III. Preserve User Control and Data

Start with a clean editor/chat/task; preserve only the user's selected AI preferences.
The user saves reusable source explicitly. Diagnostics and recovery MUST NOT replay a
hardware write. Back up before authorized firmware replacement when the tool supports it.
Development MUST preserve existing projects and use a reviewable Git baseline.

### IV. Board-First Agent Experience

Firmware requests MUST target the declared board and its peripherals. A desktop game
MUST NOT replace a requested on-board display. USB converters alone MUST NOT establish
a commercial board model. Research primary sources and existing profiles before asking
for missing physical information. Every supported workflow MUST end with actual results
and explicit pending steps; no invented success or completion percentages.

### V. Optional AI, Explicit Permissions

AI is optional and uses each user's own account and quota. MCP approval MUST default to
manual and be explicit per run. Secrets MUST use protected storage or RAM-only fallback.
Spec Kit templates and process steps MUST NOT grant hardware, publishing, spending or
destructive permissions. Do not silently switch accounts, providers or access modes.

## Engineering Constraints

Maintain Python 3.10+ application compatibility and plain ES modules. Keep production
dependencies justified and optional where possible. Preserve loopback server guards,
argument-list subprocesses, path boundaries, CSP and text-only DOM insertion. Run the
relevant tests plus required Ruff, ESLint, Prettier and manifest checks. CI covers Windows,
Ubuntu, macOS and controlled Chromium; that does not certify hardware on those platforms.
Upstream Spec Kit scaffolding is attributed and preserved separately from application code.

## Development Workflow and Evidence

Read AGENTS.md and the active .specify/feature.json. Review specification, plan,
requirements checklist, tasks and analysis before editing implementation. Record each
functional requirement's evidence in the feature verification report. The CI process
gate checks artifact consistency and changed-file coverage; semantic review and actual
tests remain necessary. No community extensions, extra agents or unattended hardware
operations are required by this constitution.

## Governance

This constitution records the user's explicit development preferences of 2026-10-26.
Higher-priority instructions and current user decisions take precedence. Amendments MUST
describe the reason and migration impact; use major versions for incompatible principles,
minor for new principles, patch for clarification. Review all changes against it. Completed
RC4 behavior is the adoption baseline, not retroactively claimed to have used Spec Kit.

**Version**: 1.0.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-26
