# Convergence: offline Windows archive ambiguity guard
Scope: FR-001 through FR-004 only; not certification of the IDE, historical RC4, or physical firmware.
Before fix: four negative assertions failed. After fix: ten archive tests passed. Full isolated discovery: 337 run, 332 passed, five platform/compiler skips, zero failed.
Ruff check/format, ESLint and Prettier passed. Source manifest and the consistency gate are refreshed with the exact technical hashes in verification.json; actual commands must pass before committing.
Exact public RC4 inspection: SHA matches, CRC and internal manifest valid; absent notices/example keep passed=false. Windows TEST lifecycle passed in this existing Windows environment, including Unicode path and data preservation. It is not a clean-machine or SmartScreen test.
REA static Evidence is retained separately from runtime results. No release, hardware write, physical serial communication or external AI invocation was performed. Remote CI must be assessed on the PR's final commit; local results do not imply remote CI success.
