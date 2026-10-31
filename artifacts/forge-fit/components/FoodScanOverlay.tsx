import React from 'react';
import { Image, Modal, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@/components/AppIcon';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';

export type FoodScanPhase = 'idle' | 'flying' | 'analyzing' | 'done';
type Macros = { calories: number; protein: number; carbs: number; fat: number };

const stepCopy: Record<string, { steps: string[]; done: string }> = {
  tr: { steps: ['Tabak tanınıyor', 'Porsiyon ölçülüyor', 'İçerikler ayrıştırılıyor', 'Makrolar hesaplanıyor'], done: 'Analiz tamam' },
  en: { steps: ['Recognising the plate', 'Measuring the portion', 'Separating ingredients', 'Calculating macros'], done: 'Analysis complete' },
  de: { steps: ['Teller wird erkannt', 'Portion wird gemessen', 'Zutaten werden getrennt', 'Makros werden berechnet'], done: 'Analyse fertig' },
  fr: { steps: ['Reconnaissance de l’assiette', 'Mesure de la portion', 'Séparation des ingrédients', 'Calcul des macros'], done: 'Analyse terminée' },
  es: { steps: ['Reconociendo el plato', 'Midiendo la porción', 'Separando ingredientes', 'Calculando macros'], done: 'Análisis listo' },
};

/** Spots the detection box hops between, as fractions of the photo. */
const DETECT_SPOTS = [
  { x: 0.12, y: 0.16, w: 0.42, h: 0.38 },
  { x: 0.5, y: 0.3, w: 0.38, h: 0.4 },
  { x: 0.2, y: 0.52, w: 0.46, h: 0.34 },
  { x: 0.3, y: 0.22, w: 0.4, h: 0.5 },
];

/** A macro readout whose digits spin like a slot machine until the real value lands. */
function MacroChip({ label, unit, value, color, spinning, delay, style }: { label: string; unit: string; value: number | null; color: string; spinning: boolean; delay: number; style: object }) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const [shown, setShown] = React.useState(0);
  const enter = useSharedValue(reduced ? 1 : 0);
  const bob = useSharedValue(0);
  const pop = useSharedValue(1);

  React.useEffect(() => {
    if (reduced) return undefined;
    enter.set(withDelay(delay, withSpring(1, { damping: 13, stiffness: 160 })));
    bob.set(withDelay(delay, withRepeat(withTiming(1, { duration: 1600 + delay, easing: Easing.inOut(Easing.sin) }), -1, true)));
    return () => cancelAnimation(bob);
  }, [bob, delay, enter, reduced]);

  React.useEffect(() => {
    if (!spinning) return undefined;
    const top = unit === 'kcal' ? 900 : 90;
    const timer = setInterval(() => setShown(Math.round(Math.random() * top)), 70);
    return () => clearInterval(timer);
  }, [spinning, unit]);

  React.useEffect(() => {
    if (value === null || spinning) return;
    setShown(Math.round(value));
    if (!reduced) pop.set(withSequence(withTiming(1.12, { duration: 140 }), withSpring(1, { damping: 10, stiffness: 220 })));
  }, [pop, reduced, spinning, value]);

  const animated = useAnimatedStyle(() => ({
    opacity: enter.get(),
    transform: [{ translateY: (1 - enter.get()) * 16 + bob.get() * -5 }, { scale: (0.7 + enter.get() * 0.3) * pop.get() }],
  }));
  const locked = !spinning && value !== null;
  return <Animated.View style={[styles.chip, { backgroundColor: colors.card, borderColor: locked ? color : colors.border }, style, animated]}>
    <View style={[styles.chipDot, { backgroundColor: color }]} />
    <View>
      <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.chipValue, { color: locked ? colors.foreground : `${colors.foreground}88` }]}>{shown}<Text style={styles.chipUnit}> {unit}</Text></Text>
    </View>
    {locked ? <Ionicons name="checkmark-circle" size={16} color={color} /> : null}
  </Animated.View>;
}

/**
 * Full-screen scan shown while a meal photo is analysed. The photo zooms in under a digital grid,
 * a laser sweeps it top to bottom and a detection box hops between spots as if picking out each
 * food. Four macro chips float around it with spinning digits; when the result arrives they lock
 * onto the real values, the scan turns green and a check pops before the sheet fades out.
 */
export function FoodScanOverlay({ uri, phase, result }: { uri: string | null; phase: FoodScanPhase; result: Macros | null }) {
  const colors = useColors();
  const { language } = useFit();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const copy = stepCopy[language] ?? stepCopy.en;
  const size = Math.min(width - 72, 300);
  const visible = phase !== 'idle' && !!uri;
  const done = phase === 'done';
  const [step, setStep] = React.useState(0);

  const appear = useSharedValue(0);
  const sweep = useSharedValue(0);
  const hop = useSharedValue(0);
  const grid = useSharedValue(0);
  const check = useSharedValue(0);

  React.useEffect(() => {
    if (!visible) {
      [appear, sweep, hop, grid, check].forEach((value) => { cancelAnimation(value); value.set(0); });
      setStep(0);
      return undefined;
    }
    appear.set(reduced ? 1 : withSpring(1, { damping: 16, stiffness: 120 }));
    if (reduced) return undefined;
    sweep.set(withRepeat(withSequence(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.cubic) }), withTiming(0, { duration: 1300, easing: Easing.inOut(Easing.cubic) })), -1));
    hop.set(withRepeat(withTiming(DETECT_SPOTS.length, { duration: DETECT_SPOTS.length * 1100, easing: Easing.linear }), -1));
    grid.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true));
    return undefined;
  }, [appear, check, grid, hop, reduced, sweep, visible]);

  React.useEffect(() => {
    if (!visible || done) return undefined;
    const timer = setInterval(() => setStep((current) => (current + 1) % copy.steps.length), 1400);
    return () => clearInterval(timer);
  }, [copy.steps.length, done, visible]);

  React.useEffect(() => {
    if (!done) return;
    cancelAnimation(sweep);
    cancelAnimation(hop);
    sweep.set(withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }));
    check.set(reduced ? 1 : withDelay(250, withSpring(1, { damping: 9, stiffness: 180 })));
  }, [check, done, hop, reduced, sweep]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, appear.get()) }));
  const photoStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.55 + appear.get() * 0.45 }, { rotate: `${(1 - appear.get()) * -8}deg` }] }));
  const laserStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sweep.get() * (size - 4) }] }));
  const gridStyle = useAnimatedStyle(() => ({ opacity: 0.25 + grid.get() * 0.35 }));
  const boxStyle = useAnimatedStyle(() => {
    const t = hop.get() % DETECT_SPOTS.length;
    const from = DETECT_SPOTS[Math.floor(t)];
    const to = DETECT_SPOTS[(Math.floor(t) + 1) % DETECT_SPOTS.length];
    // Rest on each spot for most of the second, then glide to the next.
    const raw = t - Math.floor(t);
    const k = raw < 0.6 ? 0 : (raw - 0.6) / 0.4;
    const e = k * k * (3 - 2 * k);
    const mix = (a: number, b: number) => a + (b - a) * e;
    return {
      left: mix(from.x, to.x) * size,
      top: mix(from.y, to.y) * size,
      width: mix(from.w, to.w) * size,
      height: mix(from.h, to.h) * size,
      opacity: done ? 0 : 1,
    };
  });
  const checkStyle = useAnimatedStyle(() => ({ opacity: check.get(), transform: [{ scale: 0.3 + check.get() * 0.7 }] }));

  if (!visible) return null;
  const tone = done ? colors.success : colors.accent;
  const spinning = !done || !result;
  const chips = [
    { key: 'calories', label: translate(language, 'calories'), unit: 'kcal', value: result?.calories ?? null, color: '#FF8A3D', style: { left: -18, top: -26 } },
    { key: 'protein', label: translate(language, 'protein'), unit: 'g', value: result?.protein ?? null, color: '#3DD68C', style: { right: -18, top: size * 0.24 } },
    { key: 'carbs', label: translate(language, 'carbs'), unit: 'g', value: result?.carbs ?? null, color: '#6E9BFF', style: { left: -22, top: size * 0.62 } },
    { key: 'fat', label: translate(language, 'fat'), unit: 'g', value: result?.fat ?? null, color: '#FCC94D', style: { right: -14, bottom: -24 } },
  ];

  return <Modal visible transparent animationType="none" statusBarTranslucent>
    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
      <View style={[styles.stage, { width: size, height: size }]}>
        <Animated.View style={[styles.photoWrap, { width: size, height: size, borderColor: tone, shadowColor: tone }, photoStyle]}>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <Animated.View style={[StyleSheet.absoluteFill, gridStyle]} pointerEvents="none">
            <Svg width={size} height={size}>
              <Defs>
                <Pattern id="scanDots" width={16} height={16} patternUnits="userSpaceOnUse">
                  <Circle cx={8} cy={8} r={1.3} fill="#FFFFFF" />
                </Pattern>
              </Defs>
              <Rect width={size} height={size} fill="url(#scanDots)" />
            </Svg>
          </Animated.View>
          {done ? <View style={[StyleSheet.absoluteFill, { backgroundColor: `${colors.success}22` }]} /> : null}
          <Animated.View style={[styles.laserWrap, laserStyle]} pointerEvents="none">
            <LinearGradient colors={[`${tone}00`, `${tone}66`]} style={styles.laserTrail} />
            <View style={[styles.laser, { backgroundColor: tone, shadowColor: tone }]} />
          </Animated.View>
          <Animated.View style={[styles.detect, boxStyle]} pointerEvents="none">
            {[styles.cornerTL, styles.cornerTR, styles.cornerBL, styles.cornerBR].map((corner, index) => <View key={index} style={[styles.corner, corner, { borderColor: '#FFFFFF' }]} />)}
            <View style={[styles.detectTag, { backgroundColor: tone }]}><Text style={styles.detectTagText}>AI</Text></View>
          </Animated.View>
          <Animated.View style={[styles.checkWrap, checkStyle]} pointerEvents="none">
            <View style={[styles.checkBadge, { backgroundColor: colors.success }]}><Ionicons name="checkmark" size={34} color="#FFFFFF" /></View>
          </Animated.View>
        </Animated.View>
        {chips.map((chip, index) => <MacroChip key={chip.key} label={chip.label} unit={chip.unit} value={chip.value} color={chip.color} spinning={spinning} delay={250 + index * 120} style={chip.style} />)}
      </View>
      <View style={styles.status}>
        <View style={[styles.statusDot, { backgroundColor: tone }]} />
        <Text style={styles.statusText}>{done ? copy.done : copy.steps[step]}</Text>
      </View>
      <View style={styles.steps}>
        {copy.steps.map((label, index) => <View key={label} style={[styles.stepBar, { backgroundColor: done || index <= step ? tone : 'rgba(255,255,255,0.18)', width: done || index === step ? 26 : 12 }]} />)}
      </View>
    </Animated.View>
  </Modal>;
}

const CORNER = 18;
const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(4,6,14,0.9)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  stage: { position: 'relative' },
  photoWrap: { borderRadius: 34, overflow: 'hidden', borderWidth: 2, backgroundColor: '#0A0D18', shadowOpacity: 0.6, shadowRadius: 30, shadowOffset: { width: 0, height: 0 } },
  laserWrap: { position: 'absolute', left: 0, right: 0, top: -60, height: 64, justifyContent: 'flex-end' },
  laserTrail: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 3 },
  laser: { height: 3, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  detect: { position: 'absolute' },
  corner: { position: 'absolute', width: CORNER, height: CORNER },
  cornerTL: { left: 0, top: 0, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { right: 0, top: 0, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { left: 0, bottom: 0, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { right: 0, bottom: 0, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 8 },
  detectTag: { position: 'absolute', left: 6, top: -11, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  detectTagText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.6, color: '#FFFFFF' },
  checkWrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  checkBadge: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF' },
  chip: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.4 },
  chipValue: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  chipUnit: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 54 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.3, color: '#FFFFFF' },
  steps: { flexDirection: 'row', gap: 6, marginTop: 14 },
  stepBar: { height: 5, borderRadius: 3 },
});
