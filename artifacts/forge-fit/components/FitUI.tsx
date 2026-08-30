import React, { ReactNode } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate, type Language } from '@/lib/i18n';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function triggerHaptic(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  Haptics.impactAsync(style).catch(() => undefined);
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topSpacing = Platform.OS === 'ios' ? 28 : 16;
  const content = <View style={[styles.screen, { paddingTop: insets.top + topSpacing, paddingBottom: insets.bottom + 104, backgroundColor: colors.background }]}>{children}</View>;
  return scroll ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: colors.background }}>{content}</ScrollView> : content;
}

export function Header({ eyebrow, title, subtitle, action, onAction, premiumLabel, premiumAction }: { eyebrow?: string; title: string; subtitle?: string; action?: IconName; onAction?: () => void; premiumLabel?: string; premiumAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.header}>
    <View style={{ flex: 1 }}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
    </View>
    <View style={styles.headerActions}>
      {premiumAction ? <Pressable accessibilityLabel={premiumLabel} testID="header-premium" onPress={() => { triggerHaptic(Haptics.ImpactFeedbackStyle.Medium); premiumAction(); }} style={({ pressed }) => [styles.premiumPill, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}70`, opacity: pressed ? 0.72 : 1 }]}><Ionicons name="sparkles" size={13} color={colors.primary} /><Text style={[styles.premiumPillText, { color: colors.primary }]}>{premiumLabel}</Text></Pressable> : null}
      {action && onAction ? <Pressable testID="header-action" onPress={() => { triggerHaptic(); onAction(); }} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}><Ionicons name={action} size={20} color={colors.foreground} /></Pressable> : null}
    </View>
  </View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.sectionTitle}><Text style={[styles.sectionText, { color: colors.foreground }]}>{title}</Text>{action && onAction ? <Pressable onPress={onAction}><Text style={[styles.link, { color: colors.primary }]}>{action}</Text></Pressable> : null}</View>;
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: object; onPress?: () => void }) {
  const colors = useColors();
  const pressed = React.useRef(new Animated.Value(0)).current;
  const setPressed = (value: number) => Animated.spring(pressed, { toValue: value, friction: 8, tension: 90, useNativeDriver: true }).start();
  const content = <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style, onPress ? { transform: [{ scale: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] }) }], shadowColor: colors.primary, shadowOpacity: pressed.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.34] }), shadowRadius: pressed.interpolate({ inputRange: [0, 1], outputRange: [8, 16] }), elevation: pressed.interpolate({ inputRange: [0, 1], outputRange: [2, 7] }) } : null]}>{children}</Animated.View>;
  return onPress ? <Pressable onPress={() => { triggerHaptic(); onPress(); }} onPressIn={() => setPressed(1)} onPressOut={() => setPressed(0)}>{content}</Pressable> : content;
}

export function IconButton({ icon, onPress, label }: { icon: IconName; onPress?: () => void; label?: string }) {
  const colors = useColors();
  return <Pressable accessibilityLabel={label} testID={label} onPress={() => { triggerHaptic(); onPress?.(); }} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.6 : 1 }]}><Ionicons name={icon} size={20} color={colors.foreground} /></Pressable>;
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const colors = useColors();
  return <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}><View style={[styles.progressFill, { backgroundColor: color ?? colors.primary, width: `${Math.min(Math.max(value, 0), 1) * 100}%` }]} /></View>;
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
  return <Pressable testID={title} onPress={() => { triggerHaptic(); onPress?.(); }} onPressIn={() => setPressed(1)} onPressOut={() => setPressed(0)}><Animated.View style={[styles.actionTile, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: color, shadowOpacity: pressed.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.3] }), shadowRadius: pressed.interpolate({ inputRange: [0, 1], outputRange: [5, 14] }), elevation: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, 6] }), transform: [{ translateY: pressed.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }, { scale: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] }) }] }]}><View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}><Ionicons name={icon} size={20} color={color} /></View><Text style={[styles.actionTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text></Animated.View></Pressable>;
}

export function Pill({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const colors = useColors();
  return <Pressable onPress={() => { triggerHaptic(); onPress?.(); }} style={({ pressed }) => [styles.pill, { backgroundColor: active ? colors.primary : colors.secondary, opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}><Text style={[styles.pillText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{label}</Text></Pressable>;
}

export function CelebrationBurst({ visible, onDone, title, subtitle }: { visible: boolean; onDone?: () => void; title?: string; subtitle?: string }) {
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
    const animation = Animated.timing(progress, { toValue: 1, duration: 1650, useNativeDriver: true });
    animation.start(({ finished }) => { if (finished) onDone?.(); });
    return () => animation.stop();
  }, [onDone, progress, visible]);
  if (!visible) return null;
  return <View pointerEvents="none" style={styles.celebrationLayer}>
    {pieces.map((piece, index) => <Animated.View key={index} style={[styles.confettiPiece, { backgroundColor: piece.color, transform: [{ translateX: progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [piece.side * (185 + (index % 3) * 24), piece.side * 12, piece.side * piece.endX] }) }, { translateY: progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [piece.startY, piece.startY * 0.18, piece.startY + piece.drift] }) }, { rotate: piece.rotate }, { scale: progress.interpolate({ inputRange: [0, 0.18, 0.7, 1], outputRange: [0.15, 1.15, 0.9, 0.55] }) }], opacity: progress.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 1, 0] }) }]} />)}
    {title ? <Animated.View style={[styles.celebrationCopy, { opacity: progress.interpolate({ inputRange: [0, 0.18, 0.78, 1], outputRange: [0, 1, 1, 0] }), transform: [{ scale: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.82, 1, 0.98] }) }] }]}>
      <View style={[styles.celebrationBadge, { backgroundColor: colors.primary }]}><Ionicons name="sparkles" size={22} color={colors.primaryForeground} /></View>
      <Text style={[styles.celebrationTitle, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? <Text style={[styles.celebrationSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
    </Animated.View> : null}
  </View>;
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

const premiumPriceByLanguage: Record<Language, { main: string; currency: string }> = {
  tr: { main: '€4,99', currency: 'EUR' },
  en: { main: '$4.99', currency: 'USD' },
  de: { main: '4,99 €', currency: 'EUR' },
  fr: { main: '4,99 €', currency: 'EUR' },
  es: { main: '4,99 €', currency: 'EUR' },
};

export function PremiumOfferModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { language, isPremium, setPremium } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const price = premiumPriceByLanguage[language];
  const appear = React.useRef(new Animated.Value(0)).current;
  const player = useAudioPlayer(require('@/assets/sounds/premium-success.wav'));
  const [celebrating, setCelebrating] = React.useState(false);

  React.useEffect(() => {
    if (!visible) setCelebrating(false);
  }, [visible]);

  React.useEffect(() => {
    if (!visible) return undefined;
    appear.setValue(0);
    Animated.spring(appear, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }).start();
    return () => appear.stopAnimation();
  }, [appear, visible]);

  const finishCelebration = React.useCallback(() => {
    setCelebrating(false);
    onClose();
  }, [onClose]);

  const activatePremium = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setPremium(true);
    setCelebrating(true);
    try {
      player.seekTo(0);
      player.play();
    } catch {
      // The visual celebration still completes when audio is unavailable.
    }
  };

  if (!visible) return null;
  return <Modal transparent visible animationType="none" onRequestClose={onClose}>
    <View style={styles.premiumModalRoot}>
      <Pressable onPress={celebrating ? undefined : onClose} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.premiumSheet, { backgroundColor: colors.card, borderColor: colors.border, opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }, { scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>
        <LinearGradient colors={[`${colors.primary}3A`, `${colors.primary}08`, colors.card]} style={styles.premiumGradient}>
          <View style={styles.premiumModalHeader}>
            <View style={[styles.premiumModalIcon, { backgroundColor: colors.primary }]}><Ionicons name="sparkles" size={22} color={colors.primaryForeground} /></View>
            <Pressable accessibilityLabel={t('close')} testID="close-premium" onPress={celebrating ? undefined : onClose} hitSlop={10} style={[styles.premiumClose, { backgroundColor: colors.secondary, opacity: celebrating ? 0 : 1 }]}><Ionicons name="close" size={19} color={colors.foreground} /></Pressable>
          </View>
          <Text style={[styles.premiumModalEyebrow, { color: colors.primary }]}>{t('premiumModalEyebrow')}</Text>
          <Text style={[styles.premiumModalTitle, { color: colors.foreground }]}>{t('premiumModalTitle')}</Text>
          <Text style={[styles.premiumModalSubtitle, { color: colors.mutedForeground }]}>{t('premiumModalSubtitle')}</Text>
          <View style={styles.premiumBenefits}>
            {(['premiumFeature1', 'premiumFeature2', 'premiumFeature3', 'premiumBenefit4'] as const).map((key) => <View key={key} style={styles.premiumBenefit}><View style={[styles.premiumBenefitIcon, { backgroundColor: `${colors.primary}1A` }]}><Ionicons name="checkmark" size={15} color={colors.primary} /></View><Text style={[styles.premiumBenefitText, { color: colors.foreground }]}>{t(key)}</Text></View>)}
          </View>
          <View style={[styles.premiumPriceCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}45` }]}>
            <View><Text style={[styles.premiumPriceLabel, { color: colors.mutedForeground }]}>{t('premiumPriceMonthly')}</Text><View style={styles.premiumPriceLine}><Text style={[styles.premiumPrice, { color: colors.foreground }]}>{price.main}</Text><Text style={[styles.premiumPriceUnit, { color: colors.mutedForeground }]}>{t('premiumPerMonth')}</Text></View></View>
            <View style={styles.premiumPriceAside}><Text style={[styles.premiumCurrencyCode, { color: colors.primary }]}>{price.currency}</Text><Text style={[styles.premiumTrialText, { color: colors.success }]}>{t('premiumTrial')}</Text></View>
          </View>
          <Text style={[styles.premiumPriceOptions, { color: colors.mutedForeground }]}>{t('premiumPriceOptions')}</Text>
          <Text style={[styles.premiumTrialBody, { color: colors.mutedForeground }]}>{t('premiumTrialBody')}</Text>
          <Pressable testID="start-premium" onPress={isPremium ? onClose : activatePremium} style={({ pressed }) => [styles.premiumCta, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}><Text style={[styles.premiumCtaText, { color: colors.primaryForeground }]}>{isPremium ? t('premiumActiveNow') : t('premiumStart')}</Text><Ionicons name={isPremium ? 'checkmark-circle' : 'arrow-forward'} size={18} color={colors.primaryForeground} /></Pressable>
          <Text style={[styles.premiumTrust, { color: colors.mutedForeground }]}>{t('premiumTrust')}</Text>
        </LinearGradient>
      </Animated.View>
      <CelebrationBurst visible={celebrating} title={t('premiumCelebrationTitle')} subtitle={t('premiumCelebrationSubtitle')} onDone={finishCelebration} />
    </View>
  </Modal>;
}

export const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, minHeight: '100%' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 26 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.6, marginBottom: 8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -1.1 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 7 },
  iconButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  premiumPill: { height: 38, borderRadius: 15, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  premiumPillText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.8 },
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
  celebrationLayer: { ...StyleSheet.absoluteFillObject, zIndex: 30, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  confettiPiece: { position: 'absolute', top: '50%', left: '50%', width: 8, height: 13, borderRadius: 3, marginLeft: -4, marginTop: -6 },
  celebrationCopy: { position: 'absolute', left: 22, right: 22, top: '31%', alignItems: 'center' },
  celebrationBadge: { width: 58, height: 58, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  celebrationTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 30, letterSpacing: -0.6, textAlign: 'center' },
  celebrationSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 10 },
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
  premiumModalRoot: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 14, paddingBottom: 18, backgroundColor: '#020B18B8' },
  premiumSheet: { overflow: 'hidden', borderRadius: 30, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 14 },
  premiumGradient: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18 },
  premiumModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  premiumModalIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  premiumClose: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  premiumModalEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.7, marginBottom: 8 },
  premiumModalTitle: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -1, lineHeight: 34 },
  premiumModalSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginTop: 9 },
  premiumPriceAside: { alignItems: 'flex-end', gap: 6, maxWidth: 112 },
  premiumTrialText: { fontFamily: 'Inter_700Bold', fontSize: 9, lineHeight: 12, textAlign: 'right' },
  premiumBenefits: { gap: 12, marginTop: 22, marginBottom: 20 },
  premiumBenefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  premiumBenefitIcon: { width: 25, height: 25, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  premiumBenefitText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17 },
  premiumPriceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 7 },
  premiumPriceLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 0.3 },
  premiumPriceLine: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 3 },
  premiumPrice: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.8 },
  premiumPriceUnit: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  premiumCurrencyCode: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1 },
  premiumPriceOptions: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'right', marginBottom: 16 },
  premiumTrialBody: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: -8, marginBottom: 14 },
  premiumCta: { height: 53, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  premiumCtaText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  premiumTrust: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center', marginTop: 12 },
});