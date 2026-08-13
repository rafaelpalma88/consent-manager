/*!
 * Zero-build entry point: bundles the core + Google Consent Mode
 * integration into a single global for plain `<script src>` usage,
 * mirroring the shape consumers get from the ESM/CJS entry points.
 */
import { init, has, open, reset } from './index.js';
import { googleConsentMode } from './integrations/google-consent-mode.js';

window.MKConsent = { init, has, open, reset, integrations: { googleConsentMode } };
