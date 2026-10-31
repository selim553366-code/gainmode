import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@/components/AppIcon';
import { PressableScale as Pressable, EASE_OUT } from '@/components/Motion';
import { triggerHaptic } from '@/components/FitUI';
import { useColors } from '@/hooks/useColors';
import { translate, type Language, type TranslationKey } from '@/lib/i18n';
import { localDateKey, mealDateKey, type WeightLog } from '@/lib/nutritionDates';
import type { Workout } from '@/context/FitContext';

const copy: Record<Language, { today: string; done: string; start: string; resume: string; finished: string; viewPlan: string; last: string; saved: string; save: string; update: string; noLog: string }> = {
  tr: { today: 'Bugün', done: 'tamamlandı', start: 'Antrenmana başla', resume: 'Kaldığın yerden devam et', finished: 'Bugünkü antrenman bitti', viewPlan: 'Haftalık planı gör', last: 'Son kayıt', saved: 'Bugün kaydedildi', save: 'Kaydet', update: 'Güncelle', noLog: 'İlk kaydını gir' },
  en: { today: 'Today', done: 'done', start: 'Start workout', resume: 'Pick up where you left off', finished: 'Today’s workout is done', viewPlan: 'See the week', last: 'Last entry', saved: 'Logged today', save: 'Save', update: 'Update', noLog: 'Log your first entry' },
  de: { today: 'Heute', done: 'erledigt', start: 'Training starten', resume: 'Weitermachen', finished: 'Heutiges Training erledigt', viewPlan: 'Woche ansehen', last: 'Letzter Eintrag', saved: 'Heute eingetragen', save: 'Speichern', update: 'Aktualisieren', noLog: 'Ersten Eintrag machen' },
  fr: { today: 'Aujourd’hui', done: 'faits', start: 'Commencer la séance', resume: 'Reprendre la séance', finished: 'Séance du jour terminée', viewPlan: 'Voir la semaine', last: 'Dernière pesée', saved: 'Enregistré aujourd’hui', save: 'Enregistrer', update: 'Mettre à jour', noLog: 'Ajoute ta première pesée' },
  es: { today: 'Hoy', done: 'hechos', start: 'Empezar entrenamiento', resume: 'Continuar donde lo dejaste', finished: 'Entrenamiento de hoy hecho', viewPlan: 'Ver la semana', last: 'Último registro', saved: 'Registrado hoy', save: 'Guardar', update: 'Actualizar', noLog: 'Registra tu primer peso' },
};

const muscleKey = (group: string) => `muscle${group.charAt(0).toUpperCase()}${group.slice(1)}` as TranslationKey;

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

/** One exercise in the progress strip; finished ones fill in with a short delay each. */
function Segment({ filled, color, track, index }: { filled: boolean; color: string; track: string; index: number }) {
  const reduced = useReducedMotion();
  const fill = useSharedValue(reduced && filled ? 1 : 0);
  React.useEffect(() => {
    fill.set(reduced ? (filled ? 1 : 0) : withTiming(filled ? 1 : 0, { duration: 420 + index * 60, easing: EASE_OUT }));
  }, [fill, filled, index, reduced]);
  const style = useAnimatedStyle(() => ({ width: `${fill.get() * 100}%` }));
  return <View style={[styles.segment, { backgroundColor: track }]}>
    <Animated.View style={[styles.segmentFill, { backgroundColor: color }, style]} />
  </View>;
}

/**
 * Today's session as a dark ticket: the weekday tag, the session in large type with its muscle
 * groups, a strip with one segment per exercise that fills as they are ticked off, and a start
 * button with a ring pulsing out of it. On rest days it turns into a calm reminder.
 */
export function TodaySessionCard({ workout, language, onOpen }: { workout: Workout | undefined; language: Language; onOpen: () => void }) {
  const colors = useColors();
  const c = copy[language] ?? copy.en;
  const t = (key: TranslationKey) => translate(language, key);
  const ink = colors.inkCardForeground;
  const weekday = new Intl.DateTimeFormat(language, { weekday: 'long' }).format(new Date());
  const done = workout ? workout.exercises.filter((exercise) => exercise.completed).length : 0;
  const total = workout?.exercises.length ?? 0;
  const finished = total > 0 && done === total;
  const accent = finished ? colors.success : colors.orange;
  const label = !workout ? c.viewPlan : finished ? c.finished : done > 0 ? c.resume : c.start;
  const focus = (workout?.focusAreas ?? []).slice(0, 3);

  return <Pressable testID="open-today-workout" accessibilityRole="button" accessibilityLabel={label} onPress={() => { triggerHaptic(); onOpen(); }} scaleTo={0.98}>
    <View style={styles.ticket}>
      <LinearGradient colors={[colors.inkCardStart, colors.inkCardEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.watermark}>
        <Ionicons name={workout ? 'barbell-outline' : 'moon-outline'} size={170} color={ink} />
      </View>
      <View style={[styles.glow, { backgroundColor: `${accent}30` }]} />

      <View style={styles.ticketTop}>
        <View style={[styles.dayTag, { backgroundColor: `${ink}14`, borderColor: `${ink}22` }]}>
          <View style={[styles.dayDot, { backgroundColor: accent }]} />
          <Text style={[styles.dayText, { color: ink }]}>{c.today} · {weekday.toLocaleUpperCase(language)}</Text>
        </View>
        {workout ? <View style={styles.duration}>
          <Ionicons name="time-outline" size={14} color={`${ink}B3`} />
          <Text style={[styles.durationText, { color: `${ink}CC` }]}>{workout.duration} min</Text>
        </View> : null}
      </View>

      <Text numberOfLines={2} style={[styles.sessionTitle, { color: ink }]}>
        {workout ? (translate(language, workout.name as TranslationKey) || workout.name) : t('restDayTitle')}
      </Text>
      {workout ? <View style={styles.focusRow}>
        {focus.map((group) => <View key={group} style={[styles.focusChip, { backgroundColor: `${ink}12` }]}><Text style={[styles.focusText, { color: `${ink}D9` }]}>{t(muscleKey(group))}</Text></View>)}
      </View> : <Text style={[styles.restBody, { color: `${ink}B3` }]}>{t('restDaySubtitle')}</Text>}

      {workout && total > 0 ? <View style={styles.progress}>
        <View style={styles.segments}>
          {workout.exercises.map((exercise, index) => <Segment key={exercise.id} index={index} filled={Boolean(exercise.completed)} color={accent} track={`${ink}1C`} />)}
        </View>
        <Text style={[styles.progressText, { color: `${ink}B3` }]}><Text style={{ color: ink, fontFamily: 'Inter_700Bold' }}>{done}/{total}</Text> {t('exercises')} {c.done}</Text>
      </View> : null}

      <View style={[styles.cta, { backgroundColor: ink }]}>
        <Text style={[styles.ctaText, { color: colors.inkCardStart }]}>{label}</Text>
        <View style={styles.ctaArrowWrap}>
          {!finished ? <PulseRing color={accent} /> : null}
          <View style={[styles.ctaArrow, { backgroundColor: accent }]}>
            <Ionicons name={finished ? 'checkmark' : 'arrow-forward'} size={18} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </View>
  </Pressable>;
}

const STEP = 0.1;
const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Body-weight logging as a dial instead of an empty field: the value starts from the last entry,
 * steps by 0.1 kg with the round buttons (or can be typed), and a small ruler slides under it.
 * The header shows the last entry and its change, and the card confirms once today is logged.
 */
export function WeightLogCard({ language, logs, fallbackWeight, onSave, testID = 'home-add-today-weight' }: { language: Language; logs: WeightLog[]; fallbackWeight: number | null; onSave: (value: number) => void; testID?: string }) {
  const colors = useColors();
  const c = copy[language] ?? copy.en;
  const t = (key: TranslationKey) => translate(language, key);
  const sorted = React.useMemo(() => [...logs].sort((a, b) => a.date.localeCompare(b.date)), [logs]);
  const last = sorted.at(-1);
  const previous = sorted.at(-2);
  const loggedToday = last ? mealDateKey(last.date) === localDateKey() : false;
  const start = round1(last?.value ?? fallbackWeight ?? 70);
  const [value, setValue] = React.useState(start);
  const [text, setText] = React.useState(start.toFixed(1));
  const nudge = useSharedValue(0);
  const check = useSharedValue(loggedToday ? 1 : 0);

  React.useEffect(() => { setValue(start); setText(start.toFixed(1)); }, [start]);
  React.useEffect(() => { check.set(withSpring(loggedToday ? 1 : 0, { damping: 12, stiffness: 200 })); }, [check, loggedToday]);

  const change = (delta: number) => {
    triggerHaptic();
    const next = round1(Math.min(300, Math.max(20, value + delta)));
    setValue(next);
    setText(next.toFixed(1));
    nudge.set(withSequence(withTiming(delta > 0 ? -1 : 1, { duration: 90 }), withSpring(0, { damping: 12, stiffness: 260 })));
  };
  const onType = (raw: string) => {
    setText(raw);
    const parsed = Number(raw.replace(',', '.'));
    if (Number.isFinite(parsed) && parsed > 0) setValue(round1(parsed));
  };
  const save = () => {
    if (!(value >= 20 && value <= 300)) return;
    triggerHaptic();
    onSave(value);
  };

  const delta = last && previous ? round1(last.value - previous.value) : null;
  const numberStyle = useAnimatedStyle(() => ({ transform: [{ translateY: nudge.get() * 6 }] }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: check.get(), transform: [{ scale: 0.5 + check.get() * 0.5 }] }));
  // Ruler ticks every 0.1 kg around the current value; whole kilos are taller and labelled.
  const ticks = Array.from({ length: 31 }, (_, index) => round1(value + (index - 15) * STEP));

  return <View style={[styles.weightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.weightHeader}>
      <View style={[styles.weightIcon, { backgroundColor: `${colors.accent}18` }]}><Ionicons name="scale-outline" size={18} color={colors.accent} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[styles.weightTitle, { color: colors.foreground }]}>{t('weeklyAddWeight')}</Text>
        <View style={styles.weightSubRow}>
          <Text numberOfLines={1} style={[styles.weightSub, { color: colors.mutedForeground }]}>{last ? `${c.last}: ${last.value.toFixed(1)} kg` : c.noLog}</Text>
          {delta !== null && delta !== 0 ? <View style={[styles.deltaPill, { backgroundColor: `${delta < 0 ? colors.success : colors.orange}1F` }]}>
            <Ionicons name={delta < 0 ? 'arrow-down' : 'arrow-up'} size={12} color={delta < 0 ? colors.success : colors.orange} />
            <Text style={[styles.deltaText, { color: delta < 0 ? colors.success : colors.orange }]}>{Math.abs(delta).toFixed(1)}</Text>
          </View> : null}
          {loggedToday ? <Animated.View style={[styles.savedBadge, { backgroundColor: `${colors.success}18` }, checkStyle]}>
            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
            <Text numberOfLines={1} style={[styles.savedText, { color: colors.success }]}>{c.today}</Text>
          </Animated.View> : null}
        </View>
      </View>
    </View>

    <View style={styles.dial}>
      <Pressable accessibilityRole="button" accessibilityLabel="-0.1 kg" onPress={() => change(-STEP)} scaleTo={0.9} style={[styles.stepButton, { backgroundColor: colors.secondary }]}>
        <Ionicons name="remove" size={22} color={colors.foreground} />
      </Pressable>
      <Animated.View style={[styles.valueWrap, numberStyle]}>
        <TextInput
          testID={`${testID}-input`}
          value={text}
          onChangeText={onType}
          onBlur={() => setText(value.toFixed(1))}
          keyboardType="decimal-pad"
          selectTextOnFocus
          accessibilityLabel={t('currentWeight')}
          style={[styles.valueInput, { color: colors.foreground }]}
        />
        <Text style={[styles.valueUnit, { color: colors.mutedForeground }]}>kg</Text>
      </Animated.View>
      <Pressable accessibilityRole="button" accessibilityLabel="+0.1 kg" onPress={() => change(STEP)} scaleTo={0.9} style={[styles.stepButton, { backgroundColor: colors.secondary }]}>
        <Ionicons name="add" size={22} color={colors.foreground} />
      </Pressable>
    </View>

    <View style={styles.ruler} pointerEvents="none">
      {ticks.map((tick, index) => {
        const whole = Math.abs(tick - Math.round(tick)) < 0.001;
        const center = index === 15;
        const fade = 1 - Math.abs(index - 15) / 17;
        return <View key={index} style={styles.tickSlot}>
          <View style={[styles.tick, { height: center ? 26 : whole ? 16 : 9, width: center ? 3 : 1.5, backgroundColor: center ? colors.accent : colors.foreground, opacity: center ? 1 : fade * (whole ? 0.55 : 0.28) }]} />
          {whole && !center ? <Text style={[styles.tickLabel, { color: colors.mutedForeground, opacity: fade }]}>{Math.round(tick)}</Text> : null}
        </View>;
      })}
    </View>

    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={loggedToday ? c.update : c.save} onPress={save} scaleTo={0.97} style={[styles.saveButton, { backgroundColor: colors.accent }]}>
      <Text style={[styles.saveText, { color: colors.accentForeground }]}>{loggedToday ? c.update : c.save}</Text>
      <Ionicons name={loggedToday ? 'checkmark-circle' : 'checkmark'} size={17} color={colors.accentForeground} />
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  ticket: { borderRadius: 28, padding: 20, overflow: 'hidden', marginBottom: 14 },
  watermark: { position: 'absolute', right: -34, bottom: -30, opacity: 0.07, transform: [{ rotate: '-24deg' }] },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -90, top: -110 },
  ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dayTag: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6 },
  dayDot: { width: 7, height: 7, borderRadius: 4 },
  dayText: { fontFamily: 'Inter_700Bold', fontSize: 10.5, letterSpacing: 1.1 },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  durationText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  sessionTitle: { fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 34, letterSpacing: -1.1, marginTop: 18 },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  focusChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  focusText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  restBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 8, maxWidth: 280 },
  progress: { marginTop: 20 },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 7, borderRadius: 4, overflow: 'hidden' },
  segmentFill: { height: '100%', borderRadius: 4 },
  progressText: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 9 },
  cta: { marginTop: 20, height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 7 },
  ctaText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 15, letterSpacing: -0.2 },
  ctaArrowWrap: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 42, height: 42, borderRadius: 21, borderWidth: 2 },
  ctaArrow: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  weightCard: { borderRadius: 26, borderWidth: 1, padding: 18, marginBottom: 16 },
  weightHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  weightIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  weightTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, letterSpacing: -0.2 },
  weightSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  weightSub: { flexShrink: 1, fontFamily: 'Inter_500Medium', fontSize: 11.5 },
  deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  deltaText: { fontFamily: 'Inter_700Bold', fontSize: 10.5 },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  savedText: { fontFamily: 'Inter_700Bold', fontSize: 10.5 },
  dial: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  stepButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  valueWrap: { flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4 },
  valueInput: { fontFamily: 'Inter_700Bold', fontSize: 44, letterSpacing: -2, textAlign: 'center', minWidth: 110, padding: 0 },
  valueUnit: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  ruler: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', height: 44, marginTop: 10, overflow: 'hidden' },
  tickSlot: { width: 9, alignItems: 'center' },
  tick: { borderRadius: 1 },
  tickLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 9, marginTop: 4, width: 30, textAlign: 'center' },
  saveButton: { marginTop: 8, height: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
});
