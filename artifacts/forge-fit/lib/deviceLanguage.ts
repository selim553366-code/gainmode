import type { Language } from './i18n';

const supported: Language[] = ['tr', 'en', 'de', 'fr', 'es'];

/** Map a locale tag such as "de-DE" or "pt_BR" to an app language; English when the phone's language is not supported. */
export function languageFromLocale(locale: string | null | undefined): Language {
  const code = (locale ?? '').toLowerCase().split(/[-_]/)[0] as Language;
  return supported.includes(code) ? code : 'en';
}

/** The phone's language on first launch; the user can still change it in the app. */
export function detectDeviceLanguage(): Language {
  try {
    const nav = (globalThis as { navigator?: { languages?: readonly string[]; language?: string } }).navigator;
    const locale = nav?.languages?.[0] ?? nav?.language ?? Intl.DateTimeFormat().resolvedOptions().locale;
    return languageFromLocale(locale);
  } catch {
    return 'en';
  }
}
