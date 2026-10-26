import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { EASE_OUT } from '@/components/Motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A progress ring that sweeps to its value when shown and whenever the value changes. */
export function ProgressRing({ value, size, stroke, color, track, gradientTo, delay = 0, children }: {
  value: number;
  size: number;
  stroke: number;
  color: string;
  track: string;
  /** Optional second colour; the arc then runs from `color` to this. */
  gradientTo?: string;
  delay?: number;
  children?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const id = React.useId().replace(/:/g, '');
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = Math.max(0, Math.min(1, value));
  const progress = useSharedValue(reduced ? target : 0);

  React.useEffect(() => {
    progress.set(reduced ? target : withDelay(delay, withTiming(target, { duration: 900, easing: EASE_OUT })));
  }, [delay, progress, reduced, target]);

  const arcProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.get()) }));

  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size} height={size} style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}>
      {gradientTo ? <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={color} />
          <Stop offset="1" stopColor={gradientTo} />
        </LinearGradient>
      </Defs> : null}
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={stroke} fill="none" />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={gradientTo ? `url(#${id})` : color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        animatedProps={arcProps}
      />
    </Svg>
    {children}
  </View>;
}

/** Macro progress as a small ring with the amount inside and the name underneath. */
export function MacroRing({ label, current, target, color, track, ink, muted, delay }: { label: string; current: number; target: number | null; color: string; track: string; ink: string; muted: string; delay: number }) {
  const value = target ? current / target : 0;
  return <View style={styles.macro}>
    <ProgressRing value={value} size={74} stroke={7} color={color} track={track} delay={delay}>
      <Text style={[styles.macroValue, { color: ink }]}>{Math.round(current)}</Text>
      <Text style={[styles.macroTarget, { color: muted }]}>/{target ? Math.round(target) : '—'}g</Text>
    </ProgressRing>
    <View style={styles.macroLabelRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.macroLabel, { color: muted }]}>{label}</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  macro: { alignItems: 'center', flex: 1 },
  macroValue: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.4 },
  macroTarget: { fontFamily: 'Inter_500Medium', fontSize: 9, marginTop: -1 },
  macroLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  macroLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
});
