import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
  shims: false,
  dts: false,
  tsconfig: './tsconfig.build.json',
  outExtension: () => ({ js: '.js' }),
  noExternal: [/^(@domain|@application|@infrastructure|@interfaces|@main)\//],
});
