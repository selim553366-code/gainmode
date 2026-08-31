import React from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@/components/AppIcon';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { getWeeklySummary, type WeightOutcome } from '@/lib/weeklyAnalysis';
import { AnimatedNumber, Card, Header, Screen } from '@/components/FitUI';

function formatChange(value: number | null) {
  if (value === null) return '—';
  if (Math.abs(value) < 0.05) return '0.0 kg';
  return `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(1)} kg`;
}

function outcomeCopy(outcome: WeightOutcome, t: (key: Parameters<typeof translate>[1]) => string) {
  if (outcome === 'lost') return t('weeklyWeightLost');
  if (outcome === 'gained') return t('weeklyWeightGained');
  if (outcome === 'steady') return t('weeklyWeightSteady');
  return t('weeklyWeightMissing');
}

function StatTile({ icon, value, label, color }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: React.ReactNode; label: string; color: string }) {
  const colors = useColors();
  return <View style={[styles.statTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}><Ionicons name={icon} size={17} color={color} /></View>
    <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
  </View>;
}

export default function ProgressScreen() {
  const colors = useColors();
  const { language, weight, weightLogs, addWeight, profile, calorieGoal, meals, workouts } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [draftWeight, setDraftWeight] = React.useState('');
  const [launching, setLaunching] = React.useState(false);
  const launchProgress = React.useRef(new Animated.Value(0)).current;
  const tracksWeight = Boolean(profile && profile.goal !== 'muscle');
  const summary = getWeeklySummary({ weight, weightLogs, meals, workouts, calorieGoal, goal: profile?.goal });
  const points = weightLogs.filter((item) => item.date >= summary.weekStart).slice(-7);
  const maxPoint = Math.max(...points.map((item) => item.value), summary.currentWeightKg ?? 0, 1);
  const minPoint = Math.min(...points.map((item) => item.value), summary.currentWeightKg ?? maxPoint, maxPoint);
  const pointRange = Math.max(maxPoint - minPoint, 1);

  const saveWeight = () => {
    const value = Number(draftWeight.replace(',', '.'));
    if (value > 0) {
      addWeight(value);
      setDraftWeight('');
    }
  };

  const requestAnalysis = () => {
    if (launching) return;
    setLaunching(true);
    Animated.timing(launchProgress, { toValue: 1, duration: 850, useNativeDriver: true }).start(({ finished }) => {
      if (finished) {
        router.push({ pathname: '/(tabs)/coach', params: { weeklyAnalysis: '1', analysisId: String(Date.now()) } });
      }
    });
  };

  return <Screen>
    <Header eyebrow={t('weeklyAiEyebrow')} title={t('weeklyAiTitle')} subtitle={t('weeklyAiSubtitle')} action="sparkles-outline" onAction={requestAnalysis} />
    <Animated.View style={{ opacity: launchProgress.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 0.94, 0.55] }), transform: [{ translateY: launchProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) }, { scale: launchProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) }] }}>
      <LinearGradient colors={[colors.primary, colors.blue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
        <View pointerEvents="none" style={[styles.heroOrb, { backgroundColor: `${colors.primaryForeground}18` }]} />
        <View pointerEvents="none" style={[styles.heroOrbSmall, { backgroundColor: `${colors.primaryForeground}10` }]} />
        <View style={styles.heroHeader}>
          <View style={styles.heroEyebrowRow}><View style={[styles.liveDot, { backgroundColor: colors.success }]} /><Text style={[styles.heroEyebrow, { color: `${colors.primaryForeground}B8` }]}>{t('weeklyAiLive')}</Text></View>
          <View style={[styles.weekPill, { backgroundColor: `${colors.primaryForeground}18`, borderColor: `${colors.primaryForeground}26` }]}><Ionicons name="sparkles-outline" size={13} color={colors.primaryForeground} /><Text style={[styles.weekPillText, { color: colors.primaryForeground }]}>{t('weeklyAiLastSeven')}</Text></View>
        </View>
        <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>{t('weeklyAiCardTitle')}</Text>
        <Text style={[styles.heroSubtitle, { color: `${colors.primaryForeground}B8` }]}>{t('weeklyAiCardSubtitle')}</Text>
        {tracksWeight ? <View style={styles.heroWeightRow}>
          <View style={{ flex: 1 }}><Text style={[styles.heroLabel, { color: `${colors.primaryForeground}A8` }]}>{t('weeklyWeightChange')}</Text><Text style={[styles.heroWeight, { color: colors.primaryForeground }]}>{formatChange(summary.weightChangeKg)}</Text><Text style={[styles.heroOutcome, { color: colors.primaryForeground }]}>{outcomeCopy(summary.weightOutcome, t)}</Text></View>
          <View style={[styles.heroBadge, { backgroundColor: `${colors.primaryForeground}18`, borderColor: `${colors.primaryForeground}2C` }]}><Ionicons name={summary.weightOutcome === 'gained' ? 'trending-up-outline' : summary.weightOutcome === 'lost' ? 'trending-down' : 'analytics-outline'} size={28} color={colors.primaryForeground} /><Text style={[styles.heroBadgeText, { color: `${colors.primaryForeground}C2` }]}>{summary.currentWeightKg ? `${summary.currentWeightKg.toFixed(1)} kg` : '—'}</Text></View>
        </View> : <View style={styles.muscleFocus}><View style={[styles.muscleFocusIcon, { backgroundColor: `${colors.primaryForeground}18` }]}><Ionicons name="barbell-outline" size={26} color={colors.primaryForeground} /></View><View style={{ flex: 1 }}><Text style={[styles.heroLabel, { color: `${colors.primaryForeground}A8` }]}>{t('weeklyMuscleFocus')}</Text><Text style={[styles.muscleFocusText, { color: colors.primaryForeground }]}>{t('weeklyMuscleSubtitle')}</Text></View></View>}
        <Pressable testID="get-weekly-ai-analysis" accessibilityRole="button" accessibilityLabel={t('weeklyAnalysisCta')} onPress={requestAnalysis} style={({ pressed }) => [styles.analysisButton, { backgroundColor: colors.primaryForeground, opacity: pressed || launching ? 0.8 : 1 }]}>
          <View style={[styles.analysisButtonIcon, { backgroundColor: `${colors.primary}24` }]}><Ionicons name={launching ? 'arrow-up' : 'sparkles-outline'} size={17} color={colors.primary} /></View>
          <Text style={[styles.analysisButtonText, { color: colors.primary }]}>{launching ? t('weeklyAnalysisSending') : t('weeklyAnalysisCta')}</Text>
          {!launching ? <Ionicons name="arrow-forward" size={17} color={colors.primary} /> : <Ionicons name="ellipsis-horizontal" size={17} color={colors.primary} />}
        </Pressable>
      </LinearGradient>
    </Animated.View>

    <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('weeklyStatsTitle')}</Text><Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>{t('weeklyStatsSubtitle')}</Text></View>
    <View style={styles.statsGrid}>
      <StatTile icon="activity" value={<><AnimatedNumber value={summary.workoutMinutes} /> <Text style={styles.inlineUnit}>{t('minutesShort')}</Text></>} label={t('weeklyWorkoutMinutes')} color={colors.orange} />
      <StatTile icon="barbell-outline" value={<AnimatedNumber value={summary.totalSets} />} label={t('weeklyTotalSets')} color={colors.primary} />
      <StatTile icon="activity" value={<AnimatedNumber value={summary.totalExercises} />} label={t('weeklyTotalExercises')} color={colors.blue} />
      <StatTile icon="flame-outline" value={summary.calorieConsistency === null ? '—' : `${summary.calorieConsistency}%`} label={t('weeklyCalorieConsistency')} color={colors.success} />
    </View>

    <Card style={styles.consistencyCard}>
      <View style={styles.consistencyHeader}><View style={[styles.consistencyIcon, { backgroundColor: `${colors.success}18` }]}><Ionicons name="checkmark-circle-outline" size={19} color={colors.success} /></View><View style={{ flex: 1 }}><Text style={[styles.consistencyTitle, { color: colors.foreground }]}>{t('weeklyCalorieTitle')}</Text><Text style={[styles.consistencySubtitle, { color: colors.mutedForeground }]}>{summary.trackedCalorieDays > 0 ? `${summary.onTargetCalorieDays}/${summary.trackedCalorieDays} ${t('weeklyCalorieDays')}` : t('weeklyCalorieNoData')}</Text></View><Text style={[styles.consistencyValue, { color: colors.success }]}>{summary.calorieConsistency === null ? '—' : `${summary.calorieConsistency}%`}</Text></View>
      <View style={[styles.track, { backgroundColor: colors.secondary }]}><View style={[styles.fill, { width: `${summary.calorieConsistency ?? 0}%`, backgroundColor: colors.success }]} /></View>
    </Card>

    {tracksWeight ? <Card style={styles.chartCard}>
      <View style={styles.chartHeader}><View><Text style={[styles.chartEyebrow, { color: colors.mutedForeground }]}>{t('weeklyWeightChart')}</Text><Text style={[styles.chartWeight, { color: colors.foreground }]}>{summary.currentWeightKg ? `${summary.currentWeightKg.toFixed(1)} kg` : '—'}</Text></View><View style={[styles.changePill, { backgroundColor: `${colors.primary}14` }]}><Ionicons name="analytics-outline" size={14} color={colors.primary} /><Text style={[styles.changePillText, { color: colors.primary }]}>{formatChange(summary.weightChangeKg)}</Text></View></View>
      <View style={styles.chart}>{points.length > 0 ? points.map((point) => <View key={point.id} style={styles.chartColumn}><View style={[styles.bar, { height: 20 + ((point.value - minPoint) / pointRange) * 78, backgroundColor: point.id === points.at(-1)?.id ? colors.primary : `${colors.primary}42` }]} /></View>) : <Text style={[styles.chartEmpty, { color: colors.mutedForeground }]}>{t('weeklyWeightNoData')}</Text>}</View>
    </Card> : null}

    {tracksWeight ? <><View style={styles.logHeader}><Text style={[styles.logTitle, { color: colors.foreground }]}>{t('weeklyAddWeight')}</Text><Text style={[styles.logHint, { color: colors.mutedForeground }]}>{t('weeklyWeightLogHint')}</Text></View>
    <Card style={styles.addCard}><TextInput value={draftWeight} onChangeText={setDraftWeight} keyboardType="decimal-pad" placeholder={t('currentWeight')} placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} /><Pressable accessibilityLabel={t('add')} onPress={saveWeight} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.primary, opacity: pressed ? 0.72 : 1 }]}><Ionicons name="add" size={19} color={colors.primaryForeground} /></Pressable></Card></> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  heroCard: { borderRadius: 28, padding: 20, overflow: 'hidden', marginBottom: 24 },
  heroOrb: { position: 'absolute', width: 230, height: 230, borderRadius: 115, right: -68, top: -82 },
  heroOrbSmall: { position: 'absolute', width: 110, height: 110, borderRadius: 55, left: -40, bottom: 40 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  heroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2 },
  weekPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 6 },
  weekPillText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.7, marginTop: 22 },
  heroSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 5, maxWidth: '86%' },
  heroWeightRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22 },
  heroLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase' },
  heroWeight: { fontFamily: 'Inter_700Bold', fontSize: 39, letterSpacing: -1.8, marginTop: 3 },
  heroOutcome: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  muscleFocus: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 92, marginTop: 22 },
  muscleFocusIcon: { width: 62, height: 62, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  muscleFocusText: { fontFamily: 'Inter_700Bold', fontSize: 18, lineHeight: 23, marginTop: 5, maxWidth: 220 },
  heroBadge: { width: 82, height: 82, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  heroBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  analysisButton: { minHeight: 51, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, marginTop: 22 },
  analysisButtonIcon: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  analysisButtonText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 12 },
  sectionHeading: { marginBottom: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.3 },
  sectionCaption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 16 },
  statTile: { width: '48.5%', minHeight: 113, borderRadius: 20, borderWidth: 1, padding: 13 },
  statIcon: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 22, marginTop: 12 },
  statLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 4 },
  inlineUnit: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  consistencyCard: { padding: 16, marginBottom: 16 },
  consistencyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  consistencyIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  consistencyTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  consistencySubtitle: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  consistencyValue: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  track: { height: 8, borderRadius: 5, overflow: 'hidden', marginTop: 15 },
  fill: { height: '100%', borderRadius: 5 },
  chartCard: { padding: 18, marginBottom: 16 },
  chartHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  chartEyebrow: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  chartWeight: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -1, marginTop: 4 },
  changePill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 6 },
  changePillText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  chart: { height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', marginTop: 16 },
  chartColumn: { height: 106, width: 20, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: 13, borderRadius: 7 },
  chartEmpty: { fontFamily: 'Inter_400Regular', fontSize: 11, marginBottom: 45 },
  logHeader: { marginBottom: 9 },
  logTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  logHint: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  addCard: { padding: 10, flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, height: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontFamily: 'Inter_400Regular', fontSize: 12 },
  addButton: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});