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
import { AnimatedNumber, Card, Header, Metric, PremiumAccessStatusModal, PremiumOfferModal, Screen, SectionTitle } from '@/components/FitUI';

function CalorieProgressFill({ progress, color }: { progress: number; color: string }) {
  const level = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(level, {
      toValue: Math.max(0.035, Math.min(progress, 1)),
      duration: 650,
      useNativeDriver: false,
    }).start();
  }, [level, progress]);

  const width = level.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View pointerEvents="none" style={styles.progressFrame}>
      <View style={[styles.progressTrack, { backgroundColor: `${color}1F` }]}>
        <Animated.View style={[styles.progressFill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function CalorieRing({ progress, colors }: { progress: number; colors: ReturnType<typeof useColors> }) {
  const entrance = React.useRef(new Animated.Value(0)).current;
  const activeSegments = Math.round(Math.min(Math.max(progress, 0), 1) * 16);

  React.useEffect(() => {
    entrance.setValue(0);
    Animated.spring(entrance, {
      toValue: 1,
      friction: 9,
      tension: 72,
      useNativeDriver: true,
    }).start();
  }, [entrance, progress]);

  return (
    <Animated.View
      accessibilityLabel={`${Math.round(Math.min(Math.max(progress, 0), 1) * 100)}%`}
      style={[
        styles.ring,
        {
          borderColor: `${colors.primary}18`,
          opacity: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
          transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
        },
      ]}
    >
      <View style={styles.ringSegments} pointerEvents="none">
        {Array.from({ length: 16 }, (_, index) => (
          <View
            key={index}
            style={[
              styles.ringSegment,
              {
                backgroundColor: index < activeSegments ? colors.primary : `${colors.primary}22`,
                transform: [{ rotate: `${index * 22.5}deg` }, { translateY: -42 }],
              },
            ]}
          />
        ))}
      </View>
      <View style={[styles.ringCenter, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.ringPercent, { color: colors.foreground }]}>
          {progress > 0 ? `${Math.round(Math.min(progress, 1) * 100)}%` : '—'}
        </Text>
        <Text style={[styles.ringCaption, { color: colors.mutedForeground }]}> </Text>
      </View>
    </Animated.View>
  );
}

export default function TodayScreen() {
  const colors = useColors();
  const {
    language,
    meals,
    username,
    calorieGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
    workouts,
    streakDates,
    isPremium,
  } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [premiumVisible, setPremiumVisible] = React.useState(false);
  const [premiumStatusVisible, setPremiumStatusVisible] = React.useState(false);
  const todayMeals = getMealsForRange(meals, 'daily');
  const calories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const streak = getCurrentStreak(streakDates);
  const todayWorkout = getWorkoutForDate(workouts);
  const macros = todayMeals.reduce(
    (totals, meal) => ({
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fat: totals.fat + meal.fat,
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );
  const calorieProgress = calorieGoal ? calories / calorieGoal : 0;

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
        premiumAction={
          SUBSCRIPTION_PURCHASE_ENABLED
            ? () => {
                if (isPremium) setPremiumStatusVisible(true);
                else setPremiumVisible(true);
              }
            : undefined
        }
        streak={streak}
        streakLabel={t('streak')}
        featureLabel={badgeText(badgeUi.title, language)}
        featureAction={() => router.push('/badges')}
        showText={false}
      />

      <View style={styles.homeContent}>
        <LinearGradient
          colors={[colors.card, colors.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: `${colors.blue}2B` }]}
        >
          <View style={[styles.heroAccent, { backgroundColor: `${colors.blue}18` }]} />
          <CalorieProgressFill progress={calorieProgress} color={colors.primary} />

          <View style={styles.homeGreeting}>
            <View>
              <Text style={[styles.homeGreetingTitle, { color: colors.foreground }]}>
                {`${t('goodMorning')}, ${username ?? ''}`.trim()}
              </Text>
              <Text style={[styles.homeGreetingSubtitle, { color: colors.mutedForeground }]}>{t('ready')}</Text>
            </View>
            <View style={[styles.todayMark, { backgroundColor: `${colors.primary}12` }]}>
              <Ionicons name="sunny-outline" size={18} color={colors.primary} />
            </View>
          </View>

          <View style={styles.heroTop}>
            <View style={styles.heroLead}>
              <Text style={[styles.heroEyebrow, { color: colors.mutedForeground }]}>{t('calories').toUpperCase()}</Text>
              <AnimatedNumber value={calories} style={[styles.heroNumber, { color: colors.foreground }]} />
              <Text style={[styles.heroMeta, { color: colors.mutedForeground }]}>
                / {calorieGoal?.toLocaleString() ?? '—'} {t('caloriesShort')}
              </Text>
            </View>
            <CalorieRing progress={calorieProgress} colors={colors} />
          </View>

          <View style={[styles.heroDivider, { backgroundColor: `${colors.foreground}12` }]} />
          <View style={styles.heroBottom}>
            <View>
              <Text style={[styles.heroSmallLabel, { color: colors.mutedForeground }]}>{t('remaining')}</Text>
              <Text style={[styles.heroSmallValue, { color: colors.foreground }]}>
                {calorieGoal ? `${Math.max(calorieGoal - calories, 0)} ${t('caloriesShort')}` : '—'}
              </Text>
            </View>
            <View style={styles.heroStatus}>
              <Ionicons name="information-circle-outline" size={15} color={colors.mutedForeground} />
              <Text style={[styles.heroStatusText, { color: colors.mutedForeground }]}>{t('noData')}</Text>
            </View>
          </View>

          <Pressable
            testID="analyze-meal-photo"
            accessibilityRole="button"
            accessibilityLabel={t('analyzeMealPhoto')}
            onPress={() => router.push({ pathname: '/(tabs)/nutrition', params: { openCamera: 'meal' } })}
            style={({ pressed }) => [
              styles.heroPhotoAction,
              {
                backgroundColor: `${colors.card}A8`,
                borderColor: `${colors.primary}20`,
                opacity: pressed ? 0.72 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              },
            ]}
          >
            <View style={[styles.heroPhotoActionIcon, { backgroundColor: `${colors.primary}16` }]}>
              <Ionicons name="camera-outline" size={17} color={colors.primary} />
            </View>
            <Text style={[styles.heroPhotoActionText, { color: colors.foreground }]}>{t('analyzeMealPhoto')}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </Pressable>
        </LinearGradient>

        <View style={[styles.metricRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Metric
            icon="flame-outline"
            value={
              <>
                <AnimatedNumber value={macros.protein} suffix=" g" />
                <Text style={[styles.metricGoal, { color: colors.mutedForeground }]}>{proteinGoal ? ` / ${proteinGoal} g` : ' / —'}</Text>
              </>
            }
            label={t('protein')}
            color={colors.blue}
          />
          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
          <Metric
            icon="flash-outline"
            value={
              <>
                <AnimatedNumber value={macros.carbs} suffix=" g" />
                <Text style={[styles.metricGoal, { color: colors.mutedForeground }]}>{carbsGoal ? ` / ${carbsGoal} g` : ' / —'}</Text>
              </>
            }
            label={t('carbs')}
            color={colors.orange}
          />
          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
          <Metric
            icon="nutrition-outline"
            value={
              <>
                <AnimatedNumber value={macros.fat} suffix=" g" />
                <Text style={[styles.metricGoal, { color: colors.mutedForeground }]}>{fatGoal ? ` / ${fatGoal} g` : ' / —'}</Text>
              </>
            }
            label={t('fat')}
            color={colors.plum}
          />
        </View>

        <SectionTitle title={t('todayWorkout')} action={t('viewAll')} onAction={() => router.push('/(tabs)/plan')} />
        <Card
          onPress={() =>
            todayWorkout
              ? router.push({ pathname: '/(tabs)/plan', params: { day: todayWorkout.day } })
              : router.push('/(tabs)/plan')
          }
          style={styles.workoutCard}
        >
          <View style={[styles.workoutIcon, { backgroundColor: `${todayWorkout ? colors.orange : colors.primary}15` }]}>
            <Ionicons
              name={todayWorkout ? 'barbell-outline' : 'moon-outline'}
              size={22}
              color={todayWorkout ? colors.orange : colors.primary}
            />
          </View>
          <View style={styles.workoutCopy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {todayWorkout ? (translate(language, todayWorkout.name as Parameters<typeof translate>[1]) || todayWorkout.name) : t('restDayTitle')}
            </Text>
            <Text style={[styles.cardCaption, { color: colors.mutedForeground }]}>
              {todayWorkout
                ? `${todayWorkout.duration} min  •  ${todayWorkout.exercises.length} ${t('exercises')}`
                : t('restDaySubtitle')}
            </Text>
          </View>
          <View testID="open-today-workout" style={[styles.workoutButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
          </View>
        </Card>
      </View>

      <PremiumOfferModal visible={premiumVisible} onClose={() => setPremiumVisible(false)} />
      <PremiumAccessStatusModal visible={premiumStatusVisible} onClose={() => setPremiumStatusVisible(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  homeContent: { paddingTop: 26 },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    marginBottom: 18,
  },
  heroAccent: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 100,
    right: -78,
    top: -74,
  },
  homeGreeting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  homeGreetingTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  homeGreetingSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  todayMark: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressFrame: { marginTop: 1, marginBottom: 18 },
  progressTrack: { height: 5, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99, opacity: 0.72 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLead: { flex: 1, minWidth: 0 },
  heroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.25 },
  heroNumber: { fontFamily: 'Inter_700Bold', fontSize: 48, letterSpacing: -2.6, marginTop: 5 },
  heroMeta: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: -3 },
  ring: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  ringSegments: {
    position: 'absolute',
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSegment: {
    position: 'absolute',
    width: 7,
    height: 18,
    borderRadius: 99,
  },
  ringCenter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.4 },
  ringCaption: { fontFamily: 'Inter_500Medium', fontSize: 1, height: 1 },
  heroDivider: { height: 1, marginVertical: 18 },
  heroBottom: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  heroSmallLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  heroSmallValue: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 3 },
  heroStatus: { flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'flex-end', minWidth: 0 },
  heroStatusText: { flexShrink: 1, fontFamily: 'Inter_600SemiBold', fontSize: 11, textAlign: 'right' },
  heroPhotoAction: {
    marginTop: 18,
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 11,
  },
  heroPhotoActionIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  heroPhotoActionText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 0.1 },
  metricRow: {
    minHeight: 92,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginBottom: 27,
  },
  metricDivider: { width: 1, height: 39 },
  metricGoal: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  workoutCard: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 86, paddingVertical: 16 },
  workoutIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  workoutCopy: { flex: 1, minWidth: 0 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  cardCaption: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 5 },
  workoutButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});