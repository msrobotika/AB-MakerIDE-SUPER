# Feature Specification: Browser CI and observed download diagnostics
Created: 2026-10-28. Base: a424ca7cd82208973d1fdd6a916ff84dbb3d3721.
Status: specified before implementation; prior feature 014 retained as historical.
## User Scenarios & Testing
P1: CI installs the pinned Playwright browser before testing the editor.
Observed failure: run 40780250899, job 123139832544, Ubuntu 26.04.1, rejects Chromium installation before any UI test.
P2: a tester sees Edge's uncommon-download warning and must distinguish reputation from an installer execution failure.
User-supplied screenshots identify the exact published dev-025dd26e85 Setup. Private full-desktop images stay outside the public repository.
## Requirements
- **FR-001**: Pin the browser job to Ubuntu 24.04 while retaining Playwright 1.56 and all existing UI journeys; remote installation and test steps must actually succeed before verification.
- **FR-002**: Document the observed Edge warning, exact file/hash verification and absence of signature, with a primary Microsoft source and no instruction to disable protections.
- **FR-003**: Preserve feature 014, its archive regression guard, artifact identities, and Spec Kit/source-manifest integrity.
## Clarifications and limits
No certificate is assumed available and signing is not promised to remove all reputation warnings. No change to unit/quality platform matrices, no release or user-system security setting changes.
