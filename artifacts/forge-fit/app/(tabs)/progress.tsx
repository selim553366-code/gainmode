import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { PressableScale as Pressable } from '@/components/Motion';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@/components/AppIcon';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { getWeeklySummary, type WeightOutcome } from '@/lib/weeklyAnalysis';
import { daysUntilWeeklyAnalysis, isWeeklyAnalysisUnlocked } from '@/lib/weeklyEligibility';
import { Header, Screen } from '@/components/FitUI';
import { TodayWeightBar } from '@/components/TodayWeightBar';
import { ProgressChartsButton } from '@/components/ProgressChartsSection';

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

export default function ProgressScreen() {
  const colors = useColors();
  const { language, weight, weightLogs, addWeight, profile, calorieGoal, meals, workouts, dumbbellWeightHistory, registeredAt } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [launching, setLaunching] = React.useState(false);
  const launchProgress = React.useRef(new Animated.Value(0)).current;
  const tracksWeight = Boolean(profile && profile.goal !== 'muscle');
  const weeklyAnalysisUnlocked = isWeeklyAnalysisUnlocked(registeredAt);
  const weeklyAnalysisDays = daysUntilWeeklyAnalysis(registeredAt);
  const summary = getWeeklySummary({ weight, weightLogs, meals, workouts, calorieGoal, goal: profile?.goal, profile: profile ?? undefined, dumbbellWeightHistory });

  const requestAnalysis = () => {
    if (launching || !weeklyAnalysisUnlocked) return;
    setLaunching(true);
    Animated.timing(launchProgress, { toValue: 1, duration: 850, useNativeDriver: true }).start(({ finished }) => {
      if (finished) {
        router.push({ pathname: '/(tabs)/coach', params: { weeklyAnalysis: '1', analysisId: String(Date.now()) } });
      }
    });
  };

  return <Screen>
     <Header eyebrow={t('weeklyAiEyebrow')} title={t('weeklyAiTitle')} subtitle={t('weeklyAiSubtitle')} action={weeklyAnalysisUnlocked ? 'analytics-outline' : 'badge-lock'} actionDisabled={!weeklyAnalysisUnlocked || launching} onAction={requestAnalysis} />
    <Animated.View style={{ opacity: launchProgress.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 0.94, 0.55] }), transform: [{ translateY: launchProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) }, { scale: launchProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) }] }}>
      <LinearGradient colors={[colors.inkCardStart, colors.inkCardEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
        <View pointerEvents="none" style={[styles.heroOrb, { backgroundColor: `${colors.inkCardForeground}18` }]} />
        <View pointerEvents="none" style={[styles.heroOrbSmall, { backgroundColor: `${colors.inkCardForeground}10` }]} />
        <View style={styles.heroHeader}>
          <View style={styles.heroEyebrowRow}><View style={[styles.liveDot, { backgroundColor: colors.success }]} /><Text style={[styles.heroEyebrow, { color: `${colors.inkCardForeground}B8` }]}>{t('weeklyAiLive')}</Text></View>
           <View style={[styles.weekPill, { backgroundColor: `${colors.inkCardForeground}18`, borderColor: `${colors.inkCardForeground}26` }]}><Ionicons name="analytics-outline" size={13} color={colors.inkCardForeground} /><Text style={[styles.weekPillText, { color: colors.inkCardForeground }]}>{t('weeklyAiLastSeven')}</Text></View>
        </View>
        <Text style={[styles.heroTitle, { color: colors.inkCardForeground }]}>{t('weeklyAiCardTitle')}</Text>
        <Text style={[styles.heroSubtitle, { color: `${colors.inkCardForeground}B8` }]}>{t('weeklyAiCardSubtitle')}</Text>
        {tracksWeight ? <View style={styles.heroWeightRow}>
          <View style={{ flex: 1 }}><Text style={[styles.heroLabel, { color: `${colors.inkCardForeground}A8` }]}>{t('weeklyWeightChange')}</Text><Text style={[styles.heroWeight, { color: colors.inkCardForeground }]}>{formatChange(summary.weightChangeKg)}</Text><Text style={[styles.heroOutcome, { color: colors.inkCardForeground }]}>{outcomeCopy(summary.weightOutcome, t)}</Text></View>
          <View style={[styles.heroBadge, { backgroundColor: `${colors.inkCardForeground}18`, borderColor: `${colors.inkCardForeground}2C` }]}><Ionicons name={summary.weightOutcome === 'gained' ? 'trending-up-outline' : summary.weightOutcome === 'lost' ? 'trending-down' : 'analytics-outline'} size={28} color={colors.inkCardForeground} /><Text style={[styles.heroBadgeText, { color: `${colors.inkCardForeground}C2` }]}>{summary.currentWeightKg ? `${summary.currentWeightKg.toFixed(1)} kg` : '—'}</Text></View>
        </View> : <View style={styles.muscleFocus}><View style={[styles.muscleFocusIcon, { backgroundColor: `${colors.inkCardForeground}18` }]}><Ionicons name="barbell-outline" size={26} color={colors.inkCardForeground} /></View><View style={{ flex: 1 }}><Text style={[styles.heroLabel, { color: `${colors.inkCardForeground}A8` }]}>{t('weeklyMuscleFocus')}</Text><Text style={[styles.muscleFocusText, { color: colors.inkCardForeground }]}>{t('weeklyMuscleSubtitle')}</Text></View></View>}
        <Pressable testID="get-weekly-ai-analysis" accessibilityRole="button" accessibilityState={{ disabled: !weeklyAnalysisUnlocked || launching }} accessibilityLabel={t('weeklyAnalysisCta')} disabled={!weeklyAnalysisUnlocked || launching} onPress={requestAnalysis} style={({ pressed }) => [styles.analysisButton, { backgroundColor: colors.inkCardForeground, opacity: !weeklyAnalysisUnlocked ? 0.62 : pressed || launching ? 0.8 : 1 }]}>
           <View style={[styles.analysisButtonIcon, { backgroundColor: `${colors.inkCardStart}14` }]}><Ionicons name={launching ? 'arrow-up' : weeklyAnalysisUnlocked ? 'trending-up-outline' : 'badge-lock'} size={17} color={colors.inkCardStart} /></View>
          <Text style={[styles.analysisButtonText, { color: colors.inkCardStart }]}>{launching ? t('weeklyAnalysisSending') : weeklyAnalysisUnlocked ? t('weeklyAnalysisCta') : t('weeklyAnalysisUnlockIn').replace('{days}', String(weeklyAnalysisDays))}</Text>
          {!launching ? <Ionicons name={weeklyAnalysisUnlocked ? 'arrow-forward' : 'badge-lock'} size={17} color={colors.inkCardStart} /> : <Ionicons name="ellipsis-horizontal" size={17} color={colors.inkCardStart} />}
        </Pressable>
      </LinearGradient>
    </Animated.View>

    <ProgressChartsButton />

     <TodayWeightBar language={language} tracksWeight={tracksWeight} onSave={addWeight} testID="progress-add-today-weight" />
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
  muscleFocusIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  muscleFocusText: { fontFamily: 'Inter_700Bold', fontSize: 18, lineHeight: 23, marginTop: 5, maxWidth: 220 },
  heroBadge: { width: 82, height: 82, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  heroBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  analysisButton: { minHeight: 51, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, marginTop: 22 },
  analysisButtonIcon: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  analysisButtonText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 12 },
});