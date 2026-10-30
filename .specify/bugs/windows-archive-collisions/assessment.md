# Bug Assessment: Windows ZIP aliases
Slug: windows-archive-collisions. Created: 2026-10-28.
Source: user integral audit directive and local reproduction; no external instructions.
Verdict: valid. Severity: high for distribution verification.
Symptom: audit_zip reports passed=true for a valid package with extra readme.md beside README.md.
Reproduction: DistributionArchiveTests().audit_fixture(add={'readme.md': b'case collision'}).
Observed baseline: passed=True, errors=[], files=12.
Cause, high confidence: seen compares literal ZIP names only; Windows path aliases are not compared.
Remediation: reject conservative casefold aliases in every component and file/directory conflicts, retain all original checks. Add negative regression cases and positive explicit-directory case. No extraction or historical asset rewriting.
