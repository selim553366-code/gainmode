import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale as Pressable } from '@/components/Motion';
import { Ionicons } from '@/components/AppIcon';
import { Header, Screen } from '@/components/FitUI';
import { BadgeMedal, tierAccent } from '@/components/BadgeMedal';
import { BadgeDetailSheet, BadgeRow } from '@/components/BadgeViews';
import { getBadgeMetrics, useFit } from '@/context/FitContext';
import { useColors } from '@/hooks/useColors';
import { BADGE_TIERS, badgeProgress, badgeText, badges, badgeUi, nextBadge, type BadgeCategory, type BadgeDefinition } from '@/lib/badges';

type Filter = BadgeCategory | 'all';

export default function BadgesScreen() {
  const colors = useColors();
  const fit = useFit();
  const { language, unlockedBadgeIds, badgeEarnedAt } = fit;
  const [filter, setFilter] = React.useState<Filter>('all');
  const [selected, setSelected] = React.useState<BadgeDefinition | null>(null);
  const ui = <K extends keyof typeof badgeUi>(key: K) => badgeText(badgeUi[key], language);
  const metrics = getBadgeMetrics(fit);
  const earned = badges.filter((badge) => unlockedBadgeIds.includes(badge.id));
  const upcoming = nextBadge(metrics, unlockedBadgeIds);
  const filters: Filter[] = ['all', 'training', 'consistency', 'nutrition', 'progress'];
  const visible = badges.filter((badge) => filter === 'all' || badge.category === filter);

  return <>
    <Screen sky bottomPadding={90}>
      <Header eyebrow={ui('eyebrow')} title={ui('title')} subtitle={ui('subtitle')} action="close-outline" onAction={() => router.back()} />

      <Pressable testID="open-badge-wall" accessibilityRole="button" onPress={() => router.push('/badge-wall')} scaleTo={0.985}>
        <LinearGradient colors={[colors.accent, '#123A8F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroLabel, { color: `${'#FFFFFF'}A8` }]}>{ui('collection').toUpperCase()}</Text>
              <Text style={[styles.heroValue, { color: '#FFFFFF' }]}>{earned.length}<Text style={[styles.heroTotal, { color: `${'#FFFFFF'}80` }]}> / {badges.length}</Text></Text>
            </View>
            <View style={styles.heroMedals}>
              {earned.slice(-3).map((badge, index) => <View key={badge.id} style={{ marginLeft: index ? -22 : 0, zIndex: 3 - index }}><BadgeMedal badge={badge} size={60} /></View>)}
            </View>
          </View>
          <View style={styles.tierRow}>
            {BADGE_TIERS.map((tier) => {
              const total = badges.filter((badge) => badge.tier === tier).length;
              const got = earned.filter((badge) => badge.tier === tier).length;
              return <View key={tier} style={styles.tierStat}>
                <View style={[styles.tierBar, { backgroundColor: `${'#FFFFFF'}1F` }]}>
                  <View style={[styles.tierBarFill, { width: `${(got / total) * 100}%`, backgroundColor: tierAccent[tier] }]} />
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tierStatText, { color: `${'#FFFFFF'}C2` }]}>{badgeText(badgeUi[tier], language)} {got}/{total}</Text>
              </View>;
            })}
          </View>
          <View style={[styles.wallLink, { borderTopColor: `${'#FFFFFF'}1F` }]}>
            <Ionicons name="badge-collection" size={16} color={'#FFFFFF'} />
            <Text style={[styles.wallLinkText, { color: '#FFFFFF' }]}>{ui('wall')}</Text>
            <Ionicons name="chevron-forward" size={16} color={`${'#FFFFFF'}A8`} />
          </View>
        </LinearGradient>
      </Pressable>

      {upcoming ? <Pressable testID="next-badge" accessibilityRole="button" onPress={() => setSelected(upcoming)} scaleTo={0.985} style={[styles.next, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.nextPedestal, { backgroundColor: `${tierAccent[upcoming.tier]}1F` }]}><BadgeMedal badge={upcoming} size={76} locked /></View>
        <View style={styles.nextBody}>
          <Text style={[styles.nextEyebrow, { color: colors.mutedForeground }]}>{ui('next')}</Text>
          <Text numberOfLines={1} style={[styles.nextTitle, { color: colors.foreground }]}>{badgeText(upcoming.title, language)}</Text>
          <Text numberOfLines={1} style={[styles.nextHint, { color: colors.mutedForeground }]}>{badgeText(upcoming.description, language)}</Text>
          <View style={[styles.nextTrack, { backgroundColor: `${colors.foreground}14` }]}>
            <View style={[styles.nextFill, { width: `${badgeProgress(upcoming, metrics) * 100}%`, backgroundColor: tierAccent[upcoming.tier] }]} />
          </View>
          <Text style={[styles.nextRemaining, { color: colors.foreground }]}>{ui('remaining').replace('{count}', (upcoming.target - Math.min(metrics[upcoming.metric], upcoming.target)).toLocaleString(language))}</Text>
        </View>
      </Pressable> : <Text style={[styles.done, { color: colors.foreground }]}>{ui('completed')}</Text>}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filters}>
        {filters.map((item) => {
          const active = item === filter;
          return <Pressable key={item} testID={`badge-filter-${item}`} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => setFilter(item)} style={[styles.filter, { backgroundColor: active ? colors.foreground : colors.card, borderColor: active ? colors.foreground : colors.border }]}>
            <Text style={[styles.filterText, { color: active ? colors.background : colors.mutedForeground }]}>{badgeText(badgeUi[item], language)}</Text>
          </Pressable>;
        })}
      </ScrollView>

      {visible.map((badge) => <BadgeRow key={badge.id} badge={badge} metrics={metrics} unlocked={unlockedBadgeIds.includes(badge.id)} language={language} onPress={() => setSelected(badge)} />)}
    </Screen>
    <BadgeDetailSheet
      badge={selected}
      metrics={metrics}
      unlocked={Boolean(selected && unlockedBadgeIds.includes(selected.id))}
      earnedAt={selected ? badgeEarnedAt[selected.id] : undefined}
      language={language}
      onClose={() => setSelected(null)}
    />
  </>;
}

const styles = StyleSheet.create({
  hero: { borderRadius: 34, padding: 22, marginBottom: 14, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2 },
  heroValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 52, letterSpacing: -2.6, marginTop: 2 },
  heroTotal: { fontSize: 20, letterSpacing: -0.4 },
  heroMedals: { flexDirection: 'row' },
  tierRow: { flexDirection: 'row', gap: 6, marginTop: 16 },
  tierStat: { flex: 1 },
  tierBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  tierBarFill: { height: '100%', borderRadius: 2 },
  tierStatText: { fontFamily: 'Inter_600SemiBold', fontSize: 9, marginTop: 6 },
  wallLink: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 16, paddingTop: 14 },
  wallLinkText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 13 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 30, borderWidth: 1, padding: 14, marginBottom: 18, overflow: 'hidden' },
  nextPedestal: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center' },
  nextBody: { flex: 1, minWidth: 0 },
  nextEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.1 },
  nextTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 20, letterSpacing: -0.7, marginTop: 4 },
  nextHint: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  nextTrack: { height: 7, borderRadius: 4, overflow: 'hidden', marginTop: 10 },
  nextFill: { height: '100%', borderRadius: 4 },
  nextRemaining: { fontFamily: 'Inter_700Bold', fontSize: 11, marginTop: 6 },
  done: { fontFamily: 'Inter_700Bold', fontSize: 15, textAlign: 'center', marginBottom: 18 },
  filtersScroll: { marginHorizontal: -20, marginBottom: 14 },
  filters: { gap: 8, paddingHorizontal: 20 },
  filter: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 9 },
  filterText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});
