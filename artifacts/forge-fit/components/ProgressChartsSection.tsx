import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFit } from '@/context/FitContext';
import { useColors } from '@/hooks/useColors';
import { translate, type TranslationKey } from '@/lib/i18n';
import { bodyWeightSeries, calorieAdherence, dailyActivity, liftedWeightSeries } from '@/lib/progressCharts';
import { AdherenceGrid, BarsChart, ChartCard, EmptyChart, RateRing, TrendChart } from '@/components/ProgressCharts';
import { SegmentedControl } from '@/components/SettingsControls';

type Range = '7' | '30';

const formatKg = (value: number) => `${Math.round(value * 10) / 10}`;

/**
 * Progress over time: body weight and lifted weight since the start, then training time,
 * calorie adherence and calories burned for the chosen window. Every chart reads real logs.
 */
export function ProgressChartsSection() {
  const colors = useColors();
  const { language, profile, weight, weightLogs, registeredAt, dumbbellWeightHistory, activityLog, meals, calorieGoal, achievementStats } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const [range, setRange] = React.useState<Range>('7');
  const days = Number(range);

  const tracksWeight = Boolean(profile && profile.goal !== 'muscle');
  const usesWeights = Boolean(profile && profile.equipment !== 'bodyweight');
  const body = bodyWeightSeries({ startWeight: profile?.weight ?? weight, registeredAt, weightLogs });
  const lifted = liftedWeightSeries({ history: dumbbellWeightHistory, startWeightKg: profile?.dumbbellWeightKg, registeredAt });
  const activity = dailyActivity(activityLog, days);
  const adherence = calorieAdherence(meals, calorieGoal, days);

  const periodMinutes = activity.reduce((sum, day) => sum + day.minutes, 0);
  const allTimeMinutes = Math.max(achievementStats.minutes, Math.round(activityLog.reduce((sum, entry) => sum + entry.minutes, 0)));
  const trainingDays = activity.filter((day) => day.calories > 0);
  const averageBurn = trainingDays.length ? Math.round(trainingDays.reduce((sum, day) => sum + day.calories, 0) / trainingDays.length) : 0;
  const periodBurn = activity.reduce((sum, day) => sum + day.calories, 0);
  const duration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const rest = Math.round(minutes % 60);
    return hours ? `${hours} ${t('hoursShort')} ${rest} ${t('minutesShort')}` : `${rest} ${t('minutesShort')}`;
  };

  // Losing is progress for cutting goals; gaining is progress for building goals.
  const wantsLoss = profile?.goal === 'weightLoss' || profile?.goal === 'fatLoss';
  const change = body.change ?? 0;
  const bodyCaption = body.points.length < 2
    ? undefined
    : Math.abs(change) < 0.05
      ? t('chartBodyWeightSame')
      : t(change < 0 ? 'chartBodyWeightLost' : 'chartBodyWeightGained').replace('{value}', formatKg(Math.abs(change)));
  const bodyDelta = body.points.length > 1 && Math.abs(change) >= 0.05 ? `${change > 0 ? '+' : '−'}${formatKg(Math.abs(change))} kg` : null;
  const bodyGood = profile?.goal === 'maintain' ? Math.abs(change) < 1 : wantsLoss ? change < 0 : change > 0;

  return <View style={styles.section}>
    <View style={styles.heading}>
      <Text style={[styles.title, { color: colors.foreground }]}>{t('chartsTitle')}</Text>
      <Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('chartsSubtitle')}</Text>
    </View>

    {tracksWeight ? <ChartCard
      testID="chart-body-weight"
      icon="scale-outline"
      title={t('chartBodyWeight')}
      value={body.current !== null ? `${formatKg(body.current)} kg` : '—'}
      delta={bodyDelta}
      deltaTone={bodyGood ? 'good' : 'neutral'}
      caption={bodyCaption}
    >
      {body.points.length > 1
        ? <TrendChart points={body.points} color={colors.accent} locale={language} unit="kg" />
        : <EmptyChart icon="scale-outline" text={t('chartBodyWeightEmpty')} />}
    </ChartCard> : null}

    {usesWeights ? <ChartCard
      testID="chart-lifted-weight"
      icon="barbell-outline"
      title={t('chartLifted')}
      value={lifted.best !== null ? `${formatKg(lifted.best)} kg` : '—'}
      delta={lifted.increase ? `+${formatKg(lifted.increase)} kg` : null}
      deltaTone="good"
      caption={t('chartLiftedCaption')}
    >
      {lifted.points.length > 1
        ? <TrendChart points={lifted.points} color={colors.accent} locale={language} unit="kg" />
        : <EmptyChart icon="barbell-outline" text={t('chartLiftedEmpty')} />}
    </ChartCard> : null}

    <View style={styles.rangeRow}>
      <SegmentedControl<Range>
        value={range}
        onChange={setRange}
        options={[
          { value: '7', label: t('chartsRange7'), icon: 'calendar-outline' },
          { value: '30', label: t('chartsRange30'), icon: 'calendar-outline' },
        ]}
      />
    </View>

    <ChartCard
      testID="chart-training-time"
      icon="time-outline"
      title={t('chartTrainingTime')}
      value={duration(allTimeMinutes)}
      caption={t('chartTrainingCaption').replace('{value}', duration(periodMinutes))}
    >
      {periodMinutes > 0
        ? <BarsChart data={activity.map((day) => ({ date: day.date, value: day.minutes }))} color={colors.accent} locale={language} unit={t('minutesShort')} />
        : <EmptyChart icon="time-outline" text={t('chartTrainingEmpty')} />}
    </ChartCard>

    <ChartCard
      testID="chart-calorie-adherence"
      icon="target"
      title={t('chartAdherence')}
      value={adherence.rate === null ? '—' : `${adherence.onTarget}/${adherence.tracked}`}
      aside={calorieGoal && adherence.tracked ? <RateRing value={adherence.rate} color={colors.success} /> : null}
      caption={adherence.tracked ? t('chartAdherenceCaption').replace('{on}', String(adherence.onTarget)).replace('{tracked}', String(adherence.tracked)) : undefined}
    >
      {calorieGoal && adherence.tracked
        ? <AdherenceGrid
          series={adherence.series}
          goal={calorieGoal}
          color={colors.success}
          locale={language}
          labels={{ on: t('adherenceOn'), over: t('adherenceOver'), under: t('adherenceUnder'), none: t('adherenceNone'), kcal: 'kcal' }}
        />
        : <EmptyChart icon="target" text={t('chartAdherenceEmpty')} />}
    </ChartCard>

    <ChartCard
      testID="chart-calories-burned"
      icon="flame-outline"
      title={t('chartBurned')}
      value={`${periodBurn.toLocaleString(language)} kcal`}
      caption={averageBurn ? t('chartBurnedCaption').replace('{value}', averageBurn.toLocaleString(language)) : undefined}
    >
      {periodBurn > 0
        ? <BarsChart data={activity.map((day) => ({ date: day.date, value: day.calories }))} color={colors.orange} locale={language} unit="kcal" />
        : <EmptyChart icon="flame-outline" text={t('chartBurnedEmpty')} />}
    </ChartCard>
  </View>;
}

const styles = StyleSheet.create({
  section: { marginBottom: 4 },
  heading: { marginBottom: 12, marginTop: 4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.3 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  rangeRow: { marginTop: 6, marginBottom: 12 },
});
