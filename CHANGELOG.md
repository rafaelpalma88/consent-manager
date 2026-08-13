# Changelog

This project follows [Semantic Versioning](https://semver.org/).

## 0.2.0 — 2026-08-13

- Accessibility: preferences modal now traps focus (Tab/Shift+Tab cycle
  within it), closes on Escape, moves focus into the modal on open, and
  restores focus to the triggering element on close.
- Added an automated test suite (Vitest + jsdom) covering the public API,
  banner/modal interactions, script gating, and the Google Consent Mode
  integration.
- Added CI (GitHub Actions) running build + tests on push and PR.
- Docs: consent-logging extension point (`onChange` → your own audit
  trail), a GTM Consent Settings setup guide
  (`docs/gtm-consent-setup.md`), and a screenshot in the README.

## 0.1.1 — 2026-08-13

- Added `repository` field now that the GitHub repo exists.
- Expanded the README's intro to explain what the package is for.

## 0.1.0 — 2026-08-13

- Initial release: vanilla consent core (categories, storage with
  versioning, banner + preferences UI, generic script gating via
  `data-consent-category`), Google Consent Mode integration, TypeScript
  declarations, and a browser-global build for zero-build HTML sites.
- Fixed: `init()` now closes any prior banner/modal before re-initializing,
  so React StrictMode's double effect-invoke (or any repeat call) doesn't
  leave an orphaned banner in the DOM.
