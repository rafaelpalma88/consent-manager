import type { ConsentIntegration } from "../index";

export interface GoogleConsentModeMapping {
  analytics?: string[];
  marketing?: string[];
  functional?: string[];
  [key: string]: string[] | undefined;
}

export function googleConsentMode(
  mapping?: GoogleConsentModeMapping
): ConsentIntegration;

export function googleConsentModeBootstrap(options?: {
  storageKey?: string;
  version?: number;
}): string;
