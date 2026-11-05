import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from '@/components/FitUI';
import { useColors } from '@/hooks/useColors';

type HeightRulerProps = {
  /** Height in centimetres. */
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** The big number on the left, e.g. "172" or "5′8″". */
  valueText: string;
  /** Unit shown beside the number, e.g. "cm". Empty for imperial, where the number carries it. */
  unitText: string;
  /** The same height in the other unit, shown as a small pill. */
  altText: string;
};

const STEP = 14; // pixels per centimetre
const HEIGHT = 252;
const WIDTH = 132;
const PAD = (HEIGHT - STEP) / 2;
// Native snaps with snapToInterval; the web preview needs CSS scroll snapping for the same feel.
const WEB_SNAP_ITEM = (Platform.OS === 'web' ? { scrollSnapAlign: 'start' } : null) as object | null;
const WEB_SNAP_LIST = (Platform.OS === 'web' ? { scrollSnapType: 'y mandatory', scrollPaddingTop: PAD } : null) as object | null;

/** One centimetre on the ruler. Ticks near the centre lengthen, brighten and turn accent so the choice feels magnified. */
function Mark({ index, cm, scrollY }: { index: number; cm: number; scrollY: SharedValue<number> }) {
  const colors = useColors();
  const major = cm % 10 === 0;
  const half = cm % 5 === 0;
  const base = major ? 44 : half ? 30 : 18;
  const style = useAnimatedStyle(() => {
    const dist = Math.abs(scrollY.get() / STEP - index);
    return {
      width: base + interpolate(dist, [0, 3], [22, 0], 'clamp'),
      opacity: interpolate(dist, [0, 1.5, 8], [1, 0.85, 0.3], 'clamp'),
      backgroundColor: interpolateColor(dist, [0, 1.2], [colors.accent, major ? colors.foreground : colors.mutedForeground]),
    };
  });
  const labelStyle = useAnimatedStyle(() => {
    const dist = Math.abs(scrollY.get() / STEP - index);
    return { opacity: interpolate(dist, [0, 1.5, 8], [0, 0.9, 0.35], 'clamp') };
  });
  return (
    <View style={[styles.row, WEB_SNAP_ITEM]}>
      {half ? <Animated.Text style={[styles.label, major ? styles.labelMajor : null, { color: major ? colors.foreground : colors.mutedForeground }, labelStyle]}>{cm}</Animated.Text> : null}
      <Animated.View style={[styles.tick, { height: major ? 3 : 2 }, style]} />
    </View>
  );
}

/**
 * Wall-chart style height picker: a vertical ruler on the right with the tallest height at the top. Scroll it and the
 * centimetre under the fixed marker is the answer. Snaps to whole centimetres with a tick of haptic feedback.
 */
export function HeightRuler({ value, min, max, onChange, valueText, unitText, altText }: HeightRulerProps) {
  const colors = useColors();
  const scrollRef = React.useRef<Animated.ScrollView>(null);
  const emitted = React.useRef(value);
  const offsetFor = (cm: number) => (max - cm) * STEP;
  const scrollY = useSharedValue(offsetFor(value));
  const lastCm = useSharedValue(value);
  const bump = useSharedValue(0);
  const count = max - min + 1;

  const emit = React.useCallback((cm: number) => {
    emitted.current = cm;
    triggerHaptic();
    onChange(cm);
  }, [onChange]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      scrollY.set(y);
      const cm = Math.max(min, Math.min(max, max - Math.round(y / STEP)));
      if (cm !== lastCm.get()) {
        const direction = cm > lastCm.get() ? -1 : 1;
        lastCm.set(cm);
        bump.set(withSequence(withTiming(direction, { duration: 70 }), withSpring(0, { damping: 12, stiffness: 280 })));
        scheduleOnRN(emit, cm);
      }
    },
  });

  // Typing a height or switching units moves the ruler to match.
  React.useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    lastCm.set(value);
    scrollRef.current?.scrollTo({ y: offsetFor(value), animated: true });
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollTo({ y: offsetFor(value), animated: false }), 0);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const numberStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bump.get() * 6 }] }));

  const nudge = (cm: number) => {
    const next = Math.max(min, Math.min(max, value + cm));
    scrollRef.current?.scrollTo({ y: offsetFor(next), animated: true });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.readout}>
        <Animated.View style={[styles.valueRow, numberStyle]}>
          <Text allowFontScaling={false} style={[styles.number, { color: colors.foreground }]}>{valueText}</Text>
          {unitText ? <Text style={[styles.unit, { color: colors.accent }]}>{unitText}</Text> : null}
        </Animated.View>
        <View style={[styles.alt, { backgroundColor: `${colors.accent}18` }]}>
          <Text style={[styles.altText, { color: colors.accent }]}>{altText}</Text>
        </View>
      </View>

      <View
        style={styles.ruler}
        accessible
        accessibilityRole="adjustable"
        accessibilityValue={{ text: `${value} cm` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => nudge(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
      >
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          snapToInterval={STEP}
          snapToAlignment="start"
          decelerationRate="fast"
          style={WEB_SNAP_LIST}
          contentContainerStyle={{ paddingVertical: PAD }}
          contentOffset={{ x: 0, y: offsetFor(value) }}
        >
          {Array.from({ length: count }, (_, index) => <Mark key={index} index={index} cm={max - index} scrollY={scrollY} />)}
        </Animated.ScrollView>
        <LinearGradient pointerEvents="none" colors={[colors.card, `${colors.card}00`]} style={[styles.fade, { top: 0 }]} />
        <LinearGradient pointerEvents="none" colors={[`${colors.card}00`, colors.card]} style={[styles.fade, { bottom: 0 }]} />
        <View pointerEvents="none" style={styles.marker}>
          <View style={[styles.markerDot, { backgroundColor: colors.accent, borderColor: colors.card }]} />
          <LinearGradient colors={[`${colors.accent}00`, `${colors.accent}AA`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.markerLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 26, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 14, paddingVertical: 10, overflow: 'hidden' },
  readout: { flex: 1, minWidth: 0 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  number: { fontFamily: 'Inter_700Bold', fontSize: 64, letterSpacing: -3 },
  unit: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  alt: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, marginTop: 6 },
  altText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  ruler: { width: WIDTH, height: HEIGHT },
  row: { height: STEP, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  tick: { borderRadius: 2 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 10, marginRight: 8 },
  labelMajor: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  fade: { position: 'absolute', left: 0, right: 0, height: 64 },
  marker: { position: 'absolute', left: 0, right: 0, top: PAD, height: STEP, flexDirection: 'row', alignItems: 'center' },
  markerDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, marginLeft: -2 },
  markerLine: { flex: 1, height: 2, borderRadius: 1 },
});
