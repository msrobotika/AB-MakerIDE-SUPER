# Fix report: windows-archive-collisions
Resolved from assessment context. Only the offline distribution checker and its tests change behavior.
scripts/audit_distribution.py records each path component with casefold spelling and directory/file kind. Aliases and kind conflicts fail before the entry is accepted. Existing literal duplicates remain rejected. Explicit consistent directories remain valid. No archive is extracted.
Regression reproduced first: four assertions failed over case aliases and file/directory conflicts in both entry orders. After repair, all ten archive tests pass. Full repository checks and evidence are recorded in specs/014-windows-archive-collisions/.
