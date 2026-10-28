import React from 'react';
import { Platform, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@/components/AppIcon';
import { useColors } from '@/hooks/useColors';
import { EASE_OUT } from '@/components/Motion';
import type { AdherenceDay, ChartPoint } from '@/lib/progressCharts';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PLOT_HEIGHT = 132;
const PAD_TOP = 14;
const PAD_BOTTOM = 6;
// Right gutter that holds the axis labels, so they never sit on top of the data.
const GUTTER = 30;

function formatDay(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`)).replace('.', '');
}

/** Rounded, readable axis bounds with a little headroom so the line never touches the frame. */
function niceRange(values: number[], zeroBased: boolean) {
  const max = Math.max(...values);
  const min = zeroBased ? 0 : Math.min(...values);
  const span = Math.max(max - min, zeroBased ? 1 : Math.max(Math.abs(max) * 0.02, 1));
  return { min: zeroBased ? 0 : min - span * 0.18, max: max + span * 0.18 };
}

/** Tracks the scrubbed index from touch (native) and hover (web); clears when the finger lifts. */
function useScrub(count: number, width: number, bands = false) {
  const [index, setIndex] = React.useState<number | null>(null);
  const last = React.useRef<number | null>(null);
  const pick = (x: number) => {
    if (!width || count === 0) return;
    const raw = bands ? Math.floor((x / width) * count) : Math.round((x / width) * (count - 1));
    const next = Math.max(0, Math.min(count - 1, raw));
    if (next !== last.current) {
      last.current = next;
      if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
    }
    setIndex(next);
  };
  const clear = () => { last.current = null; setIndex(null); };
  const handlers = {
    onStartShouldSetResponder: () => true,
    onResponderTerminationRequest: () => true,
    onResponderGrant: (event: GestureResponderEvent) => pick(event.nativeEvent.locationX),
    onResponderMove: (event: GestureResponderEvent) => pick(event.nativeEvent.locationX),
    onResponderRelease: clear,
    onResponderTerminate: clear,
    ...(Platform.OS === 'web' ? {
      onPointerMove: (event: { nativeEvent: { offsetX?: number; locationX?: number } }) => pick(event.nativeEvent.offsetX ?? event.nativeEvent.locationX ?? 0),
      onPointerLeave: clear,
    } : {}),
  };
  return { index, handlers };
}

/** Plays a one-time reveal whenever the data shape changes. */
function useReveal(key: string, delay = 0) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  React.useEffect(() => {
    if (reduced) return;
    progress.set(0);
    progress.set(withDelay(delay, withTiming(1, { duration: 760, easing: EASE_OUT })));
  }, [delay, key, progress, reduced]);
  return progress;
}

function Tooltip({ x, width, title, value }: { x: number; width: number; title: string; value: string }) {
  const colors = useColors();
  const boxWidth = 104;
  const left = Math.max(0, Math.min(width - boxWidth, x - boxWidth / 2));
  return <View pointerEvents="none" style={[styles.tooltip, { left, width: boxWidth, backgroundColor: colors.foreground }]}>
    <Text numberOfLines={1} style={[styles.tooltipValue, { color: colors.background }]}>{value}</Text>
    <Text numberOfLines={1} style={[styles.tooltipDate, { color: `${colors.background}B3` }]}>{title}</Text>
  </View>;
}

function GridLines({ ticks, format }: { ticks: { y: number; value: number }[]; format: (value: number) => string }) {
  const colors = useColors();
  return <>
    {ticks.map((tick) => <View key={tick.y} pointerEvents="none" style={[styles.gridLine, { top: tick.y, borderColor: colors.border }]}>
      <Text style={[styles.gridLabel, { color: colors.mutedForeground, backgroundColor: colors.card }]}>{format(tick.value)}</Text>
    </View>)}
  </>;
}

export function ChartCard({ icon, title, value, delta, deltaTone = 'neutral', caption, aside, children, testID }: {
  icon: IconName;
  title: string;
  value: string;
  delta?: string | null;
  deltaTone?: 'good' | 'neutral';
  caption?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  testID?: string;
}) {
  const colors = useColors();
  return <View testID={testID} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.cardHeader}>
      <View style={[styles.cardIcon, { backgroundColor: colors.secondary }]}><Ionicons name={icon} size={16} color={colors.foreground} /></View>
      <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.mutedForeground }]}>{title}</Text>
      {delta ? <View style={[styles.delta, { backgroundColor: deltaTone === 'good' ? `${colors.success}18` : colors.secondary }]}>
        <Text style={[styles.deltaText, { color: deltaTone === 'good' ? colors.success : colors.foreground }]}>{delta}</Text>
      </View> : null}
    </View>
    <View style={styles.valueRow}>
      <View style={styles.valueCopy}>
        <Text style={[styles.cardValue, { color: colors.foreground }]}>{value}</Text>
        {caption ? <Text style={[styles.cardCaption, { color: colors.mutedForeground }]}>{caption}</Text> : null}
      </View>
      {aside}
    </View>
    <View style={styles.cardBody}>{children}</View>
  </View>;
}

export function EmptyChart({ icon, text }: { icon: IconName; text: string }) {
  const colors = useColors();
  return <View style={[styles.empty, { borderColor: colors.border }]}>
    <Ionicons name={icon} size={18} color={colors.mutedForeground} />
    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{text}</Text>
  </View>;
}

/** Line + soft area for a value over time. Scrub (touch or hover) for any day's exact value. */
export function TrendChart({ points, color, locale, unit, testID }: { points: ChartPoint[]; color: string; locale: string; unit: string; testID?: string }) {
  const colors = useColors();
  const [width, setWidth] = React.useState(0);
  const plotWidth = Math.max(0, width - GUTTER);
  const { index, handlers } = useScrub(points.length, plotWidth);
  const reveal = useReveal(`${points.length}:${points.at(-1)?.value}`);
  const clipStyle = useAnimatedStyle(() => ({ width: `${reveal.get() * 100}%` }));
  const gradientId = React.useId().replace(/:/g, '');

  const values = points.map((point) => point.value);
  const range = niceRange(values, false);
  const plotBottom = PLOT_HEIGHT - PAD_BOTTOM;
  const y = (value: number) => PAD_TOP + (1 - (value - range.min) / (range.max - range.min)) * (plotBottom - PAD_TOP);
  const x = (i: number) => (points.length === 1 ? plotWidth / 2 : 6 + (i / (points.length - 1)) * (plotWidth - 12));
  const coords = points.map((point, i) => ({ x: x(i), y: y(point.value) }));
  // Monotone-ish smoothing: horizontal control points keep the curve from overshooting the data.
  const line = coords.reduce((d, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = coords[i - 1];
    const mid = (point.x - prev.x) / 2;
    return `${d} C ${prev.x + mid} ${prev.y}, ${point.x - mid} ${point.y}, ${point.x} ${point.y}`;
  }, '');
  const area = coords.length ? `${line} L ${coords.at(-1)!.x} ${plotBottom} L ${coords[0].x} ${plotBottom} Z` : '';
  const ticks = [range.max - (range.max - range.min) * 0.12, (range.max + range.min) / 2, range.min + (range.max - range.min) * 0.12]
    .map((value) => ({ value, y: y(value) }));
  const format = (value: number) => `${Math.round(value * 10) / 10}`;
  const active = index !== null ? coords[index] : null;
  const last = coords.at(-1);

  return <View testID={testID}>
    <View onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)} style={styles.plot} {...handlers}>
      {width ? <>
        <GridLines ticks={ticks} format={format} />
        <Animated.View pointerEvents="none" style={[styles.clip, clipStyle]}>
          <Svg width={plotWidth} height={PLOT_HEIGHT}>
            <Defs>
              <SvgGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.22} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </SvgGradient>
            </Defs>
            {coords.length > 1 ? <Path d={area} fill={`url(#${gradientId})`} /> : null}
            {coords.length > 1 ? <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
            {last && !active ? <Circle cx={last.x} cy={last.y} r={4.5} fill={color} stroke={colors.card} strokeWidth={2} /> : null}
          </Svg>
        </Animated.View>
        {active ? <Svg pointerEvents="none" width={width} height={PLOT_HEIGHT} style={StyleSheet.absoluteFill}>
          <Line x1={active.x} x2={active.x} y1={0} y2={plotBottom} stroke={colors.mutedForeground} strokeWidth={1} strokeDasharray="3 3" />
          <Circle cx={active.x} cy={active.y} r={5} fill={color} stroke={colors.card} strokeWidth={2} />
        </Svg> : null}
        {active && index !== null ? <Tooltip x={active.x} width={plotWidth} value={`${format(points[index].value)} ${unit}`} title={formatDay(points[index].date, locale)} /> : null}
      </> : null}
    </View>
    <View style={[styles.axis, styles.axisRight]}>
      <Text style={[styles.axisText, { color: colors.mutedForeground }]}>{points[0] ? formatDay(points[0].date, locale) : ''}</Text>
      <Text style={[styles.axisText, { color: colors.mutedForeground }]}>{points.length > 1 ? formatDay(points.at(-1)!.date, locale) : ''}</Text>
    </View>
  </View>;
}

function Bar({ height, color, progress, order, count }: { height: number; color: string; progress: ReturnType<typeof useSharedValue<number>>; order: number; count: number }) {
  const style = useAnimatedStyle(() => {
    // A left-to-right wave: each bar starts a touch after the previous one.
    const start = (order / Math.max(count, 1)) * 0.35;
    const local = Math.min(1, Math.max(0, (progress.get() - start) / 0.65));
    return { height: height * local };
  });
  return <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />;
}

/** Daily bars, zero-based. Today is solid; the rest are a lighter step of the same hue. */
export function BarsChart({ data, color, locale, unit, testID }: { data: { date: string; value: number }[]; color: string; locale: string; unit: string; testID?: string }) {
  const colors = useColors();
  const [width, setWidth] = React.useState(0);
  const plotWidth = Math.max(0, width - GUTTER);
  const { index, handlers } = useScrub(data.length, plotWidth, true);
  const reveal = useReveal(`${data.length}:${data.reduce((sum, item) => sum + item.value, 0)}`, 80);
  const range = niceRange(data.map((item) => item.value), true);
  const plotBottom = PLOT_HEIGHT - PAD_BOTTOM;
  const scale = (value: number) => (value / range.max) * (plotBottom - PAD_TOP);
  const gap = data.length > 14 ? 2 : 6;
  const slot = plotWidth / Math.max(data.length, 1);
  const ticks = [range.max * 0.88, range.max * 0.44].map((value) => ({ value, y: plotBottom - scale(value) }));
  const format = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${Math.round(value)}`);

  return <View testID={testID}>
    <View onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)} style={styles.plot} {...handlers}>
      {width ? <>
        <GridLines ticks={ticks} format={format} />
        <View pointerEvents="none" style={[styles.baseline, { top: plotBottom, backgroundColor: colors.border }]} />
        <View pointerEvents="none" style={[styles.bars, { height: plotBottom, gap, right: GUTTER }]}>
          {data.map((item, i) => {
            const isLast = i === data.length - 1;
            const dimmed = index !== null && index !== i;
            const fill = isLast || index === i ? color : `${color}66`;
            return <View key={item.date} style={[styles.barSlot, { opacity: dimmed ? 0.45 : 1 }]}>
              {item.value > 0
                ? <Bar height={Math.max(4, scale(item.value))} color={fill} progress={reveal} order={i} count={data.length} />
                : <View style={[styles.zeroTick, { backgroundColor: colors.border }]} />}
            </View>;
          })}
        </View>
        {index !== null ? <Tooltip x={slot * index + slot / 2} width={plotWidth} value={`${data[index].value.toLocaleString(locale)} ${unit}`} title={formatDay(data[index].date, locale)} /> : null}
      </> : null}
    </View>
    <View style={[styles.axis, styles.axisRight]}>
      <Text style={[styles.axisText, { color: colors.mutedForeground }]}>{data[0] ? formatDay(data[0].date, locale) : ''}</Text>
      <Text style={[styles.axisText, { color: colors.mutedForeground }]}>{data.length ? formatDay(data.at(-1)!.date, locale) : ''}</Text>
    </View>
  </View>;
}

function AdherenceCell({ day, color, progress, order, count, active, onPress }: { day: AdherenceDay; color: string; progress: ReturnType<typeof useSharedValue<number>>; order: number; count: number; active: boolean; onPress: () => void }) {
  const colors = useColors();
  const style = useAnimatedStyle(() => {
    const start = (order / Math.max(count, 1)) * 0.5;
    const local = Math.min(1, Math.max(0, (progress.get() - start) / 0.5));
    return { opacity: local, transform: [{ scale: 0.6 + local * 0.4 }] };
  });
  const background = day.status === 'on' ? color : day.status === 'none' ? 'transparent' : `${colors.mutedForeground}38`;
  return <Animated.View style={[styles.cellWrap, style]}>
    <View
      onStartShouldSetResponder={() => true}
      onResponderGrant={onPress}
      style={[styles.cell, { backgroundColor: background, borderColor: day.status === 'none' ? colors.border : 'transparent', borderStyle: day.status === 'none' ? 'dashed' : 'solid' }, active ? { borderColor: colors.foreground, borderStyle: 'solid', borderWidth: 2 } : null]}
    >
      {day.status === 'on' ? <Ionicons name="checkmark" size={12} color={colors.card} /> : day.status === 'over' ? <Ionicons name="arrow-up" size={11} color={colors.foreground} /> : day.status === 'under' ? <Ionicons name="arrow-down" size={11} color={colors.foreground} /> : null}
    </View>
  </Animated.View>;
}

/** One cell per day: on target, over, under or not logged. Tap a day for its total. */
export function AdherenceGrid({ series, goal, color, locale, labels, testID }: {
  series: AdherenceDay[];
  goal: number | null;
  color: string;
  locale: string;
  labels: { on: string; over: string; under: string; none: string; kcal: string };
  testID?: string;
}) {
  const colors = useColors();
  const reveal = useReveal(`${series.length}:${series.map((day) => day.status).join('')}`, 60);
  const [selected, setSelected] = React.useState<number | null>(null);
  const picked = selected !== null ? series[selected] : null;
  const statusLabel = (status: AdherenceDay['status']) => labels[status];

  return <View testID={testID}>
    <View style={styles.cells}>
      {series.map((day, i) => <AdherenceCell key={day.date} day={day} color={color} progress={reveal} order={i} count={series.length} active={selected === i} onPress={() => setSelected(selected === i ? null : i)} />)}
    </View>
    <Text style={[styles.cellDetail, { color: picked ? colors.foreground : colors.mutedForeground }]}>
      {picked
        ? `${formatDay(picked.date, locale)} · ${picked.status === 'none' ? labels.none : `${picked.eaten.toLocaleString(locale)}${goal ? ` / ${goal.toLocaleString(locale)}` : ''} ${labels.kcal} · ${statusLabel(picked.status)}`}`
        : `${formatDay(series[0]?.date ?? '', locale)} – ${formatDay(series.at(-1)?.date ?? '', locale)}`}
    </Text>
    <View style={styles.legend}>
      {(['on', 'over', 'under', 'none'] as const).map((status) => <View key={status} style={styles.legendItem}>
        <View style={[styles.legendSwatch, { backgroundColor: status === 'on' ? color : status === 'none' ? 'transparent' : `${colors.mutedForeground}38`, borderColor: status === 'none' ? colors.border : 'transparent' }]}>
          {status === 'on' ? <Ionicons name="checkmark" size={8} color={colors.card} /> : status === 'over' ? <Ionicons name="arrow-up" size={8} color={colors.foreground} /> : status === 'under' ? <Ionicons name="arrow-down" size={8} color={colors.foreground} /> : null}
        </View>
        <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{statusLabel(status)}</Text>
      </View>)}
    </View>
  </View>;
}

/** Thin ring for a single percentage, drawn in with the card. */
export function RateRing({ value, color, size = 58 }: { value: number | null; color: string; size?: number }) {
  const colors = useColors();
  const reveal = useReveal(String(value), 120);
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = (value ?? 0) / 100;
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - target * reveal.get()) }));
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size} height={size} style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.secondary} strokeWidth={stroke} fill="none" />
      <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} animatedProps={ringProps} />
    </Svg>
    <Text style={[styles.ringText, { color: colors.foreground }]}>{value === null ? '—' : `${value}%`}</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  cardIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  delta: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  deltaText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  valueCopy: { flex: 1, minWidth: 0 },
  cardValue: { fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -1.1, marginTop: 12 },
  cardCaption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  cardBody: { marginTop: 14 },
  plot: { height: PLOT_HEIGHT, position: 'relative' },
  clip: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  axisRight: { paddingRight: GUTTER },
  gridLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed' },
  gridLabel: { position: 'absolute', right: 0, top: -7, fontFamily: 'Inter_500Medium', fontSize: 9, paddingLeft: 4 },
  baseline: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  bars: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', alignItems: 'flex-end' },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '100%', maxWidth: 26, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  zeroTick: { height: 2, borderRadius: 1, width: '50%', maxWidth: 14 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  axisText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  tooltip: { position: 'absolute', top: -6, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, alignItems: 'center' },
  tooltipValue: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  tooltipDate: { fontFamily: 'Inter_500Medium', fontSize: 9, marginTop: 1 },
  empty: { height: 96, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 20 },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 11, textAlign: 'center', lineHeight: 16 },
  cells: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cellWrap: { width: '12%', aspectRatio: 1 },
  cell: { flex: 1, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cellDetail: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 12 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 14, height: 14, borderRadius: 4, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  legendText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  ringText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});
