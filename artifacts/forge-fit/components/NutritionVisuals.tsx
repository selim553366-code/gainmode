import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { EASE_OUT } from '@/components/Motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const BAR_AREA = 118;

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
  week: { borderRadius: 26, borderWidth: 1, padding: 18, marginBottom: 14 },
  weekHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  weekTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.3 },
  weekSub: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 3 },
  weekAverage: { alignItems: 'flex-end' },
  weekAverageValue: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.6 },
  weekAverageUnit: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  weekPlot: { height: BAR_AREA + 22, marginTop: 18 },
  goalLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', opacity: 0.5 },
  weekBars: { flexDirection: 'row', height: '100%' },
  weekSlot: { flex: 1, alignItems: 'center' },
  weekColumn: { height: BAR_AREA, justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
  weekBar: { width: '58%', maxWidth: 26, borderRadius: 8 },
  weekEmpty: { width: 14, height: 3, borderRadius: 2 },
  weekDay: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 8 },
  weekFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 12 },
  weekDot: { width: 8, height: 8, borderRadius: 4 },
  weekFooterText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  weekFooterValue: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});

type WeekDay = { date: string; eaten: number; status: 'on' | 'under' | 'over' | 'none' };
type WeekCopy = { title: string; average: string; onTarget: string; today: string; goal: string; empty: string; on: string; over: string; under: string };

const weekCopy: Record<string, WeekCopy> = {
  tr: { title: 'Bu haftan', average: 'Günlük ortalama', onTarget: '{on}/{tracked} gün hedefte', today: 'Bugün', goal: 'hedef', empty: 'kayıt yok', on: 'Hedefte', over: 'Fazla', under: 'Eksik' },
  en: { title: 'Your week', average: 'Daily average', onTarget: '{on}/{tracked} days on target', today: 'Today', goal: 'goal', empty: 'not logged', on: 'On target', over: 'Over', under: 'Under' },
  de: { title: 'Deine Woche', average: 'Tagesdurchschnitt', onTarget: '{on}/{tracked} Tage im Ziel', today: 'Heute', goal: 'Ziel', empty: 'kein Eintrag', on: 'Im Ziel', over: 'Darüber', under: 'Darunter' },
  fr: { title: 'Ta semaine', average: 'Moyenne par jour', onTarget: '{on}/{tracked} jours dans l’objectif', today: 'Aujourd’hui', goal: 'objectif', empty: 'non enregistré', on: 'Dans l’objectif', over: 'Au-dessus', under: 'En dessous' },
  es: { title: 'Tu semana', average: 'Media diaria', onTarget: '{on}/{tracked} días en el objetivo', today: 'Hoy', goal: 'objetivo', empty: 'sin registro', on: 'En objetivo', over: 'Por encima', under: 'Por debajo' },
};


function WeekBar({ height, color, delay }: { height: number; color: string; delay: number }) {
  const reduced = useReducedMotion();
  const grow = useSharedValue(reduced ? 1 : 0);
  React.useEffect(() => {
    grow.set(reduced ? 1 : withDelay(delay, withTiming(1, { duration: 650, easing: EASE_OUT })));
  }, [delay, grow, height, reduced]);
  const style = useAnimatedStyle(() => ({ height: Math.max(4, height * grow.get()) }));
  return <Animated.View style={[styles.weekBar, { backgroundColor: color }, style]} />;
}

/**
 * The last seven days of eating against the calorie goal: one bar per day, a dashed goal line,
 * green when the day landed within ±20%, orange when over, blue when under. Tap a day for its total.
 */
export function WeekCalories({ days, goal, language, colors }: {
  days: WeekDay[];
  goal: number | null;
  language: string;
  colors: { card: string; border: string; foreground: string; mutedForeground: string; success: string; orange: string; accent: string; secondary: string };
}) {
  const copy = weekCopy[language] ?? weekCopy.en;
  const [selected, setSelected] = React.useState(days.length - 1);
  const tracked = days.filter((day) => day.eaten > 0);
  const onTarget = days.filter((day) => day.status === 'on').length;
  const average = tracked.length ? Math.round(tracked.reduce((sum, day) => sum + day.eaten, 0) / tracked.length) : 0;
  const top = Math.max(goal ?? 0, ...days.map((day) => day.eaten), 1) * 1.15;
  const goalY = goal ? BAR_AREA - (goal / top) * BAR_AREA : null;
  const tone = (day: WeekDay) => day.status === 'on' ? colors.success : day.status === 'over' ? colors.orange : day.status === 'under' ? colors.accent : colors.secondary;
  const pick = days[selected];
  const weekday = (date: string, style: 'narrow' | 'long') => new Intl.DateTimeFormat(language, { weekday: style }).format(new Date(`${date}T12:00:00`));
  const format = (value: number) => value.toLocaleString(language);

  return <View style={[styles.week, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.weekHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.weekTitle, { color: colors.foreground }]}>{copy.title}</Text>
        <Text style={[styles.weekSub, { color: colors.mutedForeground }]}>{copy.onTarget.replace('{on}', String(onTarget)).replace('{tracked}', String(tracked.length))}</Text>
      </View>
      <View style={styles.weekAverage}>
        <Text style={[styles.weekAverageValue, { color: colors.foreground }]}>{format(average)}<Text style={styles.weekAverageUnit}> kcal</Text></Text>
        <Text style={[styles.weekSub, { color: colors.mutedForeground }]}>{copy.average}</Text>
      </View>
    </View>

    <View style={styles.weekPlot}>
      {goalY !== null ? <View pointerEvents="none" style={[styles.goalLine, { top: goalY, borderColor: colors.mutedForeground }]} /> : null}
      <View style={styles.weekBars}>
        {days.map((day, index) => {
          const active = index === selected;
          return <View key={day.date} style={styles.weekSlot} onStartShouldSetResponder={() => true} onResponderGrant={() => setSelected(index)}>
            <View style={[styles.weekColumn, { opacity: active ? 1 : 0.55 }]}>
              {day.eaten > 0 ? <WeekBar height={(day.eaten / top) * BAR_AREA} color={tone(day)} delay={index * 50} /> : <View style={[styles.weekEmpty, { backgroundColor: colors.border }]} />}
            </View>
            <Text style={[styles.weekDay, { color: active ? colors.foreground : colors.mutedForeground }]}>{weekday(day.date, 'narrow')}</Text>
          </View>;
        })}
      </View>
    </View>

    <View style={[styles.weekFooter, { borderTopColor: colors.border }]}>
      <View style={[styles.weekDot, { backgroundColor: tone(pick) }]} />
      <Text style={[styles.weekFooterText, { color: colors.foreground }]}>{selected === days.length - 1 ? copy.today : weekday(pick.date, 'long')}{pick.status !== 'none' ? <Text style={{ color: tone(pick) }}>{`  ${copy[pick.status]}`}</Text> : null}</Text>
      <Text style={[styles.weekFooterValue, { color: colors.mutedForeground }]}>
        {pick.eaten > 0 ? `${format(pick.eaten)}${goal ? ` / ${format(goal)}` : ''} kcal` : copy.empty}
      </Text>
    </View>
  </View>;
}
