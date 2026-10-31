import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Header, Screen } from '@/components/FitUI';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { widgetCopy } from '@/widgets/widgetCopy';

export default function BreatheScreen() {
  const colors = useColors();
  const { language } = useFit();
  const copy = widgetCopy[language];
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(60);
  const scale = useRef(new Animated.Value(0.78)).current;
  const elapsed = 60 - remaining;
  const phaseIndex = elapsed % 14;
  const phase = phaseIndex < 4 ? 'inhale' : phaseIndex < 8 ? 'hold' : 'exhale';
  const phaseDuration = phase === 'exhale' ? 6000 : 4000;
  const phaseLabel = phase === 'inhale' ? copy.inhale : phase === 'hold' ? copy.hold : copy.exhale;

  useEffect(() => {
    if (!started || remaining <= 0) return;
    const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [started]);

  useEffect(() => {
    if (!started) {
      scale.stopAnimation();
      scale.setValue(0.78);
      return;
    }
    scale.stopAnimation();
    if (phase === 'hold') return;
    const target = phase === 'inhale' ? 1.08 : phase === 'exhale' ? 0.78 : undefined;
    if (target !== undefined) {
      Animated.timing(scale, { toValue: target, duration: phaseDuration, useNativeDriver: true }).start();
    }
  }, [phase, phaseDuration, scale, started]);

  useEffect(() => {
    if (remaining === 0) setStarted(false);
  }, [remaining]);

  const begin = () => {
    setRemaining(60);
    setStarted(true);
  };
  const finished = remaining === 0;

  return (
    <Screen bottomPadding={36}>
      <Header title={copy.breathe} subtitle={copy.breatheHint} action="arrow-back" onAction={() => router.back()} centered />
      <View style={styles.content}>
        <Animated.View style={[styles.orb, { backgroundColor: colors.primary, transform: [{ scale }] }]}>
          <Text style={styles.phase}>{started ? phaseLabel : '4 · 4 · 6'}</Text>
          {started && <Text style={styles.counter}>{phase === 'inhale' ? 4 - phaseIndex : phase === 'hold' ? 8 - phaseIndex : 14 - phaseIndex}</Text>}
        </Animated.View>
        <Text style={[styles.timer, { color: colors.foreground }]}>
          {finished ? copy.breathingDone : `0:${String(remaining).padStart(2, '0')}`}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={started ? () => setStarted(false) : begin}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.buttonText}>{started ? copy.stopBreathing : copy.startBreathing}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  orb: { width: 210, height: 210, borderRadius: 110, alignItems: 'center', justifyContent: 'center' },
  phase: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 22, textAlign: 'center' },
  counter: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 17, marginTop: 8 },
  timer: { fontFamily: 'Inter_700Bold', fontSize: 30 },
  button: { minWidth: 190, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 26, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16 },
});
