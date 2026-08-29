import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, Header, Pill, ProgressBar, Screen, SectionTitle } from '@/components/FitUI';

const workouts = [
  { day: 'MON', name: 'Push power', duration: '45 min', count: 6, icon: 'barbell-outline' as const, colorKey: 'orange' as const },
  { day: 'WED', name: 'Pull strength', duration: '42 min', count: 5, icon: 'fitness-outline' as const, colorKey: 'blue' as const },
  { day: 'FRI', name: 'Legs & core', duration: '50 min', count: 7, icon: 'flame-outline' as const, colorKey: 'plum' as const },
];

export default function PlanScreen() {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [activeDay, setActiveDay] = useState('MON');
  const [completed, setCompleted] = useState<string[]>([]);
  const active = workouts.find((workout) => workout.day === activeDay) ?? workouts[0];
  const toggle = (id: string) => setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  return <Screen>
    <Header eyebrow="Training / 03" title={t('planTitle')} subtitle={t('planSubtitle')} action="options-outline" onAction={() => Alert.alert(t('edit'), t('planSubtitle'))} />
    <View style={styles.dayRow}>{workouts.map((workout) => <Pressable key={workout.day} onPress={() => setActiveDay(workout.day)} style={[styles.day, { backgroundColor: activeDay === workout.day ? colors.primary : colors.card, borderColor: colors.border }]}><Text style={[styles.dayText, { color: activeDay === workout.day ? colors.primaryForeground : colors.mutedForeground }]}>{workout.day}</Text><View style={[styles.dayDot, { backgroundColor: activeDay === workout.day ? colors.primaryForeground : colors.secondary }]} /></Pressable>)}</View>
    <Card style={[styles.featureCard, { backgroundColor: colors.secondary }]}>
      <View style={styles.featureTop}><View><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('thisWeek').toUpperCase()}</Text><Text style={[styles.featureTitle, { color: colors.foreground }]}>{active.name}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{active.duration}  •  {active.count} {t('exercises')}</Text></View><View style={[styles.featureIcon, { backgroundColor: colors[active.colorKey] }]}><Ionicons name={active.icon} size={23} color={colors.background} /></View></View>
      <ProgressBar value={completed.length / 4} color={colors.primary} />
      <View style={styles.featureBottom}><Text style={[styles.caption, { color: colors.mutedForeground }]}>{completed.length} / 4 {t('completed').toLowerCase()}</Text><Pill label={t('start')} active onPress={() => Alert.alert(t('startWorkout'), active.name)} /></View>
    </Card>
    <SectionTitle title={`${active.name} / ${t('exercises')}`} action={t('edit')} onAction={() => Alert.alert(t('edit'), t('planSubtitle'))} />
    {['Incline press', 'Cable row', 'Shoulder press', 'Plank hold'].map((exercise, index) => {
      const id = `${activeDay}-${index}`;
      const isDone = completed.includes(id);
      return <Pressable key={exercise} onPress={() => toggle(id)}><Card style={styles.exerciseCard}><View style={[styles.check, { borderColor: isDone ? colors.primary : colors.border, backgroundColor: isDone ? colors.primary : colors.secondary }]}>{isDone ? <Ionicons name="checkmark" size={15} color={colors.primaryForeground} /> : <Text style={[styles.index, { color: colors.mutedForeground }]}>0{index + 1}</Text>}</View><View style={{ flex: 1 }}><Text style={[styles.exerciseName, { color: isDone ? colors.mutedForeground : colors.foreground, textDecorationLine: isDone ? 'line-through' : 'none' }]}>{exercise}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>4 {t('sets')}  •  10 reps  •  90s {t('rest')}</Text></View><Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} /></Card></Pressable>;
    })}
  </Screen>;
}

const styles = StyleSheet.create({
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
  exerciseCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  check: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  index: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  exerciseName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});