import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@/components/AppIcon';
import { Card, Header, Screen, SectionTitle } from '@/components/FitUI';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate, type TranslationKey } from '@/lib/i18n';
import { daysToNextFire, fireTier, FIRE_MILESTONES, type FireTier } from '@/lib/streakFire';
import { StreakFire } from '@/components/StreakFire';
import { getCurrentStreak, getStreakCalendar } from '@/lib/streak';
import { getStreakPrompt, STREAK_PROMPT_COUNT } from '@/lib/streakPrompts';

const tierLabels: Record<Exclude<FireTier, 'none'>, TranslationKey> = {
  spark: 'streakTierSpark',
  blaze: 'streakTierBlaze',
  inferno: 'streakTierInferno',
  legend: 'streakTierLegend',
};

/** Tier name, and how far the fire is from growing again at the next milestone. */
function FireTierRow({ days }: { days: number }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const tier = fireTier(days);
  if (tier === 'none') return null;
  const remaining = daysToNextFire(days);
  const milestone = (FIRE_MILESTONES as readonly number[]).includes(days);
  return <View style={styles.tierRow}>
    <View style={styles.tierHeader}>
      <View style={[styles.tierChip, { backgroundColor: colors.secondary }]}>
        <Ionicons name="flame" size={12} color={colors.foreground} />
        <Text style={[styles.tierChipText, { color: colors.foreground }]}>{t(tierLabels[tier])}</Text>
      </View>
      <Text style={[styles.tierHint, { color: colors.mutedForeground }]}>
        {milestone ? t('streakTierUnlocked') : remaining === null ? t('streakTierMax') : t('streakNextTier').replace('{days}', String(remaining))}
      </Text>
    </View>
    <View style={styles.tierTrack}>
      {FIRE_MILESTONES.map((value, index) => {
        const from = index === 0 ? 0 : FIRE_MILESTONES[index - 1];
        const fill = Math.max(0, Math.min(1, (days - from) / (value - from)));
        return <View key={value} style={[styles.tierSegment, { backgroundColor: colors.secondary }]}>
          <View style={[styles.tierFill, { width: `${fill * 100}%`, backgroundColor: colors.orange }]} />
        </View>;
      })}
    </View>
    <View style={styles.tierLabels}>
      {FIRE_MILESTONES.map((value) => <Text key={value} style={[styles.tierLabel, { color: days >= value ? colors.foreground : colors.mutedForeground }]}>{value}</Text>)}
    </View>
  </View>;
}

export default function StreakScreen() {
  const colors = useColors();
  const { language, streakDates } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const streak = getCurrentStreak(streakDates);
  const calendar = getStreakCalendar(streakDates);
  const prompt = getStreakPrompt(language, Math.min(streak, STREAK_PROMPT_COUNT));
  const weekdayLocale = language === 'tr' ? 'tr-TR' : language;

  return (
    <Screen bottomPadding={42}>
      <Header
        title={t('streakTitle')}
        subtitle={t('streakSubtitle')}
        action="arrow-back"
        onAction={() => router.back()}
        centered
      />

      <Card style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <StreakFire days={streak} />
        <FireTierRow days={streak} />
        <View style={styles.heroCopy}>
          <Text style={[styles.kicker, { color: colors.orange }]}>{t('currentStreak').toUpperCase()}</Text>
          <View style={styles.countLine}>
            <Text style={[styles.count, { color: colors.foreground }]}>{streak}</Text>
            <Text style={[styles.countUnit, { color: colors.mutedForeground }]}>{t('streakDays')}</Text>
          </View>
          <Text style={[styles.prompt, { color: colors.foreground }]}>{prompt}</Text>
        </View>
      </Card>

      <SectionTitle title={t('streakCalendarTitle')} />
      <Card style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {calendar.map((item) => {
          const weekday = item.isToday
            ? t('streakToday')
            : new Intl.DateTimeFormat(weekdayLocale, { weekday: 'short' }).format(new Date(`${item.date}T12:00:00`)).replace('.', '');
          return (
            <View key={item.date} style={styles.calendarDay}>
              <Text style={[styles.weekday, { color: item.isToday ? colors.primary : colors.mutedForeground }]}>{weekday}</Text>
              <View style={[styles.dayDot, { backgroundColor: item.isCompleted ? colors.orange : `${colors.mutedForeground}18`, borderColor: item.isCompleted ? colors.orange : colors.border }]}>
                {item.isCompleted ? <Ionicons name="flame" size={15} color={colors.background} /> : <View style={[styles.emptyDot, { backgroundColor: colors.border }]} />}
              </View>
              <Text style={[styles.dayNumber, { color: item.isCompleted ? colors.orange : colors.mutedForeground }]}>{item.dayNumber > 0 ? item.dayNumber : '—'}</Text>
            </View>
          );
        })}
      </Card>

      <View style={[styles.keepGoing, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}35` }]}>
        <View style={[styles.keepGoingIcon, { backgroundColor: `${colors.primary}22` }]}>
          <Ionicons name="flash-outline" size={18} color={colors.primary} />
        </View>
        <Text style={[styles.keepGoingText, { color: colors.foreground }]}>{t('streakKeepGoing')}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { padding: 14, borderWidth: 1, borderRadius: 26 },
  tierRow: { paddingHorizontal: 8, paddingTop: 16 },
  tierHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  tierChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tierChipText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  tierHint: { flex: 1, textAlign: 'right', fontFamily: 'Inter_500Medium', fontSize: 11 },
  tierTrack: { flexDirection: 'row', gap: 4, marginTop: 12 },
  tierSegment: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  tierFill: { height: '100%', borderRadius: 3 },
  tierLabels: { flexDirection: 'row', marginTop: 6 },
  tierLabel: { flex: 1, textAlign: 'right', fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  heroCopy: { paddingHorizontal: 8, paddingTop: 20, paddingBottom: 8 },
  kicker: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1 },
  countLine: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 3 },
  count: { fontFamily: 'Inter_700Bold', fontSize: 52, lineHeight: 58, letterSpacing: -2 },
  countUnit: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  prompt: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 21, marginTop: 9 },
  calendarCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderWidth: 1, borderRadius: 22 },
  calendarDay: { alignItems: 'center', flex: 1, gap: 7 },
  weekday: { fontFamily: 'Inter_600SemiBold', fontSize: 10, textTransform: 'uppercase' },
  dayDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyDot: { width: 5, height: 5, borderRadius: 3 },
  dayNumber: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  keepGoing: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 16, padding: 14, borderWidth: 1, borderRadius: 18 },
  keepGoingIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  keepGoingText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
});