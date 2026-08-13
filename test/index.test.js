import { describe, it, expect, beforeEach, vi } from 'vitest';
import { init, has, open, reset } from '../src/index.js';

const categories = [
  { id: 'necessary', required: true, label: 'Necessários' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'marketing', label: 'Marketing' }
];

function baseConfig(overrides = {}) {
  return Object.assign({ storageKey: 'test-consent', version: 1, categories }, overrides);
}

beforeEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
});

describe('init()', () => {
  it('shows the banner when there is no stored consent', () => {
    init(baseConfig());
    expect(document.querySelector('.mkc-banner')).not.toBeNull();
  });

  it('does not show the banner when autoShow is false', () => {
    init(baseConfig({ autoShow: false }));
    expect(document.querySelector('.mkc-banner')).toBeNull();
  });

  it('grants only required categories before any decision', () => {
    init(baseConfig());
    expect(has('necessary')).toBe(true);
    expect(has('analytics')).toBe(false);
    expect(has('marketing')).toBe(false);
  });

  it('applies previously stored consent silently, without showing the banner', () => {
    localStorage.setItem(
      'test-consent',
      JSON.stringify({ v: 1, categories: { necessary: true, analytics: true, marketing: false } })
    );
    init(baseConfig());
    expect(document.querySelector('.mkc-banner')).toBeNull();
    expect(has('analytics')).toBe(true);
    expect(has('marketing')).toBe(false);
  });

  it('ignores stored consent from a different version and shows the banner again', () => {
    localStorage.setItem(
      'test-consent',
      JSON.stringify({ v: 999, categories: { necessary: true, analytics: true, marketing: true } })
    );
    init(baseConfig());
    expect(document.querySelector('.mkc-banner')).not.toBeNull();
    expect(has('analytics')).toBe(false);
  });

  it('does not leave an orphaned banner when called twice in a row', () => {
    // Regression test: React StrictMode (and anything else that calls init()
    // more than once) used to leave the first banner in the DOM forever,
    // since the fresh `state` object had no reference to it.
    init(baseConfig());
    init(baseConfig());
    expect(document.querySelectorAll('.mkc-banner').length).toBe(1);
  });
});

describe('banner interactions', () => {
  it('accepting all grants every category and persists it', () => {
    init(baseConfig());
    document.querySelector('[data-action="accept"]').click();

    expect(document.querySelector('.mkc-banner')).toBeNull();
    expect(has('analytics')).toBe(true);
    expect(has('marketing')).toBe(true);

    const stored = JSON.parse(localStorage.getItem('test-consent'));
    expect(stored.categories).toEqual({ necessary: true, analytics: true, marketing: true });
  });

  it('rejecting keeps only required categories granted', () => {
    init(baseConfig());
    document.querySelector('[data-action="reject"]').click();

    expect(has('analytics')).toBe(false);
    expect(has('marketing')).toBe(false);
    expect(has('necessary')).toBe(true);
  });

  it('calls onChange with the resulting consent state', () => {
    const onChange = vi.fn();
    init(baseConfig({ onChange }));
    document.querySelector('[data-action="accept"]').click();

    expect(onChange).toHaveBeenCalledWith({ necessary: true, analytics: true, marketing: true });
  });
});

describe('preferences modal', () => {
  it('open() renders the modal with a checkbox per category', () => {
    init(baseConfig({ autoShow: false }));
    open();

    expect(document.querySelector('.mkc-modal')).not.toBeNull();
    expect(document.querySelectorAll('.mkc-modal input[type="checkbox"]').length).toBe(3);
  });

  it('the required category checkbox is checked and disabled', () => {
    init(baseConfig({ autoShow: false }));
    open();

    const necessary = document.querySelector('input[data-category="necessary"]');
    expect(necessary.checked).toBe(true);
    expect(necessary.disabled).toBe(true);
  });

  it('saving custom selections persists exactly what was checked', () => {
    init(baseConfig({ autoShow: false }));
    open();

    document.querySelector('input[data-category="analytics"]').checked = true;
    document.querySelector('[data-action="save"]').click();

    expect(has('analytics')).toBe(true);
    expect(has('marketing')).toBe(false);
    expect(document.querySelector('.mkc-modal')).toBeNull();
  });

  it('Escape closes the modal and returns focus to the triggering element', () => {
    init(baseConfig({ autoShow: false }));
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    open();
    expect(document.activeElement).not.toBe(trigger);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(document.querySelector('.mkc-modal')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('Tab wraps focus back to the first element from the last', () => {
    init(baseConfig({ autoShow: false }));
    open();

    const focusable = document.querySelectorAll(
      '.mkc-modal a[href], .mkc-modal button:not([disabled]), .mkc-modal input:not([disabled])'
    );
    const last = focusable[focusable.length - 1];
    const first = focusable[0];

    last.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    expect(document.activeElement).toBe(first);
  });
});

describe('script gating', () => {
  // jsdom doesn't execute dynamically-inserted <script> content by default
  // (nor should a unit test suite enable that), so these assert the DOM
  // transformation activateCategory() performs rather than script side effects.
  it('leaves a gated script inert until its category is granted', () => {
    document.body.innerHTML =
      '<script type="text/plain" data-consent-category="analytics" id="ga">window.__gaLoaded = true;</script>';

    init(baseConfig({ autoShow: false }));
    expect(document.querySelector('script[type="text/plain"]#ga')).not.toBeNull();

    open();
    document.querySelector('input[data-category="analytics"]').checked = true;
    document.querySelector('[data-action="save"]').click();

    expect(document.querySelector('script[type="text/plain"]#ga')).toBeNull();
    const activated = document.getElementById('ga');
    expect(activated).not.toBeNull();
    expect(activated.getAttribute('type')).not.toBe('text/plain');
    expect(activated.textContent).toBe('window.__gaLoaded = true;');
  });

  it('does not activate a script tagged for a category that was denied', () => {
    document.body.innerHTML =
      '<script type="text/plain" data-consent-category="marketing" id="pixel">window.__pixelLoaded = true;</script>';

    init(baseConfig());
    document.querySelector('[data-action="reject"]').click();

    expect(document.querySelector('script[type="text/plain"]#pixel')).not.toBeNull();
  });
});

describe('reset()', () => {
  it('clears stored consent so the banner shows again on the next init()', () => {
    init(baseConfig());
    document.querySelector('[data-action="accept"]').click();
    expect(localStorage.getItem('test-consent')).not.toBeNull();

    reset();
    expect(localStorage.getItem('test-consent')).toBeNull();

    init(baseConfig());
    expect(document.querySelector('.mkc-banner')).not.toBeNull();
  });
});
