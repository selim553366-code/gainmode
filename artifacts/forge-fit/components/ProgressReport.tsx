import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import { PressableScale as Pressable } from '@/components/Motion';
import { Ionicons } from '@/components/AppIcon';
import { triggerHaptic } from '@/components/FitUI';
import { useColors } from '@/hooks/useColors';
import { translate, type Language, type TranslationKey } from '@/lib/i18n';
import { bodyWeightSeries, calorieAdherence, dailyActivity, lastDays, weightTrendPoints, type ActivityEntry } from '@/lib/progressCharts';
import type { WeeklySummary, WeightOutcome } from '@/lib/weeklyAnalysis';

type WeightLog = { value: number; date: string };

const round1 = (value: number) => Math.round(value * 10) / 10;
const workoutsWord: Record<Language, string> = { tr: 'antrenman', en: 'workouts', de: 'Trainings', fr: 'séances', es: 'entrenos' };

function formatChange(value: number | null) {
  if (value === null) return '—';
  if (Math.abs(value) < 0.05) return '0.0';
  return `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(1)}`;
}

function outcomeKey(outcome: WeightOutcome): TranslationKey {
  if (outcome === 'lost') return 'weeklyWeightLost';
  if (outcome === 'gained') return 'weeklyWeightGained';
  if (outcome === 'steady') return 'weeklyWeightSteady';
  return 'weeklyWeightMissing';
}

/** Smooth path through the points, scaled into width × height with some padding. */
function linePath(values: number[], width: number, height: number, pad = 6) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.4);
  const points = values.map((value, index) => ({
    x: pad + (index * (width - pad * 2)) / (values.length - 1),
    y: pad + (1 - (value - min) / span) * (height - pad * 2),
  }));
  let d = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const mid = (a.x + b.x) / 2;
    d += ` C${mid.toFixed(1)} ${a.y.toFixed(1)} ${mid.toFixed(1)} ${b.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return { d, last: points[points.length - 1] };
}

/** A ring that fills one segment per day until the first weekly analysis unlocks. */
function UnlockRing({ daysLeft, color, track }: { daysLeft: number; color: string; track: string }) {
  const size = 46;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const segments = 7;
  const done = Math.max(0, Math.min(segments, segments - daysLeft));
  const gap = 0.16;
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      {Array.from({ length: segments }, (_, index) => {
        const a0 = (index / segments) * Math.PI * 2 - Math.PI / 2 + gap / 2;
        const a1 = ((index + 1) / segments) * Math.PI * 2 - Math.PI / 2 - gap / 2;
        const p0 = { x: size / 2 + r * Math.cos(a0), y: size / 2 + r * Math.sin(a0) };
        const p1 = { x: size / 2 + r * Math.cos(a1), y: size / 2 + r * Math.sin(a1) };
        return <Path key={index} d={`M${p0.x} ${p0.y} A${r} ${r} 0 0 1 ${p1.x} ${p1.y}`} stroke={index < done ? color : track} strokeWidth={stroke} strokeLinecap="round" fill="none" />;
      })}
    </Svg>
    <Ionicons name="badge-lock" size={15} color={color} />
  </View>;
}

/**
 * The week as a report: the weight change set big beside its 7-day curve, a strip of the days you trained, and the
 * path to the written analysis (a ring counting the days until it unlocks, then a dark pill to request it).
 */
export function WeekReport({ language, summary, weightLogs, startWeight, registeredAt, activityLog, tracksWeight, unlocked, daysLeft, launching, onRequest }: {
  language: Language;
  summary: WeeklySummary;
  weightLogs: WeightLog[];
  startWeight: number | null;
  registeredAt: string | null;
  activityLog: ActivityEntry[];
  tracksWeight: boolean;
  unlocked: boolean;
  daysLeft: number;
  launching: boolean;
  onRequest: () => void;
}) {
  const colors = useColors();
  const t = (key: TranslationKey) => translate(language, key);
  const week = lastDays(7);
  const activity = dailyActivity(activityLog, 7);
  const series = weightTrendPoints(bodyWeightSeries({ startWeight, registeredAt, weightLogs }).points, { from: week[0] });
  const weights = series.map((point) => point.value);
  const [plotWidth, setPlotWidth] = React.useState(0);
  const plotHeight = 70;
  const curve = plotWidth ? linePath(weights, plotWidth, plotHeight) : null;
  const today = week[week.length - 1];
  const weekday = (date: string) => new Intl.DateTimeFormat(language, { weekday: 'narrow' }).format(new Date(`${date}T12:00:00`));
  const range = `${new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' }).format(new Date(`${week[0]}T12:00:00`))} – ${new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' }).format(new Date(`${today}T12:00:00`))}`;
  const outcomeColor = summary.weightOutcome === 'lost' ? colors.success : summary.weightOutcome === 'gained' ? colors.orange : colors.foreground;
  const activeDays = activity.filter((day) => day.minutes > 0).length;

  return <View style={[styles.report, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.reportTop}>
      <View style={styles.liveRow}>
        <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
        <Text style={[styles.liveText, { color: colors.mutedForeground }]}>{t('weeklyAiLive')}</Text>
      </View>
      <Text style={[styles.range, { color: colors.mutedForeground }]}>{range}</Text>
    </View>
    <Text style={[styles.reportTitle, { color: colors.foreground }]}>{t('weeklyAiCardTitle')}</Text>

    <View style={styles.metricRow}>
      <View style={styles.metricCopy}>
        <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{tracksWeight ? t('weeklyWeightChange') : t('weeklyMuscleFocus')}</Text>
        {tracksWeight
          ? <Text style={[styles.metricValue, { color: summary.weightChangeKg === null ? colors.mutedForeground : outcomeColor }]}>{formatChange(summary.weightChangeKg)}<Text style={styles.metricUnit}> kg</Text></Text>
          : <Text style={[styles.metricValue, { color: colors.foreground }]}>{summary.completedWorkouts}<Text style={styles.metricUnit}> {workoutsWord[language] ?? workoutsWord.en}</Text></Text>}
        <Text numberOfLines={2} style={[styles.metricHint, { color: colors.mutedForeground }]}>{tracksWeight ? t(outcomeKey(summary.weightOutcome)) : t('weeklyMuscleSubtitle')}</Text>
      </View>
      <View style={styles.plot} onLayout={(event) => setPlotWidth(Math.floor(event.nativeEvent.layout.width))}>
        {plotWidth ? <Svg width={plotWidth} height={plotHeight}>
          {curve
            ? <>
              <Path d={curve.d} stroke={colors.accent} strokeWidth={3} fill="none" strokeLinecap="round" />
              <Circle cx={curve.last.x} cy={curve.last.y} r={5.5} fill={colors.card} stroke={colors.accent} strokeWidth={3} />
            </>
            : <Line x1={6} x2={plotWidth - 6} y1={plotHeight / 2} y2={plotHeight / 2} stroke={colors.border} strokeWidth={2.5} strokeDasharray="4 7" strokeLinecap="round" />}
        </Svg> : null}
        {summary.currentWeightKg ? <Text style={[styles.plotCaption, { color: colors.mutedForeground }]}>{round1(summary.currentWeightKg).toFixed(1)} kg</Text> : null}
      </View>
    </View>

    <View style={styles.days}>
      {activity.map((day) => {
        const active = day.minutes > 0;
        const isToday = day.date === today;
        return <View key={day.date} style={styles.day}>
          <View style={[styles.dayDot, active ? { backgroundColor: colors.foreground } : { borderWidth: 1.5, borderColor: colors.border }, isToday && !active ? { borderColor: colors.accent } : null]}>
            {active ? <Ionicons name="checkmark" size={12} color={colors.background} /> : null}
          </View>
          <Text style={[styles.dayLabel, { color: isToday ? colors.accent : colors.mutedForeground }]}>{weekday(day.date)}</Text>
        </View>;
      })}
      <View style={[styles.dayTotal, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.dayTotalValue, { color: colors.foreground }]}>{activeDays}</Text>
        <Text style={[styles.dayTotalUnit, { color: colors.mutedForeground }]}>/7</Text>
      </View>
    </View>

    <View style={[styles.rule, { borderColor: colors.border }]} />

    {unlocked
      ? <Pressable testID="get-weekly-ai-analysis" accessibilityRole="button" accessibilityLabel={t('weeklyAnalysisCta')} disabled={launching} onPress={() => { triggerHaptic(); onRequest(); }} scaleTo={0.98} style={[styles.request, { backgroundColor: colors.foreground }]}>
        <Text numberOfLines={1} style={[styles.requestText, { color: colors.background }]}>{launching ? t('weeklyAnalysisSending') : t('weeklyAnalysisCta')}</Text>
        <View style={[styles.requestArrow, { backgroundColor: colors.background }]}><Ionicons name={launching ? 'ellipsis-horizontal' : 'arrow-forward'} size={18} color={colors.foreground} /></View>
      </Pressable>
      : <View testID="get-weekly-ai-analysis" accessibilityState={{ disabled: true }} style={styles.locked}>
        <UnlockRing daysLeft={daysLeft} color={colors.accent} track={colors.border} />
        <Text style={[styles.lockedText, { color: colors.foreground }]}>{t('weeklyAnalysisUnlockIn').replace('{days}', String(daysLeft))}</Text>
      </View>}
  </View>;
}

/** One small chart tile in the charts strip. */
function ChartTile({ label, value, unit, children }: { label: string; value: string; unit: string; children: React.ReactNode }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { triggerHaptic(); router.push('/progress-charts'); }} scaleTo={0.96} style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Text numberOfLines={1} style={[styles.tileLabel, { color: colors.mutedForeground }]}>{label}</Text>
    <Text numberOfLines={1} style={[styles.tileValue, { color: colors.foreground }]}>{value}<Text style={[styles.tileUnit, { color: colors.mutedForeground }]}> {unit}</Text></Text>
    <View style={styles.tilePlot}>{children}</View>
  </Pressable>;
}

const TILE_PLOT = { width: 86, height: 38 };

/** A peek at the charts page: weight trend, training minutes and calorie goal days for the last week, drawn from real logs. */
export function ChartStrip({ language, weightLogs, startWeight, registeredAt, activityLog, meals, calorieGoal }: {
  language: Language;
  weightLogs: WeightLog[];
  startWeight: number | null;
  registeredAt: string | null;
  activityLog: ActivityEntry[];
  meals: { calories: number; date?: string }[];
  calorieGoal: number | null;
}) {
  const colors = useColors();
  const t = (key: TranslationKey) => translate(language, key);
  const week = lastDays(7);
  const weight = bodyWeightSeries({ startWeight, registeredAt, weightLogs });
  const line = linePath(weightTrendPoints(weight.points, { from: week[0] }).map((point) => point.value), TILE_PLOT.width, TILE_PLOT.height, 4);
  const minutes = dailyActivity(activityLog, 7).map((day) => day.minutes);
  const maxMinutes = Math.max(...minutes, 1);
  const adherence = calorieAdherence(meals, calorieGoal, 7);
  const tone = (status: string) => status === 'on' ? colors.success : status === 'over' ? colors.orange : status === 'under' ? colors.accent : colors.border;
  const barWidth = TILE_PLOT.width / 7 - 4;

  return <View style={styles.strip}>
    <View style={styles.stripHead}>
      <Text style={[styles.stripTitle, { color: colors.foreground }]}>{t('chartsTitle')}</Text>
      <Pressable testID="open-progress-charts" accessibilityRole="button" onPress={() => { triggerHaptic(); router.push('/progress-charts'); }} hitSlop={10} scaleTo={0.94} style={styles.stripLink}>
        <Text style={[styles.stripLinkText, { color: colors.accent }]}>{t('viewAll')}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.accent} />
      </Pressable>
    </View>
    <View style={styles.tiles}>
      <ChartTile label={t('chartsTabWeight')} value={weight.current ? weight.current.toFixed(1) : '—'} unit="kg">
        <Svg width={TILE_PLOT.width} height={TILE_PLOT.height}>
          {line
            ? <><Path d={line.d} stroke={colors.accent} strokeWidth={2.5} fill="none" strokeLinecap="round" /><Circle cx={line.last.x} cy={line.last.y} r={3.5} fill={colors.accent} /></>
            : <Line x1={4} x2={TILE_PLOT.width - 4} y1={TILE_PLOT.height / 2} y2={TILE_PLOT.height / 2} stroke={colors.border} strokeWidth={2} strokeDasharray="3 5" />}
        </Svg>
      </ChartTile>
      <ChartTile label={t('chartsTabTime')} value={String(minutes.reduce((sum, value) => sum + value, 0))} unit="min">
        <Svg width={TILE_PLOT.width} height={TILE_PLOT.height}>
          {minutes.map((value, index) => {
            const h = Math.max(3, (value / maxMinutes) * (TILE_PLOT.height - 2));
            return <Rect key={index} x={index * (barWidth + 4) + 2} y={TILE_PLOT.height - h} width={barWidth} height={h} rx={barWidth / 2} fill={value > 0 ? colors.orange : colors.border} />;
          })}
        </Svg>
      </ChartTile>
      <ChartTile label={t('chartsTabAdherence')} value={`${adherence.onTarget}`} unit="/ 7">
        <Svg width={TILE_PLOT.width} height={TILE_PLOT.height}>
          {adherence.series.map((day, index) => <Circle key={day.date} cx={index * (TILE_PLOT.width / 7) + TILE_PLOT.width / 14} cy={TILE_PLOT.height / 2} r={5} fill={tone(day.status)} />)}
        </Svg>
      </ChartTile>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  report: { borderRadius: 30, borderWidth: 1, padding: 20, marginBottom: 22 },
  reportTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontFamily: 'Inter_700Bold', fontSize: 10.5, letterSpacing: 1.2 },
  range: { fontFamily: 'Inter_600SemiBold', fontSize: 11.5 },
  reportTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, lineHeight: 28, letterSpacing: -1, marginTop: 12 },
  metricRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: 18 },
  metricCopy: { flex: 1.15, minWidth: 0 },
  metricLabel: { fontFamily: 'Inter_700Bold', fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase' },
  metricValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 50, letterSpacing: -2.6, marginTop: 2 },
  metricUnit: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: 0 },
  metricHint: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 16, marginTop: 2 },
  plot: { flex: 1, minWidth: 0, alignItems: 'flex-end', paddingBottom: 4 },
  plotCaption: { fontFamily: 'Inter_700Bold', fontSize: 11, marginTop: 4 },
  days: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  day: { flex: 1, alignItems: 'center', gap: 6 },
  dayDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  dayTotal: { flexDirection: 'row', alignItems: 'baseline', borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6, marginLeft: 4, marginBottom: 18 },
  dayTotalValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 16 },
  dayTotalUnit: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  rule: { borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 18 },
  locked: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockedText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 14, lineHeight: 19 },
  request: { height: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 22, paddingRight: 7 },
  requestText: { flex: 1, fontFamily: 'Inter_800ExtraBold', fontSize: 15 },
  requestArrow: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  strip: { marginBottom: 24 },
  stripHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  stripTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 20, letterSpacing: -0.7 },
  stripLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  stripLinkText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, minWidth: 0, borderRadius: 22, borderWidth: 1, padding: 12 },
  tileLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  tileValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 20, letterSpacing: -0.8, marginTop: 4 },
  tileUnit: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0 },
  tilePlot: { marginTop: 10, height: TILE_PLOT.height, alignItems: 'flex-start' },
});
