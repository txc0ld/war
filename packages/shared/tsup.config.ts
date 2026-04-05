import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/types.ts',
    'src/constants.ts',
    'src/auth.ts',
    'src/gunNames.ts',
    'src/stats.ts',
    'src/s2Types.ts',
    'src/s2Constants.ts',
    'src/s2Auth.ts',
    'src/s2GameTypes.ts',
  ],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2022',
  outDir: 'dist',
  clean: true,
  splitting: false,
});
