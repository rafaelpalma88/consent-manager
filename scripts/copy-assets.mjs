import { copyFileSync, mkdirSync } from 'node:fs';

copyFileSync('src/consent.css', 'dist/consent.css');
copyFileSync('src/index.d.ts', 'dist/index.d.ts');
mkdirSync('dist/integrations', { recursive: true });
copyFileSync('src/integrations/google-consent-mode.d.ts', 'dist/integrations/google-consent-mode.d.ts');
