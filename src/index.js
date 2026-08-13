/*!
 * @rafaelcostapalma/consent — cookie/data consent manager
 * Framework-agnostic, zero runtime dependencies. Everything shown in the UI
 * (categories, copy, links) and any third-party wiring comes from the
 * config object passed to init() — nothing here is hardcoded per site.
 */

const DEFAULTS = {
  storageKey: 'mkconsent',
  version: 1,
  categories: [
    { id: 'necessary', required: true, label: 'Necessários', description: '' }
  ],
  texts: {
    title: 'Nós usamos cookies',
    description: 'Usamos cookies para melhorar sua experiência e analisar o uso do site.',
    policyLabel: null,
    policyHref: null,
    btnAcceptAll: 'Aceitar todos',
    btnRejectAll: 'Rejeitar não essenciais',
    btnCustomize: 'Personalizar',
    btnSave: 'Salvar preferências',
    prefsTitle: 'Preferências de cookies'
  },
  integrations: [],
  onChange: null,
  autoShow: true
};

let state = null;

function readStorage(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* storage unavailable (private mode, quota, etc.) — consent still works for this pageview */
  }
}

function getStoredConsent(config) {
  const stored = readStorage(config.storageKey);
  if (!stored || stored.v !== config.version) return null;
  return stored.categories;
}

function defaultConsent(categories) {
  const out = {};
  categories.forEach((c) => { out[c.id] = !!c.required; });
  return out;
}

function allGrantedConsent(categories) {
  const out = {};
  categories.forEach((c) => { out[c.id] = true; });
  return out;
}

// Scripts opt into gating by using type="text/plain" data-consent-category="analytics"
// instead of a normal type. Browsers never execute unrecognized script types, so they
// stay inert until activateCategory() rebuilds them as real <script> elements.
function activateCategory(categoryId) {
  const selector = `script[type="text/plain"][data-consent-category="${categoryId}"]`;
  const nodes = document.querySelectorAll(selector);
  nodes.forEach((old) => {
    const s = document.createElement('script');
    Array.prototype.forEach.call(old.attributes, (attr) => {
      if (attr.name === 'type') return;
      s.setAttribute(attr.name, attr.value);
    });
    if (!old.src) s.text = old.textContent;
    old.parentNode.replaceChild(s, old);
  });
}

function activateGranted(consent) {
  Object.keys(consent).forEach((id) => {
    if (consent[id]) activateCategory(id);
  });
}

function runIntegrations(hook, consent) {
  (state.config.integrations || []).forEach((integration) => {
    if (typeof integration[hook] === 'function') integration[hook](consent, state.config);
  });
}

function persist(consent) {
  writeStorage(state.config.storageKey, {
    v: state.config.version,
    categories: consent,
    ts: new Date().toISOString()
  });
}

function applyConsent(consent, opts = {}) {
  state.consent = consent;
  activateGranted(consent);
  runIntegrations('onChange', consent);
  if (typeof state.config.onChange === 'function') state.config.onChange(consent);
  if (opts.persist !== false) persist(consent);
  window.dispatchEvent(new CustomEvent('mkconsent:change', { detail: consent }));
}

// --- UI -------------------------------------------------------------

function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html != null) e.innerHTML = html;
  return e;
}

function closeUI() {
  if (state.ui.banner) { state.ui.banner.remove(); state.ui.banner = null; }
  if (state.ui.overlay) { state.ui.overlay.remove(); state.ui.overlay = null; }
  if (state.ui.modal) { state.ui.modal.remove(); state.ui.modal = null; }
}

function renderBanner() {
  const config = state.config;
  const t = config.texts;
  closeUI();

  const banner = el('div', 'mkc-banner');
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-label', t.title);

  const policyLink = (t.policyHref && t.policyLabel)
    ? ` <a class="mkc-link" href="${t.policyHref}">${t.policyLabel}</a>`
    : '';

  banner.innerHTML =
    '<div class="mkc-banner-body">' +
    `<p class="mkc-banner-title">${t.title}</p>` +
    `<p class="mkc-banner-desc">${t.description}${policyLink}</p>` +
    '</div>' +
    '<div class="mkc-banner-actions">' +
    `<button type="button" class="mkc-btn mkc-btn-ghost" data-action="customize">${t.btnCustomize}</button>` +
    `<button type="button" class="mkc-btn mkc-btn-outline" data-action="reject">${t.btnRejectAll}</button>` +
    `<button type="button" class="mkc-btn mkc-btn-primary" data-action="accept">${t.btnAcceptAll}</button>` +
    '</div>';

  banner.addEventListener('click', (ev) => {
    const action = ev.target.getAttribute('data-action');
    if (action === 'accept') {
      applyConsent(allGrantedConsent(config.categories));
      closeUI();
    } else if (action === 'reject') {
      applyConsent(defaultConsent(config.categories));
      closeUI();
    } else if (action === 'customize') {
      renderPreferences();
    }
  });

  document.body.appendChild(banner);
  state.ui.banner = banner;
}

function renderPreferences() {
  const config = state.config;
  const t = config.texts;
  const current = state.consent || getStoredConsent(config) || defaultConsent(config.categories);
  closeUI();

  const overlay = el('div', 'mkc-overlay');
  const modal = el('div', 'mkc-modal');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', t.prefsTitle);

  const rows = config.categories.map((cat) => {
    const checked = current[cat.id] ? 'checked' : '';
    const disabled = cat.required ? 'disabled' : '';
    return (
      '<label class="mkc-row">' +
      '<span class="mkc-row-text">' +
      `<span class="mkc-row-label">${cat.label}${cat.required ? ' <em>(sempre ativo)</em>' : ''}</span>` +
      (cat.description ? `<span class="mkc-row-desc">${cat.description}</span>` : '') +
      '</span>' +
      `<input type="checkbox" data-category="${cat.id}" ${checked} ${disabled}>` +
      '</label>'
    );
  }).join('');

  modal.innerHTML =
    '<div class="mkc-modal-header">' +
    `<p class="mkc-modal-title">${t.prefsTitle}</p>` +
    '<button type="button" class="mkc-close" data-action="close" aria-label="Fechar">&times;</button>' +
    '</div>' +
    `<div class="mkc-modal-body">${rows}</div>` +
    '<div class="mkc-modal-footer">' +
    `<button type="button" class="mkc-btn mkc-btn-outline" data-action="reject">${t.btnRejectAll}</button>` +
    `<button type="button" class="mkc-btn mkc-btn-primary" data-action="save">${t.btnSave}</button>` +
    '</div>';

  function collect() {
    const out = {};
    config.categories.forEach((cat) => {
      if (cat.required) { out[cat.id] = true; return; }
      const input = modal.querySelector(`input[data-category="${cat.id}"]`);
      out[cat.id] = !!(input && input.checked);
    });
    return out;
  }

  modal.addEventListener('click', (ev) => {
    const action = ev.target.getAttribute('data-action');
    if (action === 'save') {
      applyConsent(collect());
      closeUI();
    } else if (action === 'reject') {
      applyConsent(defaultConsent(config.categories));
      closeUI();
    } else if (action === 'close') {
      closeUI();
      if (!getStoredConsent(config)) renderBanner();
    }
  });

  overlay.addEventListener('click', () => {
    closeUI();
    if (!getStoredConsent(config)) renderBanner();
  });

  document.body.appendChild(overlay);
  document.body.appendChild(modal);
  state.ui.overlay = overlay;
  state.ui.modal = modal;
}

// --- Public API -------------------------------------------------------

export function init(userConfig = {}) {
  // Re-calling init() (React StrictMode's double effect-invoke, Fast Refresh,
  // or a consumer just calling it twice) must not leave the previous
  // instance's banner/modal orphaned in the DOM.
  if (state) closeUI();

  const config = Object.assign({}, DEFAULTS, userConfig);
  config.texts = Object.assign({}, DEFAULTS.texts, userConfig.texts);
  config.categories = userConfig.categories || DEFAULTS.categories;

  state = { config, consent: null, ui: {} };

  const stored = getStoredConsent(config);
  if (stored) {
    applyConsent(stored, { persist: false });
  } else {
    const consent = defaultConsent(config.categories);
    state.consent = consent;
    activateGranted(consent);
    runIntegrations('onChange', consent);
    if (config.autoShow !== false) renderBanner();
  }
}

export function has(categoryId) {
  return !!(state && state.consent && state.consent[categoryId]);
}

export function open() {
  if (!state) return;
  renderPreferences();
}

export function reset() {
  if (!state) return;
  try { window.localStorage.removeItem(state.config.storageKey); } catch (e) {}
}
