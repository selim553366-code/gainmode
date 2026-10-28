import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { renderPrivacyPolicyPage } = require('../server/privacyPolicy.js');

const locationCopy = {
  tr: ['Konum ve hava durumu arka planları', 'Open-Meteo', 'saklanmaz'],
  en: ['Location and weather backgrounds', 'Open-Meteo', 'not stored'],
  de: ['Standort und Wetterhintergründe', 'Open-Meteo', 'nicht auf GainMode-Servern gespeichert'],
  fr: ['Localisation et arrière-plans météo', 'Open-Meteo', 'n’est pas stockée'],
  es: ['Ubicación y fondos según el clima', 'Open-Meteo', 'no la almacena'],
};

test('privacy policy discloses weather location use in every supported language', () => {
  for (const [language, [heading, provider, retention]] of Object.entries(locationCopy)) {
    const html = renderPrivacyPolicyPage(language, '/forge-fit');
    for (const phrase of [heading, provider, retention]) {
      assert.ok(html.includes(phrase), `${language} policy should include ${phrase}`);
    }
  }
});
