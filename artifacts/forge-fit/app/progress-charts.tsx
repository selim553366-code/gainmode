import React from 'react';
import { router } from 'expo-router';
import { Header, Screen } from '@/components/FitUI';
import { ProgressChartsView } from '@/components/ProgressChartsSection';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';

export default function ProgressChartsScreen() {
  const { language } = useFit();
  return <Screen>
    <Header title={translate(language, 'chartsTitle')} subtitle={translate(language, 'chartsSubtitle')} action="arrow-back" onAction={() => router.back()} />
    <ProgressChartsView />
  </Screen>;
}
