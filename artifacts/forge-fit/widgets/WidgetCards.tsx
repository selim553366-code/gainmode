"use no memo";

import React from 'react';
import { FlexWidget, ImageWidget, OverlapWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import type { ColorProp } from 'react-native-android-widget';
import type { GainModeWidgetName, WidgetModel } from './widgetModels';
import { widgetCopy } from './widgetCopy';
import { dailyWidgetCard, performancePaths } from './widgetSchedule';

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

type Size = { width: number; height: number };
type Copy = (typeof widgetCopy)['en'];

/**
 * Background artwork for the picture cards: pixel size and the colours along its top and bottom edges.
 * A widget wider than the artwork crops its top and bottom; a narrower one shows it whole, with bands
 * painted in those edge colours above and below so nothing important is cut off.
 */
const art = {
  night: { image: require('../assets/images/widgets/widget-night.jpg'), w: 842, h: 512, top: ['#BFD3FA', '#C3D5FB', '#D8E4FE', '#E1E9FC', '#D7E3FA'], bottom: ['#BACDF2', '#B6C8EE', '#CDDBF6', '#CAD9F8', '#D0DEF8'] },
  goal: { image: require('../assets/images/widgets/widget-goal.jpg'), w: 1208, h: 484, top: ['#022A7A', '#05266D', '#133785', '#234292', '#304B9A'], bottom: ['#022A79', '#0E388C', '#3E7CD7', '#2D5CB7', '#4C9BFD'] },
  performance: { image: require('../assets/images/widgets/widget-performance.jpg'), w: 424, h: 516, top: ['#D4E3FB', '#DCE7FD', '#DEE9FD', '#DCE7FB', '#CEE1FA'], bottom: ['#C2D4F7', '#CBDBFA', '#CDDCFA', '#CEDDFB', '#CFDFF9'] },
  stronger: { image: require('../assets/images/widgets/widget-stronger.jpg'), w: 946, h: 320, top: ['#BFD7FB', '#D0E0FC', '#E3EBFE', '#D5E2FC', '#DEE9FC'], bottom: ['#C4DBFB', '#6E8FCB', '#C8D8F8', '#DEE7FD', '#D7E2FD'] },
  start: { image: require('../assets/images/widgets/widget-start.jpg'), w: 792, h: 288, top: ['#EEF5FC', '#E2EAFD', '#DFEAFE', '#E2EAFD', '#D8E5FA'], bottom: ['#DDE8FB', '#D3E1FB', '#D3E1FC', '#D8E4FE', '#D5E3F9'] },
} as const;
type Art = (typeof art)[keyof typeof art];

/** Where the artwork lands inside the widget, so text can sit beside the mascot at any size. */
function placeArt(item: Art, size: Size) {
  const wider = size.width / size.height >= item.w / item.h;
  const mode: 'cover' | 'contain' = wider ? 'cover' : 'contain';
  const scale = mode === 'cover' ? Math.max(size.width / item.w, size.height / item.h) : Math.min(size.width / item.w, size.height / item.h);
  const offsetX = (size.width - item.w * scale) / 2;
  const offsetY = (size.height - item.h * scale) / 2;
  return { mode, x: (px: number) => Math.round(px * scale + offsetX), y: (py: number) => Math.round(py * scale + offsetY) };
}

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(value)));

function edgeBands(item: Art, size: Size) {
  const stops = (colors: readonly string[]) => colors.map((color, index) => `<stop offset="${index / (colors.length - 1)}" stop-color="${color}"/>`).join('');
  const half = size.height / 2;
  const id = `e${item.w}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}"><defs><linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="0">${stops(item.top)}</linearGradient><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="0">${stops(item.bottom)}</linearGradient></defs><rect width="${size.width}" height="${half + 1}" fill="url(#${id}t)"/><rect y="${half}" width="${size.width}" height="${half}" fill="url(#${id}b)"/></svg>`;
}

/** A picture card: the artwork edge to edge, with live text laid over it. */
function ArtCard({ item, size, route, children }: { item: Art; size: Size; route: string; children: React.ReactNode }) {
  const placed = placeArt(item, size);
  return (
    <OverlapWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: `forge-fit://${route}` }}
      style={{ width: 'match_parent', height: 'match_parent', borderRadius: 24, overflow: 'hidden' }}
    >
      {placed.mode === 'contain' ? <SvgWidget svg={edgeBands(item, size)} style={{ width: size.width, height: size.height }} /> : null}
      <ImageWidget
        image={item.image}
        imageWidth={size.width}
        imageHeight={size.height}
        resizeMode={placed.mode}
        radius={24}
        style={{ width: 'match_parent', height: 'match_parent' }}
      />
      {children}
    </OverlapWidget>
  );
}

/** A column of text placed in a box of the widget (left/top/right/bottom in dp). */
function TextBox({ box, children, justify = 'center' }: { box: { left: number; top: number; right: number; bottom: number }; children: React.ReactNode; justify?: 'center' | 'flex-start' | 'flex-end' | 'space-between' }) {
  return (
    <FlexWidget style={{ width: 'match_parent', height: 'match_parent', paddingLeft: Math.max(0, box.left), paddingTop: Math.max(0, box.top), paddingRight: Math.max(0, box.right), paddingBottom: Math.max(0, box.bottom), flexDirection: 'column', justifyContent: justify }}>
      {children}
    </FlexWidget>
  );
}

function Line({ text, size, color, bold = false, lines = 1 }: { text: string; size: number; color: ColorProp; bold?: boolean; lines?: number }) {
  return <TextWidget text={text} maxLines={lines} truncate="END" style={{ fontSize: size, fontWeight: bold ? '800' : '600', color }} />;
}

function GoodNightCard({ model, t, size }: { model: WidgetModel; t: Copy; size: Size }) {
  const placed = placeArt(art.night, size);
  const left = placed.x(492);
  const width = size.width - left - 14;
  const headline = model.isNight
    ? (model.firstName ? fill(t.goodNightName, { name: model.firstName }) : t.goodNight)
    : t.recovery;
  const today = model.activeMinutes > 0
    ? `${t.today}: ${model.activeMinutes} ${t.minutes} · ${model.activeCalories} ${t.calories}`
    : model.currentStreak > 0 ? fill(t.streakDays, { count: model.currentStreak }) : t.recovery;
  const tomorrow = `${t.tomorrow}: ${model.tomorrowWorkoutName || t.restShort}`;
  const big = clamp(Math.min(size.height * 0.13, width * 0.11), 13, 22);
  return (
    <ArtCard item={art.night} size={size} route="breathe">
      <TextBox box={{ left, top: Math.max(placed.y(150), 12), right: 14, bottom: 12 }}>
        <Line text={headline} size={big} color={ink} bold lines={2} />
        <Line text={today} size={clamp(big * 0.58, 10, 13)} color="#365A8C" />
        <Line text={tomorrow} size={clamp(big * 0.58, 10, 13)} color={blue} bold />
      </TextBox>
    </ArtCard>
  );
}

function NextGoalCard({ model, t, size }: { model: WidgetModel; t: Copy; size: Size }) {
  const placed = placeArt(art.goal, size);
  const right = Math.max(size.width - placed.x(600), size.width * 0.42);
  const width = size.width - right - 16;
  const unitKey = model.nextBadgeMetric === 'streak' || model.nextBadgeMetric === 'activeDays' || model.nextBadgeMetric === 'onTargetDays'
    ? 'days'
    : model.nextBadgeMetric ?? 'workouts';
  const big = clamp(Math.min(size.height * 0.17, width * 0.13), 14, 28);
  const progress = Math.max(0.04, Math.min(1, model.nextBadgeProgress));
  return (
    <ArtCard item={art.goal} size={size} route="badge-wall">
      <TextBox box={{ left: 16, top: 14, right, bottom: 14 }} justify="space-between">
        <Line text={t.yourNextGoal} size={clamp(big * 0.45, 10, 13)} color="#BFD5FF" bold />
        {model.nextBadge ? (
          <FlexWidget style={{ flexDirection: 'column' }}>
            <Line text={fill(t.remaining, { count: model.nextBadgeRemaining, unit: t.units[unitKey] })} size={big} color="#FFFFFF" bold lines={2} />
            <Line text={fill(t.toUnlock, { badge: model.nextBadgeTitle })} size={clamp(big * 0.5, 10, 14)} color="#DCE8FF" lines={2} />
          </FlexWidget>
        ) : (
          <Line text={t.allBadges} size={big} color="#FFFFFF" bold lines={2} />
        )}
        <FlexWidget style={{ width: Math.max(40, Math.round(width)), height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.22)', flexDirection: 'row' }}>
          <FlexWidget style={{ width: Math.max(6, Math.round(width * progress)), height: 6, borderRadius: 3, backgroundColor: '#FBBF24' }} />
        </FlexWidget>
      </TextBox>
    </ArtCard>
  );
}

function PerformanceCard({ model, t, size }: { model: WidgetModel; t: Copy; size: Size }) {
  const placed = placeArt(art.performance, size);
  const chartWidth = Math.max(60, size.width - 28);
  const chartHeight = Math.max(28, Math.round(size.height * 0.3));
  const { line, area, last } = performancePaths(model.performanceBars, chartWidth, chartHeight, 5);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B82F6" stop-opacity="0.28"/><stop offset="1" stop-color="#3B82F6" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#g)"/><path d="${line}" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="4" fill="#FFFFFF" stroke="#2563EB" stroke-width="2.5"/></svg>`;
  const change = model.performanceChange;
  const headline = change === null ? `${model.currentWeekMinutes} ${t.minutes}` : `${change > 0 ? '+' : ''}${change}%`;
  const caption = change === null ? t.firstWeek : `${t.vsLastWeek} · ${model.currentWeekMinutes} ${t.minutes}`;
  const big = clamp(Math.min(size.height * 0.2, size.width * 0.2), 18, 34);
  return (
    <ArtCard item={art.performance} size={size} route="progress-charts">
      <TextBox box={{ left: 14, top: Math.max(placed.y(150), 40), right: 14, bottom: 12 }} justify="space-between">
        <FlexWidget style={{ flexDirection: 'column' }}>
          <Line text={headline} size={big} color={change !== null && change < 0 ? '#B45309' : ink} bold />
          <Line text={caption} size={clamp(big * 0.36, 9, 12)} color="#456284" lines={2} />
        </FlexWidget>
        <SvgWidget svg={svg} style={{ width: chartWidth, height: chartHeight }} />
      </TextBox>
    </ArtCard>
  );
}

function StrongerCard({ model, t, size }: { model: WidgetModel; t: Copy; size: Size }) {
  const placed = placeArt(art.stronger, size);
  const left = Math.max(placed.x(548), 0);
  const width = size.width - left - 14;
  const headline = model.activeToday
    ? (model.firstName ? fill(t.strongerName, { name: model.firstName }) : t.stronger)
    : (model.firstName ? fill(t.keepStreakName, { name: model.firstName }) : t.keepStreak);
  const streak = model.currentStreak > 0 ? fill(t.streakDays, { count: model.currentStreak }) : t.startStreak;
  const big = clamp(Math.min(size.height * 0.16, width * 0.1), 12, 21);
  return (
    <ArtCard item={art.stronger} size={size} route="streak">
      <TextBox box={{ left, top: 10, right: 14, bottom: 10 }}>
        <Line text={headline} size={big} color={ink} bold lines={2} />
        <Line text={width > 190 ? `🔥 ${streak} · ${model.totalWorkouts} ${t.units.workouts}` : `🔥 ${streak}`} size={clamp(big * 0.62, 10, 13)} color={blue} bold />
      </TextBox>
    </ArtCard>
  );
}

function StartWorkoutCard({ model, t, size }: { model: WidgetModel; t: Copy; size: Size }) {
  const placed = placeArt(art.start, size);
  const left = placed.x(300);
  const right = Math.max(size.width - placed.x(624), 12);
  const width = size.width - left - right;
  const workout = model.todayWorkout;
  const title = workout ? model.todayWorkoutName : t.restShort;
  const detail = !workout
    ? `${t.next}: ${model.nextWorkoutName || t.restShort}`
    : workout.completed
      ? `✓ ${t.doneToday}`
      : `${model.todayWorkoutDuration} ${t.minutes} · ${model.completedExercises}/${model.exerciseCount} ${t.units.exercises}`;
  const big = clamp(Math.min(size.height * 0.2, width * 0.11), 12, 20);
  return (
    <ArtCard item={art.start} size={size} route="plan">
      <TextBox box={{ left, top: 8, right, bottom: 8 }}>
        <Line text={workout && !workout.completed ? t.start : t.today} size={clamp(big * 0.6, 9, 12)} color={blue} bold />
        <Line text={title} size={big} color={ink} bold lines={2} />
        <Line text={detail} size={clamp(big * 0.62, 9, 12)} color="#456284" />
      </TextBox>
    </ArtCard>
  );
}

const defaultSize: Size = { width: 320, height: 160 };

export function WidgetCard({ name, model, size = defaultSize }: { name: GainModeWidgetName; model: WidgetModel; size?: Size }) {
  const t = widgetCopy[model.language];
  const area: Size = { width: Math.max(110, size.width || defaultSize.width), height: Math.max(60, size.height || defaultSize.height) };
  switch (name) {
    case 'TodayProgress':
      return <Base route="progress-charts"><Label text={t.progress} bold /><MascotRow title={t.workout} value={model.todayWorkout ? `${model.completedExercises}/${model.exerciseCount}` : t.restDay} /><FlexWidget style={{ width: 'match_parent', height: 7, flexDirection: 'row', backgroundColor: '#D6E4F7', borderRadius: 5 }}>{model.todayWorkout && <FlexWidget style={{ width: Math.max(0, Math.round(model.workoutProgress * 132)), height: 7, borderRadius: 5, backgroundColor: blue }} />}</FlexWidget><Label text={`${model.activeCalories} ${t.calories} · ${model.activeMinutes} ${t.minutes}`} /><Label text={t.open} size={9} color="#64748B" /></Base>;
    case 'Breathe':
      return <Base route="breathe"><MascotRow title={t.breathe} value="4 · 4 · 6" /><Label text={t.breatheHint} /><Label text={t.open} size={9} color="#64748B" /></Base>;
    case 'Streak':
      return <StrongerCard model={model} t={t} size={area} />;
    case 'StartWorkout':
      return <StartWorkoutCard model={model} t={t} size={area} />;
    case 'WeeklyConsistency':
      return <Base route="streak"><Label text={t.week} bold /><FlexWidget style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between' }}>{model.streakWeek.map((day, index) => <Label key={`${day.date}-${index}`} text={day.isCompleted ? '●' : '○'} size={18} color={day.isCompleted ? blue : '#9AAEC9'} bold />)}</FlexWidget><Label text={`${model.currentStreak} ${t.days}`} size={14} bold /></Base>;
    case 'Motivation':
      return <Base route="coach" dark><Label text={t.quote} size={10} color="#DBEAFE" bold /><TextWidget text={model.quote} maxLines={3} truncate="END" style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }} /><Label text={t.open} size={9} color="#DBEAFE" /></Base>;
    case 'NextGoal':
      return <NextGoalCard model={model} t={t} size={area} />;
    case 'Performance':
      return <PerformanceCard model={model} t={t} size={area} />;
    case 'GoodNight':
      return <GoodNightCard model={model} t={t} size={area} />;
    case 'Daily':
      return <WidgetCard name={dailyWidgetCard({ workoutPending: model.workoutPending, hasNextGoal: Boolean(model.nextBadge) }, model.hour)} model={model} size={area} />;
  }
}
