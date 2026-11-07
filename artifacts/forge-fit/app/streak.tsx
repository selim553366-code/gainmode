import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@/components/AppIcon';
import { Header, Screen } from '@/components/FitUI';
import { LinearGradient } from 'expo-linear-gradient';
import { ChargeButton } from '@/components/ChargeButton';
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

/**
 * The road to the next fire: three milestone stops (10, 50, 100) on one track. The filled part is the
 * streak so far, the current day rides on it as an ink flag.
 */
function FireRoad({ days }: { days: number }) {
  const { language } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const tier = fireTier(days);
  const remaining = daysToNextFire(days);
  const milestone = (FIRE_MILESTONES as readonly number[]).includes(days);
  const max = FIRE_MILESTONES[FIRE_MILESTONES.length - 1];
  // Each stop gets an equal third of the track, so day 1 and day 99 both read clearly.
  const position = (value: number) => {
    let from = 0;
    for (let i = 0; i < FIRE_MILESTONES.length; i += 1) {
      const to = FIRE_MILESTONES[i];
      if (value <= to) return (i + (value - from) / (to - from)) / FIRE_MILESTONES.length;
      from = to;
    }
    return 1;
  };
  const progress = Math.min(1, position(Math.min(days, max)));
  return <View style={styles.road}>
    <View style={styles.roadHead}>
      {tier !== 'none' ? <LinearGradient colors={['#FF7A2F', '#FFB547']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tierPill}>
        <Ionicons name="flame" size={12} color="#3A1600" />
        <Text style={styles.tierPillText}>{t(tierLabels[tier]).toUpperCase()}</Text>
      </LinearGradient> : <View />}
      <Text style={styles.roadHint}>{milestone ? t('streakTierUnlocked') : remaining === null ? t('streakTierMax') : t('streakNextTier').replace('{days}', String(remaining))}</Text>
    </View>
    <View style={styles.roadTrack}>
      <LinearGradient colors={['#FF7A2F', '#FFB547']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.roadFill, { width: `${Math.max(progress * 100, 3)}%` }]} />
      {FIRE_MILESTONES.map((value) => <View key={value} style={[styles.roadStop, { left: `${position(value) * 100}%`, backgroundColor: days >= value ? '#FFB547' : 'rgba(255,255,255,0.18)' }]} />)}
    </View>
    <View style={styles.roadLabels}>
      {FIRE_MILESTONES.map((value) => <Text key={value} style={[styles.roadLabel, { left: `${position(value) * 100}%`, color: days >= value ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }]}>{value}</Text>)}
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
    <Screen sky bottomPadding={42}>
      <Header
        title={t('streakTitle')}
        subtitle={t('streakSubtitle')}
        action="arrow-back"
        onAction={() => router.back()}
        centered
      />

      {/* Campfire at night: the fire burns in a deep panel, the streak count sits in the dark sky above it. */}
      <LinearGradient colors={['#0B1022', '#1A1230', '#2A120C']} locations={[0, 0.55, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.night}>
        <View style={styles.nightTop}>
          <View>
            <Text style={styles.kicker}>{t('currentStreak').toUpperCase()}</Text>
            <View style={styles.countLine}>
              <Text style={styles.count}>{streak}</Text>
              <Text style={styles.countUnit}>{t('streakDays')}</Text>
            </View>
          </View>
        </View>
        <View style={styles.fire}><StreakFire days={streak} height={230} bare /></View>
        <FireRoad days={streak} />
      </LinearGradient>

      <View style={[styles.note, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <LinearGradient colors={['#FF7A2F', '#FFB547']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.noteBar} />
        <Text style={[styles.prompt, { color: colors.foreground }]}>{prompt}</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('streakCalendarTitle')}</Text>
      {/* The week as capsules, like the Plan tab: a kept day fills with fire, today is ringed in ink. */}
      <View style={styles.week}>
        {calendar.map((item) => {
          const weekday = item.isToday
            ? t('streakToday')
            : new Intl.DateTimeFormat(weekdayLocale, { weekday: 'short' }).format(new Date(`${item.date}T12:00:00`)).replace('.', '');
          const body = <>
            <Text numberOfLines={1} style={[styles.capsuleDay, { color: item.isCompleted ? 'rgba(255,255,255,0.85)' : colors.mutedForeground }]}>{weekday}</Text>
            <View style={[styles.capsuleIcon, { backgroundColor: item.isCompleted ? 'rgba(255,255,255,0.22)' : 'transparent' }]}>
              <Ionicons name="flame" size={15} color={item.isCompleted ? '#FFFFFF' : colors.border} />
            </View>
            <Text style={[styles.capsuleNum, { color: item.isCompleted ? '#FFFFFF' : colors.mutedForeground }]}>{item.dayNumber > 0 ? item.dayNumber : '–'}</Text>
          </>;
          return <View key={item.date} style={styles.capsuleWrap}>
            {item.isCompleted
              ? <LinearGradient colors={['#FFB547', '#FF6A2B']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.capsule, item.isToday ? { borderColor: colors.foreground, borderWidth: 2 } : { borderColor: 'transparent' }]}>{body}</LinearGradient>
              : <View style={[styles.capsule, { backgroundColor: colors.card, borderColor: item.isToday ? colors.foreground : colors.border, borderWidth: item.isToday ? 2 : 1, borderStyle: item.isToday ? 'solid' : 'dashed' }]}>{body}</View>}
          </View>;
        })}
      </View>

      <Text style={[styles.keepText, { color: colors.mutedForeground }]}>{t('streakKeepGoing')}</Text>
      <ChargeButton testID="streak-start-workout" label={t('startWorkout')} tones={['#FF6A2B', '#FFB547']} onPress={() => router.push('/(tabs)/plan')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  night: { borderRadius: 32, paddingTop: 22, paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden' },
  nightTop: { flexDirection: 'row', justifyContent: 'space-between' },
  kicker: { fontFamily: 'Inter_800ExtraBold', fontSize: 10.5, letterSpacing: 1.4, color: '#FFB547' },
  countLine: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
  count: { fontFamily: 'Inter_800ExtraBold', fontSize: 64, lineHeight: 70, letterSpacing: -3, color: '#FFFFFF' },
  countUnit: { fontFamily: 'Inter_700Bold', fontSize: 17, color: 'rgba(255,255,255,0.6)' },
  fire: { marginTop: -30, marginHorizontal: -20 },
  road: { marginTop: 6 },
  roadHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  tierPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tierPillText: { fontFamily: 'Inter_800ExtraBold', fontSize: 10.5, letterSpacing: 0.8, color: '#3A1600' },
  roadHint: { flex: 1, textAlign: 'right', fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.72)' },
  roadTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 14, justifyContent: 'center' },
  roadFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 4 },
  roadStop: { position: 'absolute', width: 4, height: 14, borderRadius: 2, marginLeft: -4 },
  roadLabels: { height: 16, marginTop: 6 },
  roadLabel: { position: 'absolute', width: 40, marginLeft: -40, textAlign: 'right', fontFamily: 'Inter_700Bold', fontSize: 11 },
  note: { flexDirection: 'row', alignItems: 'stretch', gap: 14, borderRadius: 24, borderWidth: 1, padding: 18, marginTop: 14 },
  noteBar: { width: 4, borderRadius: 2 },
  prompt: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 22, letterSpacing: -0.2 },
  sectionTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 22, letterSpacing: -0.8, marginTop: 26, marginBottom: 12, paddingHorizontal: 2 },
  week: { flexDirection: 'row', gap: 6 },
  capsuleWrap: { flex: 1 },
  capsule: { height: 104, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'space-between', paddingTop: 13, paddingBottom: 12, overflow: 'hidden' },
  capsuleDay: { fontFamily: 'Inter_700Bold', fontSize: 9.5, letterSpacing: 0.3, textTransform: 'uppercase', maxWidth: '92%' },
  capsuleIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  capsuleNum: { fontFamily: 'Inter_800ExtraBold', fontSize: 13 },
  keepText: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 24, marginBottom: 12, paddingHorizontal: 12 },
});
