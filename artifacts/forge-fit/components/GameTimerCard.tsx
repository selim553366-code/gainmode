import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale as Pressable } from '@/components/Motion';
import { Ionicons } from '@/components/AppIcon';
import { triggerHaptic } from '@/components/FitUI';
import type { Language } from '@/lib/i18n';
import { countdownParts } from '@/lib/trialCountdown';
import { gameTimeLeft } from '@/lib/gameTimerMath';
import { GAME_TIMER_TEXT } from '@/lib/gameTimerCopy';
import { readGameTimer, type GameTimer } from '@/lib/notifications';

/** Today's entry to the gaming timer: an invitation when idle, the time left while a session runs. */
export function GameTimerCard({ language }: { language: Language }) {
  const copy = GAME_TIMER_TEXT[language] ?? GAME_TIMER_TEXT.en;
  const [timer, setTimer] = React.useState<GameTimer | null>(null);
  const [now, setNow] = React.useState(() => Date.now());
  useFocusEffect(React.useCallback(() => { void readGameTimer().then(setTimer); }, []));
  React.useEffect(() => {
    if (!timer) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);
  const left = timer ? gameTimeLeft(timer.endsAt, now) : 0;
  const { hours, minutes, seconds } = countdownParts(left);
  const pad = (n: number) => String(n).padStart(2, '0');
  const running = timer !== null && left > 0;
  const done = timer !== null && left === 0;
  return <Pressable testID="home-game-timer" accessibilityRole="button" onPress={() => { triggerHaptic(); router.push('/game-timer'); }} style={styles.wrap}>
    <LinearGradient colors={['#4C1D95', '#7C3AED', '#DB2777']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.icon}><Ionicons name={done ? 'barbell-outline' : 'game-controller-outline'} size={24} color="#FFFFFF" /></View>
      <View style={styles.copy}>
        <Text style={styles.title}>{done ? copy.doneTitle : running ? copy.cardActive : copy.cardTitle}</Text>
        {running ? <Text style={styles.clock}>{hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`}</Text>
          : <Text style={styles.body}>{done ? copy.startWorkout : copy.cardBody}</Text>}
      </View>
      <View style={styles.arrow}><Ionicons name="arrow-forward" size={18} color="#7C3AED" /></View>
    </LinearGradient>
  </Pressable>;
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14 },
  card: { borderRadius: 26, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { color: '#FFFFFF', fontFamily: 'Inter_800ExtraBold', fontSize: 16, letterSpacing: -0.3 },
  body: { color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18, marginTop: 3 },
  clock: { color: '#FFFFFF', fontFamily: 'Inter_800ExtraBold', fontSize: 24, letterSpacing: -0.6, marginTop: 2, fontVariant: ['tabular-nums'] },
  arrow: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
});
