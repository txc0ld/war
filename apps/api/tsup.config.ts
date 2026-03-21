import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'node',
  outDir: 'dist',
  clean: true,
  noExternal: ['@warpath/shared'],
  target: 'es2022',
});
