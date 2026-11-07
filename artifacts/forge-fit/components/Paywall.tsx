import React from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
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
import { GainModeWordmark } from '@/components/FitUI';
import { SkyBackdrop } from '@/components/SkyBackdrop';

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

/** The PRO medal drifts a few pixels up and down so the page feels alive; still under reduced motion. */
function FloatingMedal({ size }: { size: number }) {
  const reduced = useReducedMotion();
  const drift = useSharedValue(0);
  React.useEffect(() => {
    if (reduced) return;
    drift.set(withRepeat(withSequence(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })), -1));
  }, [drift, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * drift.get() }, { rotate: `${-4 + drift.get() * 4}deg` }] }));
  return <Animated.View style={style}>
    <Image source={require('@/assets/images/medals/pro.png')} resizeMode="contain" style={{ width: size, height: size }} />
  </Animated.View>;
}

/** One benefit: a gradient tile with the icon, the title and its line. */
function FeatureRow({ icon, title, body, delay, last }: { icon: IconName; title: string; body: string; delay: number; last: boolean }) {
  const colors = useColors();
  const entrance = useEntrance(delay, 8);
  return <Animated.View accessible accessibilityLabel={`${title}. ${body}`} style={[styles.feature, !last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border } : null, entrance]}>
    <LinearGradient colors={[colors.accent, '#123A8F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featureIcon}>
      <Ionicons name={icon} size={17} color="#FFFFFF" />
    </LinearGradient>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text numberOfLines={1} style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text>
      <Text numberOfLines={2} style={[styles.featureBody, { color: colors.mutedForeground }]}>{body}</Text>
    </View>
  </Animated.View>;
}

/**
 * Plan card. The chosen one fills with the brand gradient and its text turns white; the other stays a plain card.
 * A square check in the corner confirms the choice.
 */
function PlanCard({ selected, onPress, title, price, unit, note, badge, saveBadge, strike, testID }: {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: string;
  unit: string;
  note: string;
  badge?: string;
  saveBadge?: string | null;
  strike?: string | null;
  testID: string;
}) {
  const colors = useColors();
  const ink = selected ? '#FFFFFF' : colors.foreground;
  const muted = selected ? 'rgba(255,255,255,0.74)' : colors.mutedForeground;
  const inner = <>
    <View style={styles.planHead}>
      <Text numberOfLines={1} style={[styles.planTitle, { color: ink }]}>{title}</Text>
      <View style={[styles.check, selected ? { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' } : { borderColor: colors.border }]}>
        {selected ? <Ionicons name="checkmark" size={14} color={colors.accent} /> : null}
      </View>
    </View>
    {strike ? <Text style={[styles.planStrike, { color: muted }]}>{strike}</Text> : <View style={styles.strikeSpace} />}
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.planPrice, { color: ink }]}>{price}</Text>
    <Text style={[styles.planUnit, { color: muted }]}>{unit}</Text>
    <View style={styles.planFoot}>
      {saveBadge ? <View style={[styles.saveBadge, { backgroundColor: selected ? '#FFFFFF' : `${colors.success}1F` }]}><Text style={[styles.saveBadgeText, { color: selected ? colors.accent : colors.success }]}>{saveBadge}</Text></View> : null}
      <Text numberOfLines={2} style={[styles.planNote, { color: muted }]}>{note}</Text>
    </View>
  </>;
  return <Pressable testID={testID} accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} scaleTo={0.97} style={styles.planWrap}>
    {selected
      ? <LinearGradient colors={[colors.accent, '#123A8F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.plan, styles.planSelected]}>{inner}</LinearGradient>
      : <View style={[styles.plan, { backgroundColor: colors.card, borderColor: colors.border }]}>{inner}</View>}
    {badge ? <View style={[styles.planBadge, { backgroundColor: colors.foreground }]}><Text style={[styles.planBadgeText, { color: colors.background }]}>{badge}</Text></View> : null}
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
    <SkyBackdrop />
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 230 + insets.bottom }} showsVerticalScrollIndicator={false} bounces={false}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <GainModeWordmark color={colors.foreground} width={128} height={17} />
          <LinearGradient colors={['#F5C542', '#E39A1F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.proPill}><Text style={styles.proText}>PRO</Text></LinearGradient>
        </View>
        {onClose ? <Pressable accessibilityLabel={t('close')} onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="close" size={18} color={colors.foreground} />
        </Pressable> : null}
      </View>

      <Animated.View style={[styles.hero, heroEntrance]}>
        <FloatingMedal size={compact ? 116 : 150} />
      </Animated.View>

      <View style={styles.content}>
        <Animated.View style={[styles.heading, titleEntrance]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('paywallTitle')}</Text>
          {compact ? null : <Text numberOfLines={3} style={[styles.body, { color: colors.mutedForeground }]}>{t('paywallBody')}</Text>}
        </Animated.View>

        <Animated.View style={plansEntrance}>
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
            /> : null}
            {monthly ? <PlanCard
              testID="paywall-monthly-plan"
              selected={plan === 'monthly'}
              onPress={() => { if (plan !== 'monthly') { Haptics.selectionAsync().catch(() => undefined); setPlan('monthly'); } }}
              title={t('premiumMonthlyPlan')}
              price={monthly.priceString}
              unit={t('premiumPerMonth')}
              note={t('paywallMonthlyNote')}
            /> : null}
            {!annual && !monthly ? <View style={[styles.plansLoading, { borderColor: colors.border }]}><ActivityIndicator color={colors.mutedForeground} /><Text style={[styles.planNote, { color: colors.mutedForeground }]}>{t('premiumLoading')}</Text></View> : null}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('paywallFeaturesTitle')}</Text>
          <View style={[styles.features, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FeatureRow icon="coach-outline" title={t('paywallFeature1Title')} body={t('paywallFeature1Body')} delay={420} last={false} />
            <FeatureRow icon="camera-outline" title={t('paywallFeature2Title')} body={t('paywallFeature2Body')} delay={470} last={false} />
            <FeatureRow icon="barbell-outline" title={t('paywallFeature3Title')} body={t('paywallFeature3Body')} delay={520} last={false} />
            <FeatureRow icon="analytics-outline" title={t('paywallFeature4Title')} body={t('paywallFeature4Body')} delay={570} last />
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
        scaleTo={0.97}
        style={styles.ctaWrap}
      >
        <LinearGradient colors={[colors.accent, '#123A8F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
          <Text style={styles.ctaText}>{busy ? t('premiumLoading') : isSubscribed ? t('premiumAccessActiveContinue') : t('paywallCta')}</Text>
          <View style={styles.ctaArrow}>{busy ? <ActivityIndicator color={colors.accent} /> : <Ionicons name="arrow-forward" size={18} color={colors.accent} />}</View>
        </LinearGradient>
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
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, minHeight: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  proPill: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  proText: { fontFamily: 'Inter_800ExtraBold', fontSize: 11, letterSpacing: 1, color: '#3A2600' },
  close: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', marginTop: 14 },
  content: { paddingHorizontal: 20 },
  heading: { alignItems: 'center', marginTop: 14 },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 34, lineHeight: 38, letterSpacing: -1.6, textAlign: 'center' },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14.5, lineHeight: 21, marginTop: 8, textAlign: 'center', maxWidth: 330 },
  plans: { flexDirection: 'row', gap: 10, marginTop: 26 },
  planWrap: { flex: 1 },
  plan: { flex: 1, borderRadius: 26, borderWidth: 1.5, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16, minHeight: 186 },
  planSelected: { borderColor: 'transparent' },
  planHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  planTitle: { flex: 1, fontFamily: 'Inter_800ExtraBold', fontSize: 15, letterSpacing: -0.3 },
  check: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  planStrike: { fontFamily: 'Inter_500Medium', fontSize: 12, textDecorationLine: 'line-through', fontVariant: ['tabular-nums'], marginTop: 16 },
  strikeSpace: { height: 15, marginTop: 16 },
  planPrice: { fontFamily: 'Inter_800ExtraBold', fontSize: 25, letterSpacing: -1, fontVariant: ['tabular-nums'], marginTop: 2 },
  planUnit: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  planFoot: { marginTop: 'auto', paddingTop: 12, gap: 6 },
  planNote: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 16 },
  planBadge: { position: 'absolute', top: -11, alignSelf: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  planBadgeText: { fontFamily: 'Inter_800ExtraBold', fontSize: 9.5, letterSpacing: 0.9 },
  saveBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  saveBadgeText: { fontFamily: 'Inter_800ExtraBold', fontSize: 10, letterSpacing: 0.4 },
  plansLoading: { flex: 1, borderRadius: 26, borderWidth: 1, padding: 20, alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 20, letterSpacing: -0.7, marginTop: 26, marginBottom: 10, paddingHorizontal: 2 },
  features: { borderRadius: 26, borderWidth: 1, paddingHorizontal: 16 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 },
  featureIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontFamily: 'Inter_700Bold', fontSize: 14.5, letterSpacing: -0.2 },
  featureBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16.5, marginTop: 2 },
  disclosure: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 14, textAlign: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  error: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17, textAlign: 'center', marginBottom: 10 },
  ctaWrap: { borderRadius: 31 },
  cta: { height: 62, borderRadius: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 26, paddingRight: 8 },
  ctaText: { fontFamily: 'Inter_800ExtraBold', fontSize: 17, letterSpacing: -0.2, color: '#FFFFFF' },
  ctaArrow: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  renew: { fontFamily: 'Inter_500Medium', fontSize: 12, textAlign: 'center', marginTop: 10, fontVariant: ['tabular-nums'] },
  links: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 14, rowGap: 8, marginTop: 10, paddingHorizontal: 8 },
  link: { flexShrink: 1, textAlign: 'center', fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 16 },
});
