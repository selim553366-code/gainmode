import React from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@/components/AppIcon';
import { useFit } from '@/context/FitContext';
import { translate, TranslationKey } from '@/lib/i18n';
import type { MuscleGroup } from '@/lib/workoutPlan';
import { useColors } from '@/hooks/useColors';
import { Card, CelebrationBurst, EmptyState, Header, Pill, ProgressBar, Screen, SectionTitle, triggerHaptic } from '@/components/FitUI';
import { liveTranslate } from '@/lib/liveWorkoutCopy';
import type { ExerciseKind } from '@/lib/liveWorkout';

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

export default function PlanScreen() {
  const colors = useColors();
  const { language, workouts, toggleWorkout, toggleExercise, addExercise, removeExercise } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const liveT = (key: Parameters<typeof liveTranslate>[1]) => liveTranslate(language, key);
  const [activeDay, setActiveDay] = React.useState<WeekDay>('MON');
  const [newExercise, setNewExercise] = React.useState('');
  const [celebrating, setCelebrating] = React.useState(false);
  const active = workouts.find((workout) => workout.day === activeDay) ?? workouts[0];
  const label = (value: string) => translate(language, value as Parameters<typeof translate>[1]) || value;
  const completedCount = active?.exercises.filter((exercise) => Boolean(exercise.completed)).length ?? 0;
  const isComplete = active ? completedCount === active.exercises.length && active.exercises.length > 0 : false;
  const groupedExercises = active?.exercises.reduce<Partial<Record<MuscleGroup, typeof active.exercises>>>((groups, exercise) => {
    const group = exercise.muscleGroup ?? 'other';
    groups[group] = [...(groups[group] ?? []), exercise];
    return groups;
  }, {}) ?? {};
  const visibleGroups = active
    ? Array.from(new Set([...(active.focusAreas ?? []), ...Object.keys(groupedExercises) as MuscleGroup[]]))
    : [];
  const [celebrationType, setCelebrationType] = React.useState<'workout' | 'program'>('workout');

  if (workouts.length === 0) return <Screen><Header eyebrow={t('planEyebrow')} title={t('planTitle')} subtitle={t('planSubtitle')} /><EmptyState icon="barbell-outline" title={t('noWorkout')} text={t('createPlan')} /></Screen>;
  const addNewExercise = () => {
    const name = newExercise.trim();
    if (!active || !name) return;
    addExercise(active.id, name as TranslationKey);
    setNewExercise('');
    Alert.alert(t('addExercise'), t('planUpdated'));
  };
  const completeWorkout = () => {
    if (!active) return;
    const nextCompleted = !isComplete;
    toggleWorkout(active.id);
    if (nextCompleted) {
      const willCompleteProgram = workouts.every((workout) => workout.id === active.id ? true : workout.completed);
      setCelebrationType(willCompleteProgram ? 'program' : 'workout');
      triggerHaptic();
      setCelebrating(true);
    }
  };
  const completeExercise = (exerciseId: string) => {
    if (!active) return;
    const exercise = active.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;
    const willCompleteWorkout = active.exercises.length > 0 && active.exercises.every((item) => item.id === exerciseId ? !item.completed : Boolean(item.completed));
    toggleExercise(active.id, exerciseId);
    if (willCompleteWorkout && !isComplete) {
      const willCompleteProgram = workouts.every((workout) => workout.id === active.id ? true : workout.completed);
      setCelebrationType(willCompleteProgram ? 'program' : 'workout');
      triggerHaptic();
      setCelebrating(true);
    }
  };
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
          <View style={styles.featureBottom}><Text style={[styles.caption, { color: colors.mutedForeground }]}>{completedCount} / {active.exercises.length} {t('completed').toLowerCase()}</Text><Pill label={isComplete ? t('resetWorkout') : t('completeAll')} active onPress={completeWorkout} /></View>
        </Card>
        <Card style={[styles.liveCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}45` }]}>
          <View style={styles.liveCardHeader}><View style={[styles.liveIcon, { backgroundColor: colors.primary }]}><Ionicons name="camera-scan" size={20} color={colors.primaryForeground} /></View><View style={{ flex: 1 }}><Text style={[styles.liveTitle, { color: colors.foreground }]}>{liveT('liveWorkoutTitle')}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{liveT('liveWorkoutBody')}</Text></View></View>
           <View style={styles.liveOptions}>{([{ kind: 'squat', key: 'exerciseSquat' }, { kind: 'pushup', key: 'exercisePushup' }, { kind: 'lunge', key: 'exerciseLunge' }] as Array<{ kind: ExerciseKind; key: TranslationKey }>).map((item) => <Pressable key={item.kind} testID={`start-live-${item.kind}`} onPress={() => { triggerHaptic(); router.push({ pathname: '/live-workout', params: { exercise: item.kind } }); }} style={({ pressed }) => [styles.liveOption, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}><Ionicons name="arrow-forward" size={13} color={colors.primary} /><Text style={[styles.liveOptionText, { color: colors.foreground }]}>{t(item.key)}</Text></Pressable>)}</View>
        </Card>
        <SectionTitle title={`${label(active.name)} / ${t('allExercises')}`} />
         <Card style={styles.addCard}><TextInput testID="new-exercise-input" value={newExercise} onChangeText={setNewExercise} onSubmitEditing={addNewExercise} returnKeyType="done" placeholder={t('exerciseName')} placeholderTextColor={colors.mutedForeground} style={[styles.addInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} /><Pressable testID="add-exercise-button" accessibilityRole="button" accessibilityLabel={t('addExercise')} disabled={!newExercise.trim()} onPress={() => { triggerHaptic(); addNewExercise(); }} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.primary, opacity: !newExercise.trim() ? 0.45 : pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] }]}><Ionicons name="add" size={19} color={colors.primaryForeground} /><Text style={[styles.addButtonText, { color: colors.primaryForeground }]}>{t('add')}</Text></Pressable></Card>
        {visibleGroups.map((group) => <View key={group}>
          <View style={styles.groupHeader}><Text style={[styles.groupTitle, { color: colors.foreground }]}>{t(muscleGroupLabels[group])}</Text><Text style={[styles.groupCount, { color: colors.mutedForeground }]}>{groupedExercises[group]?.length ?? 0} {t('exercises')}</Text></View>
          {(groupedExercises[group] ?? []).map((exercise, index) => <Card key={exercise.id} style={[styles.exerciseCard, exercise.completed ? { backgroundColor: `${colors.success}12`, borderColor: `${colors.success}55` } : null]}>
            <Pressable testID={`toggle-exercise-${exercise.id}`} accessibilityRole="checkbox" accessibilityState={{ checked: Boolean(exercise.completed) }} accessibilityLabel={t(exercise.completed ? 'markExerciseUndone' : 'markExerciseDone')} onPress={() => { triggerHaptic(); completeExercise(exercise.id); }} style={[styles.check, { borderColor: exercise.completed ? colors.success : colors.border, backgroundColor: exercise.completed ? colors.success : colors.secondary }]}>
              {exercise.completed ? <Ionicons name="checkmark" size={18} color={colors.primaryForeground} /> : <Text style={[styles.index, { color: colors.mutedForeground }]}>{String(index + 1).padStart(2, '0')}</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t(exercise.completed ? 'markExerciseUndone' : 'markExerciseDone')} onPress={() => { triggerHaptic(); completeExercise(exercise.id); }} style={{ flex: 1 }}>
              <Text style={[styles.exerciseName, { color: colors.foreground }, exercise.completed ? styles.completedExercise : null]}>{label(exercise.name)}</Text>
              <Text style={[styles.caption, { color: colors.mutedForeground }]}>{exercise.sets} {t('sets')}  •  {exercise.reps} reps</Text>
            </Pressable>
            <Pressable onPress={() => { triggerHaptic(); removeExercise(active.id, exercise.id); }} accessibilityLabel={t('removeExercise')}><Ionicons name="trash-outline" size={17} color={colors.mutedForeground} /></Pressable>
          </Card>)}
        </View>)}
      </> : <Card style={[styles.restCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={[styles.restIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="sparkles-outline" size={24} color={colors.primary} /></View>
        <Text style={[styles.restTitle, { color: colors.foreground }]}>{t('restDayTitle')}</Text>
        <Text style={[styles.restBody, { color: colors.mutedForeground }]}>{t('restDaySubtitle')}</Text>
      </Card>}
    </Screen>
    <CelebrationBurst visible={celebrating} title={t(celebrationType === 'program' ? 'programCompleteTitle' : 'workoutCompleteTitle')} subtitle={t(celebrationType === 'program' ? 'programCompleteSubtitle' : 'workoutCompleteSubtitle')} onDone={() => setCelebrating(false)} />
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
  featureBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 18 },
  focusChip: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  focusChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  liveCard: { padding: 16, marginBottom: 18 },
  liveCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  liveTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, marginBottom: 4 },
  liveOptions: { flexDirection: 'row', gap: 7, marginTop: 16 },
  liveOption: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 7 },
  liveOptionText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  addCard: { padding: 10, flexDirection: 'row', gap: 8, alignItems: 'center' },
  addInput: { flex: 1, height: 42, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontFamily: 'Inter_400Regular', fontSize: 12 },
   addButton: { minWidth: 72, height: 42, borderRadius: 13, paddingHorizontal: 10, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center' },
   addButtonText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 5, marginBottom: 9 },
  groupTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  groupCount: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  exerciseCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  check: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  index: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  exerciseName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  completedExercise: { textDecorationLine: 'line-through', opacity: 0.7 },
});