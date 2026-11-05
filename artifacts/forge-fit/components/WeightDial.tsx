import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, useAnimatedReaction, useAnimatedStyle, useSharedValue, withDecay, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@/components/AppIcon';
import { PressableScale as Pressable } from '@/components/Motion';
import { triggerHaptic } from '@/components/FitUI';
import { useColors } from '@/hooks/useColors';

type WeightDialProps = {
  /** Weight in kilograms. */
  value: number;
  unit: 'metric' | 'imperial';
  /** What the number field shows, owned by the parent so typing keeps working. */
  inputValue: string;
  onInputChange: (value: string) => void;
  onChange: (valueKg: number) => void;
};

const KG_PER_POUND = 1 / 2.20462;
const RADIUS = 300;
const TOTAL_DEG = 330;
const RIM = 18;
const DIAL_HEIGHT = 104;
const TICK = { major: 26, medium: 16, minor: 9 };

/** The scale a unit uses: where it starts, how many ticks it has, and which ticks are bigger. */
function scaleFor(unit: 'metric' | 'imperial') {
  return unit === 'metric'
    ? { min: 35, max: 200, step: 0.5, majorEvery: 10, mediumEvery: 2, fine: 0.1, label: 'kg', alt: 'lb' }
    : { min: 70, max: 450, step: 1, majorEvery: 10, mediumEvery: 5, fine: 0.5, label: 'lb', alt: 'kg' };
}

const polar = (angleDeg: number, radius: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: RADIUS + radius * Math.sin(rad), y: RADIUS - radius * Math.cos(rad) };
};

/**
 * A bathroom-scale dial: a fixed needle at the top and a wheel of ticks that turns beneath it. Drag it sideways and it
 * coasts, then settles on the nearest tick with a spring. Left drag raises the weight, like pulling a ruler across.
 */
export function WeightDial({ value, unit, inputValue, onInputChange, onChange }: WeightDialProps) {
  const colors = useColors();
  const scale = scaleFor(unit);
  const count = Math.round((scale.max - scale.min) / scale.step);
  const degPerTick = TOTAL_DEG / count;
  const pxPerTick = (RADIUS * Math.PI / 180) * degPerTick;
  const toDisplay = (kg: number) => (unit === 'metric' ? kg : kg / KG_PER_POUND);
  const toKg = (shown: number) => (unit === 'metric' ? shown : shown * KG_PER_POUND);
  const indexFor = (kg: number) => Math.max(0, Math.min(count, (toDisplay(kg) - scale.min) / scale.step));

  const index = useSharedValue(indexFor(value));
  const lastTick = useSharedValue(Math.round(indexFor(value)));
  const interacting = useSharedValue(false);
  const bump = useSharedValue(0);
  const emitted = React.useRef(value);
  const lastHaptic = React.useRef(0);
  const [width, setWidth] = React.useState(0);

  const emit = React.useCallback((tick: number) => {
    const next = Math.round(toKg(scale.min + tick * scale.step) * 10) / 10;
    emitted.current = next;
    const now = Date.now();
    if (now - lastHaptic.current > 45) { lastHaptic.current = now; triggerHaptic(); }
    onChange(next);
  }, [onChange, unit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Every tick the wheel passes while the user is driving it is a new weight.
  useAnimatedReaction(
    () => Math.round(index.get()),
    (tick, previous) => {
      if (previous === null || tick === previous || !interacting.get()) return;
      lastTick.set(tick);
      bump.set(withSequence(withTiming(tick > previous ? -1 : 1, { duration: 60 }), withSpring(0, { damping: 12, stiffness: 300 })));
      scheduleOnRN(emit, tick);
    },
  );

  // A typed weight or a unit switch turns the wheel to match without sending anything back.
  React.useEffect(() => {
    if (Math.abs(value - emitted.current) < 0.05) return;
    emitted.current = value;
    interacting.set(false);
    index.set(withTiming(indexFor(value), { duration: 420 }));
  }, [value, unit]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { interacting.set(false); index.set(indexFor(value)); }, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  const startIndex = useSharedValue(0);
  // Horizontal drags turn the wheel; a mostly vertical drag fails fast so the page can still scroll.
  const pan = usePanGesture({
    activeOffsetX: [-6, 6],
    failOffsetY: [-14, 14],
    onBegin: () => {
      'worklet';
      cancelAnimation(index);
      startIndex.set(index.get());
    },
    onActivate: () => {
      'worklet';
      interacting.set(true);
    },
    onUpdate: (event) => {
      'worklet';
      index.set(Math.max(0, Math.min(count, startIndex.get() - event.translationX / pxPerTick)));
    },
    onDeactivate: (event) => {
      'worklet';
      index.set(withDecay({ velocity: -event.velocityX / pxPerTick, deceleration: 0.992, clamp: [0, count] }, (finished) => {
        'worklet';
        if (!finished) return;
        index.set(withSpring(Math.round(index.get()), { damping: 18, stiffness: 220 }, () => {
          'worklet';
          interacting.set(false);
        }));
      }));
    },
    // A touch that never became a drag (a tap, or a vertical scroll) only needs the wheel put back on a tick.
    onFinalize: () => {
      'worklet';
      if (interacting.get()) return;
      index.set(withSpring(Math.round(index.get()), { damping: 18, stiffness: 220 }));
    },
  });

  const nudge = (deltaDisplay: number) => {
    const shown = Math.max(scale.min, Math.min(scale.max, toDisplay(value) + deltaDisplay));
    triggerHaptic();
    onChange(Math.round(toKg(shown) * 10) / 10);
  };

  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${TOTAL_DEG / 2 - index.get() * degPerTick}deg` }] }));
  const numberStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bump.get() * 5 }] }));

  const paths = React.useMemo(() => {
    const major: string[] = [];
    const medium: string[] = [];
    const minor: string[] = [];
    for (let i = 0; i <= count; i += 1) {
      const angle = i * degPerTick - TOTAL_DEG / 2;
      const length = i % scale.majorEvery === 0 ? TICK.major : i % scale.mediumEvery === 0 ? TICK.medium : TICK.minor;
      const a = polar(angle, RADIUS);
      const b = polar(angle, RADIUS - length);
      const seg = `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      (length === TICK.major ? major : length === TICK.medium ? medium : minor).push(seg);
    }
    const labels = [];
    for (let i = 0; i <= count; i += scale.majorEvery) {
      const angle = i * degPerTick - TOTAL_DEG / 2;
      const at = polar(angle, RADIUS - TICK.major - 15);
      labels.push({ key: i, text: String(Math.round(scale.min + i * scale.step)), x: at.x, y: at.y, angle });
    }
    return { major: major.join(''), medium: medium.join(''), minor: minor.join(''), labels };
  }, [count, degPerTick, scale.majorEvery, scale.mediumEvery, scale.min, scale.step]);

  const altValue = unit === 'metric' ? `${(value / KG_PER_POUND).toFixed(1)} lb` : `${value.toFixed(1)} kg`;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel={`-${scale.fine} ${scale.label}`} onPress={() => nudge(-scale.fine)} scaleTo={0.9} style={[styles.fineButton, { backgroundColor: colors.secondary }]}>
          <Ionicons name="remove" size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.readout}>
          <Animated.View style={[styles.valueRow, numberStyle]}>
            <TextInput value={inputValue} onChangeText={onInputChange} keyboardType="decimal-pad" selectTextOnFocus accessibilityLabel={scale.label} style={[styles.number, { color: colors.foreground }]} />
            <Text style={[styles.unit, { color: colors.accent }]}>{scale.label}</Text>
          </Animated.View>
          <View style={[styles.alt, { backgroundColor: `${colors.accent}18` }]}>
            <Text style={[styles.altText, { color: colors.accent }]}>{altValue}</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`+${scale.fine} ${scale.label}`} onPress={() => nudge(scale.fine)} scaleTo={0.9} style={[styles.fineButton, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={20} color={colors.accentForeground} />
        </Pressable>
      </View>

      <GestureDetector gesture={pan}>
      <View
        onLayout={(event) => setWidth(Math.floor(event.nativeEvent.layout.width))}
        style={styles.dial}
        accessible
        accessibilityRole="adjustable"
        accessibilityValue={{ text: `${inputValue} ${scale.label}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => nudge(event.nativeEvent.actionName === 'increment' ? scale.fine : -scale.fine)}
      >
        {width > 0 ? (
          <Animated.View pointerEvents="none" style={[styles.wheel, { left: (width - RADIUS * 2) / 2, top: RIM }, wheelStyle]}>
            <Svg width={RADIUS * 2} height={RADIUS * 2}>
              <Path d={paths.minor} stroke={colors.mutedForeground} strokeOpacity={0.5} strokeWidth={1.5} strokeLinecap="round" />
              <Path d={paths.medium} stroke={colors.mutedForeground} strokeOpacity={0.85} strokeWidth={2} strokeLinecap="round" />
              <Path d={paths.major} stroke={colors.foreground} strokeWidth={2.5} strokeLinecap="round" />
              {paths.labels.map((label) => (
                <SvgText key={label.key} x={label.x} y={label.y} fill={colors.mutedForeground} fontSize={11} fontWeight="700" textAnchor="middle" alignmentBaseline="middle" transform={`rotate(${label.angle} ${label.x} ${label.y})`}>{label.text}</SvgText>
              ))}
            </Svg>
          </Animated.View>
        ) : null}
        <LinearGradient pointerEvents="none" colors={[colors.card, `${colors.card}00`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.sideFade, { left: 0 }]} />
        <LinearGradient pointerEvents="none" colors={[`${colors.card}00`, colors.card]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.sideFade, { right: 0 }]} />
        <View pointerEvents="none" style={styles.needle}>
          <View style={[styles.needleHead, { borderTopColor: colors.accent }]} />
          <View style={[styles.needleLine, { backgroundColor: colors.accent }]} />
        </View>
      </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 26, borderWidth: 1, paddingTop: 16, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  fineButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  readout: { flex: 1, alignItems: 'center', minWidth: 0 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 5 },
  number: { fontFamily: 'Inter_700Bold', fontSize: 56, letterSpacing: -2.5, textAlign: 'center', minWidth: 120, padding: 0 },
  unit: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  alt: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4, marginTop: 4 },
  altText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  dial: { height: DIAL_HEIGHT, marginTop: 8, overflow: 'hidden' },
  wheel: { position: 'absolute', width: RADIUS * 2, height: RADIUS * 2 },
  sideFade: { position: 'absolute', top: 0, bottom: 0, width: 54 },
  needle: { position: 'absolute', top: 2, left: 0, right: 0, alignItems: 'center' },
  needleHead: { width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 9, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  needleLine: { width: 3, height: 36, borderRadius: 2, marginTop: 5 },
});
