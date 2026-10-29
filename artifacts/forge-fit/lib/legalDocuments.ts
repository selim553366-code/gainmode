import type { Language } from '@/lib/i18n';

export type LegalDocument = 'privacy-policy' | 'terms-of-service' | 'delete-account';

const GLOBE_STUDIOS_LEGAL_ORIGIN = 'https://globe-studios.com';

export function legalDocumentUrl(document: LegalDocument, language: Language) {
  const page = document === 'privacy-policy'
    ? 'privacy'
    : document === 'terms-of-service'
      ? 'terms'
      : 'delete-account';
  return `${GLOBE_STUDIOS_LEGAL_ORIGIN}/${page}?lang=${encodeURIComponent(language)}`;
}