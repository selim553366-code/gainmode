import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Ellipse, Line, RadialGradient, Stop } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { ArrowRight, Check, Clock, Dumbbell, Layers, Moon } from 'lucide-react-native';
import { PressableScale as Pressable } from '@/components/Motion';
import { useFit } from '@/context/FitContext';
import { translate, type Language, type TranslationKey } from '@/lib/i18n';
import { getWeekdayKey, getWorkoutCompletionRatio, type MuscleGroup } from '@/lib/workoutPlan';
import { liveTranslate, type LiveWorkoutCopyKey } from '@/lib/liveWorkoutCopy';
import { useColors } from '@/hooks/useColors';
import { EmptyState, Header, Screen, triggerHaptic } from '@/components/FitUI';

const muscleGroupLabels: Record<MuscleGroup, TranslationKey> = {
  chest: 'muscleChest',
  back: 'muscleBack',
  shoulders: 'muscleShoulders',
  biceps: 'muscleBiceps',
  triceps: 'muscleTriceps',
  core: 'muscleCore',
  quadriceps: 'muscleQuadriceps',
  hamstrings: 'muscleHamstrings',
  glutes: 'muscleGlutes',
  calves: 'muscleCalves',
  other: 'muscleOther',
};

const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
type WeekDay = (typeof weekDays)[number];
const dayLabels: Record<WeekDay, TranslationKey> = {
  MON: 'dayMon',
  TUE: 'dayTue',
  WED: 'dayWed',
  THU: 'dayThu',
  FRI: 'dayFri',
  SAT: 'daySat',
  SUN: 'daySun',
};

const planCopy: Record<Language, { week: string; workouts: string; more: string; done: string; resume: string; live: string; rest: string; today: string; moves: string; time: string; sets: string; minutes: string }> = {
  tr: { week: 'BU HAFTA', workouts: 'antrenman tamamlandı', more: '+{n} hareket daha', done: 'Tamamlandı', resume: 'Kaldığın yerden devam et', live: 'CANLI', rest: 'Toparlanma', today: 'Bugün', moves: 'Hareketler', time: 'Süre', sets: 'Set', minutes: 'dk' },
  en: { week: 'THIS WEEK', workouts: 'workouts done', more: '+{n} more exercises', done: 'Completed', resume: 'Pick up where you left off', live: 'LIVE', rest: 'Recovery', today: 'Today', moves: 'Exercises', time: 'Time', sets: 'Sets', minutes: 'min' },
  de: { week: 'DIESE WOCHE', workouts: 'Trainings erledigt', more: '+{n} weitere Übungen', done: 'Erledigt', resume: 'Dort weitermachen, wo du warst', live: 'LIVE', rest: 'Erholung', today: 'Heute', moves: 'Übungen', time: 'Dauer', sets: 'Sätze', minutes: 'Min' },
  fr: { week: 'CETTE SEMAINE', workouts: 'séances terminées', more: '+{n} autres exercices', done: 'Terminé', resume: 'Reprendre où tu t’es arrêté', live: 'LIVE', rest: 'Récupération', today: 'Aujourd’hui', moves: 'Exercices', time: 'Durée', sets: 'Séries', minutes: 'min' },
  es: { week: 'ESTA SEMANA', workouts: 'entrenos hechos', more: '+{n} ejercicios más', done: 'Completado', resume: 'Sigue donde lo dejaste', live: 'EN VIVO', rest: 'Recuperación', today: 'Hoy', moves: 'Ejercicios', time: 'Tiempo', sets: 'Series', minutes: 'min' },
};

/** Calendar date for each weekday of the current Monday-first week. */
function weekDates(now = new Date()) {
  const offset = (now.getDay() + 6) % 7;
  return weekDays.map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset + index);
    return date.getDate();
  });
}

/**
 * The week as seven capsules. Each one fills from the bottom as its workout gets done, a finished day turns green,
 * a rest day stays an outline with a moon, and the chosen day turns solid ink.
 */
function WeekCapsules({ activeDay, onSelect, workouts, language }: { activeDay: WeekDay; onSelect: (day: WeekDay) => void; workouts: ReturnType<typeof useFit>['workouts']; language: Language }) {
  const colors = useColors();
  const dates = weekDates();
  const today = getWeekdayKey() as WeekDay;
  return <View style={styles.capsules}>
    {weekDays.map((day, index) => {
      const workout = workouts.find((item) => item.day === day);
      const ratio = workout ? getWorkoutCompletionRatio(workout) : 0;
      const done = Boolean(workout?.completed);
      const selected = day === activeDay;
      const ink = selected ? colors.background : colors.foreground;
      const muted = selected ? `${colors.background}99` : colors.mutedForeground;
      return <Pressable key={day} testID={`plan-day-${day}`} accessibilityRole="tab" accessibilityLabel={translate(language, dayLabels[day])} accessibilityState={{ selected }} onPress={() => { triggerHaptic(); onSelect(day); }} scaleTo={0.92} style={styles.capsuleWrap}>
        <View style={[
          styles.capsule,
          selected
            ? { backgroundColor: colors.foreground, borderColor: colors.foreground }
            : workout ? { backgroundColor: colors.card, borderColor: colors.border } : { backgroundColor: 'transparent', borderColor: colors.border, borderStyle: 'dashed' },
        ]}>
          {workout && !selected ? <View style={[styles.capsuleFill, { height: `${Math.max(done ? 100 : ratio * 100, 0)}%`, backgroundColor: done ? `${colors.success}2E` : `${colors.accent}1F` }]} /> : null}
          <Text style={[styles.capsuleDay, { color: muted }]}>{translate(language, dayLabels[day])}</Text>
          <Text style={[styles.capsuleDate, { color: ink }]}>{dates[index]}</Text>
          <View style={[styles.capsuleIcon, { backgroundColor: done ? colors.success : selected ? colors.accent : workout ? `${colors.accent}18` : 'transparent' }]}>
            {done ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : workout ? <Dumbbell size={12} color={selected ? '#FFFFFF' : colors.accent} strokeWidth={2.3} /> : <Moon size={12} color={muted} strokeWidth={2.2} />}
          </View>
        </View>
        <View style={[styles.todayDot, { backgroundColor: day === today ? colors.accent : 'transparent' }]} />
      </Pressable>;
    })}
  </View>;
}

/** A stick figure with tracked joints, scanned by a moving line: what live form checking does. */
function SkeletonScan() {
  const reduced = useReducedMotion();
  const scan = useSharedValue(0);
  React.useEffect(() => {
    if (reduced) return;
    scan.set(withRepeat(withSequence(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) })), -1));
  }, [reduced, scan]);
  const lineStyle = useAnimatedStyle(() => ({ transform: [{ translateY: 8 + scan.get() * 86 }] }));
  const joints: Array<[number, number]> = [[50, 16], [50, 34], [34, 46], [66, 46], [26, 62], [74, 60], [50, 60], [40, 82], [60, 82], [36, 102], [64, 102]];
  const bones: Array<[number, number]> = [[0, 1], [1, 2], [1, 3], [2, 4], [3, 5], [1, 6], [6, 7], [6, 8], [7, 9], [8, 10]];
  return <View style={styles.skeleton}>
    <Svg width={100} height={112} viewBox="0 0 100 112">
      {bones.map(([a, b]) => <Line key={`${a}-${b}`} x1={joints[a][0]} y1={joints[a][1]} x2={joints[b][0]} y2={joints[b][1]} stroke="#7FA6FF" strokeWidth={2.5} strokeLinecap="round" />)}
      {joints.map(([x, y], index) => <Circle key={index} cx={x} cy={y} r={index === 0 ? 7 : 3.6} fill={index === 0 ? 'none' : '#FFFFFF'} stroke={index === 0 ? '#7FA6FF' : '#3DD68C'} strokeWidth={index === 0 ? 2.5 : 1.6} />)}
    </Svg>
    <Animated.View pointerEvents="none" style={[styles.scanLine, lineStyle]}>
      <LinearGradient colors={['rgba(61,214,140,0)', 'rgba(61,214,140,0.9)', 'rgba(61,214,140,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  </View>;
}

export default function PlanScreen() {
  const colors = useColors();
  const { language, workouts, refreshWorkoutCycleIfReady } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const copy = planCopy[language] ?? planCopy.en;
  const liveT = (key: LiveWorkoutCopyKey) => liveTranslate(language, key);
  const params = useLocalSearchParams<{ day?: string }>();
  const requestedDay = typeof params.day === 'string' && weekDays.includes(params.day as WeekDay) ? params.day as WeekDay : null;
  const [activeDay, setActiveDay] = React.useState<WeekDay>(requestedDay ?? getWeekdayKey());
  const active = workouts.find((workout) => workout.day === activeDay);
  const label = (value: string) => translate(language, value as TranslationKey) || value;
  const completedCount = active?.exercises.filter((exercise) => Boolean(exercise.completed)).length ?? 0;
  const completedWorkouts = workouts.filter((workout) => workout.completed).length;
  const isToday = activeDay === getWeekdayKey();
  const dark = colors.colorScheme === 'dark';
  const liveChoices = [
    { kind: 'squat', label: liveT('liveSquat') },
    { kind: 'pushup', label: liveT('livePushup') },
    { kind: 'lunge', label: liveT('liveLunge') },
  ] as const;

  React.useEffect(() => {
    if (requestedDay) setActiveDay(requestedDay);
  }, [requestedDay]);

  React.useEffect(() => {
    if (workouts[0]?.day && activeDay === workouts[0].day) refreshWorkoutCycleIfReady(activeDay);
  }, [activeDay, refreshWorkoutCycleIfReady, workouts]);

  if (workouts.length === 0) return <Screen><Header eyebrow={t('planEyebrow')} title={t('planTitle')} subtitle={t('planSubtitle')} /><EmptyState icon="barbell-outline" title={t('noWorkout')} text={t('createPlan')} /></Screen>;

  const startWorkout = () => {
    if (!active) return;
    triggerHaptic();
    router.push({ pathname: '/workout-session', params: { workoutId: active.id } });
  };
  const totalSets = active?.exercises.reduce((sum, exercise) => sum + (Number(exercise.sets) || 0), 0) ?? 0;
  const nextIndex = active?.exercises.findIndex((exercise) => !exercise.completed) ?? -1;
  const dayName = (isToday ? copy.today : t(dayLabels[activeDay])).toLocaleUpperCase(language);

  return <View style={styles.page}>
    <Screen sky>
      <Header eyebrow={t('planEyebrow')} title={t('planTitle')} />

      <View style={styles.weekHead}>
        <Text style={[styles.weekEyebrow, { color: colors.mutedForeground }]}>{copy.week}</Text>
        <View style={styles.weekDots}>
          {workouts.map((workout) => <View key={workout.id} style={[styles.weekDot, { backgroundColor: workout.completed ? colors.success : `${colors.foreground}1A` }]} />)}
          <Text style={[styles.weekCount, { color: colors.foreground }]}>{completedWorkouts}/{workouts.length}</Text>
        </View>
      </View>
      <WeekCapsules activeDay={activeDay} onSelect={setActiveDay} workouts={workouts} language={language} />

      {active ? <>
        {/* Session stage: the 3D kettlebell stands on its shadow beside the name of the day's workout. */}
        <View style={[styles.stage, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.stageTop}>
            <View style={styles.stageCopy}>
              <Text style={[styles.stageEyebrow, { color: colors.accent }]}>{dayName}</Text>
              <Text numberOfLines={2} style={[styles.stageTitle, { color: colors.foreground }]}>{label(active.name)}</Text>
              {active.focusAreas?.length ? <View style={styles.focusRow}>
                {active.focusAreas.map((group) => <View key={group} style={[styles.focusChip, { borderColor: colors.border }]}><Text style={[styles.focusChipText, { color: colors.foreground }]}>{t(muscleGroupLabels[group])}</Text></View>)}
              </View> : null}
            </View>
            <View style={styles.prop} pointerEvents="none">
              <Svg width={112} height={26} style={styles.propShadow}>
                <Defs><RadialGradient id="kbShadow" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={dark ? '#000000' : '#0B2A66'} stopOpacity={dark ? 0.6 : 0.28} /><Stop offset="1" stopColor="#0B2A66" stopOpacity={0} /></RadialGradient></Defs>
                <Ellipse cx={56} cy={13} rx={54} ry={11} fill="url(#kbShadow)" />
              </Svg>
              <Image source={require('@/assets/images/props/kettlebell.png')} resizeMode="contain" style={styles.propImage} />
            </View>
          </View>

          <View style={[styles.stats, { backgroundColor: `${colors.foreground}08` }]}>
            {[
              { icon: <Clock size={14} color={colors.accent} strokeWidth={2.3} />, value: String(active.duration), unit: copy.minutes, label: copy.time },
              { icon: <Dumbbell size={14} color={colors.accent} strokeWidth={2.3} />, value: String(active.exercises.length), unit: '', label: copy.moves },
              { icon: <Layers size={14} color={colors.accent} strokeWidth={2.3} />, value: String(totalSets), unit: '', label: copy.sets },
            ].map((stat, index) => <View key={stat.label} style={[styles.stat, index ? { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border } : null]}>
              {stat.icon}
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}<Text style={[styles.statUnit, { color: colors.mutedForeground }]}>{stat.unit ? ` ${stat.unit}` : ''}</Text></Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>)}
          </View>

          {completedCount > 0 ? <View style={styles.progressRow}>
            <View style={[styles.progressTrack, { backgroundColor: `${colors.foreground}12` }]}>
              <View style={[styles.progressFill, { width: `${(completedCount / Math.max(active.exercises.length, 1)) * 100}%`, backgroundColor: colors.success }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.foreground }]}>{completedCount}/{active.exercises.length}</Text>
          </View> : null}

          <Pressable testID="start-planned-workout" accessibilityRole="button" accessibilityLabel={t('startWorkout')} onPress={startWorkout} scaleTo={0.97} style={[styles.cta, { backgroundColor: colors.foreground }]}>
            <Text style={[styles.ctaText, { color: colors.background }]}>{active.completed ? copy.done : completedCount > 0 ? copy.resume : t('startWorkout')}</Text>
            <View style={[styles.ctaArrow, { backgroundColor: colors.accent }]}>{active.completed ? <Check size={17} color="#FFFFFF" strokeWidth={3} /> : <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.4} />}</View>
          </Pressable>
        </View>

        {/* The exercises as a route: done stops are green, the next one is ringed, the rest wait in line. */}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{copy.moves}</Text>
          <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{active.exercises.length}</Text>
        </View>
        <View style={[styles.route, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {active.exercises.map((exercise, index) => {
            const done = Boolean(exercise.completed);
            const next = index === nextIndex;
            const last = index === active.exercises.length - 1;
            return <Pressable key={exercise.id} accessibilityRole="button" onPress={startWorkout} scaleTo={0.985} style={styles.stop}>
              <View style={styles.rail}>
                <View style={[styles.node, done
                  ? { backgroundColor: colors.success, borderColor: colors.success }
                  : next ? { backgroundColor: colors.card, borderColor: colors.accent, borderWidth: 2.5 } : { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {done ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : <Text style={[styles.nodeText, { color: next ? colors.accent : colors.mutedForeground }]}>{index + 1}</Text>}
                </View>
                {!last ? <View style={[styles.railLine, { backgroundColor: done ? colors.success : colors.border }]} /> : null}
              </View>
              <View style={[styles.stopBody, !last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border } : null]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={[styles.stopName, { color: colors.foreground, opacity: done ? 0.5 : 1 }]}>{label(exercise.name)}</Text>
                  {exercise.muscleGroup ? <Text numberOfLines={1} style={[styles.stopMuscle, { color: colors.mutedForeground }]}>{t(muscleGroupLabels[exercise.muscleGroup as MuscleGroup] ?? 'muscleOther')}</Text> : null}
                </View>
                <View style={[styles.setsPill, { backgroundColor: next ? `${colors.accent}14` : `${colors.foreground}0A` }]}>
                  <Text style={[styles.setsText, { color: next ? colors.accent : colors.foreground }]}>{exercise.sets} × {exercise.reps}</Text>
                </View>
              </View>
            </Pressable>;
          })}
        </View>

        {/* Live form check: always a night-blue panel, like the camera view it opens. */}
        <LinearGradient testID="live-form-analysis-bar" colors={['#0E1730', '#16264D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.live}>
          <View style={styles.liveTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.livePillText}>{copy.live}</Text></View>
              <Text style={styles.liveTitle}>{liveT('liveWorkoutTitle')}</Text>
              <Text style={styles.liveBody}>{liveT('liveWorkoutBody')}</Text>
            </View>
            <View style={styles.liveVisual}><SkeletonScan /></View>
          </View>
          <View style={styles.liveChoices}>
            {liveChoices.map((choice) => <Pressable
              key={choice.kind}
              testID={`start-live-${choice.kind}`}
              accessibilityRole="button"
              accessibilityLabel={choice.label}
              onPress={() => { triggerHaptic(); router.push({ pathname: '/live-workout', params: { exercise: choice.kind } }); }}
              style={styles.liveChoice}
            >
              <Text numberOfLines={1} style={styles.liveChoiceText}>{choice.label}</Text>
              <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>)}
          </View>
        </LinearGradient>
      </> : <View style={[styles.rest, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Svg width={140} height={140} viewBox="0 0 140 140" style={styles.restArt}>
          <Circle cx={70} cy={70} r={66} fill={colors.accent} opacity={0.06} />
          <Circle cx={70} cy={70} r={46} fill={colors.accent} opacity={0.1} />
          {[[24, 34], [112, 26], [118, 96], [20, 104], [98, 58]].map(([x, y]) => <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.8} fill={colors.foreground} opacity={0.45} />)}
        </Svg>
        <View style={[styles.restIcon, { backgroundColor: colors.foreground }]}><Moon size={26} color={colors.background} strokeWidth={2.2} /></View>
        <Text style={[styles.restEyebrow, { color: colors.accent }]}>{copy.rest.toLocaleUpperCase(language)}</Text>
        <Text style={[styles.restTitle, { color: colors.foreground }]}>{t('restDayTitle')}</Text>
        <Text style={[styles.restBody, { color: colors.mutedForeground }]}>{t('restDaySubtitle')}</Text>
      </View>}
    </Screen>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  weekHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 2 },
  weekEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10.5, letterSpacing: 1.4 },
  weekDots: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  weekDot: { width: 14, height: 5, borderRadius: 3 },
  weekCount: { fontFamily: 'Inter_800ExtraBold', fontSize: 13, marginLeft: 6 },
  capsules: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  capsuleWrap: { flex: 1, alignItems: 'center' },
  capsule: { width: '100%', height: 96, borderRadius: 999, borderWidth: 1.2, alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 7, overflow: 'hidden' },
  capsuleFill: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  capsuleDay: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.4 },
  capsuleDate: { fontFamily: 'Inter_800ExtraBold', fontSize: 18, letterSpacing: -0.6 },
  capsuleIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  todayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 6 },
  stage: { borderRadius: 32, borderWidth: 1, padding: 20, marginBottom: 22 },
  stageTop: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  stageCopy: { flex: 1, minWidth: 0, paddingBottom: 4 },
  stageEyebrow: { fontFamily: 'Inter_800ExtraBold', fontSize: 10.5, letterSpacing: 1.4 },
  stageTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 32, letterSpacing: -1.5, lineHeight: 35, marginTop: 6 },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  focusChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  focusChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 11.5 },
  prop: { width: 112, height: 132, alignItems: 'center', justifyContent: 'flex-end', marginRight: -6 },
  propShadow: { position: 'absolute', bottom: 0 },
  propImage: { width: 96, height: 128, marginBottom: 8 },
  stats: { flexDirection: 'row', borderRadius: 22, paddingVertical: 12, marginTop: 18 },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 20, letterSpacing: -0.6, marginTop: 2 },
  statUnit: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0 },
  statLabel: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontFamily: 'Inter_800ExtraBold', fontSize: 13 },
  cta: { height: 62, borderRadius: 31, marginTop: 18, flexDirection: 'row', alignItems: 'center', paddingLeft: 26, paddingRight: 8 },
  ctaText: { flex: 1, fontFamily: 'Inter_800ExtraBold', fontSize: 16, letterSpacing: -0.2 },
  ctaArrow: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10, paddingHorizontal: 2 },
  sectionTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 22, letterSpacing: -0.8 },
  sectionCount: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  route: { borderRadius: 28, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 22 },
  stop: { flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  rail: { width: 30, alignItems: 'center', paddingTop: 14 },
  node: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  nodeText: { fontFamily: 'Inter_800ExtraBold', fontSize: 12 },
  railLine: { position: 'absolute', top: 44, bottom: -14, width: 2, borderRadius: 1 },
  stopBody: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  stopName: { fontFamily: 'Inter_700Bold', fontSize: 14.5, letterSpacing: -0.2 },
  stopMuscle: { fontFamily: 'Inter_500Medium', fontSize: 11.5, marginTop: 2 },
  setsPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  setsText: { fontFamily: 'Inter_700Bold', fontSize: 12, fontVariant: ['tabular-nums'] },
  live: { borderRadius: 32, padding: 20, marginBottom: 18, overflow: 'hidden' },
  liveTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  livePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: 'rgba(61,214,140,0.16)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3DD68C' },
  livePillText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, color: '#3DD68C' },
  liveTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 21, letterSpacing: -0.8, marginTop: 10, color: '#FFFFFF' },
  liveBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 5, color: 'rgba(255,255,255,0.68)' },
  liveVisual: { width: 104, height: 124, borderRadius: 26, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  skeleton: { width: 100, height: 112 },
  scanLine: { position: 'absolute', left: 0, right: 0, top: 0, height: 2 },
  liveChoices: { flexDirection: 'row', gap: 8, marginTop: 16 },
  liveChoice: { flex: 1, height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  liveChoiceText: { fontFamily: 'Inter_700Bold', fontSize: 12.5, color: '#FFFFFF', flexShrink: 1 },
  rest: { borderRadius: 32, borderWidth: 1, paddingVertical: 34, paddingHorizontal: 24, alignItems: 'center', marginBottom: 18, overflow: 'hidden' },
  restArt: { position: 'absolute', top: 6 },
  restIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  restEyebrow: { fontFamily: 'Inter_800ExtraBold', fontSize: 10.5, letterSpacing: 1.4, marginTop: 40 },
  restTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, letterSpacing: -1.2, textAlign: 'center', marginTop: 6 },
  restBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8, maxWidth: 290 },
});
