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
import { AnimatedNumber, Card, Header, Metric, PremiumAccessStatusModal, PremiumOfferModal, Screen, SectionTitle, triggerHaptic } from '@/components/FitUI';

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

function CalorieRing({ progress, ink }: { progress: number; ink: string }) {
  const entrance = React.useRef(new Animated.Value(0)).current;

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
          borderColor: `${ink}22`,
          opacity: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
          transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
        },
      ]}
    >
      <View style={[styles.ringInner, { borderColor: ink }]}>
        <Text style={[styles.ringPercent, { color: ink }]}>{`${Math.round(Math.min(Math.max(progress, 0), 1) * 100)}%`}</Text>
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
  const heroInk = colors.heroInk;
  const heroMuted = colors.heroMuted;

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
        brandMark
        showText={false}
      />

      <View style={styles.homeContent}>
        <LinearGradient
          colors={[colors.heroBackgroundStart, colors.heroBackgroundEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: colors.heroBorder, shadowColor: colors.blue }]}
        >
          <View style={[styles.heroAccent, { backgroundColor: `${colors.heroAccent}18` }]} />
          <View style={styles.heroMetaRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={badgeText(badgeUi.title, language)}
              onPress={() => {
                triggerHaptic();
                router.push('/badges');
              }}
              style={({ pressed }) => [
                styles.heroBadgePill,
                {
                  backgroundColor: colors.heroBadgeBackground,
                  borderColor: colors.heroBadgeBorder,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <Ionicons name="badge-master" size={16} color={colors.heroBadgeForeground} />
              <View style={styles.heroBadgeCopy}>
                <Text numberOfLines={1} style={[styles.heroBadgeText, { color: colors.heroBadgeForeground }]}>{badgeText(badgeUi.title, language)}</Text>
                <Text numberOfLines={1} style={[styles.heroBadgeHint, { color: colors.heroBadgeForeground }]}>{t('badgesClickToView')}</Text>
              </View>
            </Pressable>
            <View style={[styles.heroStreakPill, { backgroundColor: colors.heroStreakBackground, borderColor: colors.heroStreakBorder }]}>
              <Ionicons name="flame" size={14} color={colors.heroStreakForeground} />
              <Text style={[styles.heroStreakValue, { color: colors.heroStreakForeground }]}>{streak}</Text>
              <Text style={[styles.heroStreakLabel, { color: colors.heroStreakForeground }]}>{t('streak')}</Text>
            </View>
          </View>
          <CalorieProgressFill progress={calorieProgress} color={heroInk} />

          <View style={styles.homeGreeting}>
            <View>
              <Text style={[styles.homeGreetingTitle, { color: heroInk }]}>
                {`${t('goodMorning')}, ${username ?? ''}`.trim()}
              </Text>
              <Text style={[styles.homeGreetingSubtitle, { color: heroMuted }]}>{t('ready')}</Text>
            </View>
            <View style={[styles.todayMark, { backgroundColor: `${colors.heroAccent}35` }]}>
              <Ionicons name="sunny-outline" size={18} color={heroInk} />
            </View>
          </View>

          <View style={styles.heroTop}>
            <View style={styles.heroLead}>
              <Text style={[styles.heroEyebrow, { color: heroInk }]}>{t('calories').toUpperCase()}</Text>
              <AnimatedNumber value={calories} style={[styles.heroNumber, { color: heroInk }]} />
              <Text style={[styles.heroMeta, { color: heroMuted }]}>
                / {calorieGoal?.toLocaleString() ?? '—'} {t('caloriesShort')}
              </Text>
            </View>
            <CalorieRing progress={calorieProgress} ink={heroInk} />
          </View>

          <View style={[styles.heroDivider, { backgroundColor: `${heroInk}20` }]} />
          <View style={styles.heroBottom}>
            <View>
              <Text style={[styles.heroSmallLabel, { color: heroMuted }]}>{t('remaining')}</Text>
              <Text style={[styles.heroSmallValue, { color: heroInk }]}>
                {calorieGoal ? `${Math.max(calorieGoal - calories, 0)} ${t('caloriesShort')}` : '—'}
              </Text>
            </View>
            <View style={styles.heroStatus}>
              <Ionicons name="information-circle-outline" size={15} color={heroInk} />
              <Text style={[styles.heroStatusText, { color: heroInk }]}>{t('noData')}</Text>
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
                backgroundColor: `${colors.heroActionBackground}EB`,
                borderColor: colors.heroActionBorder,
                opacity: pressed ? 0.72 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              },
            ]}
          >
            <View style={[styles.heroPhotoActionIcon, { backgroundColor: `${colors.heroActionIconBackground}33` }]}>
              <Ionicons name="camera-outline" size={17} color={colors.heroActionForeground} />
            </View>
            <Text style={[styles.heroPhotoActionText, { color: colors.heroActionForeground }]}>{t('analyzeMealPhoto')}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.heroActionForeground} />
          </Pressable>
        </LinearGradient>

        <View style={styles.metricRow}>
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
    borderRadius: 30,
    borderWidth: 1,
    padding: 22,
    overflow: 'hidden',
    marginBottom: 18,
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
  heroAccent: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 100,
    right: -78,
    top: -74,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  heroBadgePill: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.15,
  },
  heroBadgeCopy: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeHint: {
    flexShrink: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 8.5,
    opacity: 0.86,
  },
  heroStreakPill: {
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroStreakValue: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  heroStreakLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
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
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  ringInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.4 },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    marginBottom: 27,
  },
  metricGoal: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  workoutCard: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 86, paddingVertical: 16 },
  workoutIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  workoutCopy: { flex: 1, minWidth: 0 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  cardCaption: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 5 },
  workoutButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});