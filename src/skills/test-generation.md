# Test Generation Skill

Generate comprehensive tests following these principles:

## Test Naming
Use descriptive names that document behavior:
```
describe('functionName', () => {
  it('returns X when Y', () => { ... })
  it('throws when Z', () => { ... })
})
```

## Coverage Strategy
For each function/module, cover:
1. **Happy path** — correct inputs produce correct output
2. **Edge cases** — empty input, zero, max values, boundary conditions
3. **Error paths** — invalid input, missing dependencies, network failures
4. **Side effects** — verify mutations, writes, calls to external systems

## Unit vs Integration
- **Unit**: test one function in isolation; mock all dependencies
- **Integration**: test the interaction between multiple real modules
- **E2E**: test the full system from input to output

## Mocking Guidelines
- Mock at the module boundary (I/O, HTTP, time, random)
- Never mock the function under test itself
- Prefer real implementations when cost is low (in-memory DB, temp files)

## Vitest Patterns (TypeScript)
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Spy on a module function
const spy = vi.spyOn(module, 'fn').mockResolvedValue(result)

// Assert async throws
await expect(fn()).rejects.toThrow('message')

// Use beforeEach to reset state
beforeEach(() => { vi.clearAllMocks() })
```

## What to Test First
Priority order: security-critical paths > business logic > error handling > utilities
