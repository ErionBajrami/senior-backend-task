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
        'src/domain/repositories/**',
        'src/infrastructure/persistence/mongo/mongo-client.ts',
        'src/interfaces/http/views/**',
      ],
      thresholds: {
        lines: 75,
        statements: 75,
        functions: 75,
        branches: 70,
      },
    },
  },
});
