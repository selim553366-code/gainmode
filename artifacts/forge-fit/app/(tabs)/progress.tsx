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
import { ChartStrip, WeekReport } from '@/components/ProgressReport';

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
  const { language, weight, goalWeight, weightLogs, addWeight, profile, calorieGoal, meals, workouts, dumbbellWeightHistory, registeredAt, activityLog } = useFit();
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

  return <Screen sky>
     <Header eyebrow={t('weeklyAiEyebrow')} title={t('weeklyAiTitle')} subtitle={t('weeklyAiSubtitle')} action={weeklyAnalysisUnlocked ? 'analytics-outline' : 'badge-lock'} actionDisabled={!weeklyAnalysisUnlocked || launching} onAction={requestAnalysis} />
    <Animated.View style={{ opacity: launchProgress.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 0.94, 0.55] }), transform: [{ translateY: launchProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) }, { scale: launchProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) }] }}>
      <WeekReport
        language={language}
        summary={summary}
        weightLogs={weightLogs}
        startWeight={profile?.weight ?? weight ?? null}
        registeredAt={registeredAt}
        activityLog={activityLog}
        tracksWeight={tracksWeight}
        unlocked={weeklyAnalysisUnlocked}
        daysLeft={weeklyAnalysisDays}
        launching={launching}
        onRequest={requestAnalysis}
      />
    </Animated.View>

    <ChartStrip language={language} weightLogs={weightLogs} startWeight={profile?.weight ?? weight ?? null} registeredAt={registeredAt} activityLog={activityLog} meals={meals} calorieGoal={calorieGoal} />

     <TodayWeightBar language={language} tracksWeight={tracksWeight} onSave={addWeight} logs={weightLogs} fallbackWeight={weight} goalWeight={goalWeight} testID="progress-add-today-weight" />
  </Screen>;
}

const styles = StyleSheet.create({
  heroCard: { borderRadius: 34, padding: 22, overflow: 'hidden', marginBottom: 16 },
  heroOrb: { position: 'absolute', width: 230, height: 230, borderRadius: 115, right: -68, top: -82 },
  heroOrbSmall: { position: 'absolute', width: 110, height: 110, borderRadius: 55, left: -40, bottom: 40 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  heroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2 },
  weekPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 6 },
  weekPillText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  heroTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 30, lineHeight: 34, letterSpacing: -1.4, marginTop: 20 },
  heroSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18, marginTop: 6, maxWidth: '90%' },
  heroWeightRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22 },
  heroLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase' },
  heroWeight: { fontFamily: 'Inter_800ExtraBold', fontSize: 46, letterSpacing: -2.4, marginTop: 3 },
  heroOutcome: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  muscleFocus: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 92, marginTop: 22 },
  muscleFocusIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  muscleFocusText: { fontFamily: 'Inter_700Bold', fontSize: 18, lineHeight: 23, marginTop: 5, maxWidth: 220 },
  heroBadge: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  heroBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  analysisButton: { minHeight: 62, borderRadius: 31, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 10, paddingRight: 8, marginTop: 22 },
  analysisButtonIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  analysisButtonText: { flex: 1, fontFamily: 'Inter_800ExtraBold', fontSize: 14, letterSpacing: -0.2 },
});