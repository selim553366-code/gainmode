import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Header, Screen, triggerHaptic } from '@/components/FitUI';
import { PressableScale as Pressable } from '@/components/Motion';
import { Ionicons } from '@/components/AppIcon';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { countdownParts } from '@/lib/trialCountdown';
import { GAME_TIMER_PRESETS, GAME_TIMER_STEP_MINUTES, clampGameMinutes, formatGameLength, gameTimeLeft } from '@/lib/gameTimerMath';
import { GAME_TIMER_TEXT } from '@/lib/gameTimerCopy';
import { readGameTimer, startGameTimer, stopGameTimer, type GameTimer } from '@/lib/notifications';

const RING = 248;
const STROKE = 16;
const GAME_TONES: [string, string] = ['#7C3AED', '#EC4899'];

/**
 * Gaming-session timer: pick how long you'll play, watch the time count down, and FitBud sends a
 * notification to start the workout when it ends (even if the app is closed).
 */
export default function GameTimerScreen() {
  const colors = useColors();
  const { language } = useFit();
  const copy = GAME_TIMER_TEXT[language] ?? GAME_TIMER_TEXT.en;
  const [minutes, setMinutes] = React.useState(60);
  const [timer, setTimer] = React.useState<GameTimer | null>(null);
  const [notifies, setNotifies] = React.useState(true);
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => { void readGameTimer().then(setTimer); }, []);
  React.useEffect(() => {
    if (!timer) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const left = timer ? gameTimeLeft(timer.endsAt, now) : 0;
  const finished = timer !== null && left === 0;
  const progress = timer ? Math.min(1, left / (timer.minutes * 60 * 1000)) : 1;
  const { hours, minutes: mins, seconds } = countdownParts(left);
  const pad = (n: number) => String(n).padStart(2, '0');
  let endsAt = '';
  if (timer) {
    try { endsAt = new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(new Date(timer.endsAt)); } catch { endsAt = new Date(timer.endsAt).toLocaleTimeString(); }
  }

  const start = async () => {
    triggerHaptic();
    const result = await startGameTimer(language, minutes);
    setNotifies(result.notifies);
    setNow(Date.now());
    setTimer(result.timer);
  };
  const stop = async () => {
    triggerHaptic();
    await stopGameTimer();
    setTimer(null);
  };
  const goTrain = async () => {
    await stopGameTimer();
    router.replace('/(tabs)/plan');
  };

  const circumference = Math.PI * (RING - STROKE);
  return (
    <Screen bottomPadding={40}>
      <Header title={copy.title} subtitle={copy.subtitle} action="arrow-back" onAction={() => router.back()} centered />

      {timer ? <View style={styles.center}>
        <View style={{ width: RING, height: RING }}>
          <Svg width={RING} height={RING}>
            <Circle cx={RING / 2} cy={RING / 2} r={(RING - STROKE) / 2} stroke={colors.border} strokeWidth={STROKE} fill="none" />
            <Circle cx={RING / 2} cy={RING / 2} r={(RING - STROKE) / 2} stroke={finished ? '#22C55E' : GAME_TONES[1]} strokeWidth={STROKE} fill="none"
              strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - progress)}
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`} />
          </Svg>
          <View style={styles.ringCopy}>
            <Ionicons name={finished ? 'barbell-outline' : 'game-controller-outline'} size={30} color={finished ? '#22C55E' : GAME_TONES[1]} />
            <Text style={[styles.clock, { color: colors.foreground }]}>{finished ? '00:00' : hours ? `${hours}:${pad(mins)}:${pad(seconds)}` : `${pad(mins)}:${pad(seconds)}`}</Text>
            <Text style={[styles.clockLabel, { color: colors.mutedForeground }]}>{finished ? copy.doneTitle : copy.left}</Text>
          </View>
        </View>

        {finished ? <>
          <Text style={[styles.doneBody, { color: colors.foreground }]}>{copy.doneBody}</Text>
          <Pressable accessibilityRole="button" onPress={() => { void goTrain(); }} style={styles.primaryWrap}>
            <LinearGradient colors={['#22C55E', '#16A34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
              <Ionicons name="barbell-outline" size={20} color="#FFFFFF" /><Text style={styles.primaryText}>{copy.startWorkout}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => { void stop(); }} hitSlop={8}><Text style={[styles.secondary, { color: colors.mutedForeground }]}>{copy.newSession}</Text></Pressable>
        </> : <>
          <Text style={[styles.endsAt, { color: colors.mutedForeground }]}>{copy.endsAt.replace('{time}', endsAt)}</Text>
          <View style={[styles.note, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.noteText, { color: colors.foreground }]}>{notifies ? copy.coachNote : copy.noNotify}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => { void stop(); }} style={[styles.stop, { borderColor: colors.border }]}>
            <Ionicons name="pause-outline" size={18} color={colors.foreground} /><Text style={[styles.stopText, { color: colors.foreground }]}>{copy.stop}</Text>
          </Pressable>
        </>}
      </View> : <View>
        <Text style={[styles.question, { color: colors.foreground }]}>{copy.question}</Text>
        <View style={styles.presets}>
          {GAME_TIMER_PRESETS.map((preset) => {
            const active = minutes === preset;
            return <Pressable key={preset} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => { triggerHaptic(); setMinutes(preset); }}
              style={[styles.preset, { backgroundColor: active ? GAME_TONES[0] : colors.card, borderColor: active ? GAME_TONES[0] : colors.border }]}>
              <Text style={[styles.presetText, { color: active ? '#FFFFFF' : colors.foreground }]}>{formatGameLength(preset, copy.hour, copy.minute)}</Text>
            </Pressable>;
          })}
        </View>

        <Text style={[styles.customLabel, { color: colors.mutedForeground }]}>{copy.custom}</Text>
        <View style={[styles.stepper, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="-15" onPress={() => { triggerHaptic(); setMinutes((m) => clampGameMinutes(m - GAME_TIMER_STEP_MINUTES)); }} style={[styles.stepBtn, { backgroundColor: colors.secondary }]}>
            <Ionicons name="remove" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.stepValue, { color: colors.foreground }]}>{formatGameLength(minutes, copy.hour, copy.minute)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="+15" onPress={() => { triggerHaptic(); setMinutes((m) => clampGameMinutes(m + GAME_TIMER_STEP_MINUTES)); }} style={[styles.stepBtn, { backgroundColor: colors.secondary }]}>
            <Ionicons name="add" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={[styles.note, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noteText, { color: colors.foreground }]}>{copy.coachNote}</Text>
        </View>

        <Pressable testID="game-timer-start" accessibilityRole="button" onPress={() => { void start(); }} style={styles.primaryWrap}>
          <LinearGradient colors={GAME_TONES} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
            <Ionicons name="play" size={18} color="#FFFFFF" /><Text style={styles.primaryText}>{copy.start}</Text>
          </LinearGradient>
        </Pressable>
      </View>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingTop: 12 },
  ringCopy: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  clock: { fontFamily: 'Inter_800ExtraBold', fontSize: 46, letterSpacing: -1.5, marginTop: 6, fontVariant: ['tabular-nums'] },
  clockLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, textAlign: 'center', marginTop: 2 },
  endsAt: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: 18 },
  doneBody: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 20, paddingHorizontal: 12 },
  note: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 20, alignSelf: 'stretch' },
  noteText: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20 },
  question: { fontFamily: 'Inter_800ExtraBold', fontSize: 22, letterSpacing: -0.6, marginTop: 8, marginBottom: 14 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  preset: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 },
  presetText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  customLabel: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },
  stepper: { borderWidth: 1, borderRadius: 22, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 26, letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  primaryWrap: { alignSelf: 'stretch', marginTop: 22 },
  primary: { height: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryText: { color: '#FFFFFF', fontFamily: 'Inter_800ExtraBold', fontSize: 16 },
  stop: { marginTop: 18, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  stopText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  secondary: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 16 },
});
