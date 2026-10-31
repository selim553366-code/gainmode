import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { Language } from '@/lib/i18n';

export const MOTIVATION_WIDGET_NAME = 'Motivation';

const eyebrows: Record<Language, string> = {
  tr: 'GÜNÜN SÖZÜ',
  en: 'TODAY’S FUEL',
  de: 'IMPULS DES TAGES',
  fr: 'L’ÉLAN DU JOUR',
  es: 'IMPULSO DEL DÍA',
};

/**
 * Home-screen poster for Android: brand-blue gradient, the quote of the day set large, FitBud signature.
 * Tapping anywhere opens the app. The poster keeps its blue in both themes, like the iOS widget. The brand name is never set as plain
 * text; the wordmark lives only in its own artwork.
 */
export function MotivationWidget({ quote, language, width }: { quote: string; language: Language; width: number }) {
  const compact = width < 250;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: compact ? 16 : 20,
        borderRadius: 28,
        backgroundColor: 'rgba(0, 0, 0, 0)',
      }}
    >
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextWidget text={eyebrows[language]} style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.12, color: 'rgba(255, 255, 255, 0.72)' }} />
      </FlexWidget>
      <TextWidget
        text={quote}
        maxLines={compact ? 5 : 4}
        truncate="END"
        style={{ fontSize: compact ? 15 : 20, fontWeight: '700', color: '#FFFFFF' }}
      />
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
        <FlexWidget style={{ width: 22, height: 3, borderRadius: 2, backgroundColor: '#8EDBFA' }} />
        <TextWidget text="  FitBud" style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)' }} />
      </FlexWidget>
    </FlexWidget>
  );
}
