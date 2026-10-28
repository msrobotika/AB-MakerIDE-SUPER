# Feature Specification: Windows distribution path ambiguity
Created: 2026-10-28. Branch: fix/windows-archive-case-collisions-20261028.
Input: integral audit and repair directive; REA inspection of exact shipped packages.
Status: specified before implementation.

## User Scenarios & Testing
P1: a maintainer audits a ZIP before distributing it on Windows.
Given a valid package plus README.md/readme.md aliases, auditing must reject it.
Given aliases in ancestor directories, or a file occupying a directory path, auditing must reject it.
Given an ordinary package with explicit directory entries and distinct names, auditing must preserve existing successful results.

## Requirements
- **FR-001**: Reject case aliases of ZIP paths, including directory components, before reporting passed.
- **FR-002**: Reject file/directory path conflicts in either archive order; allow consistent explicit and implicit directories.
- **FR-003**: Preserve SHA, CRC, manifest, license and no-extraction checks, with regression tests.
- **FR-004**: Record exact RC4 bytes/hash and observed defects separately from Windows TEST installation and hardware limitations.

## Acceptance and scope
All new negative cases fail on the baseline and pass after repair; existing archive tests remain green.
No historical asset changes, releases, firmware writes or production installations.
Clarification: archive names are checked conservatively with Unicode casefold; this is an alias guard, not a complete Win32 filename validator. Human licensing review and physical firmware tests remain pending outside these software criteria.
