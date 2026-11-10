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
import { getPremiumPreviewProduct, translate, type Language, type TranslationKey } from '@/lib/i18n';
import { freeTrialDays } from '@/lib/premiumTrial';
import { useSubscription } from '@/lib/revenuecat';
import { hasActivePremiumEntitlement } from '@/lib/premiumAccess';
import { calculateAnnualSavingsPercent, formatAnnualMonthlyPrice } from '@/lib/subscriptionPricing';
import { legalDocumentUrl } from '@/lib/legalDocuments';
import { Ionicons } from '@/components/AppIcon';
import { EASE_OUT, PressableScale as Pressable } from '@/components/Motion';
import { GainModeWordmark } from '@/components/FitUI';
import { SkyBackdrop } from '@/components/SkyBackdrop';
import { ChargeButton, WaterFill } from '@/components/ChargeButton';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Plan = 'monthly' | 'annual';
type DisplayProduct = { price: number; currencyCode: string; priceString: string };
const ANNUAL_TONES: [string, string] = ['#E8364F', '#FF8A3D'];
const MONTHLY_TONES: [string, string] = ['#2563EB', '#38BDF8'];
const TRIAL_BADGE_TONES: [string, string] = ['#16A34A', '#22C55E'];
/** The free trial shown on the monthly plan in the web preview, where there is no store. */
const PREVIEW_TRIAL_DAYS = 3;

/** Free-trial copy for the monthly plan. {days} and {price} are filled in. */
const TRIAL_COPY: Record<Language, { badge: string; note: string; cta: string; sub: string; renew: string }> = {
  tr: { badge: '{days} GÜN ÜCRETSİZ', note: '{days} gün ücretsiz, sonra {price}/ay', cta: '{days} gün ücretsiz başla', sub: 'Sonra {price}/ay · İstediğin zaman iptal et', renew: 'Deneme bitmeden iptal edersen ücret alınmaz. Sonra {price}/ay, iptal edilmedikçe yenilenir.' },
  en: { badge: '{days} DAYS FREE', note: '{days} days free, then {price}/mo', cta: 'Start {days}-day free trial', sub: 'Then {price}/mo · Cancel anytime', renew: 'Cancel before the trial ends and you won’t be charged. Then {price}/month, renews unless canceled.' },
  de: { badge: '{days} TAGE GRATIS', note: '{days} Tage gratis, dann {price}/Monat', cta: '{days} Tage gratis testen', sub: 'Dann {price}/Monat · Jederzeit kündbar', renew: 'Kündige vor Ende des Tests und es fallen keine Kosten an. Danach {price}/Monat, verlängert sich bis zur Kündigung.' },
  fr: { badge: '{days} JOURS OFFERTS', note: '{days} jours offerts, puis {price}/mois', cta: 'Essai gratuit de {days} jours', sub: 'Puis {price}/mois · Annulable à tout moment', renew: 'Annule avant la fin de l’essai et rien ne te sera facturé. Ensuite {price}/mois, renouvelé sauf résiliation.' },
  es: { badge: '{days} DÍAS GRATIS', note: '{days} días gratis, luego {price}/mes', cta: 'Empieza {days} días gratis', sub: 'Luego {price}/mes · Cancela cuando quieras', renew: 'Cancela antes de que acabe la prueba y no se te cobrará. Luego {price}/mes, se renueva salvo que lo canceles.' },
};
const fillTrial = (text: string, days: number, price: string) => text.replace('{days}', String(days)).replace('{price}', price);

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

/** The GainMode Access medal drifts a few pixels up and down so the page feels alive; still under reduced motion. */
function FloatingMedal({ size }: { size: number }) {
  const reduced = useReducedMotion();
  const drift = useSharedValue(0);
  React.useEffect(() => {
    if (reduced) return;
    drift.set(withRepeat(withSequence(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })), -1));
  }, [drift, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * drift.get() }, { rotate: `${-4 + drift.get() * 4}deg` }] }));
  return <Animated.View style={style}>
    <Image source={require('@/assets/images/medals/access.png')} resizeMode="contain" style={{ width: size, height: size }} />
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
 * Plan bar. Its colour always flows slowly; at rest it only tints the price side of the bar, and when chosen it
 * floods the whole bar (420ms) and the text turns white.
 */
function PlanCard({ selected, onPress, title, price, unit, note, badge, badgeTones, saveBadge, strike, tones, testID }: {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: string;
  unit: string;
  note: string;
  badge?: string;
  /** Gradient for the badge instead of the default ink pill, e.g. green for a free trial. */
  badgeTones?: [string, string];
  saveBadge?: string | null;
  strike?: string | null;
  tones: [string, string];
  testID: string;
}) {
  const colors = useColors();
  const dark = colors.colorScheme === 'dark';
  const [width, setWidth] = React.useState(0);
  const fill = useSharedValue(selected ? 1 : 0);
  React.useEffect(() => {
    fill.set(withTiming(selected ? 1 : 0, { duration: selected ? 420 : 280, easing: EASE_OUT }));
  }, [fill, selected]);
  const maskStyle = useAnimatedStyle(() => ({ opacity: 1 - fill.get() }));
  const colorStyle = useAnimatedStyle(() => ({ opacity: 0.55 + fill.get() * 0.45 }));
  const ink = selected ? '#FFFFFF' : colors.foreground;
  const muted = selected ? 'rgba(255,255,255,0.8)' : colors.mutedForeground;
  return <Pressable testID={testID} accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} scaleTo={0.98} style={styles.planWrap}>
    <View onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))} style={[styles.plan, { backgroundColor: colors.card, borderColor: selected ? (dark ? 'rgba(255,255,255,0.85)' : tones[0]) : colors.border }]}>
      <View pointerEvents="none" style={styles.planColor}>
        <Animated.View style={[StyleSheet.absoluteFill, colorStyle]}><WaterFill colors={tones} width={width} /></Animated.View>
        {/* At rest the card colour covers the left so the text stays readable and the colour pools at the price. */}
        <Animated.View style={[StyleSheet.absoluteFill, maskStyle]}>
          <LinearGradient colors={[colors.card, colors.card, `${colors.card}00`]} locations={[0, 0.34, 0.86]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
      <View style={[styles.radio, { borderColor: selected ? '#FFFFFF' : colors.border }]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.planCopy}>
        <View style={styles.planTitleRow}>
          <Text style={[styles.planTitle, { color: ink }]}>{title}</Text>
          {saveBadge ? <View style={[styles.saveBadge, { backgroundColor: selected ? 'rgba(255,255,255,0.22)' : `${colors.success}22` }]}><Text style={[styles.saveBadgeText, { color: selected ? '#FFFFFF' : colors.success }]}>{saveBadge}</Text></View> : null}
        </View>
        <Text numberOfLines={1} style={[styles.planNote, { color: muted }]}>{note}</Text>
      </View>
      <View style={styles.planPriceColumn}>
        {strike ? <Text style={[styles.planStrike, { color: selected ? 'rgba(255,255,255,0.7)' : dark ? 'rgba(255,255,255,0.7)' : colors.mutedForeground }]}>{strike}</Text> : null}
        <Text numberOfLines={1} style={[styles.planPrice, { color: selected || dark ? '#FFFFFF' : colors.foreground }]}>{price}</Text>
        <Text style={[styles.planUnit, { color: selected || dark ? 'rgba(255,255,255,0.8)' : colors.mutedForeground }]}>{unit}</Text>
      </View>
    </View>
    {badge && badgeTones ? <LinearGradient colors={badgeTones} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.planBadge, styles.trialBadge]}>
      <Ionicons name="gift-outline" size={12} color="#FFFFFF" />
      <Text style={[styles.planBadgeText, { color: '#FFFFFF' }]}>{badge}</Text>
    </LinearGradient> : badge ? <View style={[styles.planBadge, { backgroundColor: colors.foreground }]}><Text style={[styles.planBadgeText, { color: colors.background }]}>{badge}</Text></View> : null}
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
  // Only promise a free trial the store actually offers on the monthly product.
  const trialDays = monthlyPackage ? freeTrialDays(monthlyPackage.product) : usePreviewPrices ? PREVIEW_TRIAL_DAYS : null;
  const trialCopy = TRIAL_COPY[language] ?? TRIAL_COPY.en;
  const monthlyTrial = plan === 'monthly' && trialDays !== null && monthly ? trialDays : null;
  // With a free trial on offer, the monthly plan is selected first, until the person picks a plan.
  const pickedPlan = React.useRef(false);
  React.useEffect(() => {
    if (trialDays !== null && !pickedPlan.current) setPlan('monthly');
  }, [trialDays]);
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

  const renewNote = monthlyTrial !== null && monthly
    ? fillTrial(trialCopy.renew, monthlyTrial, monthly.priceString)
    : selectedProduct
      ? t(plan === 'annual' ? 'paywallRenewsYearly' : 'paywallRenewsMonthly').replace('{price}', selectedProduct.priceString)
      : t('premiumTrust');
  const ctaLabel = monthlyTrial !== null ? fillTrial(trialCopy.cta, monthlyTrial, monthly?.priceString ?? '') : t('paywallCta');
  const ctaSub = monthlyTrial !== null && monthly
    ? fillTrial(trialCopy.sub, monthlyTrial, monthly.priceString)
    : selectedProduct ? `${plan === 'annual' ? t('premiumAnnualPlan') : t('premiumMonthlyPlan')} · ${selectedProduct.priceString}` : t('premiumTrust');

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <SkyBackdrop />
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 230 + insets.bottom }} showsVerticalScrollIndicator={false} bounces={false}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <GainModeWordmark color={colors.foreground} width={128} height={17} />
          <LinearGradient colors={['#F5C542', '#E39A1F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.proPill}><Text style={styles.proText}>ACCESS</Text></LinearGradient>
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
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('paywallChoosePlan')}</Text>
          <View style={styles.plans}>
            {annual ? <PlanCard
              testID="paywall-annual-plan"
              selected={plan === 'annual'}
              onPress={() => { pickedPlan.current = true; if (plan !== 'annual') { Haptics.selectionAsync().catch(() => undefined); setPlan('annual'); } }}
              title={t('premiumAnnualPlan')}
              price={annual.priceString}
              unit={t('premiumPerYear')}
              note={annualPerMonth ? t('paywallMonthlyEquivalent').replace('{price}', annualPerMonth) : t('paywallYearlyNote')}
              badge={t('paywallBestValue')}
              saveBadge={savings !== null ? t('paywallSave').replace('{percent}', String(savings)) : null}
              strike={yearOfMonthly}
              tones={ANNUAL_TONES}
            /> : null}
            {monthly ? <PlanCard
              testID="paywall-monthly-plan"
              selected={plan === 'monthly'}
              onPress={() => { pickedPlan.current = true; if (plan !== 'monthly') { Haptics.selectionAsync().catch(() => undefined); setPlan('monthly'); } }}
              title={t('premiumMonthlyPlan')}
              price={monthly.priceString}
              unit={t('premiumPerMonth')}
              note={trialDays !== null ? fillTrial(trialCopy.note, trialDays, monthly.priceString) : t('paywallMonthlyNote')}
              badge={trialDays !== null ? fillTrial(trialCopy.badge, trialDays, monthly.priceString) : undefined}
              badgeTones={trialDays !== null ? TRIAL_BADGE_TONES : undefined}
              tones={MONTHLY_TONES}
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
      <ChargeButton
        testID="paywall-subscribe"
        label={busy ? t('premiumLoading') : isSubscribed ? t('premiumAccessActiveContinue') : ctaLabel}
        sub={ctaSub}
        tones={plan === 'annual' ? ANNUAL_TONES : MONTHLY_TONES}
        busy={busy}
        disabled={busy || checking}
        onPress={() => { void handlePurchase(); }}
      />
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
  plans: { gap: 14, marginTop: 4 },
  planWrap: {},
  plan: { borderRadius: 24, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden', minHeight: 84 },
  planColor: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF' },
  planCopy: { flex: 1, minWidth: 0 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  planTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 17, letterSpacing: -0.4 },
  planNote: { fontFamily: 'Inter_500Medium', fontSize: 12.5, marginTop: 4 },
  planPriceColumn: { alignItems: 'flex-end' },
  planStrike: { fontFamily: 'Inter_500Medium', fontSize: 12, textDecorationLine: 'line-through', fontVariant: ['tabular-nums'] },
  planPrice: { fontFamily: 'Inter_800ExtraBold', fontSize: 21, letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  planUnit: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 1 },
  planBadge: { position: 'absolute', top: -10, left: 18, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  planBadgeText: { fontFamily: 'Inter_800ExtraBold', fontSize: 9.5, letterSpacing: 0.9 },
  trialBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, overflow: 'hidden' },
  saveBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  saveBadgeText: { fontFamily: 'Inter_800ExtraBold', fontSize: 10, letterSpacing: 0.4 },
  plansLoading: { flex: 1, borderRadius: 26, borderWidth: 1, padding: 20, alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 20, letterSpacing: -0.7, marginTop: 26, marginBottom: 14, paddingHorizontal: 2 },
  features: { borderRadius: 26, borderWidth: 1, paddingHorizontal: 16 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 },
  featureIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontFamily: 'Inter_700Bold', fontSize: 14.5, letterSpacing: -0.2 },
  featureBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16.5, marginTop: 2 },
  disclosure: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 14, textAlign: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  error: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17, textAlign: 'center', marginBottom: 10 },
  renew: { fontFamily: 'Inter_500Medium', fontSize: 12, textAlign: 'center', marginTop: 10, fontVariant: ['tabular-nums'] },
  links: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 14, rowGap: 8, marginTop: 10, paddingHorizontal: 8 },
  link: { flexShrink: 1, textAlign: 'center', fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 16 },
});
