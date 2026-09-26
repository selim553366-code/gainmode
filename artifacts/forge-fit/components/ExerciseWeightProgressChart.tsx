import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { translate, type Language } from '@/lib/i18n';

type WeightPoint = { date: string; weightKg: number };

type Props = {
  entries: WeightPoint[];
  language: Language;
};

const CHART_HEIGHT = 154;
const PLOT_TOP = 14;
const PLOT_BOTTOM = 130;
const PLOT_LEFT = 43;
const PLOT_RIGHT = 10;

function formatDate(date: string, language: Language) {
  return new Date(date).toLocaleDateString(language, {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  });
}

export function ExerciseWeightProgressChart({ entries, language }: Props) {
  const colors = useColors();
  const [width, setWidth] = React.useState(0);
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const values = entries.map((entry) => entry.weightKg);
  const minimum = values.length > 0 ? Math.min(...values) : 0;
  const maximum = values.length > 0 ? Math.max(...values) : 0;
  const rawRange = maximum - minimum;
  const padding = rawRange === 0 ? Math.max(maximum * 0.08, 0.5) : rawRange * 0.15;
  const domainMinimum = Math.max(0, minimum - padding);
  const domainMaximum = maximum + padding;
  const domainRange = Math.max(domainMaximum - domainMinimum, 0.1);
  const gridValues = [domainMaximum, (domainMaximum + domainMinimum) / 2, domainMinimum];
  const plotWidth = Math.max(0, width - PLOT_LEFT - PLOT_RIGHT);
  const xForIndex = (index: number) => entries.length === 1
    ? PLOT_LEFT + plotWidth / 2
    : PLOT_LEFT + (index / (entries.length - 1)) * plotWidth;
  const yForValue = (value: number) => PLOT_TOP + ((domainMaximum - value) / domainRange) * (PLOT_BOTTOM - PLOT_TOP);
  const linePoints = entries
    .map((entry, index) => `${xForIndex(index)},${yForValue(entry.weightKg)}`)
    .join(' ');
  const dateLabelIndexes = Array.from(new Set([
    0,
    Math.floor((entries.length - 1) / 2),
    entries.length - 1,
  ]));

  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="exercise-weight-progress-chart">
    <Text style={[styles.title, { color: colors.foreground }]}>{t('exerciseWeightProgressTitle')}</Text>
    {entries.length === 0 ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>{t('exerciseWeightProgressEmpty')}</Text> : <>
      <View
        style={styles.chartFrame}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        accessible
        accessibilityLabel={`${t('exerciseWeightProgressTitle')}: ${entries.map((entry) => `${formatDate(entry.date, language)}, ${entry.weightKg} kg`).join(', ')}`}
      >
        {width > 0 ? <Svg width={width} height={CHART_HEIGHT} viewBox={`0 0 ${width} ${CHART_HEIGHT}`}>
          {gridValues.map((value, index) => {
            const y = PLOT_TOP + (index / (gridValues.length - 1)) * (PLOT_BOTTOM - PLOT_TOP);
            return <React.Fragment key={index}>
              <Line x1={PLOT_LEFT} y1={y} x2={width - PLOT_RIGHT} y2={y} stroke={colors.border} strokeWidth={1} />
              <SvgText x={1} y={y + 3} fill={colors.mutedForeground} fontSize={9}>{value.toFixed(1)}</SvgText>
            </React.Fragment>;
          })}
          {entries.length > 1 ? <Polyline
            points={linePoints}
            fill="none"
            stroke={colors.primary}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          /> : null}
          {entries.map((entry, index) => <Circle
            key={entry.date + index}
            cx={xForIndex(index)}
            cy={yForValue(entry.weightKg)}
            r={index === entries.length - 1 ? 4 : 3}
            fill={colors.primary}
          />)}
        </Svg> : null}
      </View>
      <View style={styles.dateLabels}>
        {dateLabelIndexes.map((index) => <Text
          key={`${entries[index].date}-${index}`}
          numberOfLines={1}
          style={[
            styles.dateLabel,
            { color: colors.mutedForeground },
            index === 0 ? styles.dateLabelStart : null,
            index === entries.length - 1 ? styles.dateLabelEnd : null,
          ]}
        >
          {formatDate(entries[index].date, language)}
        </Text>)}
      </View>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  card: { width: '100%', marginTop: 10, padding: 11, borderRadius: 15, borderWidth: 1 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 11, marginBottom: 8 },
  chartFrame: { width: '100%', height: CHART_HEIGHT },
  dateLabels: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: PLOT_LEFT, marginRight: PLOT_RIGHT, marginTop: 2 },
  dateLabel: { flex: 1, textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 9 },
  dateLabelStart: { textAlign: 'left' },
  dateLabelEnd: { textAlign: 'right' },
  empty: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
});