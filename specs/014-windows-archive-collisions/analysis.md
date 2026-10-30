# Consistency analysis
FR-001 maps to case-alias tests and scripts/audit_distribution.py. FR-002 maps to ancestor/type conflict tests. FR-003 maps to all existing archive tests and the exact RC4 audit. FR-004 maps to docs/AUDITORIA_DISTRIBUCION_RC4.md and recorded JSON.
The old source ZIP is not rebuilt as a substitute. README case aliases were accepted with passed=true before implementation. Case-sensitive duplicate detection is the suspected root cause. Root and ancestor aliases require checking components rather than only final filenames.
No UI, Arduino, MCP, secrets or hardware behavior changes. Physical acceptance is explicitly outside the convergence claim.
