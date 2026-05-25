import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/index.ts',
        // Type-only declarations, zero runtime code
        'src/types.ts',
        // Interactive terminal UI — depends on chalk/ora/readline, not unit-testable
        'src/ui/tui.ts',
        'src/ui/diff.ts',
      ],
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 50,
        statements: 70,
      },
    },
  },
})
