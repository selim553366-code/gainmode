import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { ActionTile, AnimatedNumber, Card, Header, Metric, ProgressBar, Screen, SectionTitle } from '@/components/FitUI';

export default function TodayScreen() {
  const colors = useColors();
  const { language, meals, weight, username, calorieGoal, workouts } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const calories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const macros = meals.reduce((totals, meal) => ({
    protein: totals.protein + meal.protein,
    carbs: totals.carbs + meal.carbs,
    fat: totals.fat + meal.fat,
  }), { protein: 0, carbs: 0, fat: 0 });
  return (
    <Screen>
      <Header
        eyebrow="Forge Fit"
            title={`${t('goodMorning')}, ${username ?? ''}`.trim()}
        subtitle={t('ready')}
         action="settings-outline"
         onAction={() => router.push('/settings')}
      />

      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <View style={styles.heroGlow} />
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroEyebrow, { color: colors.primaryForeground }]}>{t('calories').toUpperCase()}</Text>
            <AnimatedNumber value={calories} style={[styles.heroNumber, { color: colors.primaryForeground }]} />
            <Text style={[styles.heroMeta, { color: `${colors.primaryForeground}A8` }]}>/ {calorieGoal?.toLocaleString() ?? '—'} {t('caloriesShort')}</Text>
          </View>
          <View style={[styles.ring, { borderColor: `${colors.primaryForeground}33` }]}>
            <View style={[styles.ringInner, { borderColor: colors.primaryForeground }]}>
              <Text style={[styles.ringPercent, { color: colors.primaryForeground }]}>{calorieGoal ? `${Math.round((calories / calorieGoal) * 100)}%` : '—'}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.heroDivider, { backgroundColor: `${colors.primaryForeground}26` }]} />
        <View style={styles.heroBottom}>
          <View><Text style={[styles.heroSmallLabel, { color: `${colors.primaryForeground}A8` }]}>{t('remaining')}</Text><Text style={[styles.heroSmallValue, { color: colors.primaryForeground }]}>{calorieGoal ? `${Math.max(calorieGoal - calories, 0)} ${t('caloriesShort')}` : '—'}</Text></View>
          <View style={styles.heroStatus}><Ionicons name="information-circle-outline" size={15} color={colors.primaryForeground} /><Text style={[styles.heroStatusText, { color: colors.primaryForeground }]}>{t('noData')}</Text></View>
        </View>
      </View>

      <View style={styles.metricRow}>
        <Metric icon="flame-outline" value={<AnimatedNumber value={macros.protein} suffix=" g" />} label={t('protein')} color={colors.blue} />
        <Metric icon="flash-outline" value={<AnimatedNumber value={macros.carbs} suffix=" g" />} label={t('carbs')} color={colors.orange} />
        <Metric icon="nutrition-outline" value={<AnimatedNumber value={macros.fat} suffix=" g" />} label={t('fat')} color={colors.plum} />
      </View>

      <SectionTitle title={t('todayWorkout')} action={t('viewAll')} onAction={() => router.push('/(tabs)/plan')} />
      <Card style={styles.workoutCard}>
        <View style={[styles.workoutIcon, { backgroundColor: `${colors.orange}22` }]}><Ionicons name="barbell-outline" size={22} color={colors.orange} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{workouts[0] ? (translate(language, workouts[0].name as Parameters<typeof translate>[1]) || workouts[0].name) : t('noWorkout')}</Text><Text style={[styles.cardCaption, { color: colors.mutedForeground }]}>{workouts[0] ? `${workouts[0].duration} min  •  ${workouts[0].exercises.length} ${t('exercises')}` : t('createPlan')}</Text></View>
        <Pressable testID="create-workout-plan" onPress={() => router.push('/(tabs)/plan')} style={({ pressed }) => [styles.workoutButton, { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable>
      </Card>

      <SectionTitle title={t('quickActions')} />
      <View style={styles.actionGrid}>
        <ActionTile icon="restaurant-outline" title={t('logMeal')} subtitle={t('addFirstMeal')} color={colors.success} onPress={() => router.push('/(tabs)/nutrition')} />
        <ActionTile icon="scan-outline" title={t('scanMeal')} subtitle={t('premium')} color={colors.plum} onPress={() => router.push('/(tabs)/nutrition')} />
        <ActionTile icon="scale-outline" title={t('weight')} subtitle={weight === null ? t('noData') : `${weight} kg`} color={colors.blue} onPress={() => router.push('/(tabs)/progress')} />
        <ActionTile icon="flame-outline" title={t('streak')} subtitle={t('noData')} color={colors.orange} />
      </View>

      <View style={[styles.premiumCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={[styles.premiumMark, { backgroundColor: colors.primary }]}><Ionicons name="sparkles" size={16} color={colors.primaryForeground} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.premiumLabel, { color: colors.primary }]}>{t('premium')}</Text><Text style={[styles.premiumTitle, { color: colors.foreground }]}>{t('unlock')}</Text><Text style={[styles.premiumDesc, { color: colors.mutedForeground }]}>{t('premiumDesc')}</Text></View>
        <Ionicons name="chevron-forward" size={19} color={colors.mutedForeground} />
      </View>

      <View style={[styles.streakBanner, { backgroundColor: colors.secondary }]}>
        <View style={[styles.streakIcon, { backgroundColor: `${colors.orange}22` }]}><Ionicons name="flame" size={18} color={colors.orange} /></View>
        <Text style={[styles.streakText, { color: colors.foreground }]}>{t('stayConsistent')}</Text>
        <Ionicons name="arrow-forward" size={17} color={colors.primary} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { borderRadius: 28, padding: 22, overflow: 'hidden', marginBottom: 16 },
  heroGlow: { position: 'absolute', right: -56, top: -70, width: 180, height: 180, borderRadius: 100, backgroundColor: '#FFFFFF18' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.3 },
  heroNumber: { fontFamily: 'Inter_700Bold', fontSize: 48, letterSpacing: -2.5, marginTop: 5 },
  heroMeta: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: -3 },
  ring: { width: 86, height: 86, borderRadius: 45, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 68, height: 68, borderRadius: 35, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  ringPercent: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  heroDivider: { height: 1, marginVertical: 18 },
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroSmallLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  heroSmallValue: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 3 },
  heroStatus: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  heroStatusText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  cardCaption: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 5 },
  workoutCard: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  workoutIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  workoutButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  premiumCard: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderRadius: 22, padding: 16, marginTop: 8 },
  premiumMark: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  premiumLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2, marginBottom: 4 },
  premiumTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  premiumDesc: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  streakBanner: { borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, marginBottom: 10 },
  streakIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  streakText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12 },
});