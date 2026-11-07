import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, cancelAnimation, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle as SvgCircle, G } from 'react-native-svg';
import { Ionicons } from '@/components/AppIcon';
import { PressableScale as Pressable, EASE_OUT } from '@/components/Motion';
import { triggerHaptic } from '@/components/FitUI';
import { useColors } from '@/hooks/useColors';
import { translate, type Language, type TranslationKey } from '@/lib/i18n';
import type { Workout } from '@/context/FitContext';

const copy: Record<Language, { today: string; done: string; start: string; resume: string; finished: string; viewPlan: string; last: string; saved: string; save: string; update: string; noLog: string }> = {
  tr: { today: 'Bugün', done: 'tamamlandı', start: 'Antrenmana başla', resume: 'Kaldığın yerden devam et', finished: 'Bugünkü antrenman bitti', viewPlan: 'Haftalık planı gör', last: 'Son kayıt', saved: 'Bugün kaydedildi', save: 'Kaydet', update: 'Güncelle', noLog: 'İlk kaydını gir' },
  en: { today: 'Today', done: 'done', start: 'Start workout', resume: 'Pick up where you left off', finished: 'Today’s workout is done', viewPlan: 'See the week', last: 'Last entry', saved: 'Logged today', save: 'Save', update: 'Update', noLog: 'Log your first entry' },
  de: { today: 'Heute', done: 'erledigt', start: 'Training starten', resume: 'Weitermachen', finished: 'Heutiges Training erledigt', viewPlan: 'Woche ansehen', last: 'Letzter Eintrag', saved: 'Heute eingetragen', save: 'Speichern', update: 'Aktualisieren', noLog: 'Ersten Eintrag machen' },
  fr: { today: 'Aujourd’hui', done: 'faits', start: 'Commencer la séance', resume: 'Reprendre la séance', finished: 'Séance du jour terminée', viewPlan: 'Voir la semaine', last: 'Dernière pesée', saved: 'Enregistré aujourd’hui', save: 'Enregistrer', update: 'Mettre à jour', noLog: 'Ajoute ta première pesée' },
  es: { today: 'Hoy', done: 'hechos', start: 'Empezar entrenamiento', resume: 'Continuar donde lo dejaste', finished: 'Entrenamiento de hoy hecho', viewPlan: 'Ver la semana', last: 'Último registro', saved: 'Registrado hoy', save: 'Guardar', update: 'Actualizar', noLog: 'Registra tu primer peso' },
};

/** A ring that keeps swelling out of the start button so the next step is obvious. */
function PulseRing({ color }: { color: string }) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  React.useEffect(() => {
    if (reduced) return undefined;
    pulse.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) }), -1));
    return () => cancelAnimation(pulse);
  }, [pulse, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - pulse.get()), transform: [{ scale: 1 + pulse.get() * 0.7 }] }));
  return <Animated.View pointerEvents="none" style={[styles.pulse, { borderColor: color }, style]} />;
}

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

/** The day's calories as a real progress arc that sweeps round when the page opens, with the percentage in the middle. */
export function CalorieArc({ progress, size = 104, color, track, textColor }: { progress: number; size?: number; color: string; track: string; textColor: string }) {
  const reduced = useReducedMotion();
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(progress, 1));
  const sweep = useSharedValue(reduced ? clamped : 0);
  React.useEffect(() => {
    sweep.set(reduced ? clamped : withTiming(clamped, { duration: 950, easing: EASE_OUT }));
  }, [clamped, reduced, sweep]);
  const arc = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - sweep.get()) }));
  return <View accessibilityLabel={`${Math.round(clamped * 100)}%`} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size} height={size}>
      <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
        <SvgCircle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} animatedProps={arc} fill="none" />
      </G>
    </Svg>
    <Text style={[styles.arcPercent, { color: textColor }]}>{Math.round(clamped * 100)}<Text style={styles.arcPercentSign}>%</Text></Text>
  </View>;
}

/** One macro as a small card: its name, today's grams, a bar toward the goal and the goal itself. */
export function MacroCard({ label, value, goal, color }: { label: string; value: number; goal: number | null; color: string }) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const ratio = goal ? Math.min(value / goal, 1) : 0;
  const fill = useSharedValue(reduced ? ratio : 0);
  React.useEffect(() => {
    fill.set(reduced ? ratio : withTiming(ratio, { duration: 800, easing: EASE_OUT }));
  }, [fill, ratio, reduced]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.get() * 100}%` }));
  return <View style={[styles.macro, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.macroHead}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.macroLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
    <Text style={[styles.macroValue, { color: colors.foreground }]}>{Math.round(value)}<Text style={[styles.macroUnit, { color: colors.mutedForeground }]}> g</Text></Text>
    <View style={[styles.macroTrack, { backgroundColor: `${color}22` }]}><Animated.View style={[styles.macroFill, { backgroundColor: color }, fillStyle]} /></View>
    <Text style={[styles.macroGoal, { color: colors.mutedForeground }]}>{goal ? `/ ${goal} g` : '/ —'}</Text>
  </View>;
}

/**
 * Today's session as one slim strip: an icon, the session name with weekday, duration and how many
 * exercises are done, a hairline along the bottom that fills with that progress, and a small
 * arrow with a ring pulsing out of it. On rest days it reads as a calm reminder instead.
 */
export function TodaySessionCard({ workout, language, onOpen }: { workout: Workout | undefined; language: Language; onOpen: () => void }) {
  const colors = useColors();
  const c = copy[language] ?? copy.en;
  const t = (key: TranslationKey) => translate(language, key);
  const reduced = useReducedMotion();
  const ink = '#FFFFFF';
  const weekday = new Intl.DateTimeFormat(language, { weekday: 'long' }).format(new Date());
  const done = workout ? workout.exercises.filter((exercise) => exercise.completed).length : 0;
  const total = workout?.exercises.length ?? 0;
  const finished = total > 0 && done === total;
  const accent = '#FFFFFF';
  const label = !workout ? c.viewPlan : finished ? c.finished : done > 0 ? c.resume : c.start;
  const ratio = total ? done / total : 0;
  const fill = useSharedValue(reduced ? ratio : 0);
  React.useEffect(() => {
    fill.set(reduced ? ratio : withTiming(ratio, { duration: 700, easing: EASE_OUT }));
  }, [fill, ratio, reduced]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.get() * 100}%` }));
  const title = workout ? (translate(language, workout.name as TranslationKey) || workout.name) : t('restDayTitle');
  const caption = workout
    ? `${weekday} · ${workout.duration} min · ${done}/${total} ${c.done}`
    : `${weekday} · ${c.viewPlan}`;

  return <Pressable testID="open-today-workout" accessibilityRole="button" accessibilityLabel={`${title}. ${label}`} onPress={() => { triggerHaptic(); onOpen(); }} scaleTo={0.98}>
    <View style={styles.strip}>
      <LinearGradient colors={[colors.accent, '#123A8F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.stripIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
        <Ionicons name={!workout ? 'moon-outline' : finished ? 'checkmark' : 'barbell-outline'} size={19} color="#FFFFFF" />
      </View>
      <View style={styles.stripCopy}>
        <Text numberOfLines={1} style={[styles.stripTitle, { color: ink }]}>{title}</Text>
        <Text numberOfLines={1} style={[styles.stripCaption, { color: `${ink}A6` }]}>{caption}</Text>
      </View>
      <View style={styles.stripArrowWrap}>
        {workout && !finished ? <PulseRing color={accent} /> : null}
        <View style={[styles.stripArrow, { backgroundColor: '#FFFFFF' }]}>
          <Ionicons name="arrow-forward" size={17} color={colors.accent} />
        </View>
      </View>
      {workout && total > 0 ? <View style={[styles.stripTrack, { backgroundColor: `${ink}38` }]}>
        <Animated.View style={[styles.stripFill, { backgroundColor: accent }, fillStyle]} />
      </View> : null}
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  strip: { height: 76, borderRadius: 30, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 14, paddingRight: 11, marginBottom: 14 },
  stripIcon: { width: 46, height: 46, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stripCopy: { flex: 1, minWidth: 0 },
  stripTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 17, letterSpacing: -0.4 },
  stripCaption: { fontFamily: 'Inter_500Medium', fontSize: 11.5, marginTop: 2 },
  stripArrowWrap: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  stripArrow: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  stripTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3 },
  stripFill: { height: '100%' },
  pulse: { position: 'absolute', width: 46, height: 46, borderRadius: 23, borderWidth: 2 },
  arcPercent: { position: 'absolute', fontFamily: 'Inter_800ExtraBold', fontSize: 26, letterSpacing: -1 },
  arcPercentSign: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  macro: { flex: 1, borderRadius: 24, borderWidth: 1, padding: 12 },
  macroHead: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 20 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroLabel: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  macroValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, letterSpacing: -1, marginTop: 10 },
  macroUnit: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 0 },
  macroTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  macroFill: { height: '100%', borderRadius: 3 },
  macroGoal: { fontFamily: 'Inter_500Medium', fontSize: 10.5, marginTop: 6 },
});
