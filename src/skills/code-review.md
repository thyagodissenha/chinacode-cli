# Code Review Skill

When reviewing code, apply this systematic checklist:

## Readability
- [ ] Are variable and function names clear and descriptive?
- [ ] Is the code logically structured and easy to follow?
- [ ] Are complex sections explained with concise comments?

## Design (DRY & SRP)
- [ ] Is logic duplicated? Extract into shared functions
- [ ] Does each function/class have a single, clear responsibility?
- [ ] Are abstractions at the right level — not too early, not too late?

## Error Handling
- [ ] Are all error paths handled explicitly?
- [ ] Do error messages include enough context to debug?
- [ ] Are exceptions caught at the right level (not swallowed silently)?

## Security
- [ ] Is user input validated and sanitized before use?
- [ ] Are secrets (API keys, passwords) never hardcoded or logged?
- [ ] Are SQL queries parameterized (no string concatenation)?
- [ ] Is output escaped appropriately (XSS prevention)?

## Test Coverage
- [ ] Are happy paths covered by tests?
- [ ] Are edge cases and error paths tested?
- [ ] Are tests readable and self-documenting?

## Performance
- [ ] Are there obvious N+1 query patterns?
- [ ] Are expensive operations cached when appropriate?
- [ ] Are large allocations avoided in hot paths?
