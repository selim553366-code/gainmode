import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@/components/AppIcon';
import { Card, Header, Screen, SectionTitle } from '@/components/FitUI';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { getCurrentStreak, getStreakCalendar } from '@/lib/streak';
import { getStreakPrompt, STREAK_PROMPT_COUNT } from '@/lib/streakPrompts';

function Campfire({ day }: { day: number }) {
  const colors = useColors();
  const flicker = React.useRef(new Animated.Value(0)).current;
  const strength = day <= 0 ? 0 : 0.34 + Math.min(day, STREAK_PROMPT_COUNT) / STREAK_PROMPT_COUNT * 0.66;
  const flameSize = 68 + strength * 82;

  React.useEffect(() => {
    if (day <= 0) return undefined;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(flicker, { toValue: 1, duration: 640, useNativeDriver: true }),
      Animated.timing(flicker, { toValue: 0.18, duration: 460, useNativeDriver: true }),
      Animated.timing(flicker, { toValue: 0.72, duration: 520, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [day, flicker]);

  const pulseOpacity = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.76, 1] });
  const pulseScale = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] });
  const innerScale = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.84, 1.1] });

  return (
    <View style={[styles.fireStage, { backgroundColor: `${colors.background}B8`, borderColor: colors.border }]}>
      <View style={[styles.fireGlow, { backgroundColor: day > 0 ? `${colors.orange}14` : 'transparent' }]} />
      <View style={styles.logs}>
        <View style={[styles.log, styles.logBack, { backgroundColor: colors.mutedForeground, borderColor: colors.border }]} />
        <View style={[styles.log, styles.logFront, { backgroundColor: colors.mutedForeground, borderColor: colors.border }]} />
        <View style={[styles.log, styles.logCross, { backgroundColor: colors.mutedForeground, borderColor: colors.border }]} />
      </View>
      {day > 0 ? (
        <Animated.View style={[styles.flameWrap, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}>
          <Animated.View style={{ transform: [{ scale: innerScale }] }}>
            <Ionicons name="flame" size={flameSize} color={colors.orange} />
          </Animated.View>
          <Animated.View style={[styles.innerFlame, { opacity: 0.9 * strength, transform: [{ scale: innerScale }] }]}>
            <Ionicons name="flame" size={flameSize * 0.58} color={colors.primary} />
          </Animated.View>
          {strength > 0.5 ? <Animated.View style={[styles.spark, styles.sparkLeft, { backgroundColor: colors.orange, opacity: pulseOpacity }]} /> : null}
          {strength > 0.7 ? <Animated.View style={[styles.spark, styles.sparkRight, { backgroundColor: colors.primary, opacity: pulseOpacity }]} /> : null}
          {strength > 0.85 ? <Animated.View style={[styles.spark, styles.sparkTop, { backgroundColor: colors.orange, opacity: pulseOpacity }]} /> : null}
        </Animated.View>
      ) : null}
    </View>
  );
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
        <Campfire day={streak} />
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
          <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
        </View>
        <Text style={[styles.keepGoingText, { color: colors.foreground }]}>{t('streakKeepGoing')}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { padding: 14, borderWidth: 1, borderRadius: 26 },
  fireStage: { height: 236, borderRadius: 20, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 28 },
  fireGlow: { position: 'absolute', width: 230, height: 120, borderRadius: 120, bottom: 14 },
  logs: { width: 128, height: 48, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  log: { position: 'absolute', width: 112, height: 18, borderRadius: 12, borderWidth: 1 },
  logBack: { transform: [{ rotate: '-12deg' }], top: 10 },
  logFront: { transform: [{ rotate: '14deg' }], top: 17 },
  logCross: { width: 84, transform: [{ rotate: '90deg' }], top: 15 },
  flameWrap: { position: 'absolute', bottom: 43, alignItems: 'center', justifyContent: 'center' },
  innerFlame: { position: 'absolute', bottom: 0, alignItems: 'center' },
  spark: { position: 'absolute', width: 5, height: 5, borderRadius: 3 },
  sparkLeft: { left: -22, top: 34 },
  sparkRight: { right: -19, top: 58 },
  sparkTop: { right: 4, top: 0 },
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