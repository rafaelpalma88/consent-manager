import { describe, it, expect, beforeEach, vi } from 'vitest';
import { googleConsentMode, googleConsentModeBootstrap } from '../src/integrations/google-consent-mode.js';

beforeEach(() => {
  localStorage.clear();
  delete window.gtag;
  delete window.dataLayer;
});

describe('googleConsentMode()', () => {
  it('maps analytics/marketing/functional to their default signals', () => {
    window.gtag = vi.fn();
    const integration = googleConsentMode();

    integration.onChange({ necessary: true, analytics: true, marketing: false, functional: true });

    expect(window.gtag).toHaveBeenCalledWith('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      personalization_storage: 'granted'
    });
  });

  it('accepts a custom category-to-signal mapping, merged with the defaults', () => {
    window.gtag = vi.fn();
    const integration = googleConsentMode({ analytics: ['my_custom_signal'] });

    integration.onChange({ analytics: true });

    // marketing/functional keep their default mapping and report "denied"
    // since onChange wasn't given a value for them.
    expect(window.gtag).toHaveBeenCalledWith('consent', 'update', {
      my_custom_signal: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied'
    });
  });

  it('does nothing if gtag was never installed (Consent Mode bootstrap missing)', () => {
    expect(typeof window.gtag).toBe('undefined');
    const integration = googleConsentMode();
    expect(() => integration.onChange({ analytics: true })).not.toThrow();
  });
});

describe('googleConsentModeBootstrap()', () => {
  function run(storageKey = 'mkconsent', version = 1) {
    // eslint-disable-next-line no-eval
    eval(googleConsentModeBootstrap({ storageKey, version }));
  }

  it('denies analytics/ads by default and grants functionality/security', () => {
    run();
    const [, , defaults] = window.dataLayer[0];

    expect(defaults).toEqual({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted'
    });
  });

  it('reflects previously stored consent as the default, on repeat visits', () => {
    localStorage.setItem(
      'mkconsent',
      JSON.stringify({ v: 1, categories: { necessary: true, analytics: true, marketing: true } })
    );

    run();
    const [, , defaults] = window.dataLayer[0];

    expect(defaults.analytics_storage).toBe('granted');
    expect(defaults.ad_storage).toBe('granted');
    expect(defaults.ad_user_data).toBe('granted');
    expect(defaults.ad_personalization).toBe('granted');
  });

  it('ignores stored consent from a mismatched version', () => {
    localStorage.setItem(
      'mkconsent',
      JSON.stringify({ v: 2, categories: { necessary: true, analytics: true, marketing: true } })
    );

    run('mkconsent', 1);
    const [, , defaults] = window.dataLayer[0];

    expect(defaults.analytics_storage).toBe('denied');
  });

  it('respects a custom storageKey', () => {
    localStorage.setItem(
      'custom-key',
      JSON.stringify({ v: 1, categories: { necessary: true, analytics: true } })
    );

    run('custom-key', 1);
    const [, , defaults] = window.dataLayer[0];

    expect(defaults.analytics_storage).toBe('granted');
  });
});
