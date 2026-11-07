import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { ArrowRight, Check, Clock, Dumbbell, Moon, ScanLine } from 'lucide-react-native';
import { PressableScale as Pressable } from '@/components/Motion';
import { useFit } from '@/context/FitContext';
import { translate, type Language, type TranslationKey } from '@/lib/i18n';
import { getWeekdayKey, getWorkoutCompletionRatio, type MuscleGroup } from '@/lib/workoutPlan';
import { liveTranslate, type LiveWorkoutCopyKey } from '@/lib/liveWorkoutCopy';
import { useColors } from '@/hooks/useColors';
import { EmptyState, Header, Screen, triggerHaptic } from '@/components/FitUI';
import { ProgressRing } from '@/components/NutritionVisuals';

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

const planCopy: Record<Language, { week: string; workouts: string; more: string; done: string; resume: string; live: string; rest: string; today: string }> = {
  tr: { week: 'BU HAFTA', workouts: 'antrenman tamamlandı', more: '+{n} hareket daha', done: 'Tamamlandı', resume: 'Kaldığın yerden devam et', live: 'CANLI', rest: 'Toparlanma', today: 'Bugün' },
  en: { week: 'THIS WEEK', workouts: 'workouts done', more: '+{n} more exercises', done: 'Completed', resume: 'Pick up where you left off', live: 'LIVE', rest: 'Recovery', today: 'Today' },
  de: { week: 'DIESE WOCHE', workouts: 'Trainings erledigt', more: '+{n} weitere Übungen', done: 'Erledigt', resume: 'Dort weitermachen, wo du warst', live: 'LIVE', rest: 'Erholung', today: 'Heute' },
  fr: { week: 'CETTE SEMAINE', workouts: 'séances terminées', more: '+{n} autres exercices', done: 'Terminé', resume: 'Reprendre où tu t’es arrêté', live: 'LIVE', rest: 'Récupération', today: 'Aujourd’hui' },
  es: { week: 'ESTA SEMANA', workouts: 'entrenos hechos', more: '+{n} ejercicios más', done: 'Completado', resume: 'Sigue donde lo dejaste', live: 'EN VIVO', rest: 'Recuperación', today: 'Hoy' },
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
 * The week as a route: seven stops joined by a line that fills up to the last finished workout.
 * Training stops carry a ring of their own progress, rest days are a small moon, finished days a
 * solid check; the chosen day lifts into a pill with its date.
 */
function WeekRoute({ activeDay, onSelect, workouts, language }: { activeDay: WeekDay; onSelect: (day: WeekDay) => void; workouts: ReturnType<typeof useFit>['workouts']; language: Language }) {
  const colors = useColors();
  const dates = weekDates();
  const today = getWeekdayKey() as WeekDay;
  const lastDone = weekDays.reduce((last, day, index) => (workouts.find((item) => item.day === day)?.completed ? index : last), -1);
  const [width, setWidth] = React.useState(0);
  const step = width / 7;

  return <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.route}>
    {width ? <Svg width={width} height={44} style={styles.routeLine}>
      <Line x1={step / 2} x2={width - step / 2} y1={22} y2={22} stroke={colors.border} strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" />
      {lastDone >= 0 ? <Line x1={step / 2} x2={step / 2 + step * lastDone} y1={22} y2={22} stroke={colors.success} strokeWidth={3} strokeLinecap="round" /> : null}
    </Svg> : null}
    {weekDays.map((day, index) => {
      const workout = workouts.find((item) => item.day === day);
      const ratio = workout ? getWorkoutCompletionRatio(workout) : 0;
      const done = Boolean(workout?.completed);
      const selected = day === activeDay;
      return <Pressable key={day} testID={`plan-day-${day}`} accessibilityRole="tab" accessibilityLabel={translate(language, dayLabels[day])} accessibilityState={{ selected }} onPress={() => { triggerHaptic(); onSelect(day); }} scaleTo={0.92} style={styles.stop}>
        <View style={styles.node}>
          {done
            ? <View style={[styles.nodeDone, { backgroundColor: colors.success }]}><Check size={16} color="#FFFFFF" strokeWidth={3} /></View>
            : workout
              ? <View style={[styles.nodeWorkout, { backgroundColor: selected ? colors.accent : colors.card }]}>
                <ProgressRing value={ratio} size={40} stroke={3} color={selected ? '#FFFFFF' : colors.accent} track={selected ? 'rgba(255,255,255,0.3)' : colors.border}>
                  <Dumbbell size={15} color={selected ? '#FFFFFF' : colors.foreground} strokeWidth={2.2} />
                </ProgressRing>
              </View>
              : <View style={[styles.nodeRest, { backgroundColor: selected ? colors.accent : colors.secondary }]}><Moon size={12} color={selected ? '#FFFFFF' : colors.mutedForeground} strokeWidth={2.2} /></View>}
        </View>
        <View style={[styles.stopLabel, selected && { backgroundColor: `${colors.accent}1F` }]}>
          <Text style={[styles.stopDay, { color: selected ? colors.foreground : colors.mutedForeground }]}>{translate(language, dayLabels[day])}</Text>
          <Text style={[styles.stopDate, { color: selected ? colors.accent : colors.mutedForeground }]}>{dates[index]}</Text>
        </View>
        {day === today ? <View style={[styles.todayDot, { backgroundColor: colors.accent }]} /> : null}
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
  const preview = active?.exercises.slice(0, 4) ?? [];
  const hidden = (active?.exercises.length ?? 0) - preview.length;

  return <View style={styles.page}>
    <Screen sky>
      <Header eyebrow={t('planEyebrow')} title={t('planTitle')} />

      <View style={[styles.weekCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image source={require('@/assets/images/props/dumbbell.png')} resizeMode="contain" style={styles.weekDumbbell} />
        <View style={styles.weekHead}>
          <Text style={[styles.weekEyebrow, { color: colors.mutedForeground }]}>{copy.week}</Text>
          <Text style={[styles.weekCount, { color: colors.foreground }]}>{completedWorkouts}<Text style={{ color: colors.mutedForeground }}> / {workouts.length}</Text> <Text style={[styles.weekCountUnit, { color: colors.mutedForeground }]}>{copy.workouts}</Text></Text>
        </View>
        <WeekRoute activeDay={activeDay} onSelect={setActiveDay} workouts={workouts} language={language} />
      </View>

      {active ? <>
        {/* The session as a ticket: a date stub torn off by a perforated edge, the admission on the right. */}
        <View style={[styles.session, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.ticketHead}>
            <View style={styles.stub}>
              <Text style={[styles.stubDay, { color: colors.accent }]}>{(isToday ? copy.today : t(dayLabels[activeDay])).toLocaleUpperCase(language)}</Text>
              <Text style={[styles.stubDate, { color: colors.foreground }]}>{weekDates()[weekDays.indexOf(activeDay)]}</Text>
            </View>
            <View style={styles.perfV}>
              {Array.from({ length: 9 }, (_, i) => <View key={i} style={[styles.perfDash, { backgroundColor: colors.border }]} />)}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={2} style={[styles.sessionTitle, { color: colors.foreground }]}>{label(active.name)}</Text>
              <View style={styles.metaRow}>
                <View style={[styles.meta, { backgroundColor: `${colors.accent}12` }]}><Clock size={12} color={colors.accent} strokeWidth={2.2} /><Text style={[styles.metaText, { color: colors.foreground }]}>{active.duration} {t('minutesShort')}</Text></View>
                <View style={[styles.meta, { backgroundColor: `${colors.accent}12` }]}><Dumbbell size={12} color={colors.accent} strokeWidth={2.2} /><Text style={[styles.metaText, { color: colors.foreground }]}>{active.exercises.length} {t('exercises')}</Text></View>
              </View>
            </View>
          </View>

          <View style={styles.tearRow}>
            <View style={[styles.notch, styles.notchLeft, { backgroundColor: `${colors.accent}14` }]} />
            <View style={styles.tearLine}>{Array.from({ length: 22 }, (_, i) => <View key={i} style={[styles.tearDash, { backgroundColor: colors.border }]} />)}</View>
            <View style={[styles.notch, styles.notchRight, { backgroundColor: `${colors.accent}14` }]} />
          </View>

          <View style={styles.setsHead}>
            {active.focusAreas?.length ? <Text numberOfLines={1} style={[styles.focusLine, { color: colors.mutedForeground }]}>{active.focusAreas.map((group) => t(muscleGroupLabels[group])).join(' · ')}</Text> : <View style={{ flex: 1 }} />}
            <Text style={[styles.setsCount, { color: colors.foreground }]}>{completedCount}<Text style={{ color: colors.mutedForeground }}>/{active.exercises.length}</Text></Text>
          </View>
          <View style={styles.segments}>
            {active.exercises.map((exercise) => <View key={exercise.id} style={[styles.segment, { backgroundColor: exercise.completed ? colors.success : `${colors.foreground}14` }]} />)}
          </View>

          <View style={styles.list}>
            {preview.map((exercise, index) => <View key={exercise.id} style={styles.listRow}>
              <Text style={[styles.listIndexText, { color: exercise.completed ? colors.success : colors.mutedForeground }]}>{exercise.completed ? '✓' : String(index + 1).padStart(2, '0')}</Text>
              <Text numberOfLines={1} style={[styles.listName, { color: colors.foreground, opacity: exercise.completed ? 0.5 : 1, textDecorationLine: exercise.completed ? 'line-through' : 'none' }]}>{label(exercise.name)}</Text>
              <Text style={[styles.listSets, { color: colors.mutedForeground }]}>{exercise.sets} × {exercise.reps}</Text>
            </View>)}
            {hidden > 0 ? <Text style={[styles.more, { color: colors.mutedForeground }]}>{copy.more.replace('{n}', String(hidden))}</Text> : null}
          </View>

          <Pressable testID="start-planned-workout" accessibilityRole="button" accessibilityLabel={t('startWorkout')} onPress={startWorkout} scaleTo={0.97} style={[styles.cta, { backgroundColor: colors.foreground }]}>
            <Text style={[styles.ctaText, { color: colors.background }]}>{active.completed ? copy.done : completedCount > 0 ? copy.resume : t('startWorkout')}</Text>
            <View style={[styles.ctaArrow, { backgroundColor: colors.accent }]}>{active.completed ? <Check size={17} color="#FFFFFF" strokeWidth={3} /> : <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.4} />}</View>
          </Pressable>
        </View>

        <View testID="live-form-analysis-bar" style={[styles.live, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.liveTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={[styles.livePill, { backgroundColor: '#3DD68C1F' }]}><View style={styles.liveDot} /><Text style={styles.livePillText}>{copy.live}</Text></View>
              <Text style={[styles.liveTitle, { color: colors.foreground }]}>{liveT('liveWorkoutTitle')}</Text>
              <Text style={[styles.liveBody, { color: colors.mutedForeground }]}>{liveT('liveWorkoutBody')}</Text>
            </View>
            <LinearGradient colors={['#0E1424', '#182544']} style={styles.liveVisual}><SkeletonScan /></LinearGradient>
          </View>
          <View style={styles.liveChoices}>
            {liveChoices.map((choice) => <Pressable
              key={choice.kind}
              testID={`start-live-${choice.kind}`}
              accessibilityRole="button"
              accessibilityLabel={choice.label}
              onPress={() => { triggerHaptic(); router.push({ pathname: '/live-workout', params: { exercise: choice.kind } }); }}
              style={[styles.liveChoice, { backgroundColor: `${colors.accent}14` }]}
            >
              <ScanLine size={15} color={colors.accent} strokeWidth={2.2} />
              <Text numberOfLines={1} style={[styles.liveChoiceText, { color: colors.foreground }]}>{choice.label}</Text>
            </Pressable>)}
          </View>
        </View>
      </> : <LinearGradient colors={colors.colorScheme === 'dark' ? ['#151A2E', '#0D0F17'] : ['#EEF2FF', '#F7F8FC']} style={[styles.rest, { borderColor: colors.border }]}>
        <Svg width={120} height={120} viewBox="0 0 120 120" style={styles.restArt}>
          <Circle cx={60} cy={60} r={56} fill={colors.accent} opacity={0.08} />
          <Circle cx={60} cy={60} r={40} fill={colors.accent} opacity={0.12} />
          {[[22, 30], [96, 24], [100, 82], [18, 88], [84, 50]].map(([x, y]) => <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill={colors.foreground} opacity={0.5} />)}
        </Svg>
        <View style={[styles.restIcon, { backgroundColor: colors.card }]}><Moon size={26} color={colors.accent} strokeWidth={2} /></View>
        <Text style={[styles.restEyebrow, { color: colors.mutedForeground }]}>{copy.rest.toLocaleUpperCase(language)}</Text>
        <Text style={[styles.restTitle, { color: colors.foreground }]}>{t('restDayTitle')}</Text>
        <Text style={[styles.restBody, { color: colors.mutedForeground }]}>{t('restDaySubtitle')}</Text>
      </LinearGradient>}
    </Screen>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  weekCard: { borderRadius: 34, borderWidth: 1, paddingTop: 18, paddingBottom: 14, paddingHorizontal: 12, marginBottom: 14, overflow: 'hidden' },
  weekDumbbell: { position: 'absolute', right: 8, top: 6, width: 88, height: 88 },
  weekHead: { paddingHorizontal: 8, marginBottom: 14 },
  weekEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4 },
  weekCount: { fontFamily: 'Inter_800ExtraBold', fontSize: 30, letterSpacing: -1.2, marginTop: 4 },
  weekCountUnit: { fontFamily: 'Inter_500Medium', fontSize: 12, letterSpacing: 0 },
  route: { flexDirection: 'row' },
  routeLine: { position: 'absolute', left: 0, top: 0 },
  stop: { flex: 1, alignItems: 'center' },
  node: { height: 44, alignItems: 'center', justifyContent: 'center' },
  nodeDone: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  nodeWorkout: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  nodeRest: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stopLabel: { alignItems: 'center', borderRadius: 14, paddingHorizontal: 6, paddingVertical: 5, marginTop: 6 },
  stopDay: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  stopDate: { fontFamily: 'Inter_700Bold', fontSize: 13, marginTop: 1 },
  todayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
  session: { borderRadius: 30, borderWidth: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 18, marginBottom: 14 },
  ticketHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stub: { width: 58, alignItems: 'center' },
  stubDay: { fontFamily: 'Inter_800ExtraBold', fontSize: 10, letterSpacing: 1.2 },
  stubDate: { fontFamily: 'Inter_800ExtraBold', fontSize: 40, letterSpacing: -2, lineHeight: 44, marginTop: 2 },
  perfV: { alignSelf: 'stretch', justifyContent: 'space-between', paddingVertical: 2 },
  perfDash: { width: 2, height: 6, borderRadius: 1 },
  sessionTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 26, letterSpacing: -1.1, lineHeight: 29 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  metaText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  tearRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -18, marginVertical: 16 },
  notch: { width: 11, height: 22 },
  notchLeft: { borderTopRightRadius: 11, borderBottomRightRadius: 11 },
  notchRight: { borderTopLeftRadius: 11, borderBottomLeftRadius: 11 },
  tearLine: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  tearDash: { width: 6, height: 2, borderRadius: 1 },
  setsHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  focusLine: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  setsCount: { fontFamily: 'Inter_800ExtraBold', fontSize: 15, letterSpacing: -0.4 },
  segments: { flexDirection: 'row', gap: 4, marginTop: 8 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  list: { marginTop: 16, gap: 12 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  listIndexText: { width: 20, fontFamily: 'Inter_700Bold', fontSize: 12, fontVariant: ['tabular-nums'] },
  listName: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  listSets: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  more: { fontFamily: 'Inter_500Medium', fontSize: 12, marginLeft: 32 },
  cta: { height: 62, borderRadius: 31, marginTop: 20, flexDirection: 'row', alignItems: 'center', paddingLeft: 26, paddingRight: 8 },
  ctaText: { flex: 1, fontFamily: 'Inter_800ExtraBold', fontSize: 16, letterSpacing: -0.2, color: '#123A8F' },
  ctaArrow: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  live: { borderRadius: 34, borderWidth: 1, padding: 18, marginBottom: 18 },
  liveTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  livePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3DD68C' },
  livePillText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, color: '#22A06B' },
  liveTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 21, letterSpacing: -0.8, marginTop: 10 },
  liveBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 5 },
  liveVisual: { width: 104, height: 124, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  skeleton: { width: 100, height: 112 },
  scanLine: { position: 'absolute', left: 0, right: 0, top: 0, height: 2 },
  liveChoices: { flexDirection: 'row', gap: 8, marginTop: 16 },
  liveChoice: { flex: 1, height: 50, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 6 },
  liveChoiceText: { fontFamily: 'Inter_700Bold', fontSize: 12.5 },
  rest: { borderRadius: 34, borderWidth: 1, paddingVertical: 34, paddingHorizontal: 24, alignItems: 'center', marginBottom: 18, overflow: 'hidden' },
  restArt: { position: 'absolute', top: 14 },
  restIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  restEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, marginTop: 34 },
  restTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, letterSpacing: -1.2, textAlign: 'center', marginTop: 6 },
  restBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8, maxWidth: 290 },
});
