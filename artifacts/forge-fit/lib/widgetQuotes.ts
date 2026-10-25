import type { Language } from '@/lib/i18n';
// Shared with the iOS widget target, which bundles the same file as a resource.
import quotes from '../targets/widget/assets/quotes.json';

const quotesByLanguage = quotes as Record<Language, string[]>;

/** Day of the year in local time, so the quote changes at the user's midnight on both platforms. */
function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

export function quoteOfTheDay(language: Language, date = new Date()) {
  const list = quotesByLanguage[language] ?? quotesByLanguage.en;
  return list[dayOfYear(date) % list.length];
}
