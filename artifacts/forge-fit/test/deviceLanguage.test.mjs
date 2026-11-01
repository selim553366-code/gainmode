import test from 'node:test';
import assert from 'node:assert/strict';
import { languageFromLocale } from '../lib/deviceLanguage.ts';

test('phone locale picks the matching app language', () => {
  assert.equal(languageFromLocale('tr-TR'), 'tr');
  assert.equal(languageFromLocale('de_AT'), 'de');
  assert.equal(languageFromLocale('fr'), 'fr');
  assert.equal(languageFromLocale('es-419'), 'es');
});

test('unsupported or missing locales fall back to English', () => {
  assert.equal(languageFromLocale('pt-BR'), 'en');
  assert.equal(languageFromLocale(undefined), 'en');
});
