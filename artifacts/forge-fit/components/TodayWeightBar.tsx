import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { PressableScale as Pressable } from '@/components/Motion';
import { Ionicons } from '@/components/AppIcon';
import { triggerHaptic } from '@/components/FitUI';
import { useColors } from '@/hooks/useColors';
import { translate, type Language } from '@/lib/i18n';
import { localDateKey, mealDateKey, type WeightLog } from '@/lib/nutritionDates';

type TodayWeightBarProps = {
  language: Language;
  tracksWeight: boolean;
  onSave: (value: number) => void;
  /** Past weigh-ins; the trend line is drawn from these. */
  logs?: WeightLog[];
  fallbackWeight?: number | null;
  goalWeight?: number | null;
  testID?: string;
};

const copy: Record<Language, { last: string; noLog: string; logged: string; save: string; update: string; toGoal: string; trend: string }> = {
  tr: { last: 'Son kayıt', noLog: 'İlk kaydını gir', logged: 'Bugün kaydedildi', save: 'Kaydet', update: 'Güncelle', toGoal: 'hedefe', trend: 'Trend' },
  en: { last: 'Last entry', noLog: 'Log your first entry', logged: 'Logged today', save: 'Save', update: 'Update', toGoal: 'to goal', trend: 'Trend' },
  de: { last: 'Letzter Eintrag', noLog: 'Ersten Eintrag machen', logged: 'Heute eingetragen', save: 'Speichern', update: 'Aktualisieren', toGoal: 'bis zum Ziel', trend: 'Trend' },
  fr: { last: 'Dernière pesée', noLog: 'Ajoute ta première pesée', logged: 'Enregistré aujourd’hui', save: 'Enregistrer', update: 'Mettre à jour', toGoal: 'de l’objectif', trend: 'Tendance' },
  es: { last: 'Último registro', noLog: 'Registra tu primer peso', logged: 'Registrado hoy', save: 'Guardar', update: 'Actualizar', toGoal: 'al objetivo', trend: 'Tendencia' },
};

const round1 = (value: number) => Math.round(value * 10) / 10;
const CHIPS = [-0.5, -0.1, 0.1, 0.5];
const CHART_HEIGHT = 74;
const MAX_POINTS = 8;

/** Smooth line, its closed area and the last point for a series, scaled into width × height. */
function trendPaths(values: number[], width: number, height: number, goal: number | null) {
  const pad = 8;
  const all = goal === null ? values : [...values, goal];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = Math.max(max - min, 0.6);
  const y = (value: number) => pad + (1 - (value - min) / span) * (height - pad * 2);
  const points = values.map((value, index) => ({ x: pad + (values.length === 1 ? (width - pad * 2) : (index * (width - pad * 2)) / (values.length - 1)), y: y(value) }));
  let line = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    const mid = (a.x + b.x) / 2;
    line += ` C${mid.toFixed(1)} ${a.y.toFixed(1)} ${mid.toFixed(1)} ${b.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  const area = `${line} L${last.x.toFixed(1)} ${height} L${points[0].x.toFixed(1)} ${height} Z`;
  return { line, area, last, goalY: goal === null ? null : y(goal) };
}

/** A pulse that keeps the live end of the trend line breathing, so it reads as "now". */
function LiveDot({ x, y, color, still }: { x: number; y: number; color: string; still: boolean }) {
  const pulse = useSharedValue(0);
  React.useEffect(() => {
    if (still) { pulse.set(0); return undefined; }
    pulse.set(withRepeat(withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }), -1, false));
    return () => cancelAnimation(pulse);
  }, [pulse, still]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.4 * (1 - pulse.get()), transform: [{ scale: 1 + pulse.get() * 1.8 }] }));
  return <Animated.View pointerEvents="none" style={[styles.liveDot, { left: x - 7, top: y - 7, backgroundColor: color }, ring]} />;
}

export function TodayWeightBar({ language, tracksWeight, onSave, logs = [], fallbackWeight = null, goalWeight = null, testID = 'add-today-weight' }: TodayWeightBarProps) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const c = copy[language] ?? copy.en;
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const sorted = React.useMemo(() => [...logs].sort((a, b) => a.date.localeCompare(b.date)), [logs]);
  const last = sorted.at(-1);
  const loggedToday = last ? mealDateKey(last.date) === localDateKey() : false;
  const start = round1(last?.value ?? fallbackWeight ?? 70);
  const [value, setValue] = React.useState(start);
  const [text, setText] = React.useState(start.toFixed(1));
  const [width, setWidth] = React.useState(0);
  const bump = useSharedValue(0);
  const check = useSharedValue(loggedToday ? 1 : 0);

  React.useEffect(() => { setValue(start); setText(start.toFixed(1)); }, [start]);
  React.useEffect(() => { check.set(withSpring(loggedToday ? 1 : 0, { damping: 12, stiffness: 200 })); }, [check, loggedToday]);

  const adjust = (delta: number) => {
    triggerHaptic();
    const next = round1(Math.min(300, Math.max(20, value + delta)));
    setValue(next);
    setText(next.toFixed(1));
    bump.set(withSequence(withTiming(delta > 0 ? -1 : 1, { duration: 90 }), withSpring(0, { damping: 12, stiffness: 260 })));
  };
  const onType = (raw: string) => {
    setText(raw);
    const parsed = Number(raw.replace(',', '.'));
    if (Number.isFinite(parsed) && parsed >= 20 && parsed <= 300) setValue(round1(parsed));
  };
  const save = () => {
    if (!(value >= 20 && value <= 300)) return;
    triggerHaptic();
    onSave(value);
  };

  // The line ends at the value being typed, so adjusting it visibly bends the trend.
  const history = sorted.map((log) => log.value);
  const series = [...(loggedToday ? history.slice(0, -1) : history).slice(-(MAX_POINTS - 1)), value];
  const chartWidth = Math.max(width, 0);
  const shape = chartWidth > 0 ? trendPaths(series, chartWidth, CHART_HEIGHT, goalWeight) : null;
  const reference = loggedToday ? sorted.at(-2)?.value : last?.value;
  const delta = reference === undefined ? null : round1(value - reference);
  const toGoal = goalWeight === null ? null : round1(value - goalWeight);
  const good = delta !== null && delta !== 0 && goalWeight !== null ? Math.abs(value - goalWeight) < Math.abs(reference! - goalWeight) : delta !== null && delta < 0;
  const deltaColor = good ? colors.success : colors.orange;
  const numberStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bump.get() * 5 }] }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: check.get(), transform: [{ scale: 0.5 + check.get() * 0.5 }] }));

  if (!tracksWeight) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: `${colors.accent}18` }]}>
          <Ionicons name="scale-outline" size={18} color={colors.accent} />
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>{t('weeklyAddWeight')}</Text>
          <View style={styles.subRow}>
            <Text numberOfLines={1} style={[styles.sub, { color: colors.mutedForeground }]}>{last ? `${c.last}: ${last.value.toFixed(1)} kg` : c.noLog}</Text>
            {loggedToday ? (
              <Animated.View style={[styles.savedBadge, { backgroundColor: `${colors.success}18` }, checkStyle]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <Text numberOfLines={1} style={[styles.savedText, { color: colors.success }]}>{c.logged}</Text>
              </Animated.View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.readout}>
          <Animated.View style={[styles.valueRow, numberStyle]}>
            <TextInput
              testID={`${testID}-input`}
              value={text}
              onChangeText={onType}
              onBlur={() => setText(value.toFixed(1))}
              keyboardType="decimal-pad"
              selectTextOnFocus
              accessibilityLabel={t('currentWeight')}
              placeholder={t('currentWeight')}
              placeholderTextColor={colors.mutedForeground}
              style={[styles.valueInput, { color: colors.foreground }]}
            />
            <Text style={[styles.unit, { color: colors.mutedForeground }]}>kg</Text>
          </Animated.View>
          <View style={styles.pills}>
            {delta !== null && delta !== 0 ? (
              <View style={[styles.pill, { backgroundColor: `${deltaColor}1F` }]}>
                <Ionicons name={delta < 0 ? 'arrow-down' : 'arrow-up'} size={11} color={deltaColor} />
                <Text style={[styles.pillText, { color: deltaColor }]}>{Math.abs(delta).toFixed(1)}</Text>
              </View>
            ) : null}
            {toGoal !== null && Math.abs(toGoal) >= 0.1 ? (
              <View style={[styles.pill, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.pillText, { color: colors.mutedForeground }]}>{Math.abs(toGoal).toFixed(1)} {c.toGoal}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.chart} onLayout={(event) => setWidth(Math.floor(event.nativeEvent.layout.width))} accessibilityLabel={c.trend}>
          {shape ? (
            <>
              <Svg width={chartWidth} height={CHART_HEIGHT}>
                <Defs>
                  <LinearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={colors.accent} stopOpacity={0.28} />
                    <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                {shape.goalY !== null ? <Path d={`M0 ${shape.goalY.toFixed(1)} H${chartWidth}`} stroke={colors.mutedForeground} strokeOpacity={0.45} strokeWidth={1} strokeDasharray="3 4" /> : null}
                <Path d={shape.area} fill="url(#weightFill)" />
                <Path d={shape.line} fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx={shape.last.x} cy={shape.last.y} r={4.5} fill={colors.card} stroke={colors.accent} strokeWidth={2.5} />
              </Svg>
              <LiveDot x={shape.last.x} y={shape.last.y} color={colors.accent} still={reduceMotion} />
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.chips}>
          {CHIPS.map((step) => (
            <Pressable
              key={step}
              accessibilityRole="button"
              accessibilityLabel={`${step > 0 ? '+' : ''}${step} kg`}
              onPress={() => adjust(step)}
              scaleTo={0.92}
              style={[styles.chip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <Text style={[styles.chipText, { color: colors.foreground }]}>{step > 0 ? '+' : '−'}{Math.abs(step)}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={loggedToday ? c.update : c.save}
          onPress={save}
          scaleTo={0.94}
          style={[styles.save, { backgroundColor: colors.accent }]}
        >
          <Ionicons name={loggedToday ? 'checkmark-circle' : 'checkmark'} size={20} color={colors.accentForeground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, padding: 16, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 15, letterSpacing: -0.2 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sub: { flexShrink: 1, fontFamily: 'Inter_500Medium', fontSize: 11.5 },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  savedText: { fontFamily: 'Inter_700Bold', fontSize: 10.5 },
  body: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 },
  readout: { minWidth: 118 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  valueInput: { fontFamily: 'Inter_700Bold', fontSize: 38, letterSpacing: -2, padding: 0, minWidth: 96 },
  unit: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6, minHeight: 20 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  pillText: { fontFamily: 'Inter_700Bold', fontSize: 10.5 },
  chart: { flex: 1, height: CHART_HEIGHT, minWidth: 0 },
  liveDot: { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14 },
  chips: { flex: 1, flexDirection: 'row', gap: 6 },
  chip: { flex: 1, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  save: { width: 56, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
