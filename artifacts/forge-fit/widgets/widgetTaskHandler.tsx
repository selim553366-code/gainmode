import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlexWidget, TextWidget, requestWidgetUpdate } from 'react-native-android-widget';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { GAINMODE_WIDGETS, parseWidgetSnapshot, type GainModeWidgetName, createWidgetModel } from './widgetModels';
import { WidgetCard } from './WidgetCards';
import { widgetCopy } from './widgetCopy';

// Android invokes this handler on add, resize, periodic refresh, and requested updates.
export async function widgetTaskHandler({ widgetAction, widgetInfo, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
  let refreshHint = widgetCopy.tr.refreshHint;
  try {
    const snapshot = parseWidgetSnapshot(await AsyncStorage.getItem('forge-fit-state'));
    refreshHint = widgetCopy[snapshot.language].refreshHint;
    const name = GAINMODE_WIDGETS.includes(widgetInfo.widgetName as GainModeWidgetName)
      ? widgetInfo.widgetName as GainModeWidgetName
      : 'Motivation';
    renderWidget(<WidgetCard name={name} model={createWidgetModel(snapshot)} />);
  } catch (error) {
    console.error('[GainMode] Android widget render failed', error);
    renderWidget(
      <FlexWidget style={{ width: 'match_parent', height: 'match_parent', padding: 16, borderRadius: 24, flexDirection: 'column', justifyContent: 'center', backgroundColor: '#2563EB' }}>
        <TextWidget text="GainMode" style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }} />
        <TextWidget text={refreshHint} style={{ fontSize: 12, color: '#EAF2FF' }} />
      </FlexWidget>,
    );
  }
}

/** Refresh each installed widget after fitness data has been persisted. */
export async function refreshGainModeWidgets() {
  const snapshot = parseWidgetSnapshot(await AsyncStorage.getItem('forge-fit-state'));
  const model = createWidgetModel(snapshot);
  await Promise.all(GAINMODE_WIDGETS.map((widgetName) => requestWidgetUpdate({
    widgetName,
    renderWidget: () => <WidgetCard name={widgetName} model={model} />,
  })));
}
