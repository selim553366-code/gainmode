import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@/components/AppIcon';
import { useFit } from '@/context/FitContext';
import { translate, TranslationKey } from '@/lib/i18n';
import { getWeekdayKey, getWorkoutCompletionRatio, type MuscleGroup } from '@/lib/workoutPlan';
import { liveTranslate, type LiveWorkoutCopyKey } from '@/lib/liveWorkoutCopy';
import { useColors } from '@/hooks/useColors';
import { Card, EmptyState, Header, ProgressBar, Screen, triggerHaptic } from '@/components/FitUI';

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

function LiveFormAnalysisCard({ title, body, choices, onSelect }: {
  title: string;
  body: string;
  choices: ReadonlyArray<{ kind: string; label: string }>;
  onSelect: (kind: string) => void;
}) {
  const colors = useColors();
  return <View testID="live-form-analysis-bar" style={[styles.liveAnalysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.liveAnalysisHeader}>
      <View style={[styles.liveAnalysisIcon, { backgroundColor: `${colors.primary}18` }]}>
        <Ionicons name="scan-outline" size={28} color={colors.primary} />
      </View>
      <View style={styles.liveAnalysisCopy}>
        <Text style={[styles.liveAnalysisTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.liveAnalysisBody, { color: colors.mutedForeground }]}>{body}</Text>
      </View>
    </View>
    <View style={styles.liveChoiceRow}>
      {choices.map((choice) => <Pressable
        key={choice.kind}
        testID={`start-live-${choice.kind}`}
        accessibilityRole="button"
        accessibilityLabel={choice.label}
        onPress={() => onSelect(choice.kind)}
        style={({ pressed }) => [styles.liveChoice, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}
      >
        <Ionicons name="arrow-forward" size={22} color={colors.primary} />
        <Text style={[styles.liveChoiceText, { color: colors.foreground }]}>{choice.label}</Text>
      </Pressable>)}
    </View>
  </View>;
}

export default function PlanScreen() {
  const colors = useColors();
  const { language, workouts, refreshWorkoutCycleIfReady } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const liveT = (key: LiveWorkoutCopyKey) => liveTranslate(language, key);
  const params = useLocalSearchParams<{ day?: string }>();
  const requestedDay = typeof params.day === 'string' && weekDays.includes(params.day as WeekDay) ? params.day as WeekDay : null;
  const [activeDay, setActiveDay] = React.useState<WeekDay>(requestedDay ?? getWeekdayKey());
  const active = workouts.find((workout) => workout.day === activeDay);
  const label = (value: string) => translate(language, value as Parameters<typeof translate>[1]) || value;
  const completedCount = active?.exercises.filter((exercise) => Boolean(exercise.completed)).length ?? 0;
  const completedWorkouts = workouts.filter((workout) => workout.completed).length;
  const liveChoices = [
    { kind: 'squat', label: liveT('liveSquat'), icon: 'barbell-outline' as const },
    { kind: 'pushup', label: liveT('livePushup'), icon: 'body-outline' as const },
    { kind: 'lunge', label: liveT('liveLunge'), icon: 'activity' as const },
  ] as const;

  React.useEffect(() => {
    if (requestedDay) setActiveDay(requestedDay);
  }, [requestedDay]);

  React.useEffect(() => {
    if (workouts[0]?.day && activeDay === workouts[0].day) refreshWorkoutCycleIfReady(activeDay);
  }, [activeDay, refreshWorkoutCycleIfReady, workouts]);

  if (workouts.length === 0) return <Screen><Header eyebrow={t('planEyebrow')} title={t('planTitle')} subtitle={t('planSubtitle')} /><EmptyState icon="barbell-outline" title={t('noWorkout')} text={t('createPlan')} /></Screen>;
  return <View style={[styles.page, { backgroundColor: colors.background }]}>
    <Screen>
      <Header eyebrow={t('planEyebrow')} title={t('planTitle')} subtitle={t('planSubtitle')} action="options-outline" onAction={() => Alert.alert(t('edit'), t('planSubtitle'))} />
       <View style={[styles.weekTable, { backgroundColor: colors.card, borderColor: colors.border }]}>
         <View style={styles.weekTableHeader}>
           <View>
             <Text style={[styles.weekTableEyebrow, { color: colors.mutedForeground }]}>{t('thisWeek').toUpperCase()}</Text>
             <Text style={[styles.weekTableTitle, { color: colors.foreground }]}>{completedWorkouts} / {workouts.length} <Text style={[styles.weekTableTitleUnit, { color: colors.mutedForeground }]}>{t('completed').toLowerCase()}</Text></Text>
           </View>
           <View style={[styles.weekTableBadge, { backgroundColor: completedWorkouts > 0 ? `${colors.success}18` : colors.secondary }]}>
             <Ionicons name={completedWorkouts > 0 ? 'checkmark-circle' : 'calendar-outline'} size={17} color={completedWorkouts > 0 ? colors.success : colors.mutedForeground} />
           </View>
         </View>
         <View style={[styles.weekTableTrack, { backgroundColor: colors.secondary }]}>
           <View style={[styles.weekTableTrackFill, { width: `${workouts.length ? (completedWorkouts / workouts.length) * 100 : 0}%`, backgroundColor: colors.success }]} />
         </View>
         <View style={styles.dayGrid}>{weekDays.map((day) => {
        const workout = workouts.find((item) => item.day === day);
        const isActiveDay = activeDay === day;
         const completionRatio = workout ? getWorkoutCompletionRatio(workout) : 0;
         const isCompleted = Boolean(workout?.completed);
         const isStarted = completionRatio > 0 && !isCompleted;
         const statusColor = isCompleted ? colors.success : isActiveDay ? colors.primaryForeground : isStarted ? colors.primary : colors.mutedForeground;
         return <Pressable key={day} onPress={() => { triggerHaptic(); setActiveDay(day); }} accessibilityLabel={t(dayLabels[day])} accessibilityState={{ selected: isActiveDay }} style={({ pressed }) => [styles.day, { backgroundColor: isCompleted ? `${colors.success}16` : isActiveDay ? colors.primary : colors.surfaceSoft, borderColor: isCompleted ? colors.success : isActiveDay ? colors.primary : colors.border, borderWidth: isActiveDay ? 2 : 1, opacity: pressed ? 0.78 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
           <View style={styles.dayTopLine}>
             <Text style={[styles.dayText, { color: isActiveDay ? colors.primaryForeground : isCompleted ? colors.success : colors.mutedForeground }]}>{t(dayLabels[day])}</Text>
             <Ionicons name={isCompleted ? 'checkmark-circle' : workout ? 'barbell-outline' : 'moon-outline'} size={14} color={statusColor} />
           </View>
           <View style={[styles.dayProgressTrack, { backgroundColor: isActiveDay && !isCompleted ? `${colors.primaryForeground}35` : `${statusColor}20` }]}>
             <View style={[styles.dayProgressFill, { width: `${workout ? Math.max(completionRatio * 100, isCompleted ? 100 : 0) : 0}%`, backgroundColor: statusColor }]} />
           </View>
         </Pressable>;
       })}</View>
       </View>
      {active ? <>
        <Card style={[styles.featureCard, { backgroundColor: colors.secondary }]}>
          <View style={styles.featureTop}><View style={{ flex: 1 }}><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('thisWeek').toUpperCase()}</Text><Text style={[styles.featureTitle, { color: colors.foreground }]}>{label(active.name)}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{active.duration} min  •  {active.exercises.length} {t('exercises')}</Text></View><View style={[styles.featureIcon, { backgroundColor: colors.primary }]}><Ionicons name="barbell-outline" size={23} color={colors.primaryForeground} /></View></View>
          <View style={styles.focusRow}>{active.focusAreas?.map((group) => <View key={group} style={[styles.focusChip, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.focusChipText, { color: colors.mutedForeground }]}>{t(muscleGroupLabels[group])}</Text></View>)}</View>
          <ProgressBar value={active.exercises.length ? completedCount / active.exercises.length : 0} color={colors.primary} />
          <Text style={[styles.progressCaption, { color: colors.mutedForeground }]}>{completedCount} / {active.exercises.length} {t('completed').toLowerCase()}</Text>
          <Pressable
            testID="start-planned-workout"
            accessibilityRole="button"
            accessibilityLabel={t('startWorkout')}
            onPress={() => {
              triggerHaptic();
              router.push({ pathname: '/workout-session', params: { workoutId: active.id } });
            }}
            style={({ pressed }) => [styles.startButton, { backgroundColor: colors.primary, opacity: pressed ? 0.76 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <Ionicons name="barbell-outline" size={19} color={colors.primaryForeground} />
            <Text style={[styles.startButtonText, { color: colors.primaryForeground }]}>{t('startWorkout')}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
          </Pressable>
          <LiveFormAnalysisCard
            title={liveT('liveWorkoutTitle')}
            body={liveT('liveWorkoutBody')}
            choices={liveChoices}
            onSelect={(kind) => {
              triggerHaptic();
              router.push({ pathname: '/live-workout', params: { exercise: kind } });
            }}
          />
        </Card>
       </> : <Card style={[styles.restCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
         <View style={[styles.restIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="moon-outline" size={24} color={colors.primary} /></View>
        <Text style={[styles.restTitle, { color: colors.foreground }]}>{t('restDayTitle')}</Text>
        <Text style={[styles.restBody, { color: colors.mutedForeground }]}>{t('restDaySubtitle')}</Text>
      </Card>}
    </Screen>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  weekTable: { borderRadius: 24, borderWidth: 1, padding: 14, marginBottom: 16 },
  weekTableHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekTableEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.3 },
  weekTableTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, letterSpacing: -0.4, marginTop: 4 },
  weekTableTitleUnit: { fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 0 },
  weekTableBadge: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  weekTableTrack: { height: 6, borderRadius: 4, overflow: 'hidden', marginTop: 12, marginBottom: 14 },
  weekTableTrackFill: { height: '100%', borderRadius: 4 },
  dayGrid: { flexDirection: 'row', gap: 5 },
  day: { flex: 1, minWidth: 0, height: 65, borderRadius: 16, alignItems: 'stretch', justifyContent: 'space-between', paddingHorizontal: 5, paddingVertical: 9 },
  dayTopLine: { alignItems: 'center', gap: 5 },
  dayText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.4 },
  dayProgressTrack: { height: 4, borderRadius: 4, overflow: 'hidden', marginHorizontal: 1 },
  dayProgressFill: { height: '100%', borderRadius: 4 },
  restCard: { padding: 24, alignItems: 'center', marginBottom: 18 },
  restIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  restTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.4, textAlign: 'center' },
  restBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8, maxWidth: 280 },
  featureCard: { padding: 20 },
  featureTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  featureTitle: { fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: -0.7, marginVertical: 7 },
  featureIcon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  progressCaption: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 10 },
  startButton: { height: 54, borderRadius: 17, marginTop: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  startButtonText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 15, textAlign: 'center' },
  liveAnalysisCard: { width: '100%', aspectRatio: 2.43, borderRadius: 20, borderWidth: 1, marginTop: 10, padding: 12, overflow: 'hidden' },
  liveAnalysisHeader: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  liveAnalysisIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  liveAnalysisCopy: { flex: 1, paddingTop: 1 },
  liveAnalysisTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, lineHeight: 20 },
  liveAnalysisBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15, marginTop: 3 },
  liveChoiceRow: { flexDirection: 'row', gap: 7, marginTop: 10 },
  liveChoice: { flex: 1, minHeight: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4, paddingHorizontal: 3 },
  liveChoiceText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 18 },
  focusChip: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  focusChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 9 },
});