import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale as Pressable, EASE_OUT } from '@/components/Motion';
import { BadgeMedal, tierAccent } from '@/components/BadgeMedal';
import { useColors } from '@/hooks/useColors';
import { badgeProgress, badgeText, badgeUi, type BadgeDefinition, type BadgeMetrics, type BadgeTier } from '@/lib/badges';
import type { Language } from '@/lib/i18n';

export function formatBadgeDate(iso: string | undefined, language: Language) {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function TierChip({ tier, language, onDark = false }: { tier: BadgeTier; language: Language; onDark?: boolean }) {
  const accent = tierAccent[tier];
  return <View style={[styles.tierChip, { backgroundColor: onDark ? `${accent}33` : `${accent}1F`, borderColor: `${accent}66` }]}>
    <View style={[styles.tierDot, { backgroundColor: accent }]} />
    <Text style={[styles.tierText, { color: onDark ? '#FFFFFF' : accent }]}>{badgeText(badgeUi[tier], language)}</Text>
  </View>;
}

/** One badge in the collection list: medal, name, rarity and progress over its own colour wash. */
export function BadgeRow({ badge, metrics, unlocked, language, onPress }: { badge: BadgeDefinition; metrics: BadgeMetrics; unlocked: boolean; language: Language; onPress: () => void }) {
  const colors = useColors();
  const value = Math.min(metrics[badge.metric] ?? 0, badge.target);
  const progress = badgeProgress(badge, metrics);
  const accent = tierAccent[badge.tier];
  return <Pressable testID={`badge-${badge.id}`} accessibilityRole="button" onPress={onPress} scaleTo={0.98} style={[styles.row, { backgroundColor: colors.card, borderColor: unlocked ? `${accent}66` : colors.border }]}>
    <View style={[styles.rowPedestal, { backgroundColor: unlocked ? `${accent}1F` : `${colors.foreground}0D` }]}>
      <BadgeMedal badge={badge} size={62} locked={!unlocked} />
    </View>
    <View style={styles.rowBody}>
      <View style={styles.rowHeading}>
        <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.foreground }]}>{badgeText(badge.title, language)}</Text>
        <TierChip tier={badge.tier} language={language} />
      </View>
      <Text numberOfLines={2} style={[styles.rowDescription, { color: colors.mutedForeground }]}>{badgeText(badge.description, language)}</Text>
      <View style={styles.progressRow}>
        <View style={[styles.track, { backgroundColor: `${colors.foreground}12` }]}>
          <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
        </View>
        <Text style={[styles.count, { color: unlocked ? colors.success : colors.mutedForeground }]}>{unlocked ? badgeText(badgeUi.earned, language) : `${value.toLocaleString(language)} / ${badge.target.toLocaleString(language)}`}</Text>
      </View>
    </View>
  </Pressable>;
}

/** Bottom sheet with a large medal, its rarity, and either the date it was earned or what is left. */
export function BadgeDetailSheet({ badge, metrics, unlocked, earnedAt, language, onClose }: {
  badge: BadgeDefinition | null;
  metrics: BadgeMetrics;
  unlocked: boolean;
  earnedAt?: string;
  language: Language;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const shine = useSharedValue(0);
  const float = useSharedValue(0);

  React.useEffect(() => {
    cancelAnimation(shine);
    cancelAnimation(float);
    if (!badge || reduced) return undefined;
    float.set(withRepeat(withSequence(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })), -1));
    if (unlocked) shine.set(withDelay(300, withRepeat(withSequence(withTiming(1, { duration: 1100, easing: EASE_OUT }), withDelay(2200, withTiming(0, { duration: 0 }))), -1)));
    return () => { cancelAnimation(shine); cancelAnimation(float); };
  }, [badge, float, reduced, shine, unlocked]);

  const medalStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * float.get() }] }));

  if (!badge) return null;
  const value = Math.min(metrics[badge.metric] ?? 0, badge.target);
  const remaining = badge.target - value;
  const date = formatBadgeDate(earnedAt, language);

  return <Modal transparent visible animationType="slide" onRequestClose={onClose}>
    <Pressable scaleTo={1} accessibilityLabel={badgeText(badgeUi.close, language)} onPress={onClose} style={styles.scrim} />
    <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 22 }]}>
      <View style={[styles.grabber, { backgroundColor: `${colors.foreground}30` }]} />
      <Animated.View style={[styles.sheetMedal, medalStyle]}>
        <BadgeMedal badge={badge} size={150} locked={!unlocked} shine={unlocked ? shine : undefined} />
      </Animated.View>
      <TierChip tier={badge.tier} language={language} />
      <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{badgeText(badge.title, language)}</Text>
      <Text style={[styles.sheetDescription, { color: colors.mutedForeground }]}>{badgeText(badge.description, language)}</Text>
      {unlocked
        ? <Text style={[styles.sheetMeta, { color: colors.foreground }]}>{date ? badgeText(badgeUi.earnedOn, language).replace('{date}', date) : badgeText(badgeUi.earned, language)}</Text>
        : <View style={styles.sheetProgress}>
          <View style={[styles.track, styles.sheetTrack, { backgroundColor: `${colors.foreground}14` }]}>
            <View style={[styles.fill, { width: `${badgeProgress(badge, metrics) * 100}%`, backgroundColor: tierAccent[badge.tier] }]} />
          </View>
          <View style={styles.sheetProgressText}>
            <Text style={[styles.sheetMeta, { color: colors.foreground, marginTop: 0 }]}>{value.toLocaleString(language)} / {badge.target.toLocaleString(language)}</Text>
            <Text style={[styles.sheetMeta, { color: colors.mutedForeground, marginTop: 0 }]}>{badgeText(badgeUi.remaining, language).replace('{count}', remaining.toLocaleString(language))}</Text>
          </View>
        </View>}
      <Pressable testID="badge-sheet-close" onPress={onClose} style={[styles.sheetButton, { backgroundColor: colors.accent }]}>
        <Text style={[styles.sheetButtonText, { color: colors.accentForeground }]}>{badgeText(badgeUi.close, language)}</Text>
      </Pressable>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  tierChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  tierDot: { width: 6, height: 6, borderRadius: 3 },
  tierText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 28, borderWidth: 1, padding: 12, paddingRight: 16, marginBottom: 10, overflow: 'hidden' },
  rowPedestal: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, minWidth: 0 },
  rowHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { flex: 1, fontFamily: 'Inter_800ExtraBold', fontSize: 16, letterSpacing: -0.4 },
  rowDescription: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 3 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  count: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 34, borderTopRightRadius: 34, overflow: 'hidden', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10 },
  grabber: { width: 38, height: 5, borderRadius: 3, marginBottom: 18 },
  sheetMedal: { marginBottom: 18 },
  sheetTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, letterSpacing: -1, textAlign: 'center', marginTop: 12 },
  sheetDescription: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6, maxWidth: 300 },
  sheetMeta: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginTop: 16 },
  sheetProgress: { alignSelf: 'stretch', marginTop: 18 },
  sheetTrack: { flex: 0, height: 8, borderRadius: 4 },
  sheetProgressText: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  sheetButton: { alignSelf: 'stretch', height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  sheetButtonText: { fontFamily: 'Inter_800ExtraBold', fontSize: 16 },
});
