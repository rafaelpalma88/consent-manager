import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.js',
      'integrations/google-consent-mode': 'src/integrations/google-consent-mode.js'
    },
    format: ['esm', 'cjs'],
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' }),
    sourcemap: true,
    clean: true,
    outDir: 'dist'
  },
  {
    entry: { browser: 'src/browser.js' },
    format: ['iife'],
    outExtension: () => ({ js: '.global.js' }),
    minify: true,
    sourcemap: true,
    outDir: 'dist'
  }
]);
