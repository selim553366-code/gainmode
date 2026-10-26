import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import type { Language } from '@/lib/i18n';
import { quoteOfTheDay } from '@/lib/widgetQuotes';
import { MotivationWidget } from './MotivationWidget';

const supportedLanguages: Language[] = ['tr', 'en', 'de', 'fr', 'es'];

// Runs headless when Android asks for the widget, so it reads the app's saved language directly from storage.
async function storedLanguage(): Promise<Language> {
  try {
    const stored = await AsyncStorage.getItem('forge-fit-state');
    const language = stored ? (JSON.parse(stored) as { language?: string }).language : undefined;
    return supportedLanguages.includes(language as Language) ? (language as Language) : 'tr';
  } catch {
    return 'tr';
  }
}

export async function widgetTaskHandler({ widgetAction, widgetInfo, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
  const language = await storedLanguage();
  renderWidget(<MotivationWidget quote={quoteOfTheDay(language)} language={language} width={widgetInfo.width} />);
}
