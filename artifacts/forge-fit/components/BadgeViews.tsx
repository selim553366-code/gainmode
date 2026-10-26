import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale as Pressable, EASE_OUT } from '@/components/Motion';
import { BadgeMedal, shade, tierAccent } from '@/components/BadgeMedal';
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

/** The frosted colour wash behind a badge row: two hues of the badge colour under a blur. */
export function BadgeAurora({ color, strength = 1 }: { color: string; strength?: number }) {
  const colors = useColors();
  const dark = colors.colorScheme === 'dark';
  const second = shade(color, dark ? -0.2 : 0.25);
  const alpha = (value: number) => Math.round(Math.min(255, value * strength)).toString(16).padStart(2, '0');
  return <View pointerEvents="none" style={styles.aurora}>
    <LinearGradient
      colors={[`${color}00`, `${color}${alpha(dark ? 70 : 52)}`, `${second}${alpha(dark ? 120 : 92)}`]}
      locations={[0.05, 0.55, 1]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={StyleSheet.absoluteFill}
    />
    <View style={[styles.blobA, { backgroundColor: `${color}${alpha(dark ? 150 : 110)}` }]} />
    <View style={[styles.blobB, { backgroundColor: `${second}${alpha(dark ? 160 : 120)}` }]} />
    <View style={[styles.blobC, { backgroundColor: `${color}${alpha(dark ? 90 : 70)}` }]} />
    <BlurView intensity={dark ? 50 : 60} tint={colors.colorScheme} style={StyleSheet.absoluteFill} />
  </View>;
}

/** One badge in the collection list: medal, name, rarity and progress over its own colour wash. */
export function BadgeRow({ badge, metrics, unlocked, language, onPress }: { badge: BadgeDefinition; metrics: BadgeMetrics; unlocked: boolean; language: Language; onPress: () => void }) {
  const colors = useColors();
  const value = Math.min(metrics[badge.metric] ?? 0, badge.target);
  const progress = badgeProgress(badge, metrics);
  return <Pressable testID={`badge-${badge.id}`} accessibilityRole="button" onPress={onPress} scaleTo={0.98} style={[styles.row, { backgroundColor: colors.card, borderColor: unlocked ? `${badge.color}66` : colors.border }]}>
    <BadgeAurora color={badge.color} strength={unlocked ? 1 : 0.38} />
    <BadgeMedal badge={badge} size={60} locked={!unlocked} />
    <View style={styles.rowBody}>
      <View style={styles.rowHeading}>
        <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.foreground }]}>{badgeText(badge.title, language)}</Text>
        <TierChip tier={badge.tier} language={language} />
      </View>
      <Text numberOfLines={2} style={[styles.rowDescription, { color: colors.mutedForeground }]}>{badgeText(badge.description, language)}</Text>
      <View style={styles.progressRow}>
        <View style={[styles.track, { backgroundColor: `${colors.foreground}14` }]}>
          <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: badge.color }]} />
        </View>
        <Text style={[styles.count, { color: unlocked ? colors.foreground : colors.mutedForeground }]}>{unlocked ? badgeText(badgeUi.earned, language) : `${value.toLocaleString(language)} / ${badge.target.toLocaleString(language)}`}</Text>
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
      <BadgeAurora color={badge.color} strength={unlocked ? 0.9 : 0.35} />
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
            <View style={[styles.fill, { width: `${badgeProgress(badge, metrics) * 100}%`, backgroundColor: badge.color }]} />
          </View>
          <View style={styles.sheetProgressText}>
            <Text style={[styles.sheetMeta, { color: colors.foreground, marginTop: 0 }]}>{value.toLocaleString(language)} / {badge.target.toLocaleString(language)}</Text>
            <Text style={[styles.sheetMeta, { color: colors.mutedForeground, marginTop: 0 }]}>{badgeText(badgeUi.remaining, language).replace('{count}', remaining.toLocaleString(language))}</Text>
          </View>
        </View>}
      <Pressable testID="badge-sheet-close" onPress={onClose} style={[styles.sheetButton, { backgroundColor: colors.primary }]}>
        <Text style={[styles.sheetButtonText, { color: colors.primaryForeground }]}>{badgeText(badgeUi.close, language)}</Text>
      </Pressable>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  tierChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  tierDot: { width: 6, height: 6, borderRadius: 3 },
  tierText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.2 },
  aurora: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  blobA: { position: 'absolute', width: 160, height: 160, borderRadius: 80, right: 40, top: -70 },
  blobB: { position: 'absolute', width: 180, height: 180, borderRadius: 90, right: -60, bottom: -90 },
  blobC: { position: 'absolute', width: 120, height: 120, borderRadius: 60, left: -40, bottom: -60 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, borderWidth: 1, padding: 14, marginBottom: 10, overflow: 'hidden' },
  rowBody: { flex: 1, minWidth: 0 },
  rowHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 15, letterSpacing: -0.2 },
  rowDescription: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 3 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  count: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10 },
  grabber: { width: 38, height: 5, borderRadius: 3, marginBottom: 18 },
  sheetMedal: { marginBottom: 18 },
  sheetTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.7, textAlign: 'center', marginTop: 12 },
  sheetDescription: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6, maxWidth: 300 },
  sheetMeta: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginTop: 16 },
  sheetProgress: { alignSelf: 'stretch', marginTop: 18 },
  sheetTrack: { flex: 0, height: 8, borderRadius: 4 },
  sheetProgressText: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  sheetButton: { alignSelf: 'stretch', height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  sheetButtonText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
});
