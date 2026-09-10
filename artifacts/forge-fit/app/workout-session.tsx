import React from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/AppIcon';
import { MuscleAnatomy, type WorkoutMapKey } from '@/components/MuscleAnatomy';
import { Card, CelebrationBurst, ProgressBar, triggerHaptic } from '@/components/FitUI';
import { ExerciseFormGuide, hasExerciseFormGuide } from '@/components/ExerciseFormGuide';
import { useFit } from '@/context/FitContext';
import { useColors } from '@/hooks/useColors';
import { translate, type TranslationKey } from '@/lib/i18n';
import { estimateExerciseCalories, type MuscleGroup } from '@/lib/workoutPlan';

type BodySide = 'front' | 'back';
const MUSCLE_TAP_HINT_SEEN_KEY = 'gainmode-muscle-tap-hint-seen';

function getWorkoutMapKey(workoutName: string | undefined, muscles: MuscleGroup[]): WorkoutMapKey {
  const groups = new Set(muscles);
  if (workoutName === 'workoutFullBody') return 'full';
  if (workoutName === 'workoutPushDay') return groups.has('core') ? 'push-core' : 'push';
  if (workoutName === 'workoutPullDay') return groups.has('triceps') ? 'pull-triceps' : 'pull';
  if (workoutName === 'workoutLegDay') return 'leg';
  if (workoutName === 'workoutLowerDay') return 'lower';
  if (workoutName === 'workoutUpperDay') return 'upper';
  if (groups.has('quadriceps') || groups.has('hamstrings') || groups.has('glutes') || groups.has('calves')) {
    return groups.has('chest') || groups.has('back') || groups.has('shoulders') ? 'full' : 'lower';
  }
  if (groups.has('chest')) return groups.has('core') ? 'push-core' : 'push';
  if (groups.has('back')) return groups.has('triceps') ? 'pull-triceps' : 'pull';
  return 'full';
}

const muscleLabels: Record<MuscleGroup, TranslationKey> = {
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

function ExerciseVisual({ color, completed }: { color: string; completed: boolean }) {
  return <View style={[styles.exerciseVisual, { backgroundColor: `${color}18` }]}>
    <View style={[styles.visualHead, { borderColor: color }]} />
    <View style={[styles.visualBody, { backgroundColor: color }]} />
    <View style={styles.visualArms}>
      <View style={[styles.visualLimb, { backgroundColor: color }]} />
      <View style={[styles.visualBar, { backgroundColor: color }]} />
      <View style={[styles.visualLimb, { backgroundColor: color }]} />
    </View>
    {completed ? <View style={[styles.visualDone, { backgroundColor: color }]}><Ionicons name="checkmark" size={13} color="#FFFFFF" /></View> : null}
  </View>;
}

export default function WorkoutSessionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const { language, profile, workouts, toggleExercise } = useFit();
  const workout = workouts.find((item) => item.id === workoutId);
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const label = (value: string) => translate(language, value as Parameters<typeof translate>[1]) || value;
  const [side, setSide] = React.useState<BodySide>('front');
  const [selectedMuscle, setSelectedMuscle] = React.useState<MuscleGroup | null>(null);
  const [celebrating, setCelebrating] = React.useState(false);
  const [showTapHint, setShowTapHint] = React.useState(false);
  const [guideExercise, setGuideExercise] = React.useState<string | null>(null);
  const listAnimation = React.useRef(new Animated.Value(0)).current;
  const tapHintAnimation = React.useRef(new Animated.Value(0)).current;
  const activeMuscles = React.useMemo(() => {
    if (!workout) return [];
    const lowerBodyGroups = new Set(['quadriceps', 'hamstrings', 'glutes', 'calves']);
    const focusAreas = workout.focusAreas ?? workout.exercises.map((exercise) => exercise.muscleGroup).filter(Boolean);
    const isPushWorkout = workout.name === 'workoutPushDay'
      || (focusAreas.includes('chest') && focusAreas.includes('shoulders') && !focusAreas.includes('back') && !focusAreas.some((group) => lowerBodyGroups.has(group as string)));
    return Array.from(new Set(workout.exercises.map((exercise) => exercise.muscleGroup ?? 'other')))
      .filter((muscle) => !(isPushWorkout && muscle === 'biceps'));
  }, [workout]);
  const mapKey = React.useMemo(() => getWorkoutMapKey(workout?.name, activeMuscles), [workout?.name, activeMuscles]);
  const selectedExercises = selectedMuscle && workout
    ? workout.exercises.filter((exercise) => (exercise.muscleGroup ?? 'other') === selectedMuscle)
    : [];
  const completedCount = workout?.exercises.filter((exercise) => exercise.completed).length ?? 0;

  React.useEffect(() => {
    listAnimation.setValue(0);
    if (selectedMuscle) Animated.spring(listAnimation, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }).start();
  }, [listAnimation, selectedMuscle]);

  React.useEffect(() => {
    AsyncStorage.getItem(MUSCLE_TAP_HINT_SEEN_KEY)
      .then((value) => setShowTapHint(value !== 'true'))
      .catch(() => setShowTapHint(true));
  }, []);

  React.useEffect(() => {
    if (!showTapHint) {
      tapHintAnimation.stopAnimation();
      tapHintAnimation.setValue(0);
      return undefined;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(tapHintAnimation, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(tapHintAnimation, { toValue: 0, duration: 650, useNativeDriver: true }),
      Animated.delay(250),
    ]));
    animation.start();
    return () => animation.stop();
  }, [showTapHint, tapHintAnimation]);

  if (!workout) {
    return <View style={[styles.missingPage, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
      <Text style={[styles.missingTitle, { color: colors.foreground }]}>{t('workoutNotFound')}</Text>
      <Pressable onPress={() => router.back()}><Text style={[styles.backLink, { color: colors.primary }]}>{t('backToPlan')}</Text></Pressable>
    </View>;
  }

  const selectMuscle = (muscle: MuscleGroup) => {
    triggerHaptic();
    setSelectedMuscle(muscle);
    if (showTapHint) {
      setShowTapHint(false);
      AsyncStorage.setItem(MUSCLE_TAP_HINT_SEEN_KEY, 'true').catch(() => undefined);
    }
  };

  const completeExercise = (exerciseId: string) => {
    const exercise = workout.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;
    const willComplete = !exercise.completed && workout.exercises.every((item) => item.id === exerciseId || item.completed);
    triggerHaptic();
    toggleExercise(workout.id, exerciseId);
    if (willComplete) setCelebrating(true);
  };

  return <View style={[styles.page, { backgroundColor: colors.background }]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }]}>
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('backToPlan')} onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{t('activeMuscles').toUpperCase()}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{label(workout.name)}</Text>
        </View>
        <View style={[styles.counter, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.counterText, { color: colors.foreground }]}>{completedCount}/{workout.exercises.length}</Text>
        </View>
      </View>

      <Card style={styles.anatomyCard}>
        <View style={styles.anatomyTop}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('muscleMap')}</Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>{t('tapHighlightedMuscle')}</Text>
          </View>
          <View style={[styles.sideSwitch, { backgroundColor: colors.secondary }]}>
            {(['front', 'back'] as BodySide[]).map((item) => <Pressable
              key={item}
              testID={`body-side-${item}`}
              onPress={() => { triggerHaptic(); setSide(item); setSelectedMuscle(null); }}
              style={[styles.sideButton, side === item ? { backgroundColor: colors.primary } : null]}
            >
              <Text style={[styles.sideText, { color: side === item ? colors.primaryForeground : colors.mutedForeground }]}>{t(item === 'front' ? 'frontBody' : 'backBody')}</Text>
            </Pressable>)}
          </View>
        </View>
        <View style={[styles.anatomyStage, { backgroundColor: colors.secondary }]}>
          <MuscleAnatomy
            side={side}
            activeMuscles={activeMuscles}
            mapKey={mapKey}
            selectedMuscle={selectedMuscle}
            onSelect={selectMuscle}
            activeColor={colors.primary}
            selectedColor={colors.blue}
            labelBackgroundColor={colors.card}
            labelTextColor={colors.foreground}
            muscleLabels={Object.fromEntries(Object.entries(muscleLabels).map(([muscle, translationKey]) => [muscle, t(translationKey)]))}
            isDark={colors.colorScheme === 'dark'}
          />
          {showTapHint ? <Animated.View pointerEvents="none" style={[styles.tapHint, {
            backgroundColor: colors.card,
            borderColor: colors.primary,
            opacity: tapHintAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }),
            transform: [
              { translateY: tapHintAnimation.interpolate({ inputRange: [0, 1], outputRange: [-8, 8] }) },
              { scale: tapHintAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.06] }) },
            ],
          }]}>
            <View style={[styles.tapHintIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="hand-pointer" size={23} color={colors.primaryForeground} />
            </View>
            <Text style={[styles.tapHintText, { color: colors.foreground }]}>{t('tapMuscleHint')}</Text>
          </Animated.View> : null}
        </View>
        <View
          accessibilityLabel={t('clickToViewWorkouts')}
          style={[styles.mapCta, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}35` }]}
        >
          <Ionicons name="hand-pointer" size={15} color={colors.primary} />
          <Text style={[styles.mapCtaText, { color: colors.primary }]}>{t('clickToViewWorkouts')}</Text>
        </View>
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{t('todayTargetMuscles')}</Text>
        </View>
        <ProgressBar value={workout.exercises.length ? completedCount / workout.exercises.length : 0} color={colors.success} />
      </Card>

      {selectedMuscle ? <Animated.View style={{
        opacity: listAnimation,
        transform: [{ translateY: listAnimation.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
      }}>
        <View style={styles.exerciseHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t(muscleLabels[selectedMuscle])}</Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>{selectedExercises.length} {t('exercises')}</Text>
          </View>
          <Ionicons name="barbell-outline" size={22} color={colors.primary} />
        </View>
        {selectedExercises.map((exercise, index) => {
          const revealStart = Math.min(0.65, index * 0.1);
          const revealEnd = Math.min(1, revealStart + 0.32);
          const exerciseCalories = estimateExerciseCalories(workout, exercise, profile ?? undefined);
          return <Animated.View key={exercise.id} style={{
            opacity: listAnimation.interpolate({ inputRange: [revealStart, revealEnd], outputRange: [0, 1], extrapolate: 'clamp' }),
            transform: [{ translateY: listAnimation.interpolate({ inputRange: [revealStart, revealEnd], outputRange: [18, 0], extrapolate: 'clamp' }) }],
          }}>
          <Card style={[styles.exerciseCard, exercise.completed ? { backgroundColor: `${colors.success}10`, borderColor: `${colors.success}55` } : null]}>
            <ExerciseVisual color={exercise.completed ? colors.success : colors.primary} completed={Boolean(exercise.completed)} />
            <View style={styles.exerciseInfo}>
              <Text style={[styles.exerciseOrder, { color: colors.primary }]}>{String(index + 1).padStart(2, '0')}</Text>
              <Text style={[styles.exerciseName, { color: colors.foreground }, exercise.completed ? styles.completedText : null]}>{label(exercise.name)}</Text>
              <View style={styles.exerciseMeta}>
                <View style={[styles.metaPill, { backgroundColor: colors.secondary }]}><Text style={[styles.metaText, { color: colors.foreground }]}>{exercise.sets} {t('sets')}</Text></View>
                <View style={[styles.metaPill, { backgroundColor: colors.secondary }]}><Text style={[styles.metaText, { color: colors.foreground }]}>{exercise.reps} {t('repetitions')}</Text></View>
                 <View accessibilityLabel={`${label(exercise.name)}: ${exerciseCalories} ${t('caloriesShort')}`} style={[styles.metaPill, styles.calorieMetaPill, { backgroundColor: `${colors.orange}18` }]}><Ionicons name="flame-outline" size={11} color={colors.orange} /><Text style={[styles.metaText, { color: colors.orange }]}>{exerciseCalories} {t('caloriesShort')}</Text></View>
              </View>
              {hasExerciseFormGuide(exercise.name) ? <Pressable accessibilityRole="button" accessibilityLabel={t('exerciseFormShow')} onPress={() => setGuideExercise(exercise.name)} style={styles.formGuideButton}>
                <Ionicons name="eye-outline" size={14} color={colors.primary} />
                <Text style={[styles.formGuideButtonText, { color: colors.primary }]}>{t('exerciseFormShow')}</Text>
              </Pressable> : null}
            </View>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: Boolean(exercise.completed) }}
              accessibilityLabel={t(exercise.completed ? 'markExerciseUndone' : 'markExerciseDone')}
              onPress={() => completeExercise(exercise.id)}
              style={[styles.checkButton, { backgroundColor: exercise.completed ? colors.success : colors.secondary, borderColor: exercise.completed ? colors.success : colors.border }]}
            >
              <Ionicons name={exercise.completed ? 'checkmark' : 'arrow-forward'} size={18} color={exercise.completed ? colors.primaryForeground : colors.primary} />
            </Pressable>
          </Card>
        </Animated.View>;
        })}
      </Animated.View> : <View style={[styles.emptyPrompt, { borderColor: colors.border }]}>
        <Ionicons name="body-outline" size={28} color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('selectMuscleTitle')}</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('selectMuscleBody')}</Text>
      </View>}
    </ScrollView>
    <ExerciseFormGuide visible={Boolean(guideExercise)} exerciseName={guideExercise ?? 'exercisePlank'} language={language} onClose={() => setGuideExercise(null)} />
    <CelebrationBurst visible={celebrating} title={t('workoutCompleteTitle')} subtitle={t('workoutCompleteSubtitle')} onDone={() => setCelebrating(false)} />
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  iconButton: { width: 43, height: 43, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.6, marginTop: 3 },
  counter: { minWidth: 46, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  counterText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  anatomyCard: { padding: 16, marginBottom: 22 },
  anatomyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 13 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.3 },
  sectionHint: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 3 },
  sideSwitch: { flexDirection: 'row', padding: 3, borderRadius: 12 },
  sideButton: { minWidth: 48, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  sideText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  anatomyStage: { height: 440, borderRadius: 22, paddingHorizontal: 28, paddingVertical: 8, overflow: 'hidden' },
  mapCta: { minHeight: 36, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10, paddingHorizontal: 12 },
  mapCtaText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  tapHint: { position: 'absolute', right: 10, top: 118, maxWidth: 126, borderRadius: 16, borderWidth: 1, padding: 8, alignItems: 'center', shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  tapHintIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tapHintText: { fontFamily: 'Inter_700Bold', fontSize: 10, lineHeight: 14, textAlign: 'center', marginTop: 6 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 7, marginVertical: 12 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  exerciseHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 2 },
  exerciseCard: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  exerciseVisual: { width: 70, height: 78, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  visualHead: { width: 15, height: 15, borderRadius: 8, borderWidth: 2, marginBottom: 3 },
  visualBody: { width: 7, height: 25, borderRadius: 4 },
  visualArms: { position: 'absolute', top: 32, flexDirection: 'row', alignItems: 'center' },
  visualLimb: { width: 18, height: 4, borderRadius: 2, transform: [{ rotate: '-18deg' }] },
  visualBar: { width: 22, height: 3, borderRadius: 2 },
  visualDone: { position: 'absolute', right: 5, top: 5, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  exerciseInfo: { flex: 1 },
  exerciseOrder: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 },
  exerciseName: { fontFamily: 'Inter_700Bold', fontSize: 14, lineHeight: 19, marginTop: 3 },
  completedText: { textDecorationLine: 'line-through', opacity: 0.7 },
  exerciseMeta: { flexDirection: 'row', gap: 6, marginTop: 8 },
  metaPill: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  calorieMetaPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  formGuideButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-start' },
  formGuideButtonText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  checkButton: { width: 39, height: 39, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyPrompt: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 20, alignItems: 'center', padding: 24, marginBottom: 20 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, marginTop: 10 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5, maxWidth: 280 },
  missingPage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  missingTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, textAlign: 'center' },
  backLink: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 14 },
});