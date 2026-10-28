import Constants from 'expo-constants';
import { getApiBaseUrl } from '@/lib/api';
import type { Language } from '@/lib/i18n';

export type LegalDocument = 'privacy-policy' | 'terms-of-service' | 'delete-account';

const GLOBE_STUDIOS_LEGAL_ORIGIN = 'https://globe-studios.com';

export function legalDocumentUrl(document: LegalDocument, language: Language) {
  if (document === 'delete-account') {
    const extra = Constants.expoConfig?.extra as { apiBaseUrl?: unknown } | undefined;
    const configured = typeof extra?.apiBaseUrl === 'string' ? extra.apiBaseUrl.trim() : '';
    const baseUrl = (configured || getApiBaseUrl())?.replace(/\/+$/, '');
    if (!baseUrl) throw new Error('GainMode account deletion page is not configured.');
    return `${baseUrl}/forge-fit/delete-account?lang=${encodeURIComponent(language)}`;
  }
  const page = document === 'privacy-policy' ? 'privacy' : document === 'terms-of-service' ? 'terms' : 'support';
  return `${GLOBE_STUDIOS_LEGAL_ORIGIN}/${page}?lang=${encodeURIComponent(language)}`;
}