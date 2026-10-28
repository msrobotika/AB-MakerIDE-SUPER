# Bug Assessment: unsupported browser runner
Created: 2026-10-28. Slug: browser-runner-unsupported. Verdict: valid. Severity: high (all nine UI journeys skipped).
Reproduction: PR 23 CI run 40780250899, job 123139832544, checked-out merge 4ae6088 containing a424ca7.
Observed: Ubuntu 26.04.1; playwright install --with-deps chromium exits 1 with platform unsupported. Every subsequent UI journey was skipped.
Root cause, high confidence: mutable ubuntu-latest advanced beyond the platform supported by pinned Playwright 1.56.
Preferred fix: use ubuntu-24.04 for browser job only, preserve all tests. Validate in real CI. No hooks configured and no target artifact needs execution to assess the source configuration.
