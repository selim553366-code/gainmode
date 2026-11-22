import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { PressableScale as Pressable } from '@/components/Motion';
import { Ionicons } from '@/components/AppIcon';
import { triggerHaptic } from '@/components/FitUI';
import { useColors } from '@/hooks/useColors';
import type { Language } from '@/lib/i18n';
import { countdownParts } from '@/lib/trialCountdown';
import { gameTimeLeft } from '@/lib/gameTimerMath';
import { GAME_TIMER_TEXT } from '@/lib/gameTimerCopy';
import { readGameTimer, type GameTimer } from '@/lib/notifications';

/** The gaming timer's single accent: a flat neon lime, like a game HUD, on the app's own card colours. */
export const GAME_ACCENT = '#A3E635';
export const GAME_ACCENT_INK = '#1A2E05';
const SEGMENTS = 12;

/** A segmented bar, like a health bar in a game, showing how much of the session is left. */
export function GameBar({ fraction, track }: { fraction: number; track: string }) {
  const lit = Math.ceil(Math.max(0, Math.min(1, fraction)) * SEGMENTS);
  return <View style={styles.bar}>
    {Array.from({ length: SEGMENTS }, (_, index) => <View key={index} style={[styles.segment, { backgroundColor: index < lit ? GAME_ACCENT : track }]} />)}
  </View>;
}

/** Today's entry to the gaming timer: an invitation when idle, the time left while a session runs. */
export function GameTimerCard({ language }: { language: Language }) {
  const colors = useColors();
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
  return <Pressable testID="home-game-timer" accessibilityRole="button" onPress={() => { triggerHaptic(); router.push('/game-timer'); }}
    style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.row}>
      <View style={styles.icon}><Ionicons name={done ? 'barbell-outline' : 'game-controller-outline'} size={22} color={GAME_ACCENT_INK} /></View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.foreground }]}>{done ? copy.doneTitle : running ? copy.cardActive : copy.cardTitle}</Text>
        {running ? <Text style={[styles.clock, { color: colors.foreground }]}>{hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`}</Text>
          : <Text style={[styles.body, { color: colors.mutedForeground }]}>{done ? copy.startWorkout : copy.cardBody}</Text>}
      </View>
      <View style={[styles.arrow, { backgroundColor: colors.foreground }]}><Ionicons name="arrow-forward" size={17} color={colors.background} /></View>
    </View>
    {running ? <GameBar fraction={left / (timer.minutes * 60 * 1000)} track={colors.border} /> : null}
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { marginTop: 14, borderRadius: 24, borderWidth: 1, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 46, height: 46, borderRadius: 14, backgroundColor: GAME_ACCENT, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 16, letterSpacing: -0.3 },
  body: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18, marginTop: 3 },
  clock: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, letterSpacing: -0.6, marginTop: 2, fontVariant: ['tabular-nums'] },
  arrow: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  bar: { flexDirection: 'row', gap: 4, marginTop: 14 },
  segment: { flex: 1, height: 8, borderRadius: 2 },
});
