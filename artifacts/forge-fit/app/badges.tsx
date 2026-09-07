import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@/components/AppIcon';
import { Header, ProgressBar, Screen } from '@/components/FitUI';
import { useFit } from '@/context/FitContext';
import { useColors } from '@/hooks/useColors';
import { badgeText, badges, badgeUi, type BadgeCategory, type BadgeMetric } from '@/lib/badges';
import { getCurrentStreak } from '@/lib/streak';

export default function BadgesScreen() {
  const colors = useColors();
  const { language, streakDates, achievementStats, unlockedBadgeIds } = useFit();
  const [category, setCategory] = React.useState<BadgeCategory>('training');
  const ui = <K extends keyof typeof badgeUi>(key: K) => badgeText(badgeUi[key], language);
  const metrics: Record<BadgeMetric, number> = {
    ...achievementStats,
    streak: getCurrentStreak(streakDates),
    activeDays: streakDates.length,
  };
  const earned = unlockedBadgeIds.length;
  const tabs: Array<{ id: BadgeCategory; icon: React.ComponentProps<typeof Ionicons>['name'] }> = [
    { id: 'training', icon: 'badge-training' },
    { id: 'consistency', icon: 'badge-consistency' },
    { id: 'nutrition', icon: 'badge-nutrition' },
    { id: 'progress', icon: 'badge-progress' },
  ];

  return <Screen bottomPadding={90}>
    <Header eyebrow={ui('eyebrow')} title={ui('title')} subtitle={ui('subtitle')} action="close-outline" onAction={() => router.back()} />
    <View style={[styles.summary, { backgroundColor: colors.primary }]}>
      <View style={[styles.summaryIcon, { backgroundColor: `${colors.primaryForeground}20` }]}><Ionicons name="badge-collection" size={27} color={colors.primaryForeground} /></View>
      <View><Text style={[styles.summaryLabel, { color: `${colors.primaryForeground}B8` }]}>{ui('collection').toUpperCase()}</Text><Text style={[styles.summaryValue, { color: colors.primaryForeground }]}>{earned} / {badges.length}</Text></View>
    </View>
    <View style={styles.tabs}>
      {tabs.map((tab) => {
        const active = category === tab.id;
        return <Pressable key={tab.id} onPress={() => setCategory(tab.id)} style={[styles.tab, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}>
          <Ionicons name={tab.icon} size={16} color={active ? colors.primaryForeground : colors.mutedForeground} />
          <Text style={[styles.tabText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{ui(tab.id)}</Text>
        </Pressable>;
      })}
    </View>
    {badges.filter((badge) => badge.category === category).map((badge) => {
      const value = metrics[badge.metric];
      const unlocked = unlockedBadgeIds.includes(badge.id);
      return <View key={badge.id} style={[styles.card, { backgroundColor: colors.card, borderColor: unlocked ? `${badge.color}70` : colors.border }]}>
        <View style={[styles.badgeIcon, { backgroundColor: unlocked ? `${badge.color}20` : colors.secondary, borderColor: unlocked ? `${badge.color}55` : colors.border }]}>
          <Ionicons name={badge.icon as React.ComponentProps<typeof Ionicons>['name']} size={25} color={unlocked ? badge.color : colors.mutedForeground} />
          {!unlocked ? <View style={[styles.lock, { backgroundColor: colors.card }]}><Ionicons name="badge-lock" size={10} color={colors.mutedForeground} /></View> : null}
        </View>
        <View style={styles.body}>
          <View style={styles.heading}><Text style={[styles.title, { color: colors.foreground }]}>{badgeText(badge.title, language)}</Text><Text style={[styles.state, { color: unlocked ? badge.color : colors.mutedForeground }]}>{unlocked ? ui('earned') : ui('locked')}</Text></View>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{badgeText(badge.description, language)}</Text>
          <View style={styles.progressRow}><View style={styles.progress}><ProgressBar value={Math.min(value / badge.target, 1)} color={unlocked ? badge.color : colors.primary} /></View><Text style={[styles.count, { color: colors.mutedForeground }]}>{Math.min(value, badge.target)} / {badge.target}</Text></View>
        </View>
      </View>;
    })}
  </Screen>;
}

const styles = StyleSheet.create({
  summary: { borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 15 },
  summaryIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2 },
  summaryValue: { fontFamily: 'Inter_700Bold', fontSize: 25, marginTop: 2 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  tab: { minHeight: 39, borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  card: { borderRadius: 20, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 12, marginBottom: 11 },
  badgeIcon: { width: 52, height: 52, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lock: { position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 14 },
  state: { fontFamily: 'Inter_700Bold', fontSize: 9, textTransform: 'uppercase' },
  description: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  progress: { flex: 1 },
  count: { minWidth: 45, textAlign: 'right', fontFamily: 'Inter_600SemiBold', fontSize: 10 },
});