import React, { ReactNode } from 'react';
import { Animated, Image, Modal, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate, type Language, type TranslationKey } from '@/lib/i18n';
import { SUBSCRIPTION_PURCHASE_ENABLED, useSubscription } from '@/lib/revenuecat';
import { hasActivePremiumEntitlement } from '@/lib/premiumAccess';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@/components/AppIcon';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function ForgeFitMark({ size = 28, style }: { size?: number; style?: object }) {
  const colors = useColors();
  return <View style={[{ width: size, height: size, borderRadius: size * 0.24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, style]}>
    <Ionicons name="barbell-outline" size={size * 0.64} color={colors.primaryForeground} />
  </View>;
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

function AmbientBackdrop({ children }: { children: ReactNode }) {
  const colors = useColors();
  const softBlue = blendColors(colors.background, colors.blue, 0.12);
  const blueMist = blendColors(colors.background, colors.blue, 0.2);
  return <LinearGradient
    colors={[colors.background, softBlue, blueMist, colors.background]}
    locations={[0, 0.3, 0.68, 1]}
    start={{ x: 0.05, y: 0 }}
    end={{ x: 0.95, y: 1 }}
    style={styles.ambientBackdrop}
  >
    {children}
  </LinearGradient>;
}

export function Screen({ children, scroll = true, bottomPadding = 104 }: { children: ReactNode; scroll?: boolean; bottomPadding?: number }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topSpacing = Platform.OS === 'ios' ? 28 : 16;
  const content = <View style={[styles.screen, { paddingTop: insets.top + topSpacing, paddingBottom: insets.bottom + bottomPadding }]}>{children}</View>;
  const backdrop = <AmbientBackdrop>{content}</AmbientBackdrop>;
  return scroll ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: colors.background }}>{backdrop}</ScrollView> : backdrop;
}

export function Header({ eyebrow, title, subtitle, action, actionLogo = false, onAction, featureLabel, featureAction, premiumLabel, premiumAction, premiumIcon = 'trophy-outline', premiumOwned = false, streak, streakLabel, centered = false, lightBackground = false, showText = true }: { eyebrow?: string; title: string; subtitle?: string; action?: IconName; actionLogo?: boolean; onAction?: () => void; featureLabel?: string; featureAction?: () => void; premiumLabel?: string; premiumAction?: () => void; premiumIcon?: IconName; premiumOwned?: boolean; streak?: number; streakLabel?: string; centered?: boolean; lightBackground?: boolean; showText?: boolean }) {
  const colors = useColors();
  const premiumColor = premiumOwned ? colors.success : colors.primary;
  const headingColor = lightBackground ? colors.primaryForeground : colors.foreground;
  const supportingColor = lightBackground ? `${colors.primaryForeground}B3` : colors.mutedForeground;
  return <View style={styles.header}>
    {showText ? <View style={[styles.headerText, centered ? styles.headerTextCentered : null]}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: lightBackground ? colors.primaryForeground : colors.primary }]}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={[styles.title, { color: headingColor }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: supportingColor }]}>{subtitle}</Text> : null}
    </View> : null}
    <View style={[styles.headerActions, centered ? styles.headerActionsCentered : null]}>
      {streak !== undefined ? <View accessibilityLabel={`${streak} ${streakLabel ?? ''}`} style={[styles.streakPill, { backgroundColor: `${colors.orange}20`, borderColor: `${colors.orange}55` }]}><Ionicons name="flame" size={15} color={colors.orange} /><Text style={[styles.streakValue, { color: colors.orange }]}>{streak}</Text>{streakLabel ? <Text style={[styles.streakLabel, { color: colors.orange }]}>{streakLabel}</Text> : null}</View> : null}
      {featureLabel && featureAction ? <Pressable accessibilityRole="button" accessibilityLabel={featureLabel} onPress={() => { triggerHaptic(); featureAction(); }} style={({ pressed }) => [styles.featurePill, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}55`, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="sparkles-outline" size={14} color={colors.primary} /><Text style={[styles.featurePillText, { color: colors.primary }]}>{featureLabel}</Text></Pressable> : null}
      {premiumAction ? <Pressable accessibilityLabel={premiumLabel} testID="header-premium" onPress={() => { triggerHaptic(Haptics.ImpactFeedbackStyle.Medium); premiumAction(); }} style={({ pressed }) => [styles.premiumPill, { backgroundColor: `${premiumColor}20`, borderColor: `${premiumColor}70`, opacity: pressed ? 0.72 : 1 }]}>{premiumOwned ? <Ionicons name="checkmark-circle" size={13} color={premiumColor} /> : <Ionicons name={premiumIcon} size={15} color={premiumColor} />}<Text style={[styles.premiumPillText, { color: premiumColor }]}>{premiumLabel}</Text></Pressable> : null}
      {action && onAction ? <Pressable testID="header-action" onPress={() => { triggerHaptic(); onAction(); }} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>{actionLogo ? <ForgeFitMark size={27} /> : <Ionicons name={action} size={20} color={colors.foreground} />}</Pressable> : null}
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

export function Pill({ label, active, onPress, lightBackground = false }: { label: string; active?: boolean; onPress?: () => void; lightBackground?: boolean }) {
  const colors = useColors();
  return <Pressable onPress={() => { triggerHaptic(); onPress?.(); }} style={({ pressed }) => [styles.pill, { backgroundColor: lightBackground ? (active ? `${colors.primary}D9` : `${colors.foreground}B8`) : (active ? colors.primary : colors.secondary), borderWidth: lightBackground ? 1 : 0, borderColor: lightBackground ? `${colors.primaryForeground}20` : 'transparent', opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}><Text style={[styles.pillText, { color: lightBackground || active ? colors.primaryForeground : colors.mutedForeground }]}>{label}</Text></Pressable>;
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
     <View style={[styles.celebrationBadge, { backgroundColor: colors.primary }]}><Ionicons name="trophy-outline" size={25} color={colors.primaryForeground} /></View>
      <Text style={[styles.celebrationTitle, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? <Text style={[styles.celebrationSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
    </Animated.View> : null}
  </View>;
}

export function PremiumSuccessCelebration({ visible, onDone, modal = true }: { visible: boolean; onDone: () => void; modal?: boolean }) {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const successTone = useAudioPlayer(require('@/assets/sounds/premium-success.wav'));
  const cardProgress = React.useRef(new Animated.Value(0)).current;
  const glowProgress = React.useRef(new Animated.Value(0)).current;
  const doneRef = React.useRef(onDone);
  doneRef.current = onDone;
  const handleDone = React.useCallback(() => doneRef.current(), []);

  React.useEffect(() => {
    if (!visible) return undefined;
    cardProgress.setValue(0);
    glowProgress.setValue(0);
    successTone.volume = 0.8;
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
    void successTone.seekTo(0).then(() => successTone.play()).catch(() => successTone.play());
    Animated.parallel([
      Animated.spring(cardProgress, { toValue: 1, friction: 8, tension: 65, useNativeDriver: true }),
      Animated.loop(Animated.sequence([
        Animated.timing(glowProgress, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(glowProgress, { toValue: 0, duration: 650, useNativeDriver: true }),
      ]), { iterations: 2 }),
    ]).start();
    return () => {
      successTone.pause();
      cardProgress.stopAnimation();
      glowProgress.stopAnimation();
    };
  }, [cardProgress, glowProgress, successTone, visible]);

  const content = <View style={styles.premiumSuccessRoot}>
    <LinearGradient colors={[`${colors.primary}D9`, `${colors.success}35`, colors.background]} style={styles.premiumSuccessGradient}>
      <Animated.View style={[styles.premiumSuccessGlow, { backgroundColor: `${colors.success}55`, opacity: glowProgress.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.5] }), transform: [{ scale: glowProgress.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.16] }) }] }]} />
      <Animated.View style={[styles.premiumSuccessCard, { backgroundColor: colors.card, borderColor: `${colors.success}65`, opacity: cardProgress, transform: [{ translateY: cardProgress.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }, { scale: cardProgress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
        <View style={[styles.premiumSuccessBadge, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={42} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.premiumSuccessEyebrow, { color: colors.success }]}>{t('premiumPurchaseSuccessEyebrow')}</Text>
        <Text style={[styles.premiumSuccessTitle, { color: colors.foreground }]}>{t('premiumPurchaseSuccessTitle')}</Text>
        <Text style={[styles.premiumSuccessBody, { color: colors.mutedForeground }]}>{t('premiumPurchaseSuccessBody')}</Text>
        <View style={[styles.premiumSuccessLine, { backgroundColor: `${colors.success}35` }]} />
      </Animated.View>
      <CelebrationBurst visible={visible} onDone={handleDone} />
    </LinearGradient>
  </View>;

  return modal ? <Modal transparent visible={visible} animationType="fade" onRequestClose={handleDone}>
    {content}
  </Modal> : content;
}

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  const colors = useColors();
  return <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Ionicons name={icon} size={24} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{text}</Text></View>;
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
  const colors = useColors();
  const { language, enablePremium } = useFit();
  const { monthlyPackage, annualPackage, isAvailable, isLoading, isSubscribed, purchase, restore, isPurchasing, isRestoring } = useSubscription();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [selectedPlan, setSelectedPlan] = React.useState<'monthly' | 'annual'>(() => annualPackage ? 'annual' : 'monthly');
  const canOfferAnnual = Boolean(annualPackage);
  const monthlyPrice = monthlyPackage?.product.priceString ?? '—';
  const annualPrice = annualPackage?.product.priceString ?? '—';
  const appear = React.useRef(new Animated.Value(0)).current;
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [purchaseCelebration, setPurchaseCelebration] = React.useState(false);

  React.useEffect(() => {
    if (!visible) return undefined;
    appear.setValue(0);
    Animated.spring(appear, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }).start();
    return () => appear.stopAnimation();
  }, [appear, visible]);

  React.useEffect(() => {
    if (!canOfferAnnual && selectedPlan === 'annual') setSelectedPlan('monthly');
  }, [canOfferAnnual, selectedPlan]);

  const activatePremium = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setActionError(null);
    if (isSubscribed) {
      onClose();
      return;
    }
    if (!isAvailable) {
      setActionError(t('premiumStoreUnavailable'));
      return;
    }
    const packageToPurchase = selectedPlan === 'annual' ? annualPackage : monthlyPackage;
    if (!packageToPurchase) {
      setActionError(t('premiumStoreUnavailable'));
      return;
    }
    try {
      const customerInfo = await purchase(packageToPurchase);
      if (!hasActivePremiumEntitlement(customerInfo)) {
        setActionError(t('premiumPurchaseError'));
        return;
      }
       enablePremium();
       setPurchaseCelebration(true);
    } catch {
      setActionError(t('premiumPurchaseError'));
    }
  };

  const restorePremium = async () => {
    triggerHaptic();
    setActionError(null);
    if (!isAvailable) {
      setActionError(t('premiumStoreUnavailable'));
      return;
    }
    try {
      const customerInfo = await restore();
       if (hasActivePremiumEntitlement(customerInfo)) {
         enablePremium();
         setPurchaseCelebration(true);
        return;
      }
      setActionError(t('premiumRestoreNoPurchase'));
    } catch {
      setActionError(t('premiumRestoreError'));
    }
  };

  if (!visible || !SUBSCRIPTION_PURCHASE_ENABLED) return null;
  return <>
   <Modal transparent visible animationType="none" onRequestClose={onClose}>
    <View style={styles.premiumModalRoot}>
      <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.premiumSheet, { backgroundColor: colors.card, borderColor: colors.border, opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }, { scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>
        <LinearGradient colors={[`${colors.primary}3A`, `${colors.primary}08`, colors.card]} style={styles.premiumGradient}>
          <View style={styles.premiumModalHeader}>
       <View style={[styles.premiumModalIcon, { backgroundColor: colors.primary }]}><Ionicons name="trophy-outline" size={27} color={colors.primaryForeground} /></View>
            <Pressable accessibilityLabel={t('close')} testID="close-premium" onPress={onClose} hitSlop={10} style={[styles.premiumClose, { backgroundColor: colors.secondary }]}><Ionicons name="close" size={19} color={colors.foreground} /></Pressable>
          </View>
          <Text style={[styles.premiumModalEyebrow, { color: colors.primary }]}>{t('premiumModalEyebrow')}</Text>
          <Text style={[styles.premiumModalTitle, { color: colors.foreground }]}>{t('premiumModalTitle')}</Text>
          <Text style={[styles.premiumModalSubtitle, { color: colors.mutedForeground }]}>{t('premiumModalSubtitle')}</Text>
           <View style={styles.premiumBenefits}>
             {(['premiumFeature1', 'premiumFeature2', 'premiumFeature3', 'premiumFeature4', 'premiumFeature5'] as const).map((key) => <View key={key} style={styles.premiumBenefit}><View style={[styles.premiumBenefitIcon, { backgroundColor: `${colors.primary}1A` }]}><Ionicons name="checkmark" size={15} color={colors.primary} /></View><Text style={[styles.premiumBenefitText, { color: colors.foreground }]}>{t(key)}</Text></View>)}
          </View>
           <View style={styles.premiumPlanChoices}>
             <Pressable testID="premium-monthly-plan" accessibilityRole="button" accessibilityState={{ selected: selectedPlan === 'monthly' }} onPress={() => setSelectedPlan('monthly')} style={[styles.premiumPlanOption, { backgroundColor: selectedPlan === 'monthly' ? `${colors.primary}18` : `${colors.secondary}88`, borderColor: selectedPlan === 'monthly' ? colors.primary : colors.border }]}>
               <Text style={[styles.premiumPlanLabel, { color: colors.foreground }]}>{t('premiumMonthlyPlan')}</Text>
               <Text style={[styles.premiumPlanPrice, { color: colors.foreground }]}>{isLoading ? t('premiumLoading') : monthlyPrice}</Text>
               {!isLoading ? <Text style={[styles.premiumPlanUnit, { color: colors.mutedForeground }]}>{t('premiumPerMonth')}</Text> : null}
             </Pressable>
               <Pressable disabled={!canOfferAnnual} testID="premium-annual-plan" accessibilityRole="button" accessibilityState={{ selected: selectedPlan === 'annual', disabled: !canOfferAnnual }} onPress={() => { if (canOfferAnnual) setSelectedPlan('annual'); }} style={[styles.premiumPlanOption, { backgroundColor: selectedPlan === 'annual' ? `${colors.primary}18` : `${colors.secondary}88`, borderColor: selectedPlan === 'annual' ? colors.primary : colors.border, opacity: canOfferAnnual ? 1 : 0.58 }]}>
                <View style={styles.premiumPlanHeader}><Text style={[styles.premiumPlanLabel, { color: colors.foreground }]}>{t('premiumAnnualPlan')}</Text>{canOfferAnnual ? <Text style={[styles.premiumSavingsBadge, { color: colors.success }]}>{t('premiumAnnualSavings')}</Text> : null}</View>
               <Text style={[styles.premiumPlanPrice, { color: colors.foreground }]}>{isLoading ? t('premiumLoading') : annualPrice}</Text>
                <Text style={[styles.premiumPlanUnit, { color: colors.mutedForeground }]}>{t('premiumPerYear')}</Text>
               </Pressable>
           </View>
          <Text style={[styles.premiumTrialBody, { color: colors.mutedForeground }]}>{t('premiumTrialBody')}</Text>
           {actionError ? <Text style={[styles.premiumActionError, { color: colors.destructive }]}>{actionError}</Text> : null}
            <Pressable testID="start-premium" disabled={isPurchasing || isLoading} onPress={activatePremium} style={({ pressed }) => [styles.premiumCta, { backgroundColor: colors.primary, opacity: pressed || isPurchasing || isLoading ? 0.58 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}><Text style={[styles.premiumCtaText, { color: colors.primaryForeground }]}>{isSubscribed ? t('premiumActiveNow') : isPurchasing ? t('premiumLoading') : t('premiumStart')}</Text><Ionicons name={isSubscribed ? 'checkmark-circle' : 'arrow-forward'} size={18} color={colors.primaryForeground} /></Pressable>
           <Pressable testID="restore-premium" disabled={isRestoring} onPress={restorePremium} style={({ pressed }) => [styles.premiumRestoreButton, { opacity: pressed || isRestoring ? 0.58 : 1 }]}><Text style={[styles.premiumRestoreText, { color: colors.primary }]}>{isRestoring ? t('premiumLoading') : t('premiumRestore')}</Text></Pressable>
          <Text style={[styles.premiumTrust, { color: colors.mutedForeground }]}>{t('premiumTrust')}</Text>
        </LinearGradient>
      </Animated.View>
    </View>
   </Modal>
   <PremiumSuccessCelebration visible={purchaseCelebration} onDone={() => { setPurchaseCelebration(false); onClose(); }} />
  </>;
}

export function PremiumAccessStatusModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, isPremium } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const pulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!visible || !isPremium) return undefined;
    pulse.setValue(0);
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1700, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [isPremium, pulse, visible]);

  if (!visible || !isPremium) return null;
  const features: Array<{ icon: IconName; key: 'premiumAccessActiveFeature1' | 'premiumAccessActiveFeature2' | 'premiumAccessActiveFeature3' }> = [
    { icon: 'sparkles-outline', key: 'premiumAccessActiveFeature1' },
    { icon: 'nutrition-outline', key: 'premiumAccessActiveFeature2' },
    { icon: 'barbell-outline', key: 'premiumAccessActiveFeature3' },
  ];
  return <Modal transparent visible animationType="fade" onRequestClose={onClose}>
    <View style={[styles.accessStatusRoot, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 18 }]}>
      <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={[styles.accessStatusSheet, { backgroundColor: colors.card, borderColor: `${colors.success}66`, shadowColor: colors.success }]}>
        <LinearGradient colors={[`${colors.success}30`, `${colors.primary}0D`, colors.card]} style={styles.accessStatusGradient}>
          <Pressable accessibilityLabel={t('close')} onPress={onClose} style={[styles.accessStatusClose, { backgroundColor: `${colors.foreground}0D` }]}>
            <Ionicons name="close" size={18} color={colors.foreground} />
          </Pressable>
          <View style={styles.accessStatusHero}>
            <Animated.View style={[styles.accessStatusHalo, { borderColor: `${colors.success}45`, transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.17] }) }], opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0.18] }) }]} />
            <Animated.View style={[styles.accessStatusHaloInner, { borderColor: `${colors.success}65`, transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) }] }]} />
            <View style={[styles.accessStatusBadge, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark" size={38} color={colors.primaryForeground} />
            </View>
            <View style={[styles.accessStatusSpark, styles.accessStatusSparkOne, { backgroundColor: colors.primary }]} />
            <View style={[styles.accessStatusSpark, styles.accessStatusSparkTwo, { backgroundColor: colors.orange }]} />
            <View style={[styles.accessStatusSpark, styles.accessStatusSparkThree, { backgroundColor: colors.success }]} />
          </View>
          <Text style={[styles.accessStatusEyebrow, { color: colors.success }]}>{t('premiumAccessActiveEyebrow')}</Text>
          <Text style={[styles.accessStatusTitle, { color: colors.foreground }]}>{t('premiumAccessActiveTitle')}</Text>
          <Text style={[styles.accessStatusBody, { color: colors.mutedForeground }]}>{t('premiumAccessActiveBody')}</Text>
          <View style={styles.accessStatusFeatures}>
            {features.map((feature) => <View key={feature.key} style={[styles.accessStatusFeature, { backgroundColor: `${colors.foreground}08`, borderColor: colors.border }]}><View style={[styles.accessStatusFeatureIcon, { backgroundColor: `${colors.success}1F` }]}><Ionicons name={feature.icon} size={16} color={colors.success} /></View><Text style={[styles.accessStatusFeatureText, { color: colors.foreground }]}>{t(feature.key)}</Text><Ionicons name="checkmark-circle" size={17} color={colors.success} /></View>)}
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.accessStatusButton, { backgroundColor: colors.success, opacity: pressed ? 0.78 : 1 }]}>
            <Text style={[styles.accessStatusButtonText, { color: colors.primaryForeground }]}>{t('premiumAccessActiveContinue')}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  </Modal>;
}

export const styles = StyleSheet.create({
  ambientBackdrop: { flex: 1, minHeight: '100%', overflow: 'hidden' },
  screen: { paddingHorizontal: 20, minHeight: '100%' },
  header: { position: 'relative', flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 26 },
  headerText: { flex: 1 },
  headerTextCentered: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 0 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActionsCentered: { position: 'absolute', right: 0, top: 0, zIndex: 2 },
  streakPill: { height: 38, borderRadius: 15, borderWidth: 1, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakValue: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  streakLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  featurePill: { height: 38, borderRadius: 15, borderWidth: 1, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 4 },
  featurePillText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.2 },
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
  metric: { flex: 1, minWidth: 72, alignItems: 'center' },
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
  lockPreviewShade: { ...StyleSheet.absoluteFillObject, backgroundColor: '#020B1859' },
  lockGateContent: { alignItems: 'center', paddingHorizontal: 8, marginVertical: 18 },
  lockIcon: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  lockEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5, marginBottom: 9 },
  lockTitle: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -1, textAlign: 'center' },
  lockText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10 },
  lockMotivation: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 14 },
  lockButton: { width: '100%', height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  lockButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  previewLayer: { position: 'absolute', left: 22, right: 22, top: 80, gap: 12, opacity: 0.45 },
  previewCard: { height: 65, borderRadius: 19, borderWidth: 1, borderColor: '#1D3B5E' },
  premiumSuccessRoot: { flex: 1, backgroundColor: '#020B18E8' },
  premiumSuccessGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  premiumSuccessGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  premiumSuccessCard: { width: '84%', maxWidth: 360, alignItems: 'center', borderRadius: 30, borderWidth: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 15 },
  premiumSuccessBadge: { width: 82, height: 82, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 7 },
  premiumSuccessEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.8 },
  premiumSuccessTitle: { fontFamily: 'Inter_700Bold', fontSize: 29, lineHeight: 35, letterSpacing: -0.9, textAlign: 'center', marginTop: 9 },
  premiumSuccessBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 10, maxWidth: 280 },
  premiumSuccessLine: { width: 48, height: 4, borderRadius: 4, marginTop: 20 },
  premiumModalRoot: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 14, paddingBottom: 18, backgroundColor: '#020B18B8' },
  premiumSheet: { overflow: 'hidden', borderRadius: 30, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 14 },
  premiumGradient: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18 },
  premiumModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  premiumModalIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  premiumClose: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  premiumModalEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.7, marginBottom: 8 },
  premiumModalTitle: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -1, lineHeight: 34 },
  premiumModalSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginTop: 9 },
  premiumBenefits: { gap: 12, marginTop: 22, marginBottom: 20 },
  premiumBenefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  premiumBenefitIcon: { width: 25, height: 25, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  premiumBenefitText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17 },
  premiumPlanChoices: { flexDirection: 'row', gap: 8, marginBottom: 9 },
  premiumPlanOption: { flex: 1, minHeight: 98, borderRadius: 17, borderWidth: 1, padding: 13 },
  premiumPlanHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  premiumPlanLabel: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  premiumPlanPrice: { fontFamily: 'Inter_700Bold', fontSize: 20, marginTop: 12 },
  premiumPlanUnit: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 3 },
  premiumSavingsBadge: { fontFamily: 'Inter_700Bold', fontSize: 8 },
  premiumPriceOptions: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'right', marginBottom: 16 },
  premiumTrialBody: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: -8, marginBottom: 14 },
  premiumCta: { height: 53, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  premiumCtaText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  premiumActionError: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16, textAlign: 'center', marginBottom: 10 },
  premiumRestoreButton: { alignItems: 'center', justifyContent: 'center', minHeight: 36 },
  premiumRestoreText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  premiumTrust: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center', marginTop: 12 },
  accessStatusRoot: { flex: 1, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: '#020B18C7' },
  accessStatusSheet: { overflow: 'hidden', borderRadius: 30, borderWidth: 1, shadowOpacity: 0.32, shadowRadius: 25, shadowOffset: { width: 0, height: 12 }, elevation: 15 },
  accessStatusGradient: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 22, paddingBottom: 20 },
  accessStatusClose: { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  accessStatusHero: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 8 },
  accessStatusHalo: { position: 'absolute', width: 142, height: 142, borderRadius: 71, borderWidth: 1 },
  accessStatusHaloInner: { position: 'absolute', width: 108, height: 108, borderRadius: 54, borderWidth: 1 },
  accessStatusBadge: { width: 78, height: 78, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 7 },
  accessStatusSpark: { position: 'absolute', width: 8, height: 8, borderRadius: 3, transform: [{ rotate: '45deg' }] },
  accessStatusSparkOne: { top: 21, right: 24 },
  accessStatusSparkTwo: { left: 16, bottom: 34 },
  accessStatusSparkThree: { right: 7, bottom: 45, width: 5, height: 5 },
  accessStatusEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.8, marginTop: 3 },
  accessStatusTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34, letterSpacing: -0.8, textAlign: 'center', marginTop: 8 },
  accessStatusBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 9, maxWidth: 310 },
  accessStatusFeatures: { width: '100%', gap: 8, marginTop: 20, marginBottom: 18 },
  accessStatusFeature: { minHeight: 48, borderRadius: 15, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  accessStatusFeatureIcon: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  accessStatusFeatureText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  accessStatusButton: { width: '100%', height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  accessStatusButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});