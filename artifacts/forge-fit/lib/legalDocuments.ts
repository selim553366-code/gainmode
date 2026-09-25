import Constants from 'expo-constants';
import { getApiBaseUrl } from '@/lib/api';
import type { Language } from '@/lib/i18n';

export type LegalDocument = 'privacy-policy' | 'terms-of-service' | 'delete-account';

type ExpoExtra = {
  apiBaseUrl?: unknown;
};

export function legalDocumentUrl(document: LegalDocument, language: Language) {
  const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;
  const configured = typeof extra?.apiBaseUrl === 'string' ? extra.apiBaseUrl.trim() : '';
  const baseUrl = (configured || getApiBaseUrl())?.replace(/\/+$/, '');
  if (!baseUrl) throw new Error('GainMode legal pages are not configured.');
  return `${baseUrl}/forge-fit/${document}?lang=${encodeURIComponent(language)}`;
}