import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Pointer } from 'lucide-react-native';
import type { Language } from '@/lib/i18n';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const PAPER = '#F6F2E8';
const INK = '#1D1C1A';
const FADED = '#8C877B';
const LCD_BG = '#0B1510';
const LCD_ON = '#8CF5A6';
const LCD_OFF = 'rgba(140,245,166,0.16)';
const TEETH = 7;
const PRINT_STEPS = 9;
const TEAR_AT = 96;

export type ReceiptLabels = { calories: string; protein: string; carbs: string; fat: string; kcal: string };
export type ReceiptResult = { name: string; calories: number; protein: number; carbs: number; fat: number };

const SCREEN: Record<Language, { analyzing: string; printing: string; tear: string; added: string; hint: string }> = {
  tr: { analyzing: 'MAKRO ANALİZİ', printing: 'FİŞ BASILIYOR', tear: 'FİŞİ KOPAR', added: 'ÖĞÜN EKLENDİ', hint: 'Yemeği eklemek için fişi kopar' },
  en: { analyzing: 'ANALYZING MACROS', printing: 'PRINTING', tear: 'TEAR TO ADD', added: 'MEAL ADDED', hint: 'Tear off the receipt to add the meal' },
  de: { analyzing: 'ANALYSE MAKROS', printing: 'DRUCKE BELEG', tear: 'ABREISSEN', added: 'HINZUGEFÜGT', hint: 'Reiß den Beleg ab, um die Mahlzeit hinzuzufügen' },
  fr: { analyzing: 'ANALYSE MACROS', printing: 'IMPRESSION', tear: 'DÉTACHER', added: 'REPAS AJOUTÉ', hint: 'Détache le ticket pour ajouter le repas' },
  es: { analyzing: 'ANALIZANDO MACROS', printing: 'IMPRIMIENDO', tear: 'ARRANCAR', added: 'AÑADIDO', hint: 'Arranca el ticket para añadir la comida' },
};

const fmt = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
const haptic = (kind: 'tick' | 'snap' | 'done') => {
  if (Platform.OS === 'web') return;
  const run = kind === 'tick' ? Haptics.selectionAsync() : kind === 'snap' ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  run.catch(() => undefined);
};

/** A counter that ticks every `ms` while active, for the stepped, pixel-screen motion. */
function useTicker(active: boolean, ms: number) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setN((v) => v + 1), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return n;
}

/** Zig-zag paper edge; `down` teeth hang below the line, otherwise they point up. */
function teethPath(width: number, down: boolean) {
  const count = Math.max(1, Math.round(width / 9));
  const step = width / count;
  let d = down ? `M0 0 H${width} V0` : `M0 ${TEETH} H${width} V${TEETH}`;
  for (let i = count; i > 0; i--) {
    const x = i * step;
    d += down ? ` L${x - step / 2} ${TEETH} L${x - step} 0` : ` L${x - step / 2} 0 L${x - step} ${TEETH}`;
  }
  return `${d} Z`;
}

/** The terminal's dot-matrix screen: two lines of glowing pixel text over a fine pixel grid. */
function PixelScreen({ line1, line2 }: { line1: string; line2: string }) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  return <View style={styles.lcd} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
    <Text numberOfLines={1} style={styles.lcdText}>{line1}</Text>
    <Text numberOfLines={1} style={[styles.lcdText, styles.lcdSub]}>{line2}</Text>
    {size.w ? <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: Math.ceil(size.h / 3) }, (_, i) => <Rect key={`h${i}`} x={0} y={i * 3 + 2} width={size.w} height={1} fill={LCD_BG} opacity={0.55} />)}
      {Array.from({ length: Math.ceil(size.w / 3) }, (_, i) => <Rect key={`v${i}`} x={i * 3 + 2} y={0} width={1} height={size.h} fill={LCD_BG} opacity={0.4} />)}
    </Svg> : null}
  </View>;
}

/** A row of square pixels, `on` of them lit starting at `from` (wrapping). */
const blocks = (count: number, on: number, from = 0) =>
  Array.from({ length: count }, (_, i) => (((i - from + count) % count) < on ? '■' : '□')).join('');

/**
 * Meal photo analysis as a card terminal. While the photo is analysed, the terminal's pixel
 * screen reads "analyzing macros" with a stepping block bar. When the result arrives the
 * receipt feeds out of the slot in printer-like jerks, and a hand shows it can be torn off.
 * Pulling the receipt left or right bends it on its last attached corner; past a point it
 * snaps free along the serrated line and flies away, and `onTear` adds the meal.
 */
export function MealReceipt({ result, labels, language, onTear }: { result: ReceiptResult | null; labels: ReceiptLabels; language: Language; onTear: () => void }) {
  const copy = SCREEN[language] ?? SCREEN.en;
  const upper = (text: string) => text.toLocaleUpperCase(language);
  const [stage, setStage] = React.useState<'analyzing' | 'printing' | 'ready' | 'torn'>('analyzing');
  const [paperH, setPaperH] = React.useState(0);
  const [paperW, setPaperW] = React.useState(0);
  const tick = useTicker(stage !== 'torn', stage === 'analyzing' ? 140 : 380);
  const time = React.useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  const feed = useSharedValue(0);
  const dragX = useSharedValue(0);
  const flying = useSharedValue(0);
  const stubKick = useSharedValue(0);
  const hand = useSharedValue(0);

  React.useEffect(() => { if (result && stage === 'analyzing') setStage('printing'); }, [result, stage]);

  // Feed the paper out in short jerks, with a printer tick on each.
  React.useEffect(() => {
    if (stage !== 'printing' || !paperH) return undefined;
    feed.set(withSequence(...Array.from({ length: PRINT_STEPS }, (_, i) => withDelay(i ? 70 : 120, withTiming((i + 1) / PRINT_STEPS, { duration: 90, easing: Easing.out(Easing.quad) })))));
    const timers = Array.from({ length: PRINT_STEPS }, (_, i) => setTimeout(() => haptic('tick'), 120 + i * 160));
    const done = setTimeout(() => setStage('ready'), 120 + PRINT_STEPS * 160 + 120);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, [stage, paperH]); // eslint-disable-line react-hooks/exhaustive-deps

  // The hand sweeps across the tear line on a loop until the receipt is touched.
  React.useEffect(() => {
    if (stage !== 'ready') { cancelAnimation(hand); hand.set(0); return undefined; }
    hand.set(withRepeat(withSequence(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) }),
      withDelay(250, withTiming(-1, { duration: 900, easing: Easing.inOut(Easing.cubic) })),
      withDelay(250, withTiming(0, { duration: 0 })),
    ), -1));
    return () => cancelAnimation(hand);
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const [touched, setTouched] = React.useState(false);
  const [gone, setGone] = React.useState(false);
  React.useEffect(() => {
    if (stage !== 'torn') return undefined;
    const id = setTimeout(() => setGone(true), 600);
    return () => clearTimeout(id);
  }, [stage]);
  const tear = React.useCallback(() => {
    haptic('snap');
    setTimeout(() => haptic('done'), 260);
    setStage('torn');
    onTear();
  }, [onTear]);

  const pan = usePanGesture({
    enabled: stage === 'ready',
    activeOffsetX: [-8, 8],
    failOffsetY: [-16, 16],
    onActivate: () => {
      'worklet';
      scheduleOnRN(setTouched, true);
    },
    onUpdate: (event) => {
      'worklet';
      dragX.set(event.translationX);
    },
    onDeactivate: (event) => {
      'worklet';
      const x = dragX.get();
      const dir = x === 0 ? Math.sign(event.velocityX) || 1 : Math.sign(x);
      if (Math.abs(x) > TEAR_AT || Math.abs(event.velocityX) > 900) {
        dragX.set(dir * Math.max(Math.abs(x), TEAR_AT));
        flying.set(withTiming(dir, { duration: 520, easing: Easing.out(Easing.cubic) }));
        stubKick.set(withSequence(withTiming(1, { duration: 60 }), withSpring(0, { damping: 6, stiffness: 420 })));
        scheduleOnRN(tear);
      } else {
        dragX.set(withSpring(0, { damping: 13, stiffness: 260 }));
      }
    },
  });

  // Before the snap the paper bends on the corner it is still attached at; after it, it flies.
  const paperStyle = useAnimatedStyle(() => {
    const x = dragX.get();
    const f = flying.get();
    const pull = Math.max(-1.4, Math.min(1.4, x / TEAR_AT));
    // Pulled right, the paper hinges on its top-right corner and the left side drops (and mirrored).
    const bend = -pull * 7;
    const free = Math.abs(f);
    return {
      transformOrigin: x >= 0 ? 'right top' : 'left top',
      opacity: paperH ? 1 - free * 0.9 : 0,
      transform: [
        { translateY: (feed.get() - 1) * paperH + Math.abs(pull) * 6 + free * 150 },
        { translateX: pull * 12 + f * 360 },
        { rotate: `${bend - f * 20}deg` },
      ],
    };
  });
  const stubStyle = useAnimatedStyle(() => ({ transform: [{ translateY: stubKick.get() * 3 }] }));
  const handStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(hand.get()) * 3) * 0.95,
    transform: [{ translateX: hand.get() * 70 }, { rotate: `${hand.get() * 10}deg` }],
  }));

  const screen = (() => {
    if (stage === 'analyzing') return [copy.analyzing, blocks(14, 4, tick % 14)];
    if (stage === 'printing') return [copy.printing, blocks(14, Math.min(14, 2 + tick * 4), 0)];
    if (stage === 'ready') return [copy.tear, tick % 2 ? '<<<   ▮▮   >>>' : ' <<   ▮▮   >> '];
    return [`${copy.added} ✓`, result ? `${fmt(result.calories)} ${upper(labels.kcal)}` : ''];
  })();

  const rows: Array<[string, string]> = result ? [
    [labels.calories, `${fmt(result.calories)} ${labels.kcal}`],
    [labels.protein, `${fmt(result.protein)} g`],
    [labels.carbs, `${fmt(result.carbs)} g`],
    [labels.fat, `${fmt(result.fat)} g`],
  ] : [];

  return <View style={styles.wrap}>
    <View style={styles.terminal}>
      <View style={styles.terminalTop}>
        <View style={styles.led} />
        <Text style={styles.brandPlate}>GAINMODE · POS</Text>
        <View style={[styles.led, { backgroundColor: stage === 'analyzing' ? (tick % 6 < 3 ? '#FFB547' : '#5A4220') : '#3DD68C' }]} />
      </View>
      <PixelScreen line1={screen[0]} line2={screen[1]} />
      <View style={styles.keys}>{Array.from({ length: 4 }, (_, i) => <View key={i} style={styles.key} />)}</View>
      <View style={styles.slot} />
    </View>

    {result ? <View style={[styles.paperArea, stage === 'printing' && { overflow: 'hidden' }]}>
      {!gone ? <GestureDetector gesture={pan}>
        <Animated.View
          style={[styles.paper, paperStyle]}
          onLayout={(e) => { if (!paperH) setPaperH(e.nativeEvent.layout.height); }}
          accessible
          accessibilityRole="button"
          accessibilityLabel={copy.hint}
          onAccessibilityTap={stage === 'ready' ? tear : undefined}
        >
          {paperW ? <Svg width={paperW} height={TEETH} style={styles.teethTop}><Path d={teethPath(paperW, false)} fill={PAPER} /></Svg> : null}
          <View style={styles.paperBody}>
            <View style={styles.row}><Text style={styles.brand}>GAINMODE</Text><Text style={styles.small}>{time}</Text></View>
            <Text numberOfLines={1} ellipsizeMode="clip" style={styles.rule}>{'- '.repeat(40)}</Text>
            <Text numberOfLines={2} style={styles.title}>{result ? upper(result.name) : ''}</Text>
            {rows.map(([label, value]) => <View key={label} style={styles.row}>
              <Text style={styles.label}>{upper(label)}</Text>
              <Text numberOfLines={1} ellipsizeMode="clip" style={styles.leader}>{' .'.repeat(40)}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>)}
            <Text numberOfLines={1} ellipsizeMode="clip" style={styles.rule}>{'- '.repeat(40)}</Text>
            <Svg width="100%" height={22} viewBox="0 0 120 22" preserveAspectRatio="none">
              {[2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 2, 3, 1].reduce<{ x: number; els: React.ReactNode[] }>((acc, w, i) => {
                if (i % 2 === 0) acc.els.push(<Rect key={i} x={acc.x} y={0} width={w} height={22} fill={INK} />);
                acc.x += w + 1.2;
                return acc;
              }, { x: 18, els: [] }).els}
            </Svg>
          </View>
          {paperW ? <Svg width={paperW} height={TEETH} style={styles.edge}><Path d={teethPath(paperW, true)} fill={PAPER} /></Svg> : null}

          {stage === 'ready' && !touched ? <View pointerEvents="none" style={styles.hintLayer}>
            <View style={styles.hintPill}><Text style={styles.hintText}>{copy.hint}</Text></View>
            <Animated.View style={[styles.hand, handStyle]}><Pointer size={30} color={INK} fill="#FFFFFF" strokeWidth={1.6} /></Animated.View>
          </View> : null}
        </Animated.View>
      </GestureDetector> : null}
      {/* The stub that stays in the slot; its serrated bottom matches the torn top of the receipt. */}
      <Animated.View style={[styles.stub, stubStyle]} onLayout={(e) => setPaperW(e.nativeEvent.layout.width)}>
        <View style={styles.stubPaper} />
        {paperW ? <Svg width={paperW} height={TEETH} style={styles.teeth}><Path d={teethPath(paperW, true)} fill={PAPER} /></Svg> : null}
      </Animated.View>

    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14 },
  terminal: { backgroundColor: '#1A1C21', borderRadius: 22, paddingTop: 10, paddingHorizontal: 12, paddingBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', zIndex: 2 },
  terminalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
  led: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3A3D45' },
  brandPlate: { fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.45)' },
  lcd: { backgroundColor: LCD_BG, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 2, borderColor: '#05090A', overflow: 'hidden' },
  lcdText: { fontFamily: MONO, fontSize: 16, fontWeight: '700', letterSpacing: 1.5, color: LCD_ON, textShadowColor: 'rgba(140,245,166,0.55)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
  lcdSub: { fontSize: 13, marginTop: 4, color: LCD_ON, opacity: 0.9 },
  keys: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 },
  key: { width: 26, height: 6, borderRadius: 3, backgroundColor: '#2B2E36' },
  slot: { height: 6, borderRadius: 3, backgroundColor: '#050608', marginTop: 12, marginHorizontal: 10 },
  paperArea: { marginHorizontal: 30, marginTop: -10, zIndex: 1 },
  stub: { position: 'absolute', top: 0, left: 0, right: 0, height: 14, zIndex: 2 },
  stubPaper: { height: 7, backgroundColor: PAPER },
  teeth: { position: 'absolute', top: 7, left: 0 },
  paper: { marginTop: 14 - TEETH },
  teethTop: { marginBottom: -1 },
  paperBody: { backgroundColor: PAPER, paddingTop: 10, paddingHorizontal: 14, paddingBottom: 10, gap: 6 },
  edge: { marginTop: -1 },
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  brand: { fontFamily: MONO, fontSize: 12, fontWeight: '700', letterSpacing: 2, color: INK },
  small: { fontFamily: MONO, fontSize: 11, color: FADED },
  rule: { fontFamily: MONO, fontSize: 11, color: FADED },
  title: { fontFamily: MONO, fontSize: 13, fontWeight: '700', color: INK, marginBottom: 2 },
  label: { fontFamily: MONO, fontSize: 12, color: INK },
  leader: { flex: 1, fontFamily: MONO, fontSize: 12, color: FADED, marginHorizontal: 4 },
  value: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: INK },
  hintLayer: { position: 'absolute', left: 0, right: 0, top: 4, alignItems: 'center' },
  hintPill: { backgroundColor: 'rgba(22,23,27,0.92)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  hintText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#FFFFFF' },
  hand: { marginTop: 4 },
});
