import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { ArrowLeft, BatteryFull, BatteryLow, BatteryMedium, Check, CloudLightning, Leaf, Mountain, Scale, Sun, WavesHorizontal, X, type LucideIcon } from 'lucide-react-native';
import { PressableScale as Pressable, EASE_OUT } from '@/components/Motion';
import { triggerHaptic } from '@/components/FitUI';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate, type Language, type TranslationKey } from '@/lib/i18n';
import { localDateKey } from '@/lib/nutritionDates';
import { getDailyMoodQuote } from '@/lib/dailyMood';

type MoodAnswerKey = 'stress' | 'energy' | 'feeling' | 'day';
/** A choice draws either a glyph or a face whose mouth curves from -1 (down) to 1 (up). */
type Choice = { id: string; label: TranslationKey; color: string; level: 1 | 2 | 3; icon?: LucideIcon; face?: -1 | 0 | 1 };

const questions: Array<{ id: MoodAnswerKey; title: TranslationKey; choices: Choice[] }> = [
  {
    id: 'stress',
    title: 'dailyMoodStressQuestion',
    choices: [
      { id: 'calm', label: 'dailyMoodStressCalm', icon: Leaf, color: '#14B8A6', level: 1 },
      { id: 'medium', label: 'dailyMoodStressMedium', icon: WavesHorizontal, color: '#F59E0B', level: 2 },
      { id: 'high', label: 'dailyMoodStressHigh', icon: CloudLightning, color: '#F43F5E', level: 3 },
    ],
  },
  {
    id: 'energy',
    title: 'dailyMoodEnergyQuestion',
    choices: [
      { id: 'low', label: 'dailyMoodEnergyLow', icon: BatteryLow, color: '#8B5CF6', level: 1 },
      { id: 'balanced', label: 'dailyMoodEnergyBalanced', icon: BatteryMedium, color: '#0EA5E9', level: 2 },
      { id: 'high', label: 'dailyMoodEnergyHigh', icon: BatteryFull, color: '#22C55E', level: 3 },
    ],
  },
  {
    id: 'feeling',
    title: 'dailyMoodFeelingQuestion',
    choices: [
      { id: 'low', label: 'dailyMoodFeelingLow', face: -1, color: '#6366F1', level: 1 },
      { id: 'neutral', label: 'dailyMoodFeelingNeutral', face: 0, color: '#64748B', level: 2 },
      { id: 'good', label: 'dailyMoodFeelingGood', face: 1, color: '#F59E0B', level: 3 },
    ],
  },
  {
    id: 'day',
    title: 'dailyMoodDayQuestion',
    choices: [
      { id: 'hard', label: 'dailyMoodDayHard', icon: Mountain, color: '#F97316', level: 1 },
      { id: 'balanced', label: 'dailyMoodDayBalanced', icon: Scale, color: '#3B82F6', level: 2 },
      { id: 'good', label: 'dailyMoodDayGood', icon: Sun, color: '#EAB308', level: 3 },
    ],
  },
];

const flowCopy: Record<Language, { step: string; back: string; next: string; summary: string }> = {
  tr: { step: 'SORU {n} / 4', back: 'Geri', next: 'Devam', summary: 'Bugünün özeti' },
  en: { step: 'QUESTION {n} OF 4', back: 'Back', next: 'Next', summary: 'Today at a glance' },
  de: { step: 'FRAGE {n} VON 4', back: 'Zurück', next: 'Weiter', summary: 'Dein Tag auf einen Blick' },
  fr: { step: 'QUESTION {n} SUR 4', back: 'Retour', next: 'Suivant', summary: 'Ta journée en bref' },
  es: { step: 'PREGUNTA {n} DE 4', back: 'Atrás', next: 'Siguiente', summary: 'Tu día de un vistazo' },
};

function Face({ curve, size, color }: { curve: -1 | 0 | 1; size: number; color: string }) {
  const mouthY = 15.5 - curve * 1.2;
  const control = mouthY + curve * 3.4;
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
    <Circle cx={12} cy={12} r={9.5} />
    <Circle cx={8.8} cy={9.6} r={0.9} fill={color} stroke="none" />
    <Circle cx={15.2} cy={9.6} r={0.9} fill={color} stroke="none" />
    <Path d={`M 8 ${mouthY} Q 12 ${control} 16 ${mouthY}`} />
  </Svg>;
}

function Glyph({ choice, size, color }: { choice: Choice; size: number; color: string }) {
  if (choice.face !== undefined) return <Face curve={choice.face} size={size} color={color} />;
  const Icon = choice.icon!;
  return <Icon size={size} color={color} strokeWidth={2} />;
}

/**
 * One answer as a tall tile. At rest it shows a soft wash of its colour; chosen, the whole tile
 * floods with that colour, lifts slightly and gains a check, while its siblings step back.
 */
function ChoiceTile({ choice, label, selected, dimmed, onPress }: { choice: Choice; label: string; selected: boolean; dimmed: boolean; onPress: () => void }) {
  const colors = useColors();
  const dark = colors.colorScheme === 'dark';
  const fill = useSharedValue(selected ? 1 : 0);
  React.useEffect(() => {
    fill.set(withSpring(selected ? 1 : 0, { damping: 16, stiffness: 220 }));
  }, [fill, selected]);
  const floodStyle = useAnimatedStyle(() => ({ opacity: fill.get() }));
  const tileStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * fill.get() }, { scale: 1 + 0.03 * fill.get() }] }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: fill.get(), transform: [{ scale: interpolate(fill.get(), [0, 1], [0.4, 1]) }] }));
  const ink = selected ? '#FFFFFF' : colors.foreground;

  return <Pressable testID={`mood-${choice.id}`} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={label} onPress={onPress} scaleTo={0.96} style={[styles.tileWrap, { opacity: dimmed ? 0.5 : 1 }]}>
    <Animated.View style={[styles.tile, { backgroundColor: colors.card, borderColor: selected ? choice.color : colors.border, shadowColor: choice.color }, tileStyle]}>
      <LinearGradient colors={[`${choice.color}00`, `${choice.color}${dark ? '33' : '24'}`]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, floodStyle]}>
        <LinearGradient colors={[choice.color, `${choice.color}D9`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.check, checkStyle]}><Check size={13} color={choice.color} strokeWidth={3} /></Animated.View>
      <View style={[styles.glyph, { backgroundColor: selected ? 'rgba(255,255,255,0.22)' : `${choice.color}${dark ? '2E' : '1F'}` }]}>
        <Glyph choice={choice} size={30} color={selected ? '#FFFFFF' : choice.color} />
      </View>
      <Text numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tileLabel, { color: ink }]}>{label}</Text>
      <View style={styles.levels}>
        {[1, 2, 3].map((step) => <View key={step} style={[styles.level, { height: 6 + step * 4, backgroundColor: step <= choice.level ? (selected ? '#FFFFFF' : choice.color) : (selected ? 'rgba(255,255,255,0.35)' : `${colors.foreground}1A`) }]} />)}
      </View>
    </Animated.View>
  </Pressable>;
}

export default function DailyMoodScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { language, dailyMoodCompletedDate, completeDailyMood } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const copy = flowCopy[language] ?? flowCopy.en;
  const [answers, setAnswers] = React.useState<Partial<Record<MoodAnswerKey, string>>>({});
  const [step, setStep] = React.useState(0);
  const [completed, setCompleted] = React.useState(false);
  const alreadyCompletedToday = dailyMoodCompletedDate === localDateKey();
  const enter = useSharedValue(1);
  const direction = useSharedValue(1);
  const advance = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (alreadyCompletedToday && !completed) router.back();
  }, [alreadyCompletedToday, completed]);
  React.useEffect(() => () => { if (advance.current) clearTimeout(advance.current); }, []);

  const goTo = (next: number) => {
    direction.set(next > step ? 1 : -1);
    enter.set(reduced ? 1 : 0);
    if (!reduced) enter.set(withTiming(1, { duration: 360, easing: EASE_OUT }));
    setStep(next);
  };
  const question = questions[step];
  const isLast = step === questions.length - 1;
  const answered = Boolean(answers[question.id]);
  const allAnswered = questions.every((item) => answers[item.id]);

  const choose = (choiceId: string) => {
    triggerHaptic();
    setAnswers((current) => ({ ...current, [question.id]: choiceId }));
    // Move on by itself after a beat, so picking feels like a single gesture.
    if (advance.current) clearTimeout(advance.current);
    if (!isLast) advance.current = setTimeout(() => goTo(step + 1), 420);
  };
  const finish = () => {
    if (!allAnswered) return;
    triggerHaptic();
    completeDailyMood();
    setCompleted(true);
  };

  const stageStyle = useAnimatedStyle(() => ({
    opacity: enter.get(),
    transform: [{ translateX: (1 - enter.get()) * 36 * direction.get() }],
  }));

  if (completed) {
    const quote = getDailyMoodQuote(language);
    return <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.doneBody}>
        <View style={[styles.doneBadge, { backgroundColor: colors.primary }]}><Check size={34} color={colors.primaryForeground} strokeWidth={2.6} /></View>
        <Text style={[styles.doneEyebrow, { color: colors.mutedForeground }]}>{t('dailyMoodCompleteEyebrow')}</Text>
        <Text style={[styles.doneTitle, { color: colors.foreground }]}>{t('dailyMoodCompleteTitle')}</Text>
        <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{copy.summary.toLocaleUpperCase(language)}</Text>
        <View style={styles.summary}>
          {questions.map((item) => {
            const choice = item.choices.find((option) => option.id === answers[item.id]);
            if (!choice) return null;
            return <View key={item.id} style={[styles.summaryChip, { backgroundColor: `${choice.color}1F`, borderColor: `${choice.color}55` }]}>
              <Glyph choice={choice} size={16} color={choice.color} />
              <Text style={[styles.summaryText, { color: colors.foreground }]}>{t(choice.label)}</Text>
            </View>;
          })}
        </View>
        <View style={[styles.quoteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.quoteMark, { color: colors.primary }]}>&ldquo;</Text>
          <Text style={[styles.quote, { color: colors.foreground }]}>{quote}</Text>
        </View>
        <Text style={[styles.doneHint, { color: colors.mutedForeground }]}>{t('dailyMoodClosing')}</Text>
      </View>
      <Pressable testID="mood-done" accessibilityRole="button" onPress={() => { triggerHaptic(); router.back(); }} style={[styles.primary, { backgroundColor: colors.primary }]}>
        <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{t('dailyMoodDone')}</Text>
      </Pressable>
    </View>;
  }

  return <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 }]}>
    <View style={styles.topBar}>
      <View style={styles.segments}>
        {questions.map((item, index) => <View key={item.id} style={[styles.segment, { backgroundColor: `${colors.foreground}1A` }]}>
          <View style={[styles.segmentFill, { width: answers[item.id] || index < step ? '100%' : index === step ? '35%' : '0%', backgroundColor: colors.foreground }]} />
        </View>)}
      </View>
      <Pressable testID="mood-close" accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.secondary }]}>
        <X size={18} color={colors.foreground} strokeWidth={2.2} />
      </Pressable>
    </View>

    <Animated.View style={[styles.stage, stageStyle]}>
      <Text style={[styles.step, { color: colors.mutedForeground }]}>{copy.step.replace('{n}', String(step + 1))}</Text>
      <Text style={[styles.question, { color: colors.foreground }]}>{t(question.title)}</Text>
      {step === 0 ? <Text style={[styles.intro, { color: colors.mutedForeground }]}>{t('dailyMoodIntro')}</Text> : null}
      <View style={styles.tiles}>
        {question.choices.map((choice) => <ChoiceTile
          key={`${question.id}-${choice.id}`}
          choice={choice}
          label={t(choice.label)}
          selected={answers[question.id] === choice.id}
          dimmed={answered && answers[question.id] !== choice.id}
          onPress={() => choose(choice.id)}
        />)}
      </View>
    </Animated.View>

    <View style={styles.bottomBar}>
      <Pressable testID="mood-back" accessibilityRole="button" disabled={step === 0} onPress={() => goTo(step - 1)} style={[styles.back, { borderColor: colors.border, opacity: step === 0 ? 0.35 : 1 }]}>
        <ArrowLeft size={18} color={colors.foreground} strokeWidth={2.2} />
        <Text style={[styles.backText, { color: colors.foreground }]}>{copy.back}</Text>
      </Pressable>
      <Pressable
        testID={isLast ? 'mood-complete' : 'mood-next'}
        accessibilityRole="button"
        disabled={isLast ? !allAnswered : !answered}
        onPress={() => (isLast ? finish() : goTo(step + 1))}
        style={[styles.primary, styles.primaryFlex, { backgroundColor: (isLast ? allAnswered : answered) ? colors.primary : `${colors.foreground}14` }]}
      >
        <Text style={[styles.primaryText, { color: (isLast ? allAnswered : answered) ? colors.primaryForeground : colors.mutedForeground }]}>{isLast ? t('dailyMoodComplete') : copy.next}</Text>
      </Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  segments: { flex: 1, flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  segmentFill: { height: '100%', borderRadius: 3 },
  close: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  stage: { flex: 1, justifyContent: 'center' },
  step: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.6 },
  question: { fontFamily: 'Inter_700Bold', fontSize: 32, lineHeight: 38, letterSpacing: -1, marginTop: 10 },
  intro: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 10 },
  tiles: { flexDirection: 'row', gap: 8, marginTop: 30 },
  tileWrap: { flex: 1 },
  tile: { height: 196, borderRadius: 24, borderWidth: 1.5, padding: 11, overflow: 'hidden', justifyContent: 'space-between', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 10 } },
  check: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  glyph: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontFamily: 'Inter_700Bold', fontSize: 12.5, lineHeight: 17, letterSpacing: -0.2 },
  levels: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  level: { width: 5, borderRadius: 2 },
  bottomBar: { flexDirection: 'row', gap: 10 },
  back: { height: 56, borderRadius: 18, borderWidth: 1, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  primary: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primaryFlex: { flex: 1 },
  primaryText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  doneBody: { flex: 1, justifyContent: 'center' },
  doneBadge: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  doneEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.6 },
  doneTitle: { fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 36, letterSpacing: -0.9, marginTop: 8 },
  summaryLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, marginTop: 28 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  summaryChip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  summaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  quoteCard: { borderRadius: 22, borderWidth: 1, padding: 20, marginTop: 24 },
  quoteMark: { fontFamily: 'Inter_700Bold', fontSize: 44, lineHeight: 44, height: 28 },
  quote: { fontFamily: 'Inter_600SemiBold', fontSize: 17, lineHeight: 25 },
  doneHint: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 16 },
});
