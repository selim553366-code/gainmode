import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { GAINMODE_WIDGETS, parseWidgetSnapshot, type GainModeWidgetName, createWidgetModel } from './widgetModels';
import { WidgetCard } from './WidgetCards';

// Android invokes this handler on add, resize, periodic refresh, and requested updates.
export async function widgetTaskHandler({ widgetAction, widgetInfo, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
  const snapshot = parseWidgetSnapshot(await AsyncStorage.getItem('forge-fit-state'));
  const name = GAINMODE_WIDGETS.includes(widgetInfo.widgetName as GainModeWidgetName)
    ? widgetInfo.widgetName as GainModeWidgetName
    : 'Motivation';
  renderWidget(<WidgetCard name={name} model={createWidgetModel(snapshot)} />);
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
