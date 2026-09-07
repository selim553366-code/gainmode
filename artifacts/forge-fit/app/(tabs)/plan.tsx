import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@/components/AppIcon';
import { useFit } from '@/context/FitContext';
import { translate, TranslationKey } from '@/lib/i18n';
import { getWeekdayKey, type MuscleGroup } from '@/lib/workoutPlan';
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
  return <View testID="live-form-analysis-bar" style={styles.liveAnalysisCard}>
    <View style={styles.liveAnalysisHeader}>
      <View style={styles.liveAnalysisIcon}>
        <Ionicons name="scan-outline" size={28} color="#071C34" />
      </View>
      <View style={styles.liveAnalysisCopy}>
        <Text style={styles.liveAnalysisTitle}>{title}</Text>
        <Text style={styles.liveAnalysisBody}>{body}</Text>
      </View>
    </View>
    <View style={styles.liveChoiceRow}>
      {choices.map((choice) => <Pressable
        key={choice.kind}
        testID={`start-live-${choice.kind}`}
        accessibilityRole="button"
        accessibilityLabel={choice.label}
        onPress={() => onSelect(choice.kind)}
        style={({ pressed }) => [styles.liveChoice, { opacity: pressed ? 0.72 : 1 }]}
      >
        <Ionicons name="arrow-forward" size={22} color="#62C8FF" />
        <Text style={styles.liveChoiceText}>{choice.label}</Text>
      </Pressable>)}
    </View>
  </View>;
}

export default function PlanScreen() {
  const colors = useColors();
  const { language, workouts } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const liveT = (key: LiveWorkoutCopyKey) => liveTranslate(language, key);
  const params = useLocalSearchParams<{ day?: string }>();
  const requestedDay = typeof params.day === 'string' && weekDays.includes(params.day as WeekDay) ? params.day as WeekDay : null;
  const [activeDay, setActiveDay] = React.useState<WeekDay>(requestedDay ?? getWeekdayKey());
  const active = workouts.find((workout) => workout.day === activeDay);
  const label = (value: string) => translate(language, value as Parameters<typeof translate>[1]) || value;
  const completedCount = active?.exercises.filter((exercise) => Boolean(exercise.completed)).length ?? 0;
  const liveChoices = [
    { kind: 'squat', label: liveT('liveSquat'), icon: 'barbell-outline' as const },
    { kind: 'pushup', label: liveT('livePushup'), icon: 'body-outline' as const },
    { kind: 'lunge', label: liveT('liveLunge'), icon: 'activity' as const },
  ] as const;

  React.useEffect(() => {
    if (requestedDay) setActiveDay(requestedDay);
  }, [requestedDay]);

  if (workouts.length === 0) return <Screen><Header eyebrow={t('planEyebrow')} title={t('planTitle')} subtitle={t('planSubtitle')} /><EmptyState icon="barbell-outline" title={t('noWorkout')} text={t('createPlan')} /></Screen>;
  return <View style={[styles.page, { backgroundColor: colors.background }]}>
    <Screen>
      <Header eyebrow={t('planEyebrow')} title={t('planTitle')} subtitle={t('planSubtitle')} action="options-outline" onAction={() => Alert.alert(t('edit'), t('planSubtitle'))} />
      <View style={styles.dayRow}>{weekDays.map((day) => {
        const workout = workouts.find((item) => item.day === day);
        const isActiveDay = activeDay === day;
        return <Pressable key={day} onPress={() => { triggerHaptic(); setActiveDay(day); }} accessibilityLabel={t(dayLabels[day])} style={({ pressed }) => [styles.day, { backgroundColor: isActiveDay ? colors.primary : colors.card, borderColor: colors.border, opacity: pressed ? 0.78 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}><Text style={[styles.dayText, { color: isActiveDay ? colors.primaryForeground : colors.mutedForeground }]}>{t(dayLabels[day])}</Text><View style={[styles.dayDot, { backgroundColor: workout?.completed ? colors.success : isActiveDay ? colors.primaryForeground : workout ? colors.secondary : colors.border }]} /></Pressable>;
      })}</View>
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
        <View style={[styles.restIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="sparkles-outline" size={24} color={colors.primary} /></View>
        <Text style={[styles.restTitle, { color: colors.foreground }]}>{t('restDayTitle')}</Text>
        <Text style={[styles.restBody, { color: colors.mutedForeground }]}>{t('restDaySubtitle')}</Text>
      </Card>}
    </Screen>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  dayRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  day: { flex: 1, height: 58, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 7 },
  dayText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.4 },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
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
  liveAnalysisCard: { width: '100%', borderRadius: 22, borderWidth: 1, marginTop: 10, padding: 17, overflow: 'hidden', backgroundColor: '#173650', borderColor: '#3D7594' },
  liveAnalysisHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 15 },
  liveAnalysisIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#61C8FF', alignItems: 'center', justifyContent: 'center' },
  liveAnalysisCopy: { flex: 1, paddingTop: 1 },
  liveAnalysisTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 20, lineHeight: 25 },
  liveAnalysisBody: { color: '#A7C5DC', fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, marginTop: 5 },
  liveChoiceRow: { flexDirection: 'row', gap: 9, marginTop: 18 },
  liveChoice: { flex: 1, minHeight: 54, borderRadius: 17, backgroundColor: '#091C34', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 5 },
  liveChoiceText: { color: '#F8FBFF', fontFamily: 'Inter_700Bold', fontSize: 13 },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 18 },
  focusChip: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  focusChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 9 },
});