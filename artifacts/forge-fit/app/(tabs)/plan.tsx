import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
              ? <View style={[styles.nodeWorkout, { backgroundColor: selected ? colors.foreground : colors.card }]}>
                <ProgressRing value={ratio} size={40} stroke={3} color={selected ? colors.background : colors.accent} track={selected ? `${colors.background}33` : colors.border}>
                  <Dumbbell size={15} color={selected ? colors.background : colors.foreground} strokeWidth={2.2} />
                </ProgressRing>
              </View>
              : <View style={[styles.nodeRest, { backgroundColor: selected ? colors.foreground : colors.secondary }]}><Moon size={12} color={selected ? colors.background : colors.mutedForeground} strokeWidth={2.2} /></View>}
        </View>
        <View style={[styles.stopLabel, selected && { backgroundColor: colors.secondary }]}>
          <Text style={[styles.stopDay, { color: selected ? colors.foreground : colors.mutedForeground }]}>{translate(language, dayLabels[day])}</Text>
          <Text style={[styles.stopDate, { color: selected ? colors.foreground : colors.mutedForeground }]}>{dates[index]}</Text>
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
  const ratio = active && active.exercises.length ? completedCount / active.exercises.length : 0;
  const preview = active?.exercises.slice(0, 4) ?? [];
  const hidden = (active?.exercises.length ?? 0) - preview.length;

  return <View style={[styles.page, { backgroundColor: colors.background }]}>
    <Screen>
      <Header eyebrow={t('planEyebrow')} title={t('planTitle')} />

      <View style={[styles.weekCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.weekHead}>
          <Text style={[styles.weekEyebrow, { color: colors.mutedForeground }]}>{copy.week}</Text>
          <Text style={[styles.weekCount, { color: colors.foreground }]}>{completedWorkouts}<Text style={{ color: colors.mutedForeground }}> / {workouts.length}</Text> <Text style={[styles.weekCountUnit, { color: colors.mutedForeground }]}>{copy.workouts}</Text></Text>
        </View>
        <WeekRoute activeDay={activeDay} onSelect={setActiveDay} workouts={workouts} language={language} />
      </View>

      {active ? <>
        <LinearGradient colors={[colors.inkCardStart, colors.inkCardEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.session}>
          {/* The day's name, huge and faint, sits behind the card like a watermark. */}
          <Text pointerEvents="none" numberOfLines={1} style={[styles.watermark, { color: `${colors.inkCardForeground}0D` }]}>{t(dayLabels[activeDay]).toLocaleUpperCase(language)}</Text>
          <View style={styles.sessionTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.sessionEyebrow, { color: `${colors.inkCardForeground}99` }]}>{isToday ? copy.today.toLocaleUpperCase(language) : t(dayLabels[activeDay]).toLocaleUpperCase(language)}</Text>
              <Text style={[styles.sessionTitle, { color: colors.inkCardForeground }]}>{label(active.name)}</Text>
              <View style={styles.metaRow}>
                <View style={[styles.meta, { backgroundColor: `${colors.inkCardForeground}14` }]}><Clock size={12} color={colors.inkCardForeground} strokeWidth={2.2} /><Text style={[styles.metaText, { color: colors.inkCardForeground }]}>{active.duration} {t('minutesShort')}</Text></View>
                <View style={[styles.meta, { backgroundColor: `${colors.inkCardForeground}14` }]}><Dumbbell size={12} color={colors.inkCardForeground} strokeWidth={2.2} /><Text style={[styles.metaText, { color: colors.inkCardForeground }]}>{active.exercises.length} {t('exercises')}</Text></View>
              </View>
            </View>
            <ProgressRing value={ratio} size={78} stroke={7} color="#7FA6FF" gradientTo={colors.success} track={`${colors.inkCardForeground}1A`}>
              <Text style={[styles.ringValue, { color: colors.inkCardForeground }]}>{completedCount}</Text>
              <Text style={[styles.ringTotal, { color: `${colors.inkCardForeground}99` }]}>/ {active.exercises.length}</Text>
            </ProgressRing>
          </View>

          {active.focusAreas?.length ? <View style={styles.focusRow}>
            {active.focusAreas.map((group) => <View key={group} style={[styles.focusChip, { borderColor: `${colors.inkCardForeground}2E` }]}><Text style={[styles.focusChipText, { color: `${colors.inkCardForeground}CC` }]}>{t(muscleGroupLabels[group])}</Text></View>)}
          </View> : null}

          <View style={[styles.list, { borderTopColor: `${colors.inkCardForeground}14` }]}>
            {preview.map((exercise, index) => <View key={exercise.id} style={styles.listRow}>
              <View style={[styles.listIndex, { backgroundColor: exercise.completed ? colors.success : `${colors.inkCardForeground}14` }]}>
                {exercise.completed ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : <Text style={[styles.listIndexText, { color: colors.inkCardForeground }]}>{index + 1}</Text>}
              </View>
              <Text numberOfLines={1} style={[styles.listName, { color: colors.inkCardForeground, opacity: exercise.completed ? 0.55 : 1 }]}>{label(exercise.name)}</Text>
              <Text style={[styles.listSets, { color: `${colors.inkCardForeground}99` }]}>{exercise.sets} × {exercise.reps}</Text>
            </View>)}
            {hidden > 0 ? <Text style={[styles.more, { color: `${colors.inkCardForeground}80` }]}>{copy.more.replace('{n}', String(hidden))}</Text> : null}
          </View>

          <Pressable testID="start-planned-workout" accessibilityRole="button" accessibilityLabel={t('startWorkout')} onPress={startWorkout} scaleTo={0.97} style={[styles.cta, { backgroundColor: colors.inkCardForeground }]}>
            <Text style={[styles.ctaText, { color: colors.inkCardStart }]}>{active.completed ? copy.done : completedCount > 0 ? copy.resume : t('startWorkout')}</Text>
            <View style={[styles.ctaArrow, { backgroundColor: colors.inkCardStart }]}>{active.completed ? <Check size={16} color={colors.inkCardForeground} strokeWidth={3} /> : <ArrowRight size={16} color={colors.inkCardForeground} strokeWidth={2.4} />}</View>
          </Pressable>
        </LinearGradient>

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
              style={[styles.liveChoice, { backgroundColor: colors.secondary }]}
            >
              <ScanLine size={15} color={colors.foreground} strokeWidth={2.2} />
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
  weekCard: { borderRadius: 26, borderWidth: 1, paddingTop: 16, paddingBottom: 12, paddingHorizontal: 10, marginBottom: 14 },
  weekHead: { paddingHorizontal: 8, marginBottom: 14 },
  weekEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4 },
  weekCount: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.6, marginTop: 4 },
  weekCountUnit: { fontFamily: 'Inter_500Medium', fontSize: 12, letterSpacing: 0 },
  route: { flexDirection: 'row' },
  routeLine: { position: 'absolute', left: 0, top: 0 },
  stop: { flex: 1, alignItems: 'center' },
  node: { height: 44, alignItems: 'center', justifyContent: 'center' },
  nodeDone: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  nodeWorkout: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  nodeRest: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stopLabel: { alignItems: 'center', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 4, marginTop: 6 },
  stopDay: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  stopDate: { fontFamily: 'Inter_700Bold', fontSize: 13, marginTop: 1 },
  todayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
  session: { borderRadius: 30, padding: 20, overflow: 'hidden', marginBottom: 14 },
  watermark: { position: 'absolute', right: -10, top: -18, fontFamily: 'Inter_700Bold', fontSize: 120, letterSpacing: -6 },
  sessionTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sessionEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4 },
  sessionTitle: { fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -1, marginTop: 6 },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  metaText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  ringValue: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.6 },
  ringTotal: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: -2 },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 },
  focusChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  focusChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  list: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 18, paddingTop: 14, gap: 11 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  listIndex: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listIndexText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  listName: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  listSets: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  more: { fontFamily: 'Inter_500Medium', fontSize: 12, marginLeft: 35 },
  cta: { height: 58, borderRadius: 20, marginTop: 20, flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8 },
  ctaText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 15 },
  ctaArrow: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  live: { borderRadius: 26, borderWidth: 1, padding: 16, marginBottom: 18 },
  liveTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  livePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3DD68C' },
  livePillText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, color: '#22A06B' },
  liveTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.4, marginTop: 10 },
  liveBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 5 },
  liveVisual: { width: 104, height: 124, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  skeleton: { width: 100, height: 112 },
  scanLine: { position: 'absolute', left: 0, right: 0, top: 0, height: 2 },
  liveChoices: { flexDirection: 'row', gap: 8, marginTop: 16 },
  liveChoice: { flex: 1, height: 46, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 6 },
  liveChoiceText: { fontFamily: 'Inter_700Bold', fontSize: 12.5 },
  rest: { borderRadius: 30, borderWidth: 1, paddingVertical: 34, paddingHorizontal: 24, alignItems: 'center', marginBottom: 18, overflow: 'hidden' },
  restArt: { position: 'absolute', top: 14 },
  restIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  restEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, marginTop: 34 },
  restTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.8, textAlign: 'center', marginTop: 6 },
  restBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8, maxWidth: 290 },
});
