import React from 'react';
import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';
import type { ColorProp } from 'react-native-android-widget';
import type { GainModeWidgetName, WidgetModel } from './widgetModels';
import { widgetCopy } from './widgetCopy';

const mascot = require('../assets/images/coach-thumbs-up-no-bg.png');
const blue = '#2563EB';
const ink = '#102C59';

function Label({ text, size = 12, color = ink as ColorProp, bold = false }: { text: string; size?: number; color?: ColorProp; bold?: boolean }) {
  return <TextWidget text={text} style={{ fontSize: size, fontWeight: bold ? '700' : '500', color }} />;
}

function Base({ children, route, dark = false }: { children: React.ReactNode; route: string; dark?: boolean }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: `forge-fit://${route}` }}
      style={{
        width: 'match_parent',
        height: 'match_parent',
        padding: 16,
        borderRadius: 24,
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: dark ? blue : '#EEF6FF',
      }}
    >
      {children}
    </FlexWidget>
  );
}

function MascotRow({ title, value, dark = false }: { title: string; value: string; dark?: boolean }) {
  return (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <FlexWidget style={{ flexDirection: 'column' }}>
        <Label text={title} size={12} color={dark ? '#DCEAFF' : '#456284'} bold />
        <Label text={value} size={22} color={dark ? '#FFFFFF' : ink} bold />
      </FlexWidget>
      <ImageWidget image={mascot} imageWidth={68} imageHeight={68} resizeMode="contain" style={{ width: 68, height: 68 }} />
    </FlexWidget>
  );
}

export function WidgetCard({ name, model }: { name: GainModeWidgetName; model: WidgetModel }) {
  const t = widgetCopy[model.language];
  const workoutName = model.nextWorkout?.name ?? t.restDay;
  switch (name) {
    case 'TodayProgress':
      return <Base route="progress-charts"><Label text={t.progress} bold /><MascotRow title={t.workout} value={model.todayWorkout ? `${model.completedExercises}/${model.exerciseCount}` : t.restDay} /><FlexWidget style={{ width: 'match_parent', height: 7, flexDirection: 'row', backgroundColor: '#D6E4F7', borderRadius: 5 }}>{model.todayWorkout && <FlexWidget style={{ width: Math.max(0, Math.round(model.workoutProgress * 132)), height: 7, borderRadius: 5, backgroundColor: blue }} />}</FlexWidget><Label text={`${model.activeCalories} ${t.calories} · ${model.activeMinutes} ${t.minutes}`} /><Label text={t.open} size={9} color="#64748B" /></Base>;
    case 'Breathe':
      return <Base route="breathe"><MascotRow title={t.breathe} value="4 · 4 · 6" /><Label text={t.breatheHint} /><Label text={t.open} size={9} color="#64748B" /></Base>;
    case 'Streak':
      return <Base route="streak" dark><MascotRow title={t.streak} value={`${model.currentStreak} ${t.days}`} dark /><Label text={t.open} size={9} color="#DBEAFE" /></Base>;
    case 'StartWorkout':
      return <Base route="plan"><Label text={t.today} size={10} color="#456284" bold /><MascotRow title={t.workout} value={workoutName} /><Label text={model.nextWorkout ? t.start : t.restDay} size={11} color={blue} bold /></Base>;
    case 'WeeklyConsistency':
      return <Base route="streak"><Label text={t.week} bold /><FlexWidget style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between' }}>{model.streakWeek.map((day, index) => <Label key={`${day.date}-${index}`} text={day.isCompleted ? '●' : '○'} size={18} color={day.isCompleted ? blue : '#9AAEC9'} bold />)}</FlexWidget><Label text={`${model.currentStreak} ${t.days}`} size={14} bold /></Base>;
    case 'Motivation':
      return <Base route="coach" dark><Label text={t.quote} size={10} color="#DBEAFE" bold /><TextWidget text={model.quote} maxLines={3} truncate="END" style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }} /><Label text={t.open} size={9} color="#DBEAFE" /></Base>;
    case 'NextGoal':
      return <Base route="badge-wall"><Label text={t.nextGoal} bold /><MascotRow title={model.nextBadgeTitle || t.nextGoal} value={`${Math.round(model.nextBadgeProgress * 100)}%`} /><Label text={`${model.currentWeekMinutes} ${t.minutes}`} size={11} /></Base>;
    case 'Performance':
      return <Base route="progress-charts"><Label text={t.performance} bold /><FlexWidget style={{ width: 'match_parent', height: 54, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }}>{model.performanceBars.map((minutes, index) => <FlexWidget key={`${index}-${minutes}`} style={{ width: 16, height: Math.min(48, Math.max(6, minutes / 2)), borderRadius: 6, backgroundColor: minutes > 0 ? blue : '#C7D7EF' }} />)}</FlexWidget><Label text={`${model.currentWeekMinutes} ${t.minutes}${model.performanceChange === null ? '' : ` · ${model.performanceChange > 0 ? '+' : ''}${model.performanceChange}%`}`} size={12} bold /></Base>;
    case 'GoodNight':
      return <Base route="breathe" dark={model.isNight}><MascotRow title={model.isNight ? t.goodNight : t.recovery} value={model.isNight ? t.recovery : t.goodNight} dark={model.isNight} /><Label text={`${model.localTime} · ${t.open}`} size={9} color={model.isNight ? '#DBEAFE' : '#64748B'} /></Base>;
  }
}
