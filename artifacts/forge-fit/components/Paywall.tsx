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
  withSpring,
  FadeInDown,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { getPremiumPreviewProduct, translate, type Language, type TranslationKey } from '@/lib/i18n';
import { freeTrialDays } from '@/lib/premiumTrial';
import { TRIAL_OFFER_WINDOW_MS, countdownParts, startTrialOfferWindow, trialOfferRemaining } from '@/lib/trialOffer';
import { scheduleTrialReminder } from '@/lib/notifications';
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
/** The free trial shown on the monthly plan in the web preview, where there is no store. */
const PREVIEW_TRIAL_DAYS = 3;

/** Free-trial copy for the monthly plan. {days} and {price} are filled in. */
type TrialCopy = { titlePre: string; titleFree: string; titlePost: string; steps: [string, string][]; endsIn: string; noPayment: string; units: [string, string, string]; ticketTop: string; ticketBottom: string; free: string; note: string; cta: string; sub: string; renew: string; today: string; day: string; charge: string; headline: string };
const TRIAL_COPY: Record<Language, TrialCopy> = {
  tr: { titlePre: '', titleFree: 'ÜCRETSİZ', titlePost: ' denemen nasıl işler?', steps: [['Bugün', 'GainMode’un tüm özellikleri hemen açılır.'], ['{n} gün sonra', 'Deneme bitmeden bir gün önce sana hatırlatacağız.'], ['{days} gün sonra', 'Aboneliğin {price}/ay ile başlar. Öncesinde istediğin zaman iptal et.']], endsIn: 'Ücretsiz deneme teklifinin bitmesine', noPayment: 'Şimdi ödeme yok', units: ['sa', 'dk', 'sn'], ticketTop: '{days} GÜN', ticketBottom: 'ÜCRETSİZ', free: 'Ücretsiz', today: 'Bugün', day: '{n}. gün', charge: '{price}/ay', headline: 'Bugün tüm özellikler açılır. {days} gün boyunca ücret yok.', note: '{days} gün ücretsiz, sonra {price}/ay', cta: '{days} gün ücretsiz başla', sub: 'Sonra {price}/ay · İstediğin zaman iptal et', renew: 'Deneme bitmeden iptal edersen ücret alınmaz. Sonra {price}/ay, iptal edilmedikçe yenilenir.' },
  en: { titlePre: 'How your ', titleFree: 'FREE', titlePost: ' trial works', steps: [['Today', 'Unlock every GainMode feature right away.'], ['In {n} days', 'We’ll remind you a day before your trial ends.'], ['In {days} days', 'Your subscription starts at {price}/mo. Cancel anytime before then.']], endsIn: 'Free trial offer ends in', noPayment: 'No payment now', units: ['hrs', 'min', 'sec'], ticketTop: '{days} DAYS', ticketBottom: 'FREE', free: 'Free', today: 'Today', day: 'Day {n}', charge: '{price}/mo', headline: 'Everything unlocks today. No charge for {days} days.', note: '{days} days free, then {price}/mo', cta: 'Start {days}-day free trial', sub: 'Then {price}/mo · Cancel anytime', renew: 'Cancel before the trial ends and you won’t be charged. Then {price}/month, renews unless canceled.' },
  de: { titlePre: 'So funktioniert dein ', titleFree: 'GRATIS', titlePost: '-Test', steps: [['Heute', 'Alle GainMode-Funktionen sofort freigeschaltet.'], ['In {n} Tagen', 'Wir erinnern dich einen Tag vor Ende des Tests.'], ['In {days} Tagen', 'Dein Abo startet für {price}/Monat. Vorher jederzeit kündbar.']], endsIn: 'Das Gratis-Angebot endet in', noPayment: 'Jetzt keine Zahlung', units: ['Std', 'Min', 'Sek'], ticketTop: '{days} TAGE', ticketBottom: 'GRATIS', free: 'Gratis', today: 'Heute', day: 'Tag {n}', charge: '{price}/Monat', headline: 'Heute wird alles freigeschaltet. {days} Tage ohne Kosten.', note: '{days} Tage gratis, dann {price}/Monat', cta: '{days} Tage gratis testen', sub: 'Dann {price}/Monat · Jederzeit kündbar', renew: 'Kündige vor Ende des Tests und es fallen keine Kosten an. Danach {price}/Monat, verlängert sich bis zur Kündigung.' },
  fr: { titlePre: 'Comment fonctionne ton essai ', titleFree: 'GRATUIT', titlePost: '', steps: [['Aujourd’hui', 'Toutes les fonctions GainMode se débloquent tout de suite.'], ['Dans {n} jours', 'On te prévient un jour avant la fin de l’essai.'], ['Dans {days} jours', 'Ton abonnement démarre à {price}/mois. Annulable avant à tout moment.']], endsIn: 'L’offre d’essai gratuit se termine dans', noPayment: 'Aucun paiement maintenant', units: ['h', 'min', 's'], ticketTop: '{days} JOURS', ticketBottom: 'OFFERTS', free: 'Offert', today: 'Aujourd’hui', day: 'Jour {n}', charge: '{price}/mois', headline: 'Tout se débloque aujourd’hui. Rien à payer pendant {days} jours.', note: '{days} jours offerts, puis {price}/mois', cta: 'Essai gratuit de {days} jours', sub: 'Puis {price}/mois · Annulable à tout moment', renew: 'Annule avant la fin de l’essai et rien ne te sera facturé. Ensuite {price}/mois, renouvelé sauf résiliation.' },
  es: { titlePre: 'Cómo funciona tu prueba ', titleFree: 'GRATIS', titlePost: '', steps: [['Hoy', 'Desbloquea todas las funciones de GainMode al instante.'], ['En {n} días', 'Te avisaremos un día antes de que termine la prueba.'], ['En {days} días', 'Tu suscripción empieza a {price}/mes. Cancela antes cuando quieras.']], endsIn: 'La oferta de prueba gratis termina en', noPayment: 'Sin pago ahora', units: ['h', 'min', 's'], ticketTop: '{days} DÍAS', ticketBottom: 'GRATIS', free: 'Gratis', today: 'Hoy', day: 'Día {n}', charge: '{price}/mes', headline: 'Hoy se desbloquea todo. Sin cargo durante {days} días.', note: '{days} días gratis, luego {price}/mes', cta: 'Empieza {days} días gratis', sub: 'Luego {price}/mes · Cancela cuando quieras', renew: 'Cancela antes de que acabe la prueba y no se te cobrará. Luego {price}/mes, se renueva salvo que lo canceles.' },
};
const fillTrial = (text: string, days: number, price: string) => text.replace('{days}', String(days)).replace('{price}', price);

const TICKET_W = 96;
const TICKET_H = 50;
const TICKET_TEETH = 6;

/** A ticket outline whose left edge is torn into teeth, like the receipt stub elsewhere in the app. */
function ticketPath(w: number, h: number) {
  const tooth = h / TICKET_TEETH;
  let d = `M ${w - 8} 0 Q ${w} 0 ${w} 8 V ${h - 8} Q ${w} ${h} ${w - 8} ${h} H 6`;
  for (let i = TICKET_TEETH; i > 0; i--) d += ` L 0 ${(i - 0.5) * tooth} L 6 ${(i - 1) * tooth}`;
  return `${d} Z`;
}

/**
 * The free trial as a little paper ticket pinned to the corner of the monthly plan. It drops in
 * with a tilt and settles, then gives a small swing every few seconds so the eye finds it.
 */
function TrialTicket({ top, bottom }: { top: string; bottom: string }) {
  const reduced = useReducedMotion();
  const drop = useSharedValue(reduced ? 1 : 0);
  const swing = useSharedValue(0);
  React.useEffect(() => {
    if (reduced) return;
    drop.set(withDelay(520, withSpring(1, { damping: 9, stiffness: 160 })));
    swing.set(withDelay(2200, withRepeat(withSequence(
      withTiming(1, { duration: 140 }), withTiming(-1, { duration: 180 }), withTiming(0.5, { duration: 160 }), withTiming(0, { duration: 160 }),
      withDelay(3600, withTiming(0, { duration: 0 })),
    ), -1)));
  }, [drop, reduced, swing]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, drop.get() * 1.4),
    transform: [{ translateY: (1 - drop.get()) * -22 }, { rotate: `${-7 + (1 - drop.get()) * -14 + swing.get() * 5}deg` }, { scale: 0.85 + drop.get() * 0.15 }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.ticket, style]}>
    <Svg width={TICKET_W} height={TICKET_H} style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgGradient id="ticketFill" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#34D399" />
          <Stop offset="1" stopColor="#059669" />
        </SvgGradient>
      </Defs>
      <Path d={ticketPath(TICKET_W, TICKET_H)} fill="url(#ticketFill)" />
      <Path d={`M 20 7 V ${TICKET_H - 7}`} stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} strokeDasharray="3 3" />
    </Svg>
    <View style={styles.ticketIcon}><Ionicons name="gift-outline" size={13} color="#FFFFFF" /></View>
    <View style={styles.ticketCopy}>
      <Text style={styles.ticketTop}>{top}</Text>
      <Text style={styles.ticketBottom}>{bottom}</Text>
    </View>
  </Animated.View>;
}

const STEP_ICONS: IconName[] = ['flash-outline', 'notifications-outline', 'star'];

/**
 * The trial as three stops down a green rail: today everything unlocks, a reminder comes a day
 * before the end, and the subscription starts on the last day. The rail fills in on arrival.
 */
function TrialSteps({ days, copy, price }: { days: number; copy: TrialCopy; price: string }) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const fill = useSharedValue(reduced ? 1 : 0);
  React.useEffect(() => {
    if (!reduced) fill.set(withDelay(250, withTiming(1, { duration: 1200, easing: EASE_OUT })));
  }, [fill, reduced]);
  const railStyle = useAnimatedStyle(() => ({ height: `${fill.get() * 100}%` }));
  const fillIn = (text: string) => text.replace('{n}', String(Math.max(1, days - 1))).replace('{days}', String(days)).replace('{price}', price);
  return <View style={styles.steps}>
    <View style={[styles.stepsRail, { backgroundColor: colors.border }]}>
      <Animated.View style={[styles.stepsRailFill, railStyle]}>
        <LinearGradient colors={['#34D399', '#059669']} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
    {copy.steps.map(([title, body], index) => <View key={title} style={styles.step}>
      <LinearGradient colors={index === 2 ? ['#F5C542', '#E39A1F'] : ['#34D399', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.stepIcon}>
        <Ionicons name={STEP_ICONS[index]} size={17} color="#FFFFFF" />
      </LinearGradient>
      <View style={styles.stepCopy}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>{fillIn(title)}</Text>
        <Text style={[styles.stepBody, { color: colors.mutedForeground }]}>{fillIn(body)}</Text>
      </View>
    </View>)}
  </View>;
}

/** One two-digit group of the countdown; the digits drop in as they change. */
function CountdownUnit({ value, label }: { value: number; label: string }) {
  const colors = useColors();
  const text = String(value).padStart(2, '0');
  return <View style={styles.countUnit}>
    <View style={[styles.countTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Animated.Text key={text} entering={FadeInDown.duration(220)} style={[styles.countDigits, { color: colors.foreground }]}>{text}</Animated.Text>
    </View>
    <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>{label}</Text>
  </View>;
}

/** The time left on the free-trial offer, and the reassurance that nothing is paid today. */
function OfferCountdown({ remaining, copy }: { remaining: number; copy: TrialCopy }) {
  const colors = useColors();
  const { hours, minutes, seconds } = countdownParts(remaining);
  return <View style={styles.countdown}>
    <Text style={[styles.countTitle, { color: colors.foreground }]}>{copy.endsIn}</Text>
    <View style={styles.countRow}>
      <CountdownUnit value={hours} label={copy.units[0]} />
      <Text style={[styles.countColon, { color: colors.mutedForeground }]}>:</Text>
      <CountdownUnit value={minutes} label={copy.units[1]} />
      <Text style={[styles.countColon, { color: colors.mutedForeground }]}>:</Text>
      <CountdownUnit value={seconds} label={copy.units[2]} />
    </View>
    <View style={styles.noPayment}>
      <Ionicons name="shield-checkmark-outline" size={15} color="#10B981" />
      <Text style={styles.noPaymentText}>{copy.noPayment}</Text>
    </View>
  </View>;
}

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
function PlanCard({ selected, onPress, title, price, unit, note, badge, ticket, saveBadge, strike, tones, testID, compact = false }: {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: string;
  unit: string;
  note: string;
  badge?: string;
  /** A free-trial ticket pinned to the card's corner. */
  ticket?: { top: string; bottom: string };
  saveBadge?: string | null;
  strike?: string | null;
  tones: [string, string];
  testID: string;
  /** A slim bar for the bottom of the trial offer: badges sit inline and the ticket becomes a pill. */
  compact?: boolean;
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
    <View onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))} style={[styles.plan, compact && styles.planCompact, { backgroundColor: colors.card, borderColor: selected ? (dark ? 'rgba(255,255,255,0.85)' : tones[0]) : colors.border }]}>
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
          {compact && ticket ? <LinearGradient colors={['#34D399', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.saveBadge}><Text style={[styles.saveBadgeText, { color: '#FFFFFF' }]}>{`${ticket.top} ${ticket.bottom}`}</Text></LinearGradient> : null}
          {saveBadge ? <View style={[styles.saveBadge, { backgroundColor: selected ? 'rgba(255,255,255,0.22)' : `${colors.success}22` }]}><Text style={[styles.saveBadgeText, { color: selected ? '#FFFFFF' : colors.success }]}>{saveBadge}</Text></View> : null}
        </View>
        <Text numberOfLines={1} style={[styles.planNote, { color: muted }]}>{note}</Text>
      </View>
      <View style={styles.planPriceColumn}>
        {strike && !compact ? <Text style={[styles.planStrike, { color: selected ? 'rgba(255,255,255,0.7)' : dark ? 'rgba(255,255,255,0.7)' : colors.mutedForeground }]}>{strike}</Text> : null}
        <Text numberOfLines={1} style={[styles.planPrice, compact && styles.planPriceCompact, { color: selected || dark ? '#FFFFFF' : colors.foreground }]}>{price}</Text>
        <Text style={[styles.planUnit, { color: selected || dark ? 'rgba(255,255,255,0.8)' : colors.mutedForeground }]}>{unit}</Text>
      </View>
    </View>
    {ticket && !compact ? <TrialTicket top={ticket.top} bottom={ticket.bottom} /> : null}
    {badge ? <View style={[styles.planBadge, compact && styles.planBadgeCompact, { backgroundColor: colors.foreground }]}><Text style={[styles.planBadgeText, { color: colors.background }]}>{badge}</Text></View> : null}
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
  const storeTrialDays = monthlyPackage ? freeTrialDays(monthlyPackage.product) : usePreviewPrices ? PREVIEW_TRIAL_DAYS : null;
  // The trial is offered for 15 minutes from the first time this paywall is shown, then it really ends.
  const [offerStartedAt, setOfferStartedAt] = React.useState<number | null>(null);
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (storeTrialDays === null) return;
    let cancelled = false;
    void startTrialOfferWindow().then((startedAt) => { if (!cancelled) setOfferStartedAt(startedAt); });
    return () => { cancelled = true; };
  }, [storeTrialDays]);
  const offerRemaining = offerStartedAt === null ? TRIAL_OFFER_WINDOW_MS : trialOfferRemaining(offerStartedAt, now);
  const offerActive = storeTrialDays !== null && offerRemaining > 0;
  React.useEffect(() => {
    if (!offerActive) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [offerActive]);
  const trialDays = offerActive ? storeTrialDays : null;
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
      const startsTrial = plan === 'monthly' && trialDays !== null;
      // Once the offer has run out, Google Play is asked for the plan without its free trial.
      const customerInfo = await purchase(selectedPackage, { withoutTrial: storeTrialDays !== null && !offerActive });
      if (!hasActivePremiumEntitlement(customerInfo)) {
        setError(t('premiumPurchaseError'));
        return;
      }
      if (startsTrial) void scheduleTrialReminder(language).catch(() => undefined);
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

  const [footerHeight, setFooterHeight] = React.useState(230 + insets.bottom);
  const offerMode = trialDays !== null && !!monthly;
  const planCards = (
          <View style={[styles.plans, offerMode && styles.plansCompact]}>
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
              compact={offerMode}
            /> : null}
            {monthly ? <PlanCard
              testID="paywall-monthly-plan"
              selected={plan === 'monthly'}
              onPress={() => { pickedPlan.current = true; if (plan !== 'monthly') { Haptics.selectionAsync().catch(() => undefined); setPlan('monthly'); } }}
              title={t('premiumMonthlyPlan')}
              price={monthly.priceString}
              unit={t('premiumPerMonth')}
              note={trialDays !== null ? fillTrial(trialCopy.note, trialDays, monthly.priceString) : t('paywallMonthlyNote')}
              ticket={trialDays !== null ? { top: fillTrial(trialCopy.ticketTop, trialDays, monthly.priceString), bottom: trialCopy.ticketBottom } : undefined}
              tones={MONTHLY_TONES}
              compact={offerMode}
            /> : null}
            {!annual && !monthly ? <View style={[styles.plansLoading, { borderColor: colors.border }]}><ActivityIndicator color={colors.mutedForeground} /><Text style={[styles.planNote, { color: colors.mutedForeground }]}>{t('premiumLoading')}</Text></View> : null}
          </View>
  );

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <SkyBackdrop />
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: footerHeight + 24 }} showsVerticalScrollIndicator={false} bounces={false}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <GainModeWordmark color={colors.foreground} width={128} height={17} />
          <LinearGradient colors={['#F5C542', '#E39A1F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.proPill}><Text style={styles.proText}>ACCESS</Text></LinearGradient>
        </View>
        {onClose ? <Pressable accessibilityLabel={t('close')} onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="close" size={18} color={colors.foreground} />
        </Pressable> : null}
      </View>

      {offerMode ? null : <Animated.View style={[styles.hero, heroEntrance]}>
        <FloatingMedal size={compact ? 116 : 150} />
      </Animated.View>}

      <View style={styles.content}>
        {trialDays !== null && monthly ? <Animated.View style={titleEntrance}>
          <Text style={[styles.title, styles.trialTitle, { color: colors.foreground }]}>
            {trialCopy.titlePre}<Text style={styles.trialFree}>{` ${trialCopy.titleFree} `}</Text>{trialCopy.titlePost}
          </Text>
          <TrialSteps days={trialDays} copy={trialCopy} price={monthly.priceString} />
          <OfferCountdown remaining={offerRemaining} copy={trialCopy} />
        </Animated.View> : <Animated.View style={[styles.heading, titleEntrance]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('paywallTitle')}</Text>
          {compact ? null : <Text numberOfLines={3} style={[styles.body, { color: colors.mutedForeground }]}>{t('paywallBody')}</Text>}
        </Animated.View>}

        {offerMode ? null : <Animated.View style={plansEntrance}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('paywallChoosePlan')}</Text>
          {planCards}

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('paywallFeaturesTitle')}</Text>
          <View style={[styles.features, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FeatureRow icon="coach-outline" title={t('paywallFeature1Title')} body={t('paywallFeature1Body')} delay={420} last={false} />
            <FeatureRow icon="camera-outline" title={t('paywallFeature2Title')} body={t('paywallFeature2Body')} delay={470} last={false} />
            <FeatureRow icon="barbell-outline" title={t('paywallFeature3Title')} body={t('paywallFeature3Body')} delay={520} last={false} />
            <FeatureRow icon="analytics-outline" title={t('paywallFeature4Title')} body={t('paywallFeature4Body')} delay={570} last />
          </View>
          <Text style={[styles.disclosure, { color: colors.mutedForeground }]}>{t('premiumTrialBody')}</Text>
        </Animated.View>}
      </View>
    </ScrollView>

    <View onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)} style={[styles.footer, offerMode && styles.footerOffer, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border }]}>
      <BlurView intensity={40} tint={colors.colorScheme} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass }]} />
      {offerMode ? <View style={styles.footerPlans}>{planCards}</View> : null}
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
  planCompact: { minHeight: 0, paddingVertical: 11, borderRadius: 18 },
  planPriceCompact: { fontSize: 19 },
  planBadgeCompact: { top: -9, left: 14, paddingVertical: 3 },
  plansCompact: { gap: 12, marginTop: 0 },
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
  ticket: { position: 'absolute', top: -20, right: 96, width: TICKET_W, height: TICKET_H, shadowColor: '#065F46', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  ticketIcon: { position: 'absolute', left: 4, top: (TICKET_H - 13) / 2 },
  ticketCopy: { position: 'absolute', left: 24, right: 6, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  ticketTop: { fontFamily: 'Inter_800ExtraBold', fontSize: 16, letterSpacing: -0.2, color: '#FFFFFF' },
  ticketBottom: { fontFamily: 'Inter_800ExtraBold', fontSize: 9, letterSpacing: 1.6, color: 'rgba(255,255,255,0.9)', marginTop: 1 },
  trialTitle: { textAlign: 'center', marginTop: 22, marginBottom: 20 },
  trialFree: { color: '#FFFFFF', backgroundColor: '#10B981', overflow: 'hidden', borderRadius: 10 },
  steps: { position: 'relative', gap: 16, marginBottom: 22, paddingLeft: 2 },
  stepsRail: { position: 'absolute', left: 19, top: 20, bottom: 20, width: 4, borderRadius: 2, overflow: 'hidden' },
  stepsRailFill: { width: 4, borderRadius: 2, overflow: 'hidden' },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  stepIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepCopy: { flex: 1, paddingTop: 1 },
  stepTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 16, letterSpacing: -0.2 },
  stepBody: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18, marginTop: 2 },
  countdown: { alignItems: 'center', marginBottom: 22 },
  countTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, marginBottom: 10 },
  countRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  countUnit: { alignItems: 'center', gap: 5 },
  countTile: { minWidth: 62, borderRadius: 16, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center', overflow: 'hidden' },
  countDigits: { fontFamily: 'Inter_800ExtraBold', fontSize: 30, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  countLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  countColon: { fontFamily: 'Inter_800ExtraBold', fontSize: 26, marginTop: 9 },
  noPayment: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  noPaymentText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#10B981' },
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
  footerOffer: { paddingTop: 22 },
  footerPlans: { marginBottom: 12 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  error: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17, textAlign: 'center', marginBottom: 10 },
  renew: { fontFamily: 'Inter_500Medium', fontSize: 12, textAlign: 'center', marginTop: 10, fontVariant: ['tabular-nums'] },
  links: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 14, rowGap: 8, marginTop: 10, paddingHorizontal: 8 },
  link: { flexShrink: 1, textAlign: 'center', fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 16 },
});
