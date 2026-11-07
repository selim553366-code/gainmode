import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@/components/AppIcon';
import { EASE_OUT, PressableScale as Pressable } from '@/components/Motion';

/**
 * Colour that moves like slow water: two soft gradient bands, three times the card's width, drifting past each other
 * in opposite directions. No shapes, just colour, softened by a light blur. Still under reduced motion.
 */
export function WaterFill({ colors: tones, width, speed = 1 }: { colors: [string, string]; width: number; speed?: number }) {
  const reduced = useReducedMotion();
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  React.useEffect(() => {
    if (reduced || !width) return;
    a.set(withRepeat(withTiming(1, { duration: 9000 / speed, easing: Easing.inOut(Easing.sin) }), -1, true));
    b.set(withRepeat(withTiming(1, { duration: 13000 / speed, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [a, b, reduced, speed, width]);
  const bandA = useAnimatedStyle(() => ({ transform: [{ translateX: -a.get() * width * 2 }] }));
  const bandB = useAnimatedStyle(() => ({ transform: [{ translateX: -(1 - b.get()) * width * 2 }] }));
  const [c0, c1] = tones;
  if (!width) return null;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Animated.View style={[styles.band, { width: width * 3 }, bandA]}>
      <LinearGradient colors={[c0, c1, c0, c1, c0]} start={{ x: 0, y: 0.3 }} end={{ x: 1, y: 0.7 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
    <Animated.View style={[styles.band, { width: width * 3, opacity: 0.55 }, bandB]}>
      <LinearGradient colors={[`${c1}00`, c1, `${c0}00`, c0, `${c1}00`, c1]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
    <BlurView intensity={24} tint="default" style={StyleSheet.absoluteFill} />
  </View>;
}

/**
 * The buy button as a charging bar: it carries the chosen plan's flowing colour, says what you are buying under the
 * call to action, and a white key tile on the right nudges forward every few seconds.
 */
export function ChargeButton({ label, sub, tones, busy = false, disabled = false, onPress, testID }: { label: string; sub?: string; tones: [string, string]; busy?: boolean; disabled?: boolean; onPress: () => void; testID: string }) {
  const reduced = useReducedMotion();
  const [width, setWidth] = React.useState(0);
  const nudge = useSharedValue(0);
  const sweep = useSharedValue(0);
  React.useEffect(() => {
    if (reduced) return;
    nudge.set(withRepeat(withSequence(withDelay(1800, withTiming(1, { duration: 260, easing: EASE_OUT })), withTiming(0, { duration: 420, easing: Easing.inOut(Easing.quad) })), -1));
    sweep.set(withRepeat(withSequence(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }), withDelay(1200, withTiming(0, { duration: 0 }))), -1));
  }, [nudge, reduced, sweep]);
  const keyStyle = useAnimatedStyle(() => ({ transform: [{ translateX: nudge.get() * 5 }] }));
  const sweepStyle = useAnimatedStyle(() => ({ opacity: sweep.get() > 0 && sweep.get() < 1 ? 1 : 0, transform: [{ translateX: -120 + sweep.get() * (width + 160) }, { skewX: '-20deg' }] }));
  return <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ disabled, busy }} disabled={disabled} onPress={onPress} scaleTo={0.97}>
    <View onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))} style={[styles.cta, { backgroundColor: tones[0] }]}>
      <WaterFill colors={tones} width={width} speed={1.6} />
      <Animated.View pointerEvents="none" style={[styles.ctaSweep, sweepStyle]}>
        <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View style={styles.ctaCopy}>
        <Text style={styles.ctaText}>{label}</Text>
        {sub ? <Text numberOfLines={1} style={styles.ctaSub}>{sub}</Text> : null}
      </View>
      <Animated.View style={[styles.ctaKey, keyStyle]}>
        {busy ? <ActivityIndicator color={tones[0]} /> : <Ionicons name="arrow-forward" size={20} color={tones[0]} />}
      </Animated.View>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  band: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  cta: { height: 68, borderRadius: 24, flexDirection: 'row', alignItems: 'center', paddingLeft: 22, paddingRight: 10, overflow: 'hidden' },
  ctaSweep: { position: 'absolute', top: -10, bottom: -10, left: 0, width: 90 },
  ctaCopy: { flex: 1, minWidth: 0 },
  ctaText: { fontFamily: 'Inter_800ExtraBold', fontSize: 18, letterSpacing: -0.4, color: '#FFFFFF' },
  ctaSub: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontVariant: ['tabular-nums'] },
  ctaKey: { width: 50, height: 50, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
});
