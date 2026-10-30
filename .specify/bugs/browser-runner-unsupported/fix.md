# Fix report: browser-runner-unsupported
Context slug from assessment. The browser job now uses ubuntu-24.04, preserving Playwright 1.56 and all nine UI commands. Unit and quality runners are unchanged.
The actual user screenshots classify the reported installer block as an Edge uncommon-download warning. Installation guidance now identifies the exact TEST file and hash and explains the reputation/signature boundary without changing system protections.
Hosted browser validation then succeeded in run 40780735147, job 123141478082, on candidate 1cacc750619ed2628aabfa4fe8408e5596c296f3. See test.md for the verification boundary.
