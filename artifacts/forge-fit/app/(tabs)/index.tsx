import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@/components/AppIcon';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { SUBSCRIPTION_PURCHASE_ENABLED } from '@/lib/revenuecat';
import { getMealsForRange } from '@/lib/nutritionDates';
import { getCurrentStreak } from '@/lib/streak';
import { getWorkoutForDate } from '@/lib/workoutPlan';
import { badgeText, badgeUi } from '@/lib/badges';
import { AnimatedNumber, Card, ForgeFitMark, Header, Metric, PremiumAccessStatusModal, PremiumOfferModal, Screen, SectionTitle } from '@/components/FitUI';

function CalorieProgressFill({ progress, color }: { progress: number; color: string }) {
  const level = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(level, { toValue: Math.max(0.035, Math.min(progress, 1)), duration: 650, useNativeDriver: false }).start();
  }, [level, progress]);
  const width = level.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return <View pointerEvents="none" style={styles.progressFrame}>
    <View style={[styles.progressTrack, { backgroundColor: `${color}26` }]}>
      <Animated.View style={[styles.progressFill, { width, backgroundColor: color }]} />
    </View>
  </View>;
}

export default function TodayScreen() {
  const colors = useColors();
  const { language, meals, username, calorieGoal, proteinGoal, carbsGoal, fatGoal, workouts, streakDates, isPremium } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [premiumVisible, setPremiumVisible] = React.useState(false);
  const [premiumStatusVisible, setPremiumStatusVisible] = React.useState(false);
  const todayMeals = getMealsForRange(meals, 'daily');
  const calories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const streak = getCurrentStreak(streakDates);
  const todayWorkout = getWorkoutForDate(workouts);
  const macros = todayMeals.reduce((totals, meal) => ({
    protein: totals.protein + meal.protein,
    carbs: totals.carbs + meal.carbs,
    fat: totals.fat + meal.fat,
  }), { protein: 0, carbs: 0, fat: 0 });
  return (
    <Screen bottomPadding={120}>
      <Header
        title={`${t('goodMorning')}, ${username ?? ''}`.trim()}
        subtitle={t('ready')}
        centered
         action="settings-outline"
         onAction={() => router.push('/settings')}
          premiumLabel={SUBSCRIPTION_PURCHASE_ENABLED ? (isPremium ? t('premiumOwned') : t('premiumShort')) : undefined}
          premiumIcon="trophy-outline"
         premiumOwned={isPremium}
         premiumAction={SUBSCRIPTION_PURCHASE_ENABLED ? () => { if (isPremium) setPremiumStatusVisible(true); else setPremiumVisible(true); } : undefined}
         streak={streak}
         streakLabel={t('streak')}
          featureLabel={badgeText(badgeUi.title, language)}
          featureAction={() => router.push('/badges')}
         showText={false}
      />

       <View style={styles.homeContent}>
       <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <CalorieProgressFill progress={calorieGoal ? calories / calorieGoal : 0} color={colors.primaryForeground} />
        <View style={styles.heroGlow} />
         <View style={styles.homeGreeting}>
           <Text style={[styles.homeGreetingTitle, { color: colors.primaryForeground }]}>{`${t('goodMorning')}, ${username ?? ''}`.trim()}</Text>
           <Text style={[styles.homeGreetingSubtitle, { color: `${colors.primaryForeground}A8` }]}>{t('ready')}</Text>
         </View>
         <View style={styles.heroTop}>
           <View style={styles.heroLead}>
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
         <Pressable testID="analyze-meal-photo" onPress={() => router.push({ pathname: '/(tabs)/nutrition', params: { openCamera: 'meal' } })} style={({ pressed }) => [styles.heroPhotoAction, { borderColor: `${colors.primaryForeground}35`, opacity: pressed ? 0.8 : 1 }]}>
           <LinearGradient colors={[`${colors.primaryForeground}F2`, `${colors.primaryForeground}C7`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroPhotoActionGradient}>
             <View style={[styles.heroPhotoActionIcon, { backgroundColor: `${colors.primary}35` }]}><Ionicons name="camera-outline" size={16} color={colors.primary} /></View>
             <Text style={[styles.heroPhotoActionText, { color: colors.primary }]}>{t('analyzeMealPhoto')}</Text>
             <Ionicons name="arrow-forward" size={16} color={colors.primary} />
           </LinearGradient>
         </Pressable>
      </View>

      <View style={styles.metricRow}>
        <Metric icon="flame-outline" value={<><AnimatedNumber value={macros.protein} suffix=" g" /><Text style={[styles.metricGoal, { color: colors.mutedForeground }]}>{proteinGoal ? ` / ${proteinGoal} g` : ' / —'}</Text></>} label={t('protein')} color={colors.blue} />
        <Metric icon="flash-outline" value={<><AnimatedNumber value={macros.carbs} suffix=" g" /><Text style={[styles.metricGoal, { color: colors.mutedForeground }]}>{carbsGoal ? ` / ${carbsGoal} g` : ' / —'}</Text></>} label={t('carbs')} color={colors.orange} />
        <Metric icon="nutrition-outline" value={<><AnimatedNumber value={macros.fat} suffix=" g" /><Text style={[styles.metricGoal, { color: colors.mutedForeground }]}>{fatGoal ? ` / ${fatGoal} g` : ' / —'}</Text></>} label={t('fat')} color={colors.plum} />
      </View>

      <SectionTitle title={t('todayWorkout')} action={t('viewAll')} onAction={() => router.push('/(tabs)/plan')} />
      <Card onPress={() => todayWorkout ? router.push({ pathname: '/(tabs)/plan', params: { day: todayWorkout.day } }) : router.push('/(tabs)/plan')} style={styles.workoutCard}>
        <View style={[styles.workoutIcon, { backgroundColor: `${colors.orange}22` }]}><Ionicons name="barbell-outline" size={22} color={colors.orange} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{todayWorkout ? (translate(language, todayWorkout.name as Parameters<typeof translate>[1]) || todayWorkout.name) : t('restDayTitle')}</Text><Text style={[styles.cardCaption, { color: colors.mutedForeground }]}>{todayWorkout ? `${todayWorkout.duration} min  •  ${todayWorkout.exercises.length} ${t('exercises')}` : t('restDaySubtitle')}</Text></View>
        <View testID="open-today-workout" style={[styles.workoutButton, { backgroundColor: colors.primary }]}><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></View>
      </Card>

       </View>
        <PremiumOfferModal visible={premiumVisible} onClose={() => setPremiumVisible(false)} />
        <PremiumAccessStatusModal visible={premiumStatusVisible} onClose={() => setPremiumStatusVisible(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  homeContent: { paddingTop: 30 },
  heroCard: { borderRadius: 28, padding: 22, overflow: 'hidden', marginBottom: 16 },
  homeGreeting: { marginBottom: 18 },
  homeGreetingTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, lineHeight: 27, letterSpacing: -0.5 },
  homeGreetingSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17, marginTop: 3 },
  progressFrame: { marginTop: 1, marginBottom: 17 },
  progressTrack: { height: 6, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99, opacity: 0.78 },
  heroGlow: { position: 'absolute', right: -56, top: -70, width: 180, height: 180, borderRadius: 100, backgroundColor: '#FFFFFF18' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLead: { flex: 1, minWidth: 0 },
  heroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.3 },
  heroNumber: { fontFamily: 'Inter_700Bold', fontSize: 48, letterSpacing: -2.5, marginTop: 5 },
  heroMeta: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: -3 },
  ring: { width: 86, height: 86, borderRadius: 45, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 68, height: 68, borderRadius: 35, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  ringPercent: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  heroDivider: { height: 1, marginVertical: 18 },
  heroBottom: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  heroSmallLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  heroSmallValue: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 3 },
  heroStatus: { flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'flex-end', minWidth: 0 },
  heroStatusText: { flexShrink: 1, fontFamily: 'Inter_600SemiBold', fontSize: 11, textAlign: 'right' },
  metricGoal: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  heroPhotoAction: { marginTop: 17, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  heroPhotoActionGradient: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 11 },
  heroPhotoActionIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  heroPhotoActionText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 0.1 },
  metricRow: { flexDirection: 'row', justifyContent: 'center', gap: 22, marginBottom: 16 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  cardCaption: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 5 },
  workoutCard: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  workoutIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  workoutButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  premiumCard: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderRadius: 22, padding: 16, marginTop: 8 },
  premiumMark: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  premiumLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2, marginBottom: 4 },
  premiumTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  premiumDesc: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
});
