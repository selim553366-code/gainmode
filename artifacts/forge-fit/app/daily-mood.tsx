import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@/components/AppIcon';
import { Header, Screen, triggerHaptic } from '@/components/FitUI';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate, type TranslationKey } from '@/lib/i18n';
import { localDateKey } from '@/lib/nutritionDates';

type MoodAnswerKey = 'stress' | 'energy' | 'feeling' | 'day';
type Choice = { id: string; label: TranslationKey; icon: React.ComponentProps<typeof Ionicons>['name'] };

const questions: Array<{ id: MoodAnswerKey; title: TranslationKey; choices: Choice[] }> = [
  {
    id: 'stress',
    title: 'dailyMoodStressQuestion',
    choices: [
      { id: 'calm', label: 'dailyMoodStressCalm', icon: 'sparkles' },
      { id: 'medium', label: 'dailyMoodStressMedium', icon: 'remove' },
      { id: 'high', label: 'dailyMoodStressHigh', icon: 'alert-circle' },
    ],
  },
  {
    id: 'energy',
    title: 'dailyMoodEnergyQuestion',
    choices: [
      { id: 'low', label: 'dailyMoodEnergyLow', icon: 'pause-outline' },
      { id: 'balanced', label: 'dailyMoodEnergyBalanced', icon: 'activity' },
      { id: 'high', label: 'dailyMoodEnergyHigh', icon: 'flash-outline' },
    ],
  },
  {
    id: 'feeling',
    title: 'dailyMoodFeelingQuestion',
    choices: [
      { id: 'low', label: 'dailyMoodFeelingLow', icon: 'close-outline' },
      { id: 'neutral', label: 'dailyMoodFeelingNeutral', icon: 'options-outline' },
      { id: 'good', label: 'dailyMoodFeelingGood', icon: 'sparkles' },
    ],
  },
  {
    id: 'day',
    title: 'dailyMoodDayQuestion',
    choices: [
      { id: 'hard', label: 'dailyMoodDayHard', icon: 'close-outline' },
      { id: 'balanced', label: 'dailyMoodDayBalanced', icon: 'activity' },
      { id: 'good', label: 'dailyMoodDayGood', icon: 'sparkles' },
    ],
  },
];

export default function DailyMoodScreen() {
  const colors = useColors();
  const { language, dailyMoodCompletedDate, completeDailyMood } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const [answers, setAnswers] = React.useState<Partial<Record<MoodAnswerKey, string>>>({});
  const [completed, setCompleted] = React.useState(false);
  const alreadyCompletedToday = dailyMoodCompletedDate === localDateKey();

  React.useEffect(() => {
    if (alreadyCompletedToday && !completed) {
      router.back();
    }
  }, [alreadyCompletedToday, completed]);

  const choose = (questionId: MoodAnswerKey, choiceId: string) => {
    triggerHaptic();
    setAnswers((current) => ({ ...current, [questionId]: choiceId }));
  };
  const allAnswered = questions.every((question) => answers[question.id]);
  const quote = answers.stress === 'high' || answers.energy === 'low'
    ? t('dailyMoodQuoteGentle')
    : answers.feeling === 'good' || answers.energy === 'high'
      ? t('dailyMoodQuoteStrong')
      : t('dailyMoodQuoteSteady');

  if (completed) {
    return <Screen><View style={styles.completeState}><View style={[styles.completeIcon, { backgroundColor: `${colors.primary}20` }]}><Ionicons name="checkmark" size={33} color={colors.primary} /></View><Text style={[styles.completeEyebrow, { color: colors.primary }]}>{t('dailyMoodCompleteEyebrow')}</Text><Text style={[styles.completeTitle, { color: colors.foreground }]}>{t('dailyMoodCompleteTitle')}</Text><Text style={[styles.quote, { color: colors.foreground }]}>&ldquo;{quote}&rdquo;</Text><Text style={[styles.completeHint, { color: colors.mutedForeground }]}>{t('dailyMoodClosing')}</Text><Pressable accessibilityRole="button" onPress={() => { triggerHaptic(); router.back(); }} style={({ pressed }) => [styles.doneButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}><Text style={[styles.doneButtonText, { color: colors.primaryForeground }]}>{t('dailyMoodDone')}</Text><Ionicons name="checkmark" size={18} color={colors.primaryForeground} /></Pressable></View></Screen>;
  }

  return (
    <Screen bottomPadding={46}>
      <Header eyebrow={t('dailyMoodEyebrow')} title={t('dailyMoodTitle')} subtitle={t('dailyMoodSubtitle')} action="close-outline" onAction={() => router.back()} />
      <View style={[styles.introCard, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}40` }]}><View style={[styles.introIcon, { backgroundColor: colors.primary }]}><Ionicons name="sparkles" size={20} color={colors.primaryForeground} /></View><Text style={[styles.introText, { color: colors.foreground }]}>{t('dailyMoodIntro')}</Text></View>
      {questions.map((question, index) => (
        <View key={question.id} style={styles.questionBlock}>
          <Text style={[styles.questionNumber, { color: colors.primary }]}>{String(index + 1).padStart(2, '0')}</Text>
          <Text style={[styles.questionTitle, { color: colors.foreground }]}>{t(question.title)}</Text>
          <View style={styles.choices}>
            {question.choices.map((choice) => {
              const selected = answers[question.id] === choice.id;
              return <Pressable key={choice.id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => choose(question.id, choice.id)} style={({ pressed }) => [styles.choice, { backgroundColor: selected ? `${colors.primary}18` : colors.card, borderColor: selected ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1 }]}><View style={[styles.choiceIcon, { backgroundColor: selected ? colors.primary : `${colors.primary}16` }]}><Ionicons name={choice.icon} size={16} color={selected ? colors.primaryForeground : colors.primary} /></View><Text style={[styles.choiceText, { color: colors.foreground }]}>{t(choice.label)}</Text>{selected ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}</Pressable>;
            })}
          </View>
        </View>
      ))}
      <Pressable disabled={!allAnswered} onPress={() => { if (!allAnswered) return; triggerHaptic(); completeDailyMood(); setCompleted(true); }} style={({ pressed }) => [styles.completeButton, { backgroundColor: allAnswered ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1 }]}><Text style={[styles.completeButtonText, { color: allAnswered ? colors.primaryForeground : colors.mutedForeground }]}>{t('dailyMoodComplete')}</Text><Ionicons name="arrow-forward" size={18} color={allAnswered ? colors.primaryForeground : colors.mutedForeground} /></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  introCard: { borderWidth: 1, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 22 },
  introIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  introText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  questionBlock: { marginBottom: 21 },
  questionNumber: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1, marginBottom: 5 },
  questionTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, lineHeight: 22, marginBottom: 10 },
  choices: { gap: 8 },
  choice: { minHeight: 51, borderRadius: 16, borderWidth: 1, padding: 8, paddingRight: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  choiceIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  choiceText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  completeButton: { minHeight: 54, borderRadius: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 2 },
  completeButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  completeState: { flex: 1, minHeight: 620, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  completeIcon: { width: 72, height: 72, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  completeEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 },
  completeTitle: { fontFamily: 'Inter_700Bold', fontSize: 27, textAlign: 'center', marginTop: 10 },
  quote: { fontFamily: 'Inter_600SemiBold', fontSize: 18, lineHeight: 27, textAlign: 'center', marginTop: 22 },
  completeHint: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 22 },
  doneButton: { minHeight: 54, borderRadius: 18, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 28, minWidth: 170 },
  doneButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});