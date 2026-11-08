"use no memo";

import React from 'react';
import { FlexWidget, ImageWidget, OverlapWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import type { ColorProp } from 'react-native-android-widget';
import type { Language } from '@/lib/i18n';
import { badgeMedalImages } from '@/lib/badgeMedalImages';
import type { GainModeWidgetName, WidgetModel } from './widgetModels';

// Artwork shared with the app: the Blender kettlebell, FitBud, and the streak campfire.
const kettlebell = require('../assets/images/widgets/v2/kettlebell.png');
const fitbud = require('../assets/images/widgets/v2/fitbud.png');
const fire = require('../assets/images/widgets/v2/fire.png');

// Inter ships with the widget (react-native-android-widget `fonts`), so numbers match the app.
const HEAVY = 'Inter_800ExtraBold';
const SEMI = 'Inter_600SemiBold';

type Palette = { card: ColorProp; ink: ColorProp; muted: ColorProp; accent: ColorProp; track: ColorProp; success: ColorProp; button: ColorProp; buttonText: ColorProp; buttonKey: ColorProp; buttonArrow: ColorProp };
const light: Palette = { card: '#FFFFFF', ink: '#0B1530', muted: '#5B6B88', accent: '#2563EB', track: '#E6EDF8', success: '#22C55E', button: '#0B1530', buttonText: '#FFFFFF', buttonKey: '#FFFFFF', buttonArrow: '#0B1530' };
const dark: Palette = { card: '#141619', ink: '#FFFFFF', muted: '#9AA4B8', accent: '#3B82F6', track: '#2A2F3A', success: '#22C55E', button: '#FFFFFF', buttonText: '#0B1530', buttonKey: '#2563EB', buttonArrow: '#FFFFFF' };

const copy: Record<Language, {
  calories: string; kcalLeft: string; kcalOver: string; setGoal: string; protein: string; carbs: string; fat: string;
  todaysWorkout: string; start: string; done: string; rest: string; next: string; min: string; exercises: string;
  streak: string; days: string; startStreak: string; week: string; nextBadge: string; toGo: string; allBadges: string;
}> = {
  tr: { calories: 'KALORİ', kcalLeft: 'kcal kaldı', kcalOver: 'kcal fazla', setGoal: 'Hedefini belirle', protein: 'Protein', carbs: 'Karb.', fat: 'Yağ', todaysWorkout: 'BUGÜNÜN ANTRENMANI', start: 'Başla', done: 'Tamamlandı', rest: 'Dinlenme günü', next: 'Sıradaki', min: 'dk', exercises: 'hareket', streak: 'SERİ', days: 'gün', startStreak: 'Bugün başla', week: 'BU HAFTA', nextBadge: 'SIRADAKİ ROZET', toGo: 'kaldı', allBadges: 'Tüm rozetler senin' },
  en: { calories: 'CALORIES', kcalLeft: 'kcal left', kcalOver: 'kcal over', setGoal: 'Set your goal', protein: 'Protein', carbs: 'Carbs', fat: 'Fat', todaysWorkout: 'TODAY’S WORKOUT', start: 'Start', done: 'Done', rest: 'Rest day', next: 'Next', min: 'min', exercises: 'exercises', streak: 'STREAK', days: 'days', startStreak: 'Start today', week: 'THIS WEEK', nextBadge: 'NEXT BADGE', toGo: 'to go', allBadges: 'Every badge is yours' },
  de: { calories: 'KALORIEN', kcalLeft: 'kcal übrig', kcalOver: 'kcal drüber', setGoal: 'Ziel festlegen', protein: 'Protein', carbs: 'Kohlenh.', fat: 'Fett', todaysWorkout: 'HEUTIGES TRAINING', start: 'Start', done: 'Erledigt', rest: 'Ruhetag', next: 'Nächstes', min: 'Min.', exercises: 'Übungen', streak: 'SERIE', days: 'Tage', startStreak: 'Heute starten', week: 'DIESE WOCHE', nextBadge: 'NÄCHSTES ABZEICHEN', toGo: 'übrig', allBadges: 'Alle Abzeichen gehören dir' },
  fr: { calories: 'CALORIES', kcalLeft: 'kcal restantes', kcalOver: 'kcal en trop', setGoal: 'Fixe ton objectif', protein: 'Protéines', carbs: 'Glucides', fat: 'Lipides', todaysWorkout: 'SÉANCE DU JOUR', start: 'Go', done: 'Terminé', rest: 'Jour de repos', next: 'Prochaine', min: 'min', exercises: 'exercices', streak: 'SÉRIE', days: 'jours', startStreak: 'Commence aujourd’hui', week: 'CETTE SEMAINE', nextBadge: 'PROCHAIN BADGE', toGo: 'restants', allBadges: 'Tous les badges sont à toi' },
  es: { calories: 'CALORÍAS', kcalLeft: 'kcal restantes', kcalOver: 'kcal de más', setGoal: 'Fija tu objetivo', protein: 'Proteína', carbs: 'Carbos', fat: 'Grasa', todaysWorkout: 'ENTRENO DE HOY', start: 'Empezar', done: 'Hecho', rest: 'Día de descanso', next: 'Siguiente', min: 'min', exercises: 'ejercicios', streak: 'RACHA', days: 'días', startStreak: 'Empieza hoy', week: 'ESTA SEMANA', nextBadge: 'PRÓXIMA INSIGNIA', toGo: 'restantes', allBadges: 'Todas las insignias son tuyas' },
};
type Copy = (typeof copy)['en'];
type Size = { width: number; height: number };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(value)));
const tierColor: Record<string, string> = { bronze: '#C98C54', silver: '#9AA4B8', gold: '#E8B23A', platinum: '#7FA6CC', legendary: '#9B6BF0' };

function Text({ text, size, color, heavy = false, lines = 1, align }: { text: string; size: number; color: ColorProp; heavy?: boolean; lines?: number; align?: 'left' | 'center' | 'right' }) {
  return <TextWidget text={text} maxLines={lines} truncate="END" style={{ fontSize: size, fontFamily: heavy ? HEAVY : SEMI, color, textAlign: align, letterSpacing: heavy ? -0.02 : 0 }} />;
}

/** The widget surface: rounded card, tap target, and an optional gradient instead of the plain card colour. */
function Shell({ route, background, gradient, children, padding = 14 }: { route: string; background: ColorProp; gradient?: { from: ColorProp; to: ColorProp }; children: React.ReactNode; padding?: number }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: `forge-fit://${route}` }}
      style={{
        width: 'match_parent',
        height: 'match_parent',
        padding,
        borderRadius: 26,
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...(gradient ? { backgroundGradient: { from: gradient.from, to: gradient.to, orientation: 'TL_BR' } } : { backgroundColor: background }),
      }}
    >
      {children}
    </FlexWidget>
  );
}

function Bar({ width, height = 6, progress, color, track }: { width: number; height?: number; progress: number; color: ColorProp; track: ColorProp }) {
  const fill = Math.round(width * Math.max(0, Math.min(1, progress)));
  return (
    <FlexWidget style={{ width, height, borderRadius: height / 2, backgroundColor: track, flexDirection: 'row' }}>
      {fill > 0 ? <FlexWidget style={{ width: Math.max(height, fill), height, borderRadius: height / 2, backgroundColor: color }} /> : null}
    </FlexWidget>
  );
}

/** A progress ring drawn as SVG: the calorie share of today's goal. */
function ringSvg(size: number, stroke: number, progress: number, color: string, track: string) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, progress)) * c;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
}

function CaloriesCard({ model, t, p, size }: { model: WidgetModel; t: Copy; p: Palette; size: Size }) {
  const inner = size.width - 28;
  const wide = size.width >= 230;
  const ring = clamp(Math.min(size.height * 0.36, inner * 0.36), 40, 76);
  const over = model.calorieGoal !== null && model.caloriesEaten > model.calorieGoal;
  const big = model.calorieGoal === null ? '—' : String(over ? model.caloriesEaten - model.calorieGoal : model.caloriesLeft ?? 0);
  const bigSize = clamp(Math.min(size.height * 0.24, (inner - ring) * 0.3), 22, 40);
  const barWidth = Math.max(40, Math.round(wide ? inner - 58 - 74 : inner - 44));
  const colors: Record<string, ColorProp> = { protein: p.accent, carbs: p.success, fat: '#FF6A2B' };
  return (
    <Shell route="nutrition" background={p.card}>
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <FlexWidget style={{ flexDirection: 'column' }}>
          <Text text={t.calories} size={10} color={p.muted} heavy />
          <Text text={big} size={bigSize} color={over ? '#FF6A2B' : p.ink} heavy />
          <Text text={model.calorieGoal === null ? t.setGoal : over ? t.kcalOver : t.kcalLeft} size={11} color={p.muted} />
        </FlexWidget>
        <OverlapWidget style={{ width: ring, height: ring }}>
          <SvgWidget svg={ringSvg(ring, Math.max(5, Math.round(ring * 0.13)), model.calorieProgress, String(over ? '#FF6A2B' : p.accent), String(p.track))} style={{ width: ring, height: ring }} />
          <FlexWidget style={{ width: ring, height: ring, alignItems: 'center', justifyContent: 'center' }}>
            <Text text={`${Math.round(model.calorieProgress * 100)}%`} size={clamp(ring * 0.24, 10, 16)} color={p.ink} heavy />
          </FlexWidget>
        </OverlapWidget>
      </FlexWidget>
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
        {model.macros.map((macro) => (
          <FlexWidget key={macro.key} style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <FlexWidget style={{ width: wide ? 58 : 44 }}><Text text={t[macro.key]} size={10} color={p.muted} /></FlexWidget>
            <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Bar width={barWidth} height={5} progress={macro.goal ? macro.eaten / macro.goal : 0} color={colors[macro.key]} track={p.track} />
              {wide ? <FlexWidget style={{ width: 66, marginLeft: 8 }}><Text align="right" text={macro.goal ? `${macro.eaten}/${macro.goal} g` : `${macro.eaten} g`} size={10} color={p.ink} /></FlexWidget> : null}
            </FlexWidget>
          </FlexWidget>
        ))}
      </FlexWidget>
    </Shell>
  );
}

function StartWorkoutCard({ model, t, p, size }: { model: WidgetModel; t: Copy; p: Palette; size: Size }) {
  const workout = model.todayWorkout;
  const pending = Boolean(workout && !workout.completed);
  const art = clamp(Math.min(size.height * 0.78, size.width * 0.3), 52, 120);
  const inner = size.width - 28 - art - 8;
  const titleSize = clamp(Math.min(size.height * 0.15, inner * 0.11), 15, 24);
  const route = pending && workout?.id ? `workout-session?workoutId=${encodeURIComponent(workout.id)}` : 'plan';
  const title = workout ? model.todayWorkoutName : t.rest;
  const meta = !workout
    ? `${t.next}: ${model.nextWorkoutName || t.rest}`
    : `${model.todayWorkoutDuration} ${t.min} · ${model.exerciseCount} ${t.exercises}`;
  const segments = Math.max(1, Math.min(12, model.exerciseCount));
  const segGap = 3;
  const segWidth = Math.max(4, Math.floor((inner - 34 - segGap * (segments - 1)) / segments));
  return (
    <Shell route={route} background={p.card}>
      <FlexWidget style={{ width: 'match_parent', height: 'match_parent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <FlexWidget style={{ width: inner, height: 'match_parent', flexDirection: 'column', justifyContent: 'space-between' }}>
          <FlexWidget style={{ flexDirection: 'column' }}>
            <Text text={t.todaysWorkout} size={10} color={p.accent} heavy />
            <Text text={title} size={titleSize} color={p.ink} heavy lines={1} />
            <Text text={meta} size={11} color={p.muted} />
          </FlexWidget>
          {workout ? (
            <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
              {Array.from({ length: segments }, (_, index) => (
                <FlexWidget key={index} style={{ width: segWidth, height: 6, borderRadius: 3, marginRight: index < segments - 1 ? segGap : 0, backgroundColor: index < Math.round((model.completedExercises / Math.max(1, model.exerciseCount)) * segments) ? p.success : p.track }} />
              ))}
              <FlexWidget style={{ marginLeft: 8 }}><Text text={`${model.completedExercises}/${model.exerciseCount}`} size={11} color={p.ink} heavy /></FlexWidget>
            </FlexWidget>
          ) : null}
          {pending && size.height >= 130 ? (
            <FlexWidget style={{ height: 36, borderRadius: 18, backgroundColor: p.button, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 4 }}>
              <Text text={t.start} size={13} color={p.buttonText} heavy />
              <FlexWidget style={{ width: 28, height: 28, borderRadius: 10, marginLeft: 12, backgroundColor: p.buttonKey, alignItems: 'center', justifyContent: 'center' }}>
                <Text text="→" size={14} color={p.buttonArrow} heavy />
              </FlexWidget>
            </FlexWidget>
          ) : workout?.completed ? <Text text={`✓ ${t.done}`} size={12} color={p.success} heavy /> : null}
        </FlexWidget>
        <ImageWidget image={kettlebell} imageWidth={Math.round(art * 0.74)} imageHeight={art} resizeMode="contain" style={{ width: Math.round(art * 0.74), height: art }} />
      </FlexWidget>
    </Shell>
  );
}

function StreakCard({ model, t, size }: { model: WidgetModel; t: Copy; size: Size }) {
  const art = clamp(Math.min(size.height * 0.62, size.width * 0.45), 48, 110);
  const big = clamp(Math.min(size.height * 0.32, size.width * 0.3), 30, 56);
  return (
    <Shell route="streak" background="#0B1022" gradient={{ from: '#121A3A', to: '#3A1A10' }}>
      <Text text={t.streak} size={10} color="#FFB547" heavy />
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <FlexWidget style={{ flexDirection: 'column' }}>
          <Text text={model.currentStreak > 0 ? String(model.currentStreak) : '0'} size={big} color="#FFFFFF" heavy />
          <Text text={model.currentStreak > 0 ? t.days : t.startStreak} size={12} color="#C9CFDD" />
          {model.streakTierLabel ? (
            <FlexWidget style={{ marginTop: 6, borderRadius: 999, paddingLeft: 9, paddingRight: 9, paddingTop: 3, paddingBottom: 3, backgroundGradient: { from: '#FF7A2F', to: '#FFB547', orientation: 'LEFT_RIGHT' } }}>
              <Text text={model.streakTierLabel.toLocaleUpperCase(model.language)} size={10} color="#3A1600" heavy />
            </FlexWidget>
          ) : null}
        </FlexWidget>
        <ImageWidget image={fire} imageWidth={Math.round(art * 0.8)} imageHeight={art} resizeMode="contain" style={{ width: Math.round(art * 0.8), height: art }} />
      </FlexWidget>
    </Shell>
  );
}

function WeekCard({ model, t, p, size }: { model: WidgetModel; t: Copy; p: Palette; size: Size }) {
  const gap = 6;
  const capsuleWidth = Math.max(22, Math.floor((size.width - 28 - gap * 6) / 7));
  const capsuleHeight = clamp(size.height - 28 - 26, 44, 120);
  const labelSize = clamp(capsuleWidth * 0.28, 8, 11);
  const numberSize = clamp(capsuleWidth * 0.42, 11, 18);
  return (
    <Shell route="plan" background={p.card}>
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text text={t.week} size={10} color={p.accent} heavy />
        <Text text={`${model.workoutsDoneThisWeek}/${model.workoutsThisWeek}`} size={12} color={p.ink} heavy />
      </FlexWidget>
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between' }}>
        {model.planWeek.map((day, index) => {
          const filled = day.done;
          const border = day.isToday ? p.ink : p.track;
          return (
            <FlexWidget
              key={index}
              style={{
                width: capsuleWidth,
                height: capsuleHeight,
                borderRadius: Math.round(capsuleWidth / 2),
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 6,
                paddingBottom: 6,
                ...(filled ? { backgroundColor: p.accent } : { borderWidth: day.isToday ? 2 : 1, borderColor: border, borderStyle: day.hasWorkout || day.isToday ? 'solid' : 'dashed' }),
              }}
            >
              <Text text={day.label} size={labelSize} color={filled ? '#FFFFFF' : p.muted} align="center" />
              <Text text={String(day.dayNumber)} size={numberSize} color={filled ? '#FFFFFF' : p.ink} heavy align="center" />
              <Text text={filled ? '✓' : day.hasWorkout ? '•' : '☾'} size={labelSize + 1} color={filled ? '#FFFFFF' : day.hasWorkout ? p.accent : p.muted} heavy align="center" />
            </FlexWidget>
          );
        })}
      </FlexWidget>
    </Shell>
  );
}

function NextBadgeCard({ model, t, p, size }: { model: WidgetModel; t: Copy; p: Palette; size: Size }) {
  const medal = model.nextBadgeId ? badgeMedalImages[model.nextBadgeId] : undefined;
  const wide = size.width >= 230;
  const art = clamp(Math.min(size.height * (wide ? 0.62 : 0.3), size.width * 0.4), 36, 96);
  const inner = wide ? size.width - 28 - art - 12 : size.width - 28;
  const color = (tierColor[model.nextBadgeTier ?? 'gold'] ?? p.accent) as ColorProp;
  const details = model.nextBadge ? (
    <FlexWidget style={{ flexDirection: 'column', width: inner }}>
      <Text text={model.nextBadgeTitle} size={clamp(inner * 0.1, 12, 17)} color={p.ink} heavy lines={wide ? 2 : 1} />
      <FlexWidget style={{ marginTop: 6 }}><Bar width={inner} height={6} progress={model.nextBadgeProgress} color={color} track={p.track} /></FlexWidget>
      <FlexWidget style={{ marginTop: 4 }}><Text text={`${model.nextBadgeRemaining} ${t.toGo}`} size={11} color={p.muted} /></FlexWidget>
    </FlexWidget>
  ) : <Text text={t.allBadges} size={14} color={p.ink} heavy lines={2} />;
  return (
    <Shell route="badge-wall" background={p.card}>
      <Text text={t.nextBadge} size={10} color={p.accent} heavy />
      {wide ? (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
          {medal ? <ImageWidget image={medal} imageWidth={art} imageHeight={art} resizeMode="contain" style={{ width: art, height: art, marginRight: 12 }} /> : null}
          {details}
        </FlexWidget>
      ) : (
        <>
          {medal ? <ImageWidget image={medal} imageWidth={art} imageHeight={art} resizeMode="contain" style={{ width: art, height: art }} /> : null}
          {details}
        </>
      )}
    </Shell>
  );
}

function FitBudCard({ model, p, size }: { model: WidgetModel; p: Palette; size: Size }) {
  const art = clamp(Math.min(size.height * 0.92, size.width * 0.34), 56, 140);
  const inner = size.width - 28 - Math.round(art * 0.7) - 10;
  const quoteSize = clamp(Math.min(size.height * 0.13, inner * 0.085), 12, 20);
  return (
    <Shell route="coach" background={p.card} padding={12}>
      <FlexWidget style={{ width: 'match_parent', height: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
        <ImageWidget image={fitbud} imageWidth={Math.round(art * 0.7)} imageHeight={art} resizeMode="contain" style={{ width: Math.round(art * 0.7), height: art, marginRight: 10 }} />
        <FlexWidget style={{ width: inner, flexDirection: 'column' }}>
          <Text text={`“${model.quote}”`} size={quoteSize} color={p.ink} heavy lines={4} />
          <FlexWidget style={{ marginTop: 6 }}><Text text="— FitBud" size={11} color={p.accent} /></FlexWidget>
        </FlexWidget>
      </FlexWidget>
    </Shell>
  );
}

const defaultSize: Size = { width: 320, height: 160 };

export function WidgetCard({ name, model, size = defaultSize, darkMode = false }: { name: GainModeWidgetName; model: WidgetModel; size?: Size; darkMode?: boolean }) {
  const t = copy[model.language] ?? copy.en;
  const p = darkMode ? dark : light;
  const area: Size = { width: Math.max(110, size.width || defaultSize.width), height: Math.max(80, size.height || defaultSize.height) };
  switch (name) {
    case 'Calories':
      return <CaloriesCard model={model} t={t} p={p} size={area} />;
    case 'StartWorkout':
      return <StartWorkoutCard model={model} t={t} p={p} size={area} />;
    case 'Streak':
      return <StreakCard model={model} t={t} size={area} />;
    case 'WeeklyConsistency':
      return <WeekCard model={model} t={t} p={p} size={area} />;
    case 'NextGoal':
      return <NextBadgeCard model={model} t={t} p={p} size={area} />;
    case 'Motivation':
      return <FitBudCard model={model} p={p} size={area} />;
  }
}
