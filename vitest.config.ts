import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'examples/',
        'vitest.config.ts',
        'tsup.config.ts',
        'src/index.ts',
        'src/query-types.ts',
        'src/**/*.examples.ts',
      ],
    },
    setupFiles: ['./src/__tests__/query-builder.test.ts'],
  },
});


