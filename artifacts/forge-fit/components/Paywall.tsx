import React from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { getPremiumPreviewProduct, translate, type TranslationKey } from '@/lib/i18n';
import { useSubscription } from '@/lib/revenuecat';
import { hasActivePremiumEntitlement } from '@/lib/premiumAccess';
import { calculateAnnualSavingsPercent, formatAnnualMonthlyPrice } from '@/lib/subscriptionPricing';
import { legalDocumentUrl } from '@/lib/legalDocuments';
import { Ionicons } from '@/components/AppIcon';
import { EASE_OUT, PressableScale as Pressable } from '@/components/Motion';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Plan = 'monthly' | 'annual';
type DisplayProduct = { price: number; currencyCode: string; priceString: string };

function formatPrice(value: number, currencyCode: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(value);
}

/** Fades and lifts a block into place after `delay` ms; static under reduced motion. */
function useEntrance(delay: number, distance = 14) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  React.useEffect(() => {
    if (reduced) return;
    progress.set(withDelay(delay, withTiming(1, { duration: 480, easing: EASE_OUT })));
  }, [delay, progress, reduced]);
  return useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * distance }],
  }));
}

function GlassChip({ icon, label, delay, style }: { icon: IconName; label: string; delay: number; style: object | object[] }) {
  const entrance = useEntrance(delay, 10);
  return <Animated.View style={[styles.chip, style, entrance]}>
    <View style={styles.chipTint} />
    <Ionicons name={icon} size={13} color="#FFFFFF" />
    <Text style={styles.chipText}>{label}</Text>
  </Animated.View>;
}

/** One benefit as a compact tile: icon and title, with the longer line kept for screen readers. */
function FeatureTile({ icon, title, body, delay }: { icon: IconName; title: string; body: string; delay: number }) {
  const colors = useColors();
  const entrance = useEntrance(delay, 8);
  return <Animated.View accessible accessibilityLabel={`${title}. ${body}`} style={[styles.feature, { backgroundColor: colors.card, borderColor: colors.border }, entrance]}>
    <View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}><Ionicons name={icon} size={15} color={colors.foreground} /></View>
    <Text numberOfLines={2} style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text>
  </Animated.View>;
}

/**
 * Plan card. Selecting it floods the whole card with its frosted aurora (420ms ease-out) while the
 * border and radio settle (220ms). The chosen card then gets a light sheen that sweeps across every
 * few seconds, like light catching glass; it stops as soon as the card is deselected or motion is reduced.
 */
function PlanCard({ selected, onPress, title, price, unit, note, badge, saveBadge, strike, glow, testID }: {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: string;
  unit: string;
  note: string;
  badge?: string;
  saveBadge?: string | null;
  strike?: string | null;
  /** Two colors for the frosted aurora; a hint of it shows at rest, the selected card is filled. */
  glow: [string, string];
  testID: string;
}) {
  const colors = useColors();
  const dark = colors.colorScheme === 'dark';
  const reduced = useReducedMotion();
  const [width, setWidth] = React.useState(0);
  const progress = useSharedValue(selected ? 1 : 0);
  const fill = useSharedValue(selected ? 1 : 0);
  const sheen = useSharedValue(0);

  React.useEffect(() => {
    progress.set(withTiming(selected ? 1 : 0, { duration: 220, easing: EASE_OUT }));
    fill.set(withTiming(selected ? 1 : 0, { duration: selected ? 420 : 260, easing: EASE_OUT }));
    cancelAnimation(sheen);
    sheen.set(0);
    if (selected && !reduced && width) {
      sheen.set(withDelay(450, withRepeat(withSequence(
        withTiming(1, { duration: 1700, easing: Easing.bezier(0.45, 0, 0.25, 1) }),
        withDelay(2300, withTiming(0, { duration: 0 })),
      ), -1)));
    }
    return () => cancelAnimation(sheen);
  }, [fill, progress, reduced, selected, sheen, width]);

  const cardStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.get(), [0, 1], [colors.border, colors.primary]),
  }));
  const dotStyle = useAnimatedStyle(() => ({ opacity: progress.get(), transform: [{ scale: interpolate(progress.get(), [0, 1], [0.4, 1]) }] }));
  const ringStyle = useAnimatedStyle(() => ({ borderColor: interpolateColor(progress.get(), [0, 1], [colors.border, colors.primary]) }));
  const floodStyle = useAnimatedStyle(() => ({ opacity: fill.get() }));
  const restMaskStyle = useAnimatedStyle(() => ({ opacity: 1 - fill.get() }));
  const sheenStyle = useAnimatedStyle(() => ({
    opacity: sheen.get() > 0 && sheen.get() < 1 ? 1 : 0,
    transform: [{ translateX: -150 + sheen.get() * (width + 200) }, { rotate: '18deg' }],
  }));

  const strong = dark ? '8C' : '66';
  return <Pressable testID={testID} accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} scaleTo={0.98}>
    <Animated.View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[styles.plan, { backgroundColor: colors.card }, cardStyle]}>
      <View pointerEvents="none" style={styles.glowLayer}>
        <Animated.View style={[StyleSheet.absoluteFill, floodStyle]}>
          <LinearGradient colors={[`${glow[0]}${strong}`, `${glow[1]}${strong}`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={[styles.glowBlobLeft, { backgroundColor: `${glow[1]}${dark ? '80' : '59'}` }]} />
        </Animated.View>
        <LinearGradient
          colors={[`${glow[0]}00`, `${glow[0]}${dark ? '47' : '33'}`, `${glow[1]}${dark ? '73' : '59'}`]}
          locations={[0.22, 0.6, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glowBlobA, { backgroundColor: `${glow[0]}${dark ? '80' : '66'}` }]} />
        <View style={[styles.glowBlobB, { backgroundColor: `${glow[1]}${dark ? '99' : '73'}` }]} />
        <BlurView intensity={dark ? 50 : 60} tint={colors.colorScheme} style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, restMaskStyle]}>
          <LinearGradient colors={[colors.card, `${colors.card}00`]} locations={[0.18, 0.42]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View style={[styles.sheen, sheenStyle]}>
          <LinearGradient colors={['rgba(255,255,255,0)', dark ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
      {badge ? <View style={[styles.planBadge, { backgroundColor: colors.primary }]}><Text style={[styles.planBadgeText, { color: colors.primaryForeground }]}>{badge}</Text></View> : null}
      <Animated.View style={[styles.radio, ringStyle]}>
        <Animated.View style={[styles.radioDot, { backgroundColor: colors.primary }, dotStyle]} />
      </Animated.View>
      <View style={styles.planCopy}>
        <View style={styles.planTitleRow}>
          <Text style={[styles.planTitle, { color: colors.foreground }]}>{title}</Text>
          {saveBadge ? <View style={[styles.saveBadge, { backgroundColor: colors.success }]}><Text style={[styles.saveBadgeText, { color: colors.primaryForeground }]}>{saveBadge}</Text></View> : null}
        </View>
        <Text style={[styles.planNote, { color: colors.mutedForeground }]}>{note}</Text>
      </View>
      <View style={styles.planPriceColumn}>
        {strike ? <Text style={[styles.planStrike, { color: colors.mutedForeground }]}>{strike}</Text> : null}
        <Text style={[styles.planPrice, { color: colors.foreground }]}>{price}</Text>
        <Text style={[styles.planUnit, { color: colors.mutedForeground }]}>{unit}</Text>
      </View>
    </Animated.View>
  </Pressable>;
}

export function Paywall({ onUnlock, onPurchaseSuccess, onClose, previewMode = false }: {
  onUnlock: () => void;
  onPurchaseSuccess: (kind: 'purchase' | 'restore') => void;
  onClose?: () => void;
  previewMode?: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  // On short phones the hero shrinks and the intro line goes, so both plans still show without scrolling.
  const compact = useWindowDimensions().height < 740;
  const { language } = useFit();
  const t = (key: TranslationKey) => translate(language, key);
  const { monthlyPackage, annualPackage, isAvailable, isLoading, isSubscribed: storeSubscribed, purchase, refreshPackages, restore, isPurchasing, isRestoring } = useSubscription();
  // The web preview always counts as subscribed; the design preview should still show the buying path.
  const isSubscribed = previewMode ? false : storeSubscribed;
  const [plan, setPlan] = React.useState<Plan>('annual');
  const [error, setError] = React.useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = React.useState(false);

  const usePreviewPrices = previewMode || Platform.OS === 'web';
  // Preview prices are illustrative; real purchases always use localized store products.
  const monthly: DisplayProduct | undefined = monthlyPackage?.product ?? (usePreviewPrices ? getPremiumPreviewProduct(language, 6.99) : undefined);
  const annual: DisplayProduct | undefined = annualPackage?.product ?? (usePreviewPrices ? getPremiumPreviewProduct(language, 49.99) : undefined);
  const savings = calculateAnnualSavingsPercent(monthly, annual);
  const annualPerMonth = formatAnnualMonthlyPrice(annual);
  const yearOfMonthly = monthly && annual && monthly.currencyCode === annual.currencyCode ? formatPrice(monthly.price * 12, monthly.currencyCode) : null;
  const selectedProduct = plan === 'annual' ? annual : monthly;
  const busy = isPurchasing || previewBusy;
  const checking = !previewMode && isAvailable && (isLoading || isSubscribed === undefined);

  const heroEntrance = useEntrance(0, 18);
  const titleEntrance = useEntrance(120, 12);
  const plansEntrance = useEntrance(260, 12);

  const handlePurchase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    setError(null);
    if (isSubscribed) {
      onUnlock();
      return;
    }
    if (previewMode) {
      setPreviewBusy(true);
      setTimeout(() => { setPreviewBusy(false); onPurchaseSuccess('purchase'); }, 1100);
      return;
    }
    if (checking) return;
    let selectedPackage = plan === 'annual' ? annualPackage : monthlyPackage;
    if (isAvailable && !selectedPackage) {
      const fresh = await refreshPackages().catch(() => ({ monthly: undefined, annual: undefined }));
      selectedPackage = plan === 'annual' ? fresh.annual : fresh.monthly;
    }
    if (!isAvailable || !selectedPackage) {
      setError(t('premiumStoreUnavailable'));
      return;
    }
    try {
      const customerInfo = await purchase(selectedPackage);
      if (!hasActivePremiumEntitlement(customerInfo)) {
        setError(t('premiumPurchaseError'));
        return;
      }
      onPurchaseSuccess('purchase');
    } catch {
      setError(t('premiumPurchaseError'));
    }
  };

  const handleRestore = async () => {
    Haptics.selectionAsync().catch(() => undefined);
    setError(null);
    if (previewMode || !isAvailable) {
      setError(previewMode ? t('premiumRestoreNoPurchase') : t('premiumStoreUnavailable'));
      return;
    }
    try {
      const customerInfo = await restore();
      if (!hasActivePremiumEntitlement(customerInfo)) {
        setError(t('premiumRestoreNoPurchase'));
        return;
      }
      onPurchaseSuccess('restore');
    } catch {
      setError(t('premiumRestoreError'));
    }
  };

  const openLegal = (document: 'privacy-policy' | 'terms-of-service') => {
    Linking.openURL(legalDocumentUrl(document, language)).catch(() => Alert.alert(t('legalLinkErrorTitle'), t('legalLinkErrorBody')));
  };

  const renewNote = selectedProduct
    ? t(plan === 'annual' ? 'paywallRenewsYearly' : 'paywallRenewsMonthly').replace('{price}', selectedProduct.priceString)
    : t('premiumTrust');

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <ScrollView contentContainerStyle={{ paddingBottom: 230 + insets.bottom }} showsVerticalScrollIndicator={false} bounces={false}>
      <Animated.View style={heroEntrance}>
        <LinearGradient colors={[colors.heroBackgroundStart, colors.heroBackgroundEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, compact ? styles.heroCompact : null, { paddingTop: insets.top + 18 }]}>
          <View style={styles.heroRingLarge} />
          <View style={styles.heroRingSmall} />
          <Image source={require('@/assets/images/coach-wave-transparent.png')} resizeMode="contain" style={[styles.mascot, compact ? styles.mascotCompact : null]} />
          <GlassChip icon="chatbubble-ellipses-outline" label={t('paywallChipCoach')} delay={260} style={[styles.chipLeft, compact ? { top: 86 } : null]} />
          <GlassChip icon="camera-outline" label={t('paywallChipPhoto')} delay={340} style={[styles.chipRight, compact ? { top: 52 } : null]} />
          <GlassChip icon="analytics-outline" label={t('paywallChipWeekly')} delay={420} style={[styles.chipBottom, compact ? { top: 112 } : null]} />
          <LinearGradient colors={[`${colors.background}00`, colors.background]} style={styles.heroFade} />
        </LinearGradient>
      </Animated.View>
      {onClose ? <Pressable accessibilityLabel={t('close')} onPress={onClose} hitSlop={10} style={[styles.close, { top: insets.top + 12 }]}>
        <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        <Ionicons name="close" size={18} color="#FFFFFF" />
      </Pressable> : null}

      <View style={styles.content}>
        <Animated.View style={titleEntrance}>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{t('paywallEyebrow')}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('paywallTitle')}</Text>
          {compact ? null : <Text numberOfLines={2} style={[styles.body, { color: colors.mutedForeground }]}>{t('paywallBody')}</Text>}
        </Animated.View>


        <Animated.View style={plansEntrance}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('paywallChoosePlan')}</Text>
          <View style={styles.plans}>
            {annual ? <PlanCard
              testID="paywall-annual-plan"
              selected={plan === 'annual'}
              onPress={() => { if (plan !== 'annual') { Haptics.selectionAsync().catch(() => undefined); setPlan('annual'); } }}
              title={t('premiumAnnualPlan')}
              price={annual.priceString}
              unit={t('premiumPerYear')}
              note={annualPerMonth ? t('paywallMonthlyEquivalent').replace('{price}', annualPerMonth) : t('paywallYearlyNote')}
              badge={t('paywallBestValue')}
              saveBadge={savings !== null ? t('paywallSave').replace('{percent}', String(savings)) : null}
              strike={yearOfMonthly}
              glow={['#FF3B5C', '#FF8A3D']}
            /> : null}
            {monthly ? <PlanCard
              testID="paywall-monthly-plan"
              selected={plan === 'monthly'}
              onPress={() => { if (plan !== 'monthly') { Haptics.selectionAsync().catch(() => undefined); setPlan('monthly'); } }}
              title={t('premiumMonthlyPlan')}
              price={monthly.priceString}
              unit={t('premiumPerMonth')}
              note={t('paywallMonthlyNote')}
              glow={['#2563EB', '#38BDF8']}
            /> : null}
            {!annual && !monthly ? <View style={[styles.plansLoading, { borderColor: colors.border }]}><ActivityIndicator color={colors.mutedForeground} /><Text style={[styles.planNote, { color: colors.mutedForeground }]}>{t('premiumLoading')}</Text></View> : null}
          </View>
          <View style={styles.features}>
            <FeatureTile icon="coach-outline" title={t('paywallFeature1Title')} body={t('paywallFeature1Body')} delay={520} />
            <FeatureTile icon="camera-outline" title={t('paywallFeature2Title')} body={t('paywallFeature2Body')} delay={570} />
            <FeatureTile icon="barbell-outline" title={t('paywallFeature3Title')} body={t('paywallFeature3Body')} delay={620} />
            <FeatureTile icon="analytics-outline" title={t('paywallFeature4Title')} body={t('paywallFeature4Body')} delay={670} />
          </View>
          <Text style={[styles.disclosure, { color: colors.mutedForeground }]}>{t('premiumTrialBody')}</Text>
        </Animated.View>
      </View>
    </ScrollView>

    <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border }]}>
      <BlurView intensity={40} tint={colors.colorScheme} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass }]} />
      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      <Pressable
        testID="paywall-subscribe"
        accessibilityRole="button"
        accessibilityState={{ disabled: busy || checking, busy }}
        disabled={busy || checking}
        onPress={() => { void handlePurchase(); }}
        style={[styles.cta, { backgroundColor: colors.primary }]}
      >
        {busy ? <ActivityIndicator color={colors.primaryForeground} /> : null}
        <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>{busy ? t('premiumLoading') : isSubscribed ? t('premiumAccessActiveContinue') : t('paywallCta')}</Text>
        {!busy ? <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /> : null}
      </Pressable>
      <Text style={[styles.renew, { color: colors.mutedForeground }]}>{renewNote}</Text>
      <View style={styles.links}>
        <Pressable testID="paywall-restore" accessibilityRole="button" disabled={isRestoring} onPress={() => { void handleRestore(); }} hitSlop={8}>
          <Text style={[styles.link, { color: colors.foreground }]}>{isRestoring ? t('premiumLoading') : t('premiumRestore')}</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => openLegal('terms-of-service')} hitSlop={8}>
          <Text style={[styles.link, { color: colors.mutedForeground }]}>{t('termsOfService')}</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => openLegal('privacy-policy')} hitSlop={8}>
          <Text style={[styles.link, { color: colors.mutedForeground }]}>{t('privacyPolicy')}</Text>
        </Pressable>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { height: 236, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroRingLarge: { position: 'absolute', width: 250, height: 250, borderRadius: 125, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', top: 10 },
  heroRingSmall: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.08)', top: 50 },
  mascot: { width: 140, height: 152, marginTop: 34 },
  heroCompact: { height: 176 },
  mascotCompact: { width: 104, height: 112, marginTop: 20 },
  heroFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70 },
  chip: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  chipTint: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.14)' },
  chipText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#FFFFFF' },
  chipLeft: { left: 16, top: 112 },
  chipRight: { right: 16, top: 70 },
  chipBottom: { right: 22, top: 150 },
  close: { position: 'absolute', right: 16, width: 36, height: 36, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  content: { paddingHorizontal: 20, marginTop: -18 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 34, letterSpacing: -1.2, marginTop: 6 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 6 },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  feature: { flexGrow: 1, flexBasis: '46%', flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 16, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 10 },
  featureIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12.5, lineHeight: 16, letterSpacing: -0.1 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.4, marginTop: 18, marginBottom: 14 },
  plans: { gap: 12 },
  plan: { borderRadius: 22, borderWidth: 2, paddingHorizontal: 16, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  glowLayer: { ...StyleSheet.absoluteFill, borderRadius: 20, overflow: 'hidden' },
  glowBlobA: { position: 'absolute', width: 150, height: 150, borderRadius: 75, right: 70, top: -40 },
  glowBlobB: { position: 'absolute', width: 170, height: 170, borderRadius: 85, right: -40, bottom: -70 },
  glowBlobLeft: { position: 'absolute', width: 160, height: 160, borderRadius: 80, left: -50, top: -60 },
  sheen: { position: 'absolute', top: -30, bottom: -30, left: 0, width: 120 },
  planBadge: { position: 'absolute', top: -11, left: 18, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  planBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.8 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  planCopy: { flex: 1, minWidth: 0 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  planTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.2 },
  saveBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  saveBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.4 },
  planNote: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 4 },
  planPriceColumn: { alignItems: 'flex-end' },
  planStrike: { fontFamily: 'Inter_500Medium', fontSize: 12, textDecorationLine: 'line-through', fontVariant: ['tabular-nums'] },
  planPrice: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  planUnit: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 1 },
  plansLoading: { borderRadius: 22, borderWidth: 1, padding: 20, alignItems: 'center', gap: 8 },
  disclosure: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 14, textAlign: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  error: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17, textAlign: 'center', marginBottom: 10 },
  cta: { height: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.2 },
  renew: { fontFamily: 'Inter_500Medium', fontSize: 12, textAlign: 'center', marginTop: 10, fontVariant: ['tabular-nums'] },
  links: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 14, rowGap: 8, marginTop: 10, paddingHorizontal: 8 },
  link: { flexShrink: 1, textAlign: 'center', fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 16 },
});
