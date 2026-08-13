# @rafaelcostapalma/consent

A cookie/data consent banner for sites that need to comply with LGPD
(Brazil) or GDPR (EU): show a banner before any non-essential cookie or
tracking script runs, let visitors accept, reject, or choose by category,
and remember that choice. Blocks Google Analytics, Meta Pixel, chat
widgets, or any other third-party script until the matching category is
granted — including tags that live inside a single Google Tag Manager
container, via a built-in Google Consent Mode integration.

Framework-agnostic, zero runtime dependencies, config-driven (categories,
copy, and links all come from the config object you pass in — nothing
hardcoded for one specific site). Built to be reused across multiple
client sites rather than rewritten per project.

Works two ways:

- **Bundler / Next.js**: `import { init } from '@rafaelcostapalma/consent'`
- **Plain HTML, no build step**: `<script src=".../dist/browser.global.js">`, exposes `window.MKConsent`

## Install

```sh
npm install @rafaelcostapalma/consent
```

## Usage (ESM / Next.js)

```js
import { init, has, open } from '@rafaelcostapalma/consent';
import '@rafaelcostapalma/consent/style.css';
import { googleConsentMode } from '@rafaelcostapalma/consent/integrations/google-consent-mode';

init({
  storageKey: 'mkconsent',
  version: 1,
  categories: [
    { id: 'necessary', required: true, label: 'Necessários', description: '...' },
    { id: 'analytics', label: 'Analytics', description: '...' },
    { id: 'marketing', label: 'Marketing', description: '...' }
  ],
  texts: {
    title: 'Nós usamos cookies',
    description: '...',
    policyLabel: 'Política de Privacidade',
    policyHref: '/privacidade'
  },
  integrations: [googleConsentMode({})]
});
```

If you're gating a GTM container, also inline the Consent Mode bootstrap
(`googleConsentModeBootstrap()`) as the very first thing in `<head>`, before
the GTM loader script — it can't be a normal import, since Consent Mode
defaults must exist before GTM has a chance to fire any tag.

## Usage (plain HTML, no build step)

```html
<link rel="stylesheet" href="/vendor/consent/consent.css">
<script src="/vendor/consent/browser.global.js"></script>
<script>
  MKConsent.init({ /* same config shape as above */ });
</script>
```

## Gating arbitrary third-party scripts

Any script tag can be gated by a category without touching this library's
code — mark it inert with `type="text/plain"` and tag it with the category
that must be granted before it runs:

```html
<script type="text/plain" data-consent-category="functional" src="https://chat.example.com/widget.js"></script>
```

## API

- `init(config)` — mounts the banner (unless `autoShow: false`) and applies any previously stored consent.
- `has(categoryId)` — whether a category is currently granted.
- `open()` — opens the preferences panel (e.g. wire to a "Manage cookies" link).
- `reset()` — clears stored consent (mostly for testing).

## License

MIT
