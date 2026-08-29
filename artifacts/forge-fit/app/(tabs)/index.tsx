import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { ActionTile, Card, Header, Metric, Pill, ProgressBar, Screen, SectionTitle } from '@/components/FitUI';

export default function TodayScreen() {
  const colors = useColors();
  const { language, calories, water, workoutComplete, addWater, toggleWorkout, addMeal } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const calorieGoal = 2050;
  const calorieRatio = calories / calorieGoal;
  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);

  const handleWater = () => {
    haptic();
    addWater();
    Alert.alert(t('water'), t('waterAdded'));
  };

  const handleWorkout = () => {
    haptic();
    toggleWorkout();
    Alert.alert(t('todayWorkout'), workoutComplete ? t('startWorkout') : t('workoutDone'));
  };

  return (
    <Screen>
      <Header
        eyebrow="Forge Fit / 29 Ağustos"
        title={`${t('goodMorning')}, Selim`}
        subtitle={t('ready')}
        action="notifications-outline"
        onAction={() => Alert.alert(t('notifications'), t('online'))}
      />

      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <View style={styles.heroGlow} />
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroEyebrow, { color: colors.primaryForeground }]}>{t('calories').toUpperCase()}</Text>
            <Text style={[styles.heroNumber, { color: colors.primaryForeground }]}>{calories.toLocaleString()}</Text>
            <Text style={[styles.heroMeta, { color: `${colors.primaryForeground}A8` }]}>/ {calorieGoal.toLocaleString()} {t('caloriesShort')}</Text>
          </View>
          <View style={[styles.ring, { borderColor: `${colors.primaryForeground}33` }]}>
            <View style={[styles.ringInner, { borderColor: colors.primaryForeground }]}>
              <Text style={[styles.ringPercent, { color: colors.primaryForeground }]}>{Math.round(calorieRatio * 100)}%</Text>
            </View>
          </View>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroBottom}>
          <View><Text style={[styles.heroSmallLabel, { color: `${colors.primaryForeground}A8` }]}>{t('remaining')}</Text><Text style={[styles.heroSmallValue, { color: colors.primaryForeground }]}>{Math.max(calorieGoal - calories, 0)} {t('caloriesShort')}</Text></View>
          <View style={styles.heroStatus}><Ionicons name="trending-down" size={15} color={colors.primaryForeground} /><Text style={[styles.heroStatusText, { color: colors.primaryForeground }]}>-8% {t('calories').toLowerCase()}</Text></View>
        </View>
      </View>

      <View style={styles.metricRow}>
        <Metric icon="flame-outline" value="128 g" label={t('protein')} color={colors.blue} />
        <Metric icon="flash-outline" value="146 g" label={t('carbs')} color={colors.orange} />
        <Metric icon="water-outline" value="42 g" label={t('fat')} color={colors.plum} />
      </View>

      <Card>
        <View style={styles.cardHeading}><View><Text style={[styles.cardTitle, { color: colors.foreground }]}>{t('water')}</Text><Text style={[styles.cardCaption, { color: colors.mutedForeground }]}>{water} / 8 {t('glasses')}</Text></View><Pressable testID="add-water" onPress={handleWater} style={({ pressed }) => [styles.addCircle, { backgroundColor: colors.primary, opacity: pressed ? 0.65 : 1 }]}><Ionicons name="add" color={colors.primaryForeground} size={20} /></Pressable></View>
        <View style={styles.waterRow}>{Array.from({ length: 8 }).map((_, index) => <View key={index} style={[styles.waterDot, { backgroundColor: index < water ? colors.blue : colors.secondary, borderColor: index < water ? colors.blue : colors.border }]}><Ionicons name="water" size={14} color={index < water ? colors.background : colors.mutedForeground} /></View>)}</View>
      </Card>

      <SectionTitle title={t('todayWorkout')} action={t('viewAll')} onAction={() => Alert.alert(t('plan'), t('planSubtitle'))} />
      <Card style={styles.workoutCard}>
        <View style={[styles.workoutIcon, { backgroundColor: `${colors.orange}22` }]}><Ionicons name="barbell-outline" size={22} color={colors.orange} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Upper body focus</Text><Text style={[styles.cardCaption, { color: colors.mutedForeground }]}>45 dk  •  6 {t('exercises')}</Text></View>
        <Pressable testID="toggle-workout" onPress={handleWorkout} style={({ pressed }) => [styles.workoutButton, { backgroundColor: workoutComplete ? colors.success : colors.primary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name={workoutComplete ? 'checkmark' : 'arrow-forward'} size={18} color={colors.primaryForeground} /></Pressable>
      </Card>

      <SectionTitle title={t('quickActions')} />
      <View style={styles.actionGrid}>
        <ActionTile icon="restaurant-outline" title={t('logMeal')} subtitle="+ 420 kcal" color={colors.success} onPress={() => { haptic(); addMeal('dinner'); Alert.alert(t('logMeal'), t('mealAdded')); }} />
        <ActionTile icon="scan-outline" title={t('scanMeal')} subtitle={t('premium')} color={colors.plum} onPress={() => Alert.alert(t('scanMeal'), t('photoComing'))} />
        <ActionTile icon="scale-outline" title={t('weight')} subtitle="68.4 kg" color={colors.blue} onPress={() => Alert.alert(t('weight'), t('progressSubtitle'))} />
        <ActionTile icon="flame-outline" title={'7 ' + t('streak')} subtitle={t('completed')} color={colors.orange} />
      </View>

      <View style={[styles.premiumCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.premiumMark}><Ionicons name="sparkles" size={16} color={colors.primaryForeground} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.premiumLabel, { color: colors.primary }]}>{t('premium')}</Text><Text style={[styles.premiumTitle, { color: colors.foreground }]}>{t('unlock')}</Text><Text style={[styles.premiumDesc, { color: colors.mutedForeground }]}>{t('premiumDesc')}</Text></View>
        <Ionicons name="chevron-forward" size={19} color={colors.mutedForeground} />
      </View>

      <View style={[styles.streakBanner, { backgroundColor: colors.secondary }]}>
        <View style={styles.streakIcon}><Ionicons name="flame" size={18} color={colors.orange} /></View>
        <Text style={[styles.streakText, { color: colors.foreground }]}><Text style={{ fontFamily: 'Inter_700Bold' }}>7 {t('streak')}</Text> — bu ritmi bozma.</Text>
        <Pill label="7/14" active />
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
  heroDivider: { height: 1, backgroundColor: '#0B0D0C26', marginVertical: 18 },
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroSmallLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  heroSmallValue: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 3 },
  heroStatus: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  heroStatusText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  cardCaption: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 5 },
  addCircle: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  waterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  waterDot: { width: 30, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  workoutCard: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  workoutIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  workoutButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  premiumCard: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderRadius: 22, padding: 16, marginTop: 8 },
  premiumMark: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D7F34A' },
  premiumLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2, marginBottom: 4 },
  premiumTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  premiumDesc: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  streakBanner: { borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, marginBottom: 10 },
  streakIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2A65A22' },
  streakText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12 },
});