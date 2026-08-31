import React from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { Ionicons } from '@/components/AppIcon';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { SUBSCRIPTION_PURCHASE_ENABLED } from '@/lib/revenuecat';
import { AnimatedNumber, Card, ForgeFitMark, Header, Metric, PremiumOfferModal, Screen, SectionTitle } from '@/components/FitUI';

function CalorieWaterFill({ progress, color }: { progress: number; color: string }) {
  const level = React.useRef(new Animated.Value(0)).current;
  const wave = React.useRef(new Animated.Value(0)).current;
  const tiltX = React.useRef(new Animated.Value(0)).current;
  const tiltY = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(level, { toValue: Math.max(0.035, Math.min(progress, 1)), duration: 650, useNativeDriver: false }).start();
  }, [level, progress]);
  React.useEffect(() => {
    const animation = Animated.loop(Animated.timing(wave, { toValue: 1, duration: 2200, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [wave]);
  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    let subscription: { remove: () => void } | undefined;
    try {
      Accelerometer.setUpdateInterval(55);
      subscription = Accelerometer.addListener(({ x, y }) => {
        Animated.parallel([
          Animated.spring(tiltX, { toValue: Math.max(-1, Math.min(1, x)), friction: 8, tension: 55, useNativeDriver: true }),
          Animated.spring(tiltY, { toValue: Math.max(-1, Math.min(1, y)), friction: 8, tension: 55, useNativeDriver: true }),
        ]).start();
      });
    } catch {
      // Sensor access is unavailable in web previews and restricted native environments.
    }
    return () => subscription?.remove();
  }, [tiltX, tiltY]);
  const height = level.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const translateX = wave.interpolate({ inputRange: [0, 1], outputRange: [0, -92] });
  const fluidTranslateX = tiltX.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const fluidTranslateY = tiltY.interpolate({ inputRange: [-1, 1], outputRange: [7, -7] });
  const fluidRotation = tiltX.interpolate({ inputRange: [-1, 1], outputRange: ['-5deg', '5deg'] });
  return <View pointerEvents="none" style={styles.waterFrame}>
    <Animated.View style={[styles.waterFill, { height, backgroundColor: color }]}>
      <Animated.View style={[styles.waterMotion, { transform: [{ translateX: fluidTranslateX }, { translateY: fluidTranslateY }, { rotate: fluidRotation }] }]}>
        <Animated.View style={[styles.waterWave, { backgroundColor: color, transform: [{ translateX }] }]} />
        <Animated.View style={[styles.waterWave, styles.waterWaveSecond, { backgroundColor: color, transform: [{ translateX }] }]} />
      </Animated.View>
    </Animated.View>
  </View>;
}

export default function TodayScreen() {
  const colors = useColors();
  const { language, meals, username, calorieGoal, workouts, isPremium } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [premiumVisible, setPremiumVisible] = React.useState(false);
  const calories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const streak = workouts.filter((workout) => workout.completed).length;
  const macros = meals.reduce((totals, meal) => ({
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
         premiumOwned={isPremium}
         premiumAction={SUBSCRIPTION_PURCHASE_ENABLED ? () => setPremiumVisible(true) : undefined}
         streak={streak}
         streakLabel={t('streak')}
         showText={false}
      />

       <View style={styles.homeContent}>
       <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <CalorieWaterFill progress={calorieGoal ? calories / calorieGoal : 0} color={colors.primaryForeground} />
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

      {SUBSCRIPTION_PURCHASE_ENABLED ? <Card onPress={() => setPremiumVisible(true)} style={[styles.premiumCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={[styles.premiumMark, { backgroundColor: colors.primary }]}><ForgeFitMark size={34} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.premiumLabel, { color: colors.primary }]}>{t('premium')}</Text><Text style={[styles.premiumTitle, { color: colors.foreground }]}>{t('unlock')}</Text><Text style={[styles.premiumDesc, { color: colors.mutedForeground }]}>{t('premiumDesc')}</Text></View>
        <Ionicons name="chevron-forward" size={19} color={colors.mutedForeground} />
      </Card> : null}

       </View>
       <PremiumOfferModal visible={premiumVisible} onClose={() => setPremiumVisible(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  homeContent: { paddingTop: 30 },
  heroCard: { borderRadius: 28, padding: 22, overflow: 'hidden', marginBottom: 16 },
  homeGreeting: { marginBottom: 18 },
  homeGreetingTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, lineHeight: 27, letterSpacing: -0.5 },
  homeGreetingSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17, marginTop: 3 },
  waterFrame: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, justifyContent: 'flex-end', overflow: 'hidden' },
  waterFill: { width: '100%', opacity: 0.13, minHeight: 2 },
  waterMotion: { flex: 1, width: '100%' },
  waterWave: { position: 'absolute', width: '145%', height: 26, borderRadius: 80, top: -13, left: '-22%' },
  waterWaveSecond: { top: -8, left: '30%', opacity: 0.72 },
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