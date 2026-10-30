# Verification: browser-runner-unsupported
Verdict: verified for the hosted browser preparation failure.
Before: run 40780250899, browser job 123139832544, failed during Chromium installation on unsupported Ubuntu 26.04; nine UI commands skipped.
After: run 40780735147, browser job 123141478082, installed Chromium and passed all nine UI commands after pinning ubuntu-24.04. Unit jobs Windows/Ubuntu/macOS also passed. Source candidate: 1cacc750619ed2628aabfa4fe8408e5596c296f3.
The candidate quality job deliberately failed the pending Spec Kit convergence gate. Final evidence recording changes no browser code or tests, but still requires its own complete CI verification. No hardware, signed distribution or Edge reputation removal is inferred.
