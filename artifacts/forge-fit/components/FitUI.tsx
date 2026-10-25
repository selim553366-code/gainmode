import React, { ReactNode } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Linking, Modal, Platform, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import { AnimatedFill, PressableScale as Pressable, Reveal } from '@/components/Motion';
import { offerWidgetAfterFirstPurchase } from '@/components/WidgetOffer';
import { Paywall } from '@/components/Paywall';
import { PremiumSuccessCelebration } from '@/components/WelcomeCelebration';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate, type Language, type TranslationKey } from '@/lib/i18n';
import { SUBSCRIPTION_PURCHASE_ENABLED, useSubscription } from '@/lib/revenuecat';
import { hasActivePremiumEntitlement } from '@/lib/premiumAccess';
import { calculateAnnualSavingsPercent, formatAnnualMonthlyPrice } from '@/lib/subscriptionPricing';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@/components/AppIcon';
import { legalDocumentUrl } from '@/lib/legalDocuments';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function ForgeFitMark({ size = 28, style }: { size?: number; style?: object }) {
  const colors = useColors();
  return <View style={[{ width: size, height: size, borderRadius: size * 0.24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, style]}>
    <Ionicons name="barbell-outline" size={size * 0.64} color={colors.primaryForeground} />
  </View>;
}

export function GainModeWordmark({ color, width = 150, height = 20 }: { color: string; width?: number; height?: number }) {
  const colors = useColors();
  return <Image
    accessibilityLabel="GainMode"
    source={require('@/assets/images/gainmode-wordmark.png')}
    resizeMode="contain"
    style={[styles.gainModeWordmark, { width, height, tintColor: colors.colorScheme === 'dark' ? color : undefined }]}
  />;
}

export function triggerHaptic(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  Haptics.impactAsync(style).catch(() => undefined);
}

function blendColors(base: string, accent: string, amount: number) {
  const parse = (value: string) => value.replace('#', '').slice(0, 6).match(/.{2}/g)?.map((channel) => parseInt(channel, 16)) ?? [0, 0, 0];
  const baseRgb = parse(base);
  const accentRgb = parse(accent);
  const channels = baseRgb.map((channel, index) => Math.round(channel + (accentRgb[index] - channel) * amount));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

// A calm, flat ground: depth comes from surfaces and type, not from decorative color.
function AmbientBackdrop({ children }: { children: ReactNode }) {
  const colors = useColors();
  return <View style={[styles.ambientBackdrop, { backgroundColor: colors.background }]}>{children}</View>;
}

// Wraps each top-level section of a screen in a staggered entrance. Absolutely positioned children stay
// unwrapped, and a child that flexes passes its flex to the wrapper so centered layouts keep working.
function revealSections(children: ReactNode) {
  return React.Children.toArray(children).map((child, index) => {
    if (!React.isValidElement<{ style?: StyleProp<ViewStyle> }>(child)) return child;
    const flat = StyleSheet.flatten(child.props.style) ?? {};
    if (flat.position === 'absolute') return child;
    const wrapperStyle = flat.flex !== undefined || flat.flexGrow !== undefined ? { flex: flat.flex ?? undefined, flexGrow: flat.flexGrow ?? undefined } : undefined;
    return <Reveal key={child.key ?? index} index={index} style={wrapperStyle}>{child}</Reveal>;
  });
}

export function Screen({ children, scroll = true, bottomPadding = 104, ambient = true }: { children: ReactNode; scroll?: boolean; bottomPadding?: number; ambient?: boolean }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topSpacing = Platform.OS === 'ios' ? 28 : 16;
  const content = <View style={[styles.screen, { paddingTop: insets.top + topSpacing, paddingBottom: insets.bottom + bottomPadding }]}>{revealSections(children)}</View>;
  const backdrop = ambient ? <AmbientBackdrop>{content}</AmbientBackdrop> : <View style={[styles.plainBackdrop, { backgroundColor: colors.background }]}>{content}</View>;
  return scroll ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: colors.background }}>{backdrop}</ScrollView> : backdrop;
}

export function Header({ eyebrow, title, subtitle, action, actionLogo = false, onAction, actionDisabled = false, featureLabel, featureAction, premiumLabel, premiumAction, premiumIcon = 'trophy-outline', premiumOwned = false, streak, streakLabel, centered = false, lightBackground = false, showText = true, brandMark = false }: { eyebrow?: string; title: string; subtitle?: string; action?: IconName; actionLogo?: boolean; onAction?: () => void; actionDisabled?: boolean; featureLabel?: string; featureAction?: () => void; premiumLabel?: string; premiumAction?: () => void; premiumIcon?: IconName; premiumOwned?: boolean; streak?: number; streakLabel?: string; centered?: boolean; lightBackground?: boolean; showText?: boolean; brandMark?: boolean }) {
  const colors = useColors();
  const premiumColor = premiumOwned ? colors.success : colors.primary;
  const headingColor = lightBackground ? colors.primaryForeground : colors.foreground;
  const supportingColor = lightBackground ? `${colors.primaryForeground}B3` : colors.mutedForeground;
  return <View style={styles.header}>
    {showText ? <View style={[styles.headerText, centered ? styles.headerTextCentered : null]}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: lightBackground ? colors.primaryForeground : colors.mutedForeground }]}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={[styles.title, { color: headingColor }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: supportingColor }]}>{subtitle}</Text> : null}
    </View> : null}
    {brandMark ? <View accessibilityLabel="GainMode" style={styles.headerBrand}><GainModeWordmark color={colors.foreground} /></View> : null}
    <View style={[styles.headerActions, centered ? styles.headerActionsCentered : null]}>
      {streak !== undefined ? <View accessibilityLabel={`${streak} ${streakLabel ?? ''}`} style={[styles.streakPill, { backgroundColor: `${colors.orange}14`, borderColor: `${colors.orange}33` }]}><Ionicons name="flame" size={15} color={colors.orange} /><Text style={[styles.streakValue, { color: colors.orange }]}>{streak}</Text>{streakLabel ? <Text style={[styles.streakLabel, { color: colors.orange }]}>{streakLabel}</Text> : null}</View> : null}
      {featureLabel && featureAction ? <Pressable accessibilityRole="button" accessibilityLabel={featureLabel} onPress={() => { triggerHaptic(); featureAction(); }} style={({ pressed }) => [styles.featurePill, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}><Ionicons name="sparkles-outline" size={14} color={colors.primary} /><Text style={[styles.featurePillText, { color: colors.primary }]}>{featureLabel}</Text></Pressable> : null}
      {premiumAction ? <Pressable accessibilityLabel={premiumLabel} testID="header-premium" onPress={() => { triggerHaptic(Haptics.ImpactFeedbackStyle.Medium); premiumAction(); }} style={({ pressed }) => [styles.premiumPill, { backgroundColor: premiumColor, borderColor: premiumColor, opacity: pressed ? 0.85 : 1 }]}>{premiumOwned ? <Ionicons name="checkmark-circle" size={14} color={colors.primaryForeground} /> : <Ionicons name={premiumIcon} size={15} color={colors.primaryForeground} />}<Text style={[styles.premiumPillText, { color: colors.primaryForeground }]}>{premiumLabel}</Text></Pressable> : null}
       {action && onAction ? <Pressable testID="header-action" accessibilityRole="button" accessibilityState={{ disabled: actionDisabled }} disabled={actionDisabled} onPress={() => { triggerHaptic(); onAction(); }} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: actionDisabled ? 0.48 : pressed ? 0.8 : 1 }]}>{actionLogo ? <ForgeFitMark size={27} /> : <Ionicons name={action} size={20} color={colors.foreground} />}</Pressable> : null}
    </View>
  </View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.sectionTitle}><Text style={[styles.sectionText, { color: colors.foreground }]}>{title}</Text>{action && onAction ? <Pressable onPress={onAction} hitSlop={10}><Text style={[styles.link, { color: colors.mutedForeground }]}>{action}</Text></Pressable> : null}</View>;
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: object; onPress?: () => void }) {
  const colors = useColors();
  const pressed = React.useRef(new Animated.Value(0)).current;
  const setPressed = (value: number) => Animated.spring(pressed, { toValue: value, friction: 8, tension: 90, useNativeDriver: true }).start();
  const content = <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style, onPress ? { transform: [{ scale: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] }) }], shadowColor: '#000000', shadowOpacity: pressed.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.1] }), shadowRadius: pressed.interpolate({ inputRange: [0, 1], outputRange: [8, 14] }), elevation: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) } : null]}>{children}</Animated.View>;
  return onPress ? <Pressable scaleTo={1} onPress={() => { triggerHaptic(); onPress(); }} onPressIn={() => setPressed(1)} onPressOut={() => setPressed(0)}>{content}</Pressable> : content;
}

export function IconButton({ icon, onPress, label }: { icon: IconName; onPress?: () => void; label?: string }) {
  const colors = useColors();
  return <Pressable accessibilityLabel={label} testID={label} onPress={() => { triggerHaptic(); onPress?.(); }} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}><Ionicons name={icon} size={20} color={colors.foreground} /></Pressable>;
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const colors = useColors();
  return <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}><AnimatedFill value={value} color={color ?? colors.primary} style={styles.progressFill} /></View>;
}

export function Metric({ icon, value, label, color }: { icon: IconName; value: ReactNode; label: string; color: string }) {
  const colors = useColors();
  return <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}><Ionicons name={icon} size={16} color={color} /></View><Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

export function AnimatedNumber({ value, suffix = '', style, format = (number) => Math.round(number).toLocaleString() }: { value: number; suffix?: string; style?: StyleProp<TextStyle>; format?: (value: number) => string }) {
  const colors = useColors();
  const animated = React.useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = React.useState(value);
  React.useEffect(() => {
    const listener = animated.addListener(({ value: next }) => setDisplay(next));
    Animated.timing(animated, { toValue: value, duration: 650, useNativeDriver: false }).start();
    return () => animated.removeListener(listener);
  }, [animated, value]);
  return <Text style={[styles.metricValue, { color: colors.foreground }, style]}>{format(display)}{suffix}</Text>;
}

export function ActionTile({ icon, title, subtitle, onPress, color }: { icon: IconName; title: string; subtitle: string; onPress?: () => void; color: string }) {
  const colors = useColors();
  const pressed = React.useRef(new Animated.Value(0)).current;
  const setPressed = (value: number) => Animated.spring(pressed, { toValue: value, friction: 8, tension: 90, useNativeDriver: true }).start();
  return <Pressable scaleTo={1} testID={title} onPress={() => { triggerHaptic(); onPress?.(); }} onPressIn={() => setPressed(1)} onPressOut={() => setPressed(0)}><Animated.View style={[styles.actionTile, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: '#000000', shadowOpacity: pressed.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.09] }), shadowRadius: pressed.interpolate({ inputRange: [0, 1], outputRange: [6, 12] }), elevation: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }), transform: [{ translateY: pressed.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }, { scale: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] }) }] }]}><View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}><Ionicons name={icon} size={20} color={color} /></View><Text style={[styles.actionTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text></Animated.View></Pressable>;
}

export function Pill({ label, active, onPress, lightBackground = false }: { label: string; active?: boolean; onPress?: () => void; lightBackground?: boolean }) {
  const colors = useColors();
  return <Pressable onPress={() => { triggerHaptic(); onPress?.(); }} style={({ pressed }) => [styles.pill, { backgroundColor: lightBackground ? (active ? `${colors.primary}D9` : `${colors.foreground}B8`) : (active ? colors.primary : colors.card), borderWidth: 1, borderColor: lightBackground ? `${colors.primaryForeground}20` : active ? colors.primary : colors.border, opacity: pressed ? 0.86 : 1 }]}><Text style={[styles.pillText, { color: lightBackground || active ? colors.primaryForeground : colors.mutedForeground }]}>{label}</Text></Pressable>;
}

export function CelebrationBurst({ visible, onDone, title, subtitle, duration = 1650 }: { visible: boolean; onDone?: () => void; title?: string; subtitle?: string; duration?: number }) {
  const colors = useColors();
  const progress = React.useRef(new Animated.Value(0)).current;
  const pieces = React.useMemo(() => Array.from({ length: 28 }, (_, index) => ({
    side: index % 2 === 0 ? -1 : 1,
    startY: -150 + (index % 7) * 48,
    color: [colors.primary, colors.blue, colors.orange, colors.success, colors.plum][index % 5],
    drift: -34 + (index % 6) * 14,
    endX: 30 + (index % 4) * 18,
    rotate: `${(index % 2 ? 1 : -1) * (140 + index * 17)}deg`,
  })), [colors]);
  React.useEffect(() => {
    if (!visible) return undefined;
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration, useNativeDriver: true });
    animation.start(({ finished }) => { if (finished) onDone?.(); });
    return () => animation.stop();
  }, [duration, onDone, progress, visible]);
  if (!visible) return null;
  return <View pointerEvents="none" style={styles.celebrationLayer}>
    {pieces.map((piece, index) => <Animated.View key={index} style={[styles.confettiPiece, { backgroundColor: piece.color, transform: [{ translateX: progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [piece.side * (185 + (index % 3) * 24), piece.side * 12, piece.side * piece.endX] }) }, { translateY: progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [piece.startY, piece.startY * 0.18, piece.startY + piece.drift] }) }, { rotate: piece.rotate }, { scale: progress.interpolate({ inputRange: [0, 0.18, 0.7, 1], outputRange: [0.15, 1.15, 0.9, 0.55] }) }], opacity: progress.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 1, 0] }) }]} />)}
    {title ? <Animated.View style={[styles.celebrationCopy, { opacity: progress.interpolate({ inputRange: [0, 0.18, 0.78, 1], outputRange: [0, 1, 1, 0] }), transform: [{ scale: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.82, 1, 0.98] }) }] }]}>
     <View style={[styles.celebrationBadge, { backgroundColor: colors.primary }]}><Ionicons name="trophy-outline" size={25} color={colors.primaryForeground} /></View>
      <Text style={[styles.celebrationTitle, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? <Text style={[styles.celebrationSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
    </Animated.View> : null}
  </View>;
}

// The first-purchase welcome lives in its own module; re-exported so existing imports keep working.
export { PremiumSuccessCelebration };

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  const colors = useColors();
  return <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Ionicons name={icon} size={24} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{text}</Text></View>;
}

export function InlineStatus({ icon, text, color, loading = false }: { icon: IconName; text: string; color: string; loading?: boolean }) {
  return <View style={[styles.inlineStatus, { backgroundColor: `${color}0D`, borderColor: `${color}28` }]}>
    {loading ? <ActivityIndicator size="small" color={color} /> : <View style={[styles.inlineStatusIcon, { backgroundColor: `${color}18` }]}><Ionicons name={icon} size={15} color={color} /></View>}
    <Text style={[styles.inlineStatusText, { color }]}>{text}</Text>
  </View>;
}

export function PremiumLock() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [offerVisible, setOfferVisible] = React.useState(false);
  const previewItems: Array<{ icon: IconName; label: TranslationKey; accent: string }> = [
    { icon: 'pie-chart-outline', label: 'premiumGateNutrition', accent: colors.success },
    { icon: 'barbell-outline', label: 'premiumGateWorkout', accent: colors.orange },
    { icon: 'chatbubble-ellipses-outline', label: 'premiumGateCoach', accent: colors.primary },
    { icon: 'analytics-outline', label: 'premiumGateProgress', accent: colors.blue },
    { icon: 'people-outline', label: 'premiumGateCommunity', accent: colors.plum },
  ];
  return <AmbientBackdrop><View style={[styles.lockScreen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 22 }]}>
    <View style={[styles.lockPreviewShell, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.lockPreviewTop}><View style={[styles.lockPreviewBrand, { backgroundColor: `${colors.primary}30` }]} /><View style={styles.lockPreviewTopLines}><View style={[styles.lockPreviewLine, { backgroundColor: colors.border }]} /><View style={[styles.lockPreviewLineShort, { backgroundColor: colors.border }]} /></View><View style={[styles.lockPreviewAvatar, { backgroundColor: `${colors.primary}30` }]} /></View>
       <View style={styles.lockPreviewTabs}>{(['premiumGateNutrition', 'premiumGateWorkout', 'premiumGateCoach', 'premiumGateProgress', 'premiumGateCommunity'] as const).map((key) => <View key={key} style={[styles.lockPreviewTab, { backgroundColor: `${colors.primary}16` }]}><Text style={[styles.lockPreviewTabText, { color: colors.mutedForeground }]}>{t(key)}</Text></View>)}</View>
       <View style={styles.lockPreviewGrid}>{previewItems.map((item, index) => <View key={item.label} style={[styles.lockPreviewCard, index === 0 ? styles.lockPreviewWide : null, { backgroundColor: `${item.accent}12`, borderColor: `${item.accent}28` }]}><View style={[styles.lockPreviewIcon, { backgroundColor: `${item.accent}28` }]}><Ionicons name={item.icon} size={17} color={item.accent} /></View><View style={styles.lockPreviewCopy}><Text style={[styles.lockPreviewTitle, { color: colors.foreground }]}>{t(item.label)}</Text><View style={[styles.lockPreviewLine, { backgroundColor: `${colors.foreground}30` }]} /><View style={[styles.lockPreviewLineShort, { backgroundColor: `${colors.foreground}18` }]} /></View></View>)}</View>
       <BlurView intensity={45} tint={colors.colorScheme} pointerEvents="none" style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.lockPreviewShade} />
    </View>
    <View style={styles.lockGateContent}>
       <View style={[styles.lockIcon, { backgroundColor: colors.primary }]}><Ionicons name="trophy-outline" size={30} color={colors.primaryForeground} /></View>
      <Text style={[styles.lockEyebrow, { color: colors.primary }]}>{t('premiumGateEyebrow')}</Text>
      <Text style={[styles.lockTitle, { color: colors.foreground }]}>{t('premiumGateTitle')}</Text>
      <Text style={[styles.lockText, { color: colors.mutedForeground }]}>{t('premiumGateBody')}</Text>
      <Text style={[styles.lockMotivation, { color: colors.foreground }]}>{t('premiumGateHint')}</Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={t('premiumStart')} onPress={() => { triggerHaptic(Haptics.ImpactFeedbackStyle.Medium); setOfferVisible(true); }} style={({ pressed }) => [styles.lockButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Text style={[styles.lockButtonText, { color: colors.primaryForeground }]}>{t('premiumStart')}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable>
    <PremiumOfferModal visible={offerVisible} onClose={() => setOfferVisible(false)} />
  </View></AmbientBackdrop>;
}

export function PremiumOfferModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { enablePremium } = useFit();
  const [purchaseCelebration, setPurchaseCelebration] = React.useState(false);
  const purchasedRef = React.useRef(false);
  if (!SUBSCRIPTION_PURCHASE_ENABLED) return null;
  return <>
    <Modal visible={visible && !purchaseCelebration} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <Paywall
        onClose={onClose}
        onUnlock={onClose}
        onPurchaseSuccess={(kind) => {
          enablePremium();
          purchasedRef.current = kind === 'purchase';
          setPurchaseCelebration(true);
        }}
      />
    </Modal>
    <PremiumSuccessCelebration visible={purchaseCelebration} onDone={() => { setPurchaseCelebration(false); onClose(); if (purchasedRef.current) void offerWidgetAfterFirstPurchase(); }} />
  </>;
}

// The active-member sheet lives in its own module; re-exported so existing imports keep working.
export { PremiumAccessStatusModal } from '@/components/PremiumAccessSheet';

export const styles = StyleSheet.create({
  ambientBackdrop: { flex: 1, minHeight: '100%', overflow: 'hidden' },
  plainBackdrop: { flex: 1, minHeight: '100%' },
  screen: { paddingHorizontal: 20, minHeight: '100%' },
  header: { position: 'relative', flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 26 },
  headerText: { flex: 1 },
  headerTextCentered: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 0 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActionsCentered: { position: 'absolute', right: 0, top: 0, zIndex: 2 },
  headerBrand: { width: 138, height: 44, alignItems: 'flex-start', justifyContent: 'center', zIndex: 1, transform: [{ translateY: 4 }] },
  gainModeWordmark: { width: 150, height: 20 },
  headerBrandWordmark: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -1.35 },
  headerBrandTrademark: { fontFamily: 'Inter_700Bold', fontSize: 7, lineHeight: 9, position: 'relative', top: -7 },
  streakPill: { minHeight: 40, borderRadius: 999, borderWidth: 1, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakValue: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  streakLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  featurePill: { minHeight: 40, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  featurePillText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.4, marginBottom: 10 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 32, lineHeight: 36, letterSpacing: -1.2 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, marginTop: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  premiumPill: { minHeight: 40, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  premiumPillText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.6 },
  card: { borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 14 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14, marginBottom: 12 },
  sectionText: { fontFamily: 'Inter_700Bold', fontSize: 19, letterSpacing: -0.5 },
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  metric: { flex: 1, minWidth: 72, alignItems: 'center' },
  metricIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  metricLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 4 },
  actionTile: { width: '48%', minHeight: 118, borderRadius: 22, borderWidth: 1, padding: 14, marginBottom: 12 },
  actionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: -0.2 },
  actionSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, marginRight: 8 },
  pillText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  celebrationLayer: { ...StyleSheet.absoluteFill, zIndex: 30, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  confettiPiece: { position: 'absolute', top: '50%', left: '50%', width: 8, height: 13, borderRadius: 3, marginLeft: -4, marginTop: -6 },
  celebrationCopy: { position: 'absolute', left: 22, right: 22, top: '31%', alignItems: 'center' },
  celebrationBadge: { width: 58, height: 58, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  celebrationTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 30, letterSpacing: -0.6, textAlign: 'center' },
  celebrationSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 10 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.3 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  inlineStatus: { minHeight: 48, borderRadius: 15, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 9 },
  inlineStatusIcon: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  inlineStatusText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16 },
  lockScreen: { flex: 1, minHeight: '100%', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, overflow: 'hidden' },
  lockPreviewShell: { width: '100%', height: 275, borderRadius: 28, borderWidth: 1, padding: 15, overflow: 'hidden' },
  lockPreviewTop: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 },
  lockPreviewBrand: { width: 34, height: 34, borderRadius: 12 },
  lockPreviewTopLines: { flex: 1, gap: 6 },
  lockPreviewAvatar: { width: 28, height: 28, borderRadius: 10 },
  lockPreviewTabs: { flexDirection: 'row', gap: 5, marginBottom: 12, overflow: 'hidden' },
  lockPreviewTab: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 5 },
  lockPreviewTabText: { fontFamily: 'Inter_600SemiBold', fontSize: 7 },
  lockPreviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lockPreviewCard: { width: '48%', minHeight: 66, borderRadius: 15, borderWidth: 1, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  lockPreviewWide: { width: '100%', minHeight: 73 },
  lockPreviewIcon: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  lockPreviewCopy: { flex: 1, gap: 5 },
  lockPreviewTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  lockPreviewLine: { height: 4, width: '82%', borderRadius: 4 },
  lockPreviewLineShort: { height: 4, width: '54%', borderRadius: 4 },
  lockPreviewShade: { ...StyleSheet.absoluteFill, backgroundColor: '#00000033' },
  lockGateContent: { alignItems: 'center', paddingHorizontal: 8, marginVertical: 18 },
  lockIcon: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  lockEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5, marginBottom: 9 },
  lockTitle: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -1, textAlign: 'center' },
  lockText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10 },
  lockMotivation: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 14 },
  lockButton: { width: '100%', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  lockButtonText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  previewLayer: { position: 'absolute', left: 22, right: 22, top: 80, gap: 12, opacity: 0.45 },
  previewCard: { height: 65, borderRadius: 19, borderWidth: 1, borderColor: '#1D3B5E' },
});