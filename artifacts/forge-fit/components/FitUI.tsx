import React, { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { BlurView } from 'expo-blur';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const content = <View style={[styles.screen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 104, backgroundColor: colors.background }]}>{children}</View>;
  return scroll ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: colors.background }}>{content}</ScrollView> : content;
}

export function Header({ eyebrow, title, subtitle, action, onAction }: { eyebrow?: string; title: string; subtitle?: string; action?: IconName; onAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.header}>
    <View style={{ flex: 1 }}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
    </View>
    {action && onAction ? <Pressable testID="header-action" onPress={onAction} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}><Ionicons name={action} size={20} color={colors.foreground} /></Pressable> : null}
  </View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.sectionTitle}><Text style={[styles.sectionText, { color: colors.foreground }]}>{title}</Text>{action && onAction ? <Pressable onPress={onAction}><Text style={[styles.link, { color: colors.primary }]}>{action}</Text></Pressable> : null}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  const colors = useColors();
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>;
}

export function IconButton({ icon, onPress, label }: { icon: IconName; onPress?: () => void; label?: string }) {
  const colors = useColors();
  return <Pressable accessibilityLabel={label} testID={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.6 : 1 }]}><Ionicons name={icon} size={20} color={colors.foreground} /></Pressable>;
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const colors = useColors();
  return <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}><View style={[styles.progressFill, { backgroundColor: color ?? colors.primary, width: `${Math.min(Math.max(value, 0), 1) * 100}%` }]} /></View>;
}

export function Metric({ icon, value, label, color }: { icon: IconName; value: string; label: string; color: string }) {
  const colors = useColors();
  return <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}><Ionicons name={icon} size={16} color={color} /></View><Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

export function ActionTile({ icon, title, subtitle, onPress, color }: { icon: IconName; title: string; subtitle: string; onPress?: () => void; color: string }) {
  const colors = useColors();
  return <Pressable testID={title} onPress={onPress} style={({ pressed }) => [styles.actionTile, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}><View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}><Ionicons name={icon} size={20} color={color} /></View><Text style={[styles.actionTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text></Pressable>;
}

export function Pill({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={[styles.pill, { backgroundColor: active ? colors.primary : colors.secondary }]}><Text style={[styles.pillText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{label}</Text></Pressable>;
}

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  const colors = useColors();
  return <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Ionicons name={icon} size={24} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{text}</Text></View>;
}

export function PremiumLock() {
  const colors = useColors();
  const { language, setPremium } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  return <View style={[styles.lockScreen, { backgroundColor: colors.background }]}>
    <View style={styles.previewLayer}><View style={[styles.previewCard, { backgroundColor: colors.card }]} /><View style={[styles.previewCard, { backgroundColor: colors.card }]} /><View style={[styles.previewCard, { backgroundColor: colors.card }]} /><BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} /></View>
    <View style={[styles.lockAura, { backgroundColor: `${colors.primary}18` }]} /><View style={[styles.lockIcon, { backgroundColor: colors.primary }]}><Ionicons name="sparkles" size={27} color={colors.primaryForeground} /></View>
    <Text style={[styles.lockTitle, { color: colors.foreground }]}>{t('premiumLocked')}</Text><Text style={[styles.lockText, { color: colors.mutedForeground }]}>{t('premiumLockedBody')}</Text>
    <View style={styles.lockFeatures}>{(['premiumFeature1', 'premiumFeature2', 'premiumFeature3'] as const).map((key) => <View key={key} style={styles.lockFeature}><Ionicons name="checkmark" size={17} color={colors.primary} /><Text style={[styles.lockFeatureText, { color: colors.foreground }]}>{t(key)}</Text></View>)}</View>
    <Pressable onPress={() => setPremium(true)} style={[styles.lockButton, { backgroundColor: colors.primary }]}><Text style={[styles.lockButtonText, { color: colors.primaryForeground }]}>{t('unlockPremium')}</Text></Pressable>
  </View>;
}

export const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, minHeight: '100%' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 26 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.6, marginBottom: 8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -1.1 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 7 },
  iconButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  card: { borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 16 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 12 },
  sectionText: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  progressTrack: { height: 7, borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8 },
  metric: { flex: 1, minWidth: 72 },
  metricIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  metricLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  actionTile: { width: '48%', minHeight: 118, borderRadius: 20, borderWidth: 1, padding: 14, marginBottom: 12 },
  actionIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  actionSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  pill: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 30, marginRight: 8 },
  pillText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  lockScreen: { flex: 1, minHeight: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, overflow: 'hidden' },
  lockAura: { position: 'absolute', width: 270, height: 270, borderRadius: 135, top: '22%' },
  lockIcon: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  lockTitle: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -1, textAlign: 'center' },
  lockText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10 },
  lockFeatures: { alignSelf: 'stretch', gap: 15, marginVertical: 28 },
  lockFeature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lockFeatureText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  lockButton: { width: '100%', height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  lockButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  previewLayer: { position: 'absolute', left: 22, right: 22, top: 80, gap: 12, opacity: 0.45 },
  previewCard: { height: 65, borderRadius: 19, borderWidth: 1, borderColor: '#1D3B5E' },
});