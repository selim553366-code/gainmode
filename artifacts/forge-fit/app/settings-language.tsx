import React from 'react';
import { router } from 'expo-router';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { Header, Screen } from '@/components/FitUI';
import { LanguageList } from '@/components/SettingsControls';

export default function SettingsLanguageScreen() {
  const { language, setLanguage } = useFit();
  return <Screen>
    <Header title={translate(language, 'appLanguage')} subtitle={translate(language, 'languageDescription')} action="close-outline" onAction={() => router.back()} />
    <LanguageList value={language} onChange={setLanguage} />
  </Screen>;
}
