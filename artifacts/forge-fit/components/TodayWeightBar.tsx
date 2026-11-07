import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { PressableScale as Pressable } from '@/components/Motion';
import { Ionicons } from '@/components/AppIcon';
import { triggerHaptic } from '@/components/FitUI';
import { WeightDial } from '@/components/WeightDial';
import { useColors } from '@/hooks/useColors';
import { translate, type Language } from '@/lib/i18n';
import { localDateKey, mealDateKey, type WeightLog } from '@/lib/nutritionDates';

type TodayWeightBarProps = {
  language: Language;
  tracksWeight: boolean;
  onSave: (value: number) => void;
  /** Past weigh-ins, used for the starting value and the change since the last entry. */
  logs?: WeightLog[];
  fallbackWeight?: number | null;
  goalWeight?: number | null;
  testID?: string;
};

const copy: Record<Language, { last: string; noLog: string; logged: string; save: string; update: string; toGoal: string }> = {
  tr: { last: 'Son kayıt', noLog: 'İlk kaydını gir', logged: 'Bugün kaydedildi', save: 'Kaydet', update: 'Güncelle', toGoal: 'hedefe' },
  en: { last: 'Last entry', noLog: 'Log your first entry', logged: 'Logged today', save: 'Save', update: 'Update', toGoal: 'to goal' },
  de: { last: 'Letzter Eintrag', noLog: 'Ersten Eintrag machen', logged: 'Heute eingetragen', save: 'Speichern', update: 'Aktualisieren', toGoal: 'bis zum Ziel' },
  fr: { last: 'Dernière pesée', noLog: 'Ajoute ta première pesée', logged: 'Enregistré aujourd’hui', save: 'Enregistrer', update: 'Mettre à jour', toGoal: 'de l’objectif' },
  es: { last: 'Último registro', noLog: 'Registra tu primer peso', logged: 'Registrado hoy', save: 'Guardar', update: 'Actualizar', toGoal: 'al objetivo' },
};

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Today's weigh-in on the scale dial: turn the wheel (or type, or nudge with the small buttons) to the weight, see the
 * change since the last entry and the distance to the goal, and save with one pill button.
 */
export function TodayWeightBar({ language, tracksWeight, onSave, logs = [], fallbackWeight = null, goalWeight = null, testID = 'add-today-weight' }: TodayWeightBarProps) {
  const colors = useColors();
  const c = copy[language] ?? copy.en;
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const sorted = React.useMemo(() => [...logs].sort((a, b) => a.date.localeCompare(b.date)), [logs]);
  const last = sorted.at(-1);
  const loggedToday = last ? mealDateKey(last.date) === localDateKey() : false;
  const start = round1(last?.value ?? fallbackWeight ?? 70);
  const [value, setValue] = React.useState(start);
  const [text, setText] = React.useState(start.toFixed(1));
  const check = useSharedValue(loggedToday ? 1 : 0);

  React.useEffect(() => { setValue(start); setText(start.toFixed(1)); }, [start]);
  React.useEffect(() => { check.set(withSpring(loggedToday ? 1 : 0, { damping: 12, stiffness: 200 })); }, [check, loggedToday]);

  const setFromKg = (kg: number) => {
    const next = round1(Math.min(200, Math.max(35, kg)));
    setValue(next);
    setText(next.toFixed(1));
  };
  const onType = (raw: string) => {
    setText(raw);
    const parsed = Number(raw.replace(',', '.'));
    if (Number.isFinite(parsed) && parsed >= 35 && parsed <= 200) setValue(round1(parsed));
  };
  const save = () => {
    if (!(value >= 35 && value <= 200)) return;
    triggerHaptic();
    onSave(value);
  };

  const checkStyle = useAnimatedStyle(() => ({ opacity: check.get(), transform: [{ scale: 0.5 + check.get() * 0.5 }] }));

  if (!tracksWeight) return null;

  const reference = loggedToday ? sorted.at(-2)?.value : last?.value;
  const delta = reference === undefined ? null : round1(value - reference);
  const toGoal = goalWeight === null ? null : round1(value - goalWeight);
  const good = delta !== null && delta !== 0 && goalWeight !== null && reference !== undefined
    ? Math.abs(value - goalWeight) < Math.abs(reference - goalWeight)
    : delta !== null && delta < 0;
  const deltaColor = good ? colors.success : colors.orange;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: `${colors.accent}18` }]}>
          <Ionicons name="scale-outline" size={19} color={colors.accent} />
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>{t('weeklyAddWeight')}</Text>
          <View style={styles.subRow}>
            <Text numberOfLines={1} style={[styles.sub, { color: colors.mutedForeground }]}>{last ? `${c.last}: ${last.value.toFixed(1)} kg` : c.noLog}</Text>
            {loggedToday ? (
              <Animated.View style={[styles.savedBadge, { backgroundColor: `${colors.success}18` }, checkStyle]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <Text numberOfLines={1} style={[styles.savedText, { color: colors.success }]}>{c.logged}</Text>
              </Animated.View>
            ) : null}
          </View>
        </View>
      </View>

      <WeightDial value={value} unit="metric" inputValue={text} onInputChange={onType} onChange={setFromKg} />

      <View style={styles.footer}>
        <View style={styles.pills}>
          {delta !== null && delta !== 0 ? (
            <View style={[styles.pill, { backgroundColor: `${deltaColor}1F` }]}>
              <Ionicons name={delta < 0 ? 'arrow-down' : 'arrow-up'} size={12} color={deltaColor} />
              <Text style={[styles.pillText, { color: deltaColor }]}>{Math.abs(delta).toFixed(1)} kg</Text>
            </View>
          ) : null}
          {toGoal !== null && Math.abs(toGoal) >= 0.1 ? (
            <View style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[styles.pillText, { color: colors.mutedForeground }]}>{Math.abs(toGoal).toFixed(1)} kg {c.toGoal}</Text>
            </View>
          ) : null}
        </View>
        <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={loggedToday ? c.update : c.save} onPress={save} scaleTo={0.97} style={[styles.save, { backgroundColor: colors.accent }]}>
          <Text style={[styles.saveText, { color: colors.accentForeground }]}>{loggedToday ? c.update : c.save}</Text>
          <View style={[styles.saveArrow, { backgroundColor: colors.accentForeground }]}><Ionicons name={loggedToday ? 'checkmark' : 'arrow-forward'} size={18} color={colors.accent} /></View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 19, letterSpacing: -0.7 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  sub: { flexShrink: 1, fontFamily: 'Inter_500Medium', fontSize: 12 },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  savedText: { fontFamily: 'Inter_700Bold', fontSize: 10.5 },
  footer: { marginTop: 12, gap: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, minHeight: 28, justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  pillText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  save: { height: 62, borderRadius: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 26, paddingRight: 8 },
  saveText: { fontFamily: 'Inter_800ExtraBold', fontSize: 17, letterSpacing: -0.2 },
  saveArrow: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
