export interface ConsentCategory {
  id: string;
  required?: boolean;
  label: string;
  description?: string;
}

export interface ConsentTexts {
  title?: string;
  description?: string;
  policyLabel?: string | null;
  policyHref?: string | null;
  btnAcceptAll?: string;
  btnRejectAll?: string;
  btnCustomize?: string;
  btnSave?: string;
  prefsTitle?: string;
}

export type ConsentState = Record<string, boolean>;

export interface ConsentIntegration {
  onInit?: (consent: ConsentState, config: ConsentConfig) => void;
  onChange?: (consent: ConsentState, config: ConsentConfig) => void;
}

export interface ConsentConfig {
  storageKey?: string;
  version?: number;
  categories: ConsentCategory[];
  texts?: ConsentTexts;
  integrations?: ConsentIntegration[];
  onChange?: (consent: ConsentState) => void;
  autoShow?: boolean;
}

export function init(config: ConsentConfig): void;
export function has(categoryId: string): boolean;
export function open(): void;
export function reset(): void;
