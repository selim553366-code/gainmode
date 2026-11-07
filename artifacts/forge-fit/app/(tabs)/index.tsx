import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { PressableScale as Pressable } from '@/components/Motion';
import { Ionicons } from '@/components/AppIcon';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { getMealsForRange } from '@/lib/nutritionDates';
import { getCurrentStreak } from '@/lib/streak';
import { getWorkoutForDate } from '@/lib/workoutPlan';
import { badges, badgeText, badgeUi } from '@/lib/badges';
import { BadgeMedal } from '@/components/BadgeMedal';
import { AnimatedNumber, GainModeWordmark, Screen, triggerHaptic } from '@/components/FitUI';
import { CalorieArc, MacroCard, TodaySessionCard } from '@/components/HomeToday';

const HERO_DEEP = '#123A8F';

/** The medal drifts up and down a few pixels and sways, so the page feels alive without drawing the eye. */
function FloatingMedal({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const drift = useSharedValue(0);
  React.useEffect(() => {
    if (reduced) return;
    drift.set(withRepeat(withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [drift, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -4 + drift.get() * 8 }, { rotate: `${-9 + drift.get() * 4}deg` }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
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
    unlockedBadgeIds,
  } = useFit();
  const latestBadge = badges.find((badge) => badge.id === unlockedBadgeIds.at(-1)) ?? badges[0];
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const todayMeals = getMealsForRange(meals, 'daily');
  const calories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const streak = getCurrentStreak(streakDates);
  const todayWorkout = getWorkoutForDate(workouts);
  const macros = todayMeals.reduce(
    (totals, meal) => ({ protein: totals.protein + meal.protein, carbs: totals.carbs + meal.carbs, fat: totals.fat + meal.fat }),
    { protein: 0, carbs: 0, fat: 0 },
  );
  const calorieProgress = calorieGoal ? calories / calorieGoal : 0;
  const initial = (username?.trim()?.slice(0, 1) || '•').toLocaleUpperCase(language);

  return (
    <Screen sky bottomPadding={120}>
      <View style={styles.topRow}>
        <View accessibilityLabel="GainMode"><GainModeWordmark color={colors.foreground} width={150} height={22} /></View>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${streak} ${t('streak')}`}
            onPress={() => { triggerHaptic(); router.push('/streak'); }}
            style={[styles.streakChip, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="flame" size={16} color={colors.orange} />
            <Text style={[styles.streakValue, { color: colors.foreground }]}>{streak}</Text>
          </Pressable>
          <Pressable
            testID="header-action"
            accessibilityRole="button"
            onPress={() => { triggerHaptic(); router.push('/settings'); }}
            style={[styles.avatar, { backgroundColor: colors.foreground }]}
          >
            <Text style={[styles.avatarText, { color: colors.background }]}>{initial}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.greeting}>
        <View style={styles.greetingCopy}>
          <Text style={[styles.greetingTitle, { color: colors.foreground }]}>{`${t('goodMorning')},`}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.greetingName, { color: colors.accent }]}>{username ?? ''}</Text>
          <Text style={[styles.greetingSub, { color: colors.mutedForeground }]}>{t('ready')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={badgeText(badgeUi.title, language)}
          onPress={() => { triggerHaptic(); router.push('/badges'); }}
          scaleTo={0.94}
          style={styles.medalWrap}
        >
          <View pointerEvents="none" style={styles.medalShadow}>
            <Svg width={104} height={30}>
              <Defs><RadialGradient id="medalShadow" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#0B2A66" stopOpacity={0.34} /><Stop offset="1" stopColor="#0B2A66" stopOpacity={0} /></RadialGradient></Defs>
              <Ellipse cx={52} cy={15} rx={50} ry={12} fill="url(#medalShadow)" />
            </Svg>
          </View>
          <View style={styles.medalDisc}>
            <FloatingMedal><BadgeMedal badge={latestBadge} size={92} locked={!unlockedBadgeIds.length} /></FloatingMedal>
          </View>
          <View style={[styles.medalCount, { backgroundColor: colors.foreground }]}>
            <Text style={[styles.medalCountText, { color: colors.background }]}>{unlockedBadgeIds.length} / {badges.length}</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.content}>
        <LinearGradient colors={[colors.accent, HERO_DEEP]} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={[styles.hero, { shadowColor: HERO_DEEP }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroLead}>
              <Text style={styles.heroEyebrow}>{t('calories').toUpperCase()}</Text>
              <AnimatedNumber value={calories} style={styles.heroNumber} />
              <Text style={styles.heroMeta}>/ {calorieGoal?.toLocaleString() ?? '—'} {t('caloriesShort')}</Text>
            </View>
            <CalorieArc progress={calorieProgress} color="#FFFFFF" track="rgba(255,255,255,0.22)" textColor="#FFFFFF" />
          </View>
          <View style={styles.heroBottom}>
            <View>
              <Text style={styles.heroSmallLabel}>{t('remaining')}</Text>
              <Text style={styles.heroSmallValue}>{calorieGoal ? `${Math.max(calorieGoal - calories, 0)} ${t('caloriesShort')}` : '—'}</Text>
            </View>
          </View>
          <Pressable
            testID="analyze-meal-photo"
            accessibilityRole="button"
            accessibilityLabel={t('analyzeMealPhoto')}
            onPress={() => router.push({ pathname: '/(tabs)/nutrition', params: { openCamera: 'meal' } })}
            scaleTo={0.98}
            style={styles.heroAction}
          >
            <View style={styles.heroActionCamera}><Ionicons name="camera-outline" size={20} color={colors.accent} /></View>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.heroActionText, { color: HERO_DEEP }]}>{t('analyzeMealPhoto')}</Text>
            <View style={[styles.heroActionArrow, { backgroundColor: colors.accent }]}><Ionicons name="arrow-forward" size={18} color="#FFFFFF" /></View>
          </Pressable>
        </LinearGradient>

        <View style={styles.macroRow}>
          <MacroCard label={t('protein')} value={macros.protein} goal={proteinGoal} color={colors.blue} />
          <MacroCard label={t('carbs')} value={macros.carbs} goal={carbsGoal} color={colors.orange} />
          <MacroCard label={t('fat')} value={macros.fat} goal={fatGoal} color={colors.plum} />
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('todayWorkout')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/plan')} hitSlop={10}><Text style={[styles.sectionAction, { color: colors.accent }]}>{t('viewAll')}</Text></Pressable>
        </View>
        <TodaySessionCard
          workout={todayWorkout}
          language={language}
          onOpen={() => (todayWorkout
            ? router.push({ pathname: '/(tabs)/plan', params: { day: todayWorkout.day } })
            : router.push('/(tabs)/plan'))}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakChip: { height: 42, borderRadius: 21, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 16, letterSpacing: -0.3 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Inter_800ExtraBold', fontSize: 16 },
  greeting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 20 },
  greetingCopy: { flex: 1, minWidth: 0, paddingRight: 8 },
  greetingTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 34, lineHeight: 38, letterSpacing: -1.5 },
  greetingName: { fontFamily: 'Inter_800ExtraBold', fontSize: 34, lineHeight: 40, letterSpacing: -1.5 },
  greetingSub: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 6 },
  medalWrap: { width: 106, height: 116, alignItems: 'center' },
  medalShadow: { position: 'absolute', bottom: 6 },
  medalDisc: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  medalCount: { position: 'absolute', bottom: 0, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4 },
  medalCountText: { fontFamily: 'Inter_800ExtraBold', fontSize: 11.5, letterSpacing: 0.2 },
  content: { paddingTop: 4 },
  hero: { borderRadius: 34, padding: 22, marginBottom: 14, shadowOpacity: 0.28, shadowRadius: 26, shadowOffset: { width: 0, height: 16 }, elevation: 8 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLead: { flex: 1, minWidth: 0 },
  heroEyebrow: { color: 'rgba(255,255,255,0.72)', fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.6 },
  heroNumber: { color: '#FFFFFF', fontFamily: 'Inter_800ExtraBold', fontSize: 58, letterSpacing: -3, marginTop: 4, fontVariant: ['tabular-nums'] },
  heroMeta: { color: 'rgba(255,255,255,0.78)', fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: -2 },
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  heroSmallLabel: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_500Medium', fontSize: 12 },
  heroSmallValue: { color: '#FFFFFF', fontFamily: 'Inter_800ExtraBold', fontSize: 20, letterSpacing: -0.6, marginTop: 2 },
  heroAction: { marginTop: 18, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 20, paddingRight: 7 },
  heroActionCamera: { marginRight: 2 },
  heroActionText: { flex: 1, fontFamily: 'Inter_800ExtraBold', fontSize: 14.5, letterSpacing: -0.4 },
  heroActionArrow: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  macroRow: { flexDirection: 'row', gap: 10, marginBottom: 26 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 22, letterSpacing: -0.8 },
  sectionAction: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});
