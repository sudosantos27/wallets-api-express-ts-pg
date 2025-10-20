import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['test/setup.ts'],
    globals: false,
    reporters: 'default',
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reports: ['text', 'lcov'],
      exclude: [
        'prisma/**',
        'src/server.ts',
        'src/docs/**',
        'src/types/**',
        'test/utils/**',
        '**/*.config.*',
        'eslint.config.cjs',
        'vitest.config.ts',
        'src/lib/prisma.ts',
        "src/env.schema.ts",
        'src/lib/logger.ts',
      ],
      thresholds: { statements: 85, branches: 75, functions: 80, lines: 85 },
    },
  },
});