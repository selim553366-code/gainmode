import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const PAPER = '#F6F2E8';
const INK = '#1D1C1A';
const FADED = '#8C877B';
const ROWS = 7;

export type ReceiptLabels = { analyzing: string; calories: string; protein: string; carbs: string; fat: string; kcal: string };
export type ReceiptResult = { name: string; calories: number; protein: number; carbs: number; fat: number };

const fmt = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

/** Ticks a counter up to `max` every `ms`, in steps, like a printer advancing a line. */
function useSteps(active: boolean, max: number, ms: number) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (!active) { setN(0); return undefined; }
    const id = setInterval(() => setN((v) => (v >= max ? v : v + 1)), ms);
    return () => clearInterval(id);
  }, [active, max, ms]);
  return n;
}

/**
 * Meal photo analysis shown as a thermal receipt. While the photo is analysed the receipt prints
 * line by line out of a slot, with dot-matrix dots ticking on the status line. When the result
 * arrives the meal name and the numbers print in, one row at a time. Everything moves in steps,
 * the way a receipt printer does, rather than glowing or sweeping.
 */
export function MealReceipt({ result, labels, locale }: { result: ReceiptResult | null; labels: ReceiptLabels; locale: string }) {
  const upper = (text: string) => text.toLocaleUpperCase(locale);
  const printed = useSteps(true, ROWS, 110);
  const dots = useSteps(!result, 1e9, 320) % 4;
  const values = useSteps(Boolean(result), 4, 170);
  const time = React.useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  const rows: Array<[string, string]> = [
    [labels.calories, result && values >= 1 ? `${fmt(result.calories)} ${labels.kcal}` : '---'],
    [labels.protein, result && values >= 2 ? `${fmt(result.protein)} g` : '--'],
    [labels.carbs, result && values >= 3 ? `${fmt(result.carbs)} g` : '--'],
    [labels.fat, result && values >= 4 ? `${fmt(result.fat)} g` : '--'],
  ];

  return <View style={styles.wrap} accessibilityLabel={result ? result.name : labels.analyzing}>
    <View style={styles.slot} />
    <View style={styles.paper}>
      {printed >= 1 ? <View style={styles.row}><Text style={styles.brand}>GAINMODE</Text><Text style={styles.small}>{time}</Text></View> : null}
      {printed >= 2 ? <Text numberOfLines={1} ellipsizeMode="clip" style={styles.rule}>{'- '.repeat(40)}</Text> : null}
      {printed >= 3 ? <Text numberOfLines={1} style={styles.title}>
        {result ? upper(result.name) : `${upper(labels.analyzing)}${'.'.repeat(dots)}`}
      </Text> : null}
      {rows.map(([label, value], index) => printed >= 4 + index ? <View key={label} style={styles.row}>
        <Text style={styles.label}>{upper(label)}</Text>
        <Text numberOfLines={1} ellipsizeMode="clip" style={styles.leader}>{' .'.repeat(40)}</Text>
        <Text style={[styles.value, value.startsWith('-') && { color: FADED }]}>{value}</Text>
      </View> : null)}
    </View>
    <Svg width="100%" height={8} viewBox="0 0 120 8" preserveAspectRatio="none" style={styles.edge}>
      <Path d={`M0 0 H120 V2 ${Array.from({ length: 20 }, (_, i) => `L${120 - i * 6 - 3} 8 L${120 - (i + 1) * 6} 2`).join(' ')} Z`} fill={PAPER} />
    </Svg>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14, marginHorizontal: 6 },
  slot: { height: 8, borderRadius: 4, backgroundColor: '#16171B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', marginHorizontal: -6, zIndex: 2 },
  paper: { backgroundColor: PAPER, marginTop: -4, paddingTop: 14, paddingHorizontal: 14, paddingBottom: 8, gap: 6, minHeight: 34 },
  edge: { marginTop: -1 },
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  brand: { fontFamily: MONO, fontSize: 12, fontWeight: '700', letterSpacing: 2, color: INK },
  small: { fontFamily: MONO, fontSize: 11, color: FADED },
  rule: { fontFamily: MONO, fontSize: 11, color: FADED },
  title: { fontFamily: MONO, fontSize: 13, fontWeight: '700', color: INK, marginBottom: 2 },
  label: { fontFamily: MONO, fontSize: 12, color: INK },
  leader: { flex: 1, fontFamily: MONO, fontSize: 12, color: FADED, marginHorizontal: 4 },
  value: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: INK },
});
