import React from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@/components/AppIcon';
import { useFit } from '@/context/FitContext';
import { translate, TranslationKey } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, CelebrationBurst, EmptyState, Header, Pill, ProgressBar, Screen, SectionTitle, triggerHaptic } from '@/components/FitUI';
import { liveTranslate } from '@/lib/liveWorkoutCopy';
import type { ExerciseKind } from '@/lib/liveWorkout';

export default function PlanScreen() {
  const colors = useColors();
  const { language, workouts, toggleWorkout, addExercise, removeExercise } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const liveT = (key: Parameters<typeof liveTranslate>[1]) => liveTranslate(language, key);
  const [activeDay, setActiveDay] = React.useState('MON');
  const [newExercise, setNewExercise] = React.useState('');
  const [celebrating, setCelebrating] = React.useState(false);
  const active = workouts.find((workout) => workout.day === activeDay) ?? workouts[0];
  const label = (value: string) => translate(language, value as Parameters<typeof translate>[1]) || value;

  if (!active) return <Screen><Header eyebrow="Training" title={t('planTitle')} subtitle={t('planSubtitle')} /><EmptyState icon="barbell-outline" title={t('noWorkout')} text={t('createPlan')} /></Screen>;
  const completedCount = active.completed ? active.exercises.length : 0;
  const addNewExercise = () => {
    const name = newExercise.trim();
    if (!name) return;
    addExercise(active.id, name as TranslationKey);
    setNewExercise('');
    Alert.alert(t('addExercise'), t('planUpdated'));
  };
  const completeWorkout = () => {
    const nextCompleted = !active.completed;
    toggleWorkout(active.id);
    if (nextCompleted) {
      triggerHaptic();
      setCelebrating(true);
    }
  };
  return <View style={[styles.page, { backgroundColor: colors.background }]}>
    <Screen>
      <Header eyebrow="Training" title={t('planTitle')} subtitle={t('planSubtitle')} action="options-outline" onAction={() => Alert.alert(t('edit'), t('planSubtitle'))} />
      <View style={styles.dayRow}>{workouts.map((workout) => <Pressable key={workout.day} onPress={() => { triggerHaptic(); setActiveDay(workout.day); }} style={({ pressed }) => [styles.day, { backgroundColor: activeDay === workout.day ? colors.primary : colors.card, borderColor: colors.border, opacity: pressed ? 0.78 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}><Text style={[styles.dayText, { color: activeDay === workout.day ? colors.primaryForeground : colors.mutedForeground }]}>{workout.day}</Text><View style={[styles.dayDot, { backgroundColor: workout.completed ? colors.success : activeDay === workout.day ? colors.primaryForeground : colors.secondary }]} /></Pressable>)}</View>
      <Card style={[styles.featureCard, { backgroundColor: colors.secondary }]}>
      <View style={styles.featureTop}><View><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('thisWeek').toUpperCase()}</Text><Text style={[styles.featureTitle, { color: colors.foreground }]}>{label(active.name)}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{active.duration} min  •  {active.exercises.length} {t('exercises')}</Text></View><View style={[styles.featureIcon, { backgroundColor: colors.primary }]}><Ionicons name="barbell-outline" size={23} color={colors.primaryForeground} /></View></View>
      <ProgressBar value={active.completed ? 1 : 0} color={colors.primary} />
        <View style={styles.featureBottom}><Text style={[styles.caption, { color: colors.mutedForeground }]}>{completedCount} / {active.exercises.length} {t('completed').toLowerCase()}</Text><Pill label={active.completed ? t('completed') : t('start')} active onPress={completeWorkout} /></View>
      </Card>
      <Card style={[styles.liveCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}45` }]}>
        <View style={styles.liveCardHeader}><View style={[styles.liveIcon, { backgroundColor: colors.primary }]}><Ionicons name="camera-scan" size={20} color={colors.primaryForeground} /></View><View style={{ flex: 1 }}><Text style={[styles.liveTitle, { color: colors.foreground }]}>{liveT('liveWorkoutTitle')}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{liveT('liveWorkoutBody')}</Text></View></View>
        <View style={styles.liveOptions}>{([{ kind: 'squat', key: 'exerciseSquat' }, { kind: 'pushup', key: 'exercisePushup' }, { kind: 'lunge', key: 'exerciseLunge' }] as Array<{ kind: ExerciseKind; key: TranslationKey }>).map((item) => <Pressable key={item.kind} testID={`start-live-${item.kind}`} onPress={() => { triggerHaptic(); router.push({ pathname: '/live-workout', params: { exercise: item.kind } }); }} style={({ pressed }) => [styles.liveOption, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}><Ionicons name="arrow-forward" size={13} color={colors.primary} /><Text style={[styles.liveOptionText, { color: colors.foreground }]}>{t(item.key)}</Text></Pressable>)}</View>
      </Card>
      <SectionTitle title={`${label(active.name)} / ${t('exercises')}`} action={t('addExercise')} onAction={() => undefined} />
      <Card style={styles.addCard}><TextInput value={newExercise} onChangeText={setNewExercise} placeholder={t('exerciseName')} placeholderTextColor={colors.mutedForeground} style={[styles.addInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} /><Pressable onPress={() => { triggerHaptic(); addNewExercise(); }} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] }]}><Ionicons name="add" size={19} color={colors.primaryForeground} /></Pressable></Card>
      {active.exercises.map((exercise, index) => <Card key={exercise.id} style={styles.exerciseCard}><View style={[styles.check, { borderColor: colors.border, backgroundColor: colors.secondary }]}><Text style={[styles.index, { color: colors.mutedForeground }]}>{String(index + 1).padStart(2, '0')}</Text></View><View style={{ flex: 1 }}><Text style={[styles.exerciseName, { color: colors.foreground }]}>{label(exercise.name)}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{exercise.sets} {t('sets')}  •  {exercise.reps} reps</Text></View><Pressable onPress={() => { triggerHaptic(); removeExercise(active.id, exercise.id); }} accessibilityLabel={t('removeExercise')}><Ionicons name="trash-outline" size={17} color={colors.mutedForeground} /></Pressable></Card>)}
    </Screen>
    <CelebrationBurst visible={celebrating} onDone={() => setCelebrating(false)} />
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  dayRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  day: { flex: 1, height: 58, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 7 },
  dayText: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1 },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  featureCard: { padding: 20 },
  featureTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  featureTitle: { fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: -0.7, marginVertical: 7 },
  featureIcon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  featureBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  liveCard: { padding: 16, marginBottom: 18 },
  liveCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  liveTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, marginBottom: 4 },
  liveOptions: { flexDirection: 'row', gap: 7, marginTop: 16 },
  liveOption: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 7 },
  liveOptionText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  addCard: { padding: 10, flexDirection: 'row', gap: 8, alignItems: 'center' },
  addInput: { flex: 1, height: 42, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontFamily: 'Inter_400Regular', fontSize: 12 },
  addButton: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  exerciseCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  check: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  index: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  exerciseName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});