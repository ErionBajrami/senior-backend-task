import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: false,
    environment: 'node',
    include: ['test/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', 'coverage'],
    testTimeout: 10_000,
    hookTimeout: 30_000,
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.{test,spec}.ts',
        'src/**/index.ts',
        'src/main/**',
        'src/**/*.dto.ts',
        'src/**/*.port.ts',
        // Interface-only files compile to empty modules; coverage tools score them 0%.
        'src/domain/repositories/**',
        // Thin connection-factory exercised only at boot; covered in production smoke / E2E
        // by the live container in `buildTestApp`, but not via a separate unit test.
        'src/infrastructure/persistence/mongo/mongo-client.ts',
      ],
      thresholds: {
        lines: 85,
        statements: 85,
        functions: 85,
        branches: 80,
        'src/domain/**': { lines: 90, statements: 90, functions: 90, branches: 85 },
        'src/application/**': { lines: 90, statements: 90, functions: 90, branches: 85 },
      },
    },
  },
});
