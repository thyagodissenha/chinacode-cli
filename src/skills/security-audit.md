# Security Audit Skill

Perform a thorough security review using OWASP Top 10 as a baseline:

## A01 — Broken Access Control
- [ ] Are authorization checks enforced on every endpoint/function?
- [ ] Can users access or modify data belonging to other users?
- [ ] Are directory traversal attacks prevented (path validation)?

## A02 — Cryptographic Failures
- [ ] Is sensitive data encrypted at rest and in transit?
- [ ] Are weak algorithms (MD5, SHA1, DES) used for security-critical operations?
- [ ] Are secrets stored in environment variables, not source code?

## A03 — Injection
- [ ] Are all SQL queries parameterized (no string interpolation)?
- [ ] Is shell command input sanitized (no command injection)?
- [ ] Is user-supplied HTML/JS escaped before rendering?

## A04 — Insecure Design
- [ ] Are threat models documented for sensitive flows?
- [ ] Is the principle of least privilege applied to services and users?

## A05 — Security Misconfiguration
- [ ] Are default credentials changed?
- [ ] Are unnecessary features/services disabled?
- [ ] Are error messages non-verbose in production?

## A06 — Vulnerable Components
- [ ] Are dependencies up-to-date (`npm audit`)?
- [ ] Are known CVEs present in the dependency tree?

## A07 — Authentication Failures
- [ ] Are sessions invalidated on logout?
- [ ] Is brute-force protection (rate limiting) applied to auth endpoints?

## Secrets Exposure
- [ ] Does `.gitignore` cover all secret files (`.env`, `*.pem`, `*.key`)?
- [ ] Is `git log` free of committed secrets?

## Input Validation
- [ ] Is every external input validated before processing?
- [ ] Are file uploads restricted by type and size?
