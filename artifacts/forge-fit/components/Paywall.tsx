import React from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { getPremiumPreviewProduct, translate, type Language, type TranslationKey } from '@/lib/i18n';
import { freeTrialDays } from '@/lib/premiumTrial';
import { scheduleTrialReminder } from '@/lib/notifications';
import { useSubscription } from '@/lib/revenuecat';
import { hasActivePremiumEntitlement } from '@/lib/premiumAccess';
import { calculateAnnualSavingsPercent, formatAnnualMonthlyPrice } from '@/lib/subscriptionPricing';
import { legalDocumentUrl } from '@/lib/legalDocuments';
import { Ionicons } from '@/components/AppIcon';
import { EASE_OUT, PressableScale as Pressable } from '@/components/Motion';
import { GainModeWordmark } from '@/components/FitUI';
import { SkyBackdrop } from '@/components/SkyBackdrop';
import { WaterFill } from '@/components/ChargeButton';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Plan = 'monthly' | 'annual';
type DisplayProduct = { price: number; currencyCode: string; priceString: string };
const ANNUAL_TONES: [string, string] = ['#E8364F', '#FF8A3D'];
const MONTHLY_TONES: [string, string] = ['#2563EB', '#38BDF8'];
/** The free trial shown on the monthly plan in the web preview, where there is no store. */
const PREVIEW_TRIAL_DAYS = 3;

const RETRY_COPY: Record<string, string> = { tr: 'Tekrar dene', en: 'Try again', de: 'Erneut versuchen', fr: 'Réessayer', es: 'Reintentar' };

/** Free-trial copy for the monthly plan. {days} and {price} are filled in. */
type TrialCopy = { titlePre: string; titleFree: string; titlePost: string; steps: [string, string][]; endsIn: string; noPayment: string; units: [string, string, string]; ticketTop: string; ticketBottom: string; free: string; note: string; cta: string; sub: string; renew: string; today: string; day: string; charge: string; headline: string };
const TRIAL_COPY: Record<Language, TrialCopy> = {
  tr: { titlePre: '', titleFree: 'ÜCRETSİZ', titlePost: ' denemen nasıl işler?', steps: [['Bugün', 'GainMode’un tüm özellikleri hemen açılır.'], ['{n} gün sonra', 'Deneme bitmeden bir gün önce sana hatırlatacağız.'], ['{days} gün sonra', 'Aboneliğin {price}/ay ile başlar. Öncesinde istediğin zaman iptal et.']], endsIn: 'Ücretsiz deneme teklifinin bitmesine', noPayment: 'Şimdi ödeme yok', units: ['sa', 'dk', 'sn'], ticketTop: '{days} GÜN', ticketBottom: 'ÜCRETSİZ', free: 'Ücretsiz', today: 'Bugün', day: '{n}. gün', charge: '{price}/ay', headline: 'Bugün tüm özellikler açılır. {days} gün boyunca ücret yok.', note: '{days} gün ücretsiz, sonra {price}/ay', cta: '{days} gün ücretsiz başla', sub: 'Sonra {price}/ay · İstediğin zaman iptal et', renew: 'Deneme bitmeden iptal edersen ücret alınmaz. Sonra {price}/ay, iptal edilmedikçe yenilenir.' },
  en: { titlePre: 'How your ', titleFree: 'FREE', titlePost: ' trial works', steps: [['Today', 'Unlock every GainMode feature right away.'], ['In {n} days', 'We’ll remind you a day before your trial ends.'], ['In {days} days', 'Your subscription starts at {price}/mo. Cancel anytime before then.']], endsIn: 'Free trial offer ends in', noPayment: 'No payment now', units: ['hrs', 'min', 'sec'], ticketTop: '{days} DAYS', ticketBottom: 'FREE', free: 'Free', today: 'Today', day: 'Day {n}', charge: '{price}/mo', headline: 'Everything unlocks today. No charge for {days} days.', note: '{days} days free, then {price}/mo', cta: 'Start {days}-day free trial', sub: 'Then {price}/mo · Cancel anytime', renew: 'Cancel before the trial ends and you won’t be charged. Then {price}/month, renews unless canceled.' },
  de: { titlePre: 'So funktioniert dein ', titleFree: 'GRATIS', titlePost: '-Test', steps: [['Heute', 'Alle GainMode-Funktionen sofort freigeschaltet.'], ['In {n} Tagen', 'Wir erinnern dich einen Tag vor Ende des Tests.'], ['In {days} Tagen', 'Dein Abo startet für {price}/Monat. Vorher jederzeit kündbar.']], endsIn: 'Das Gratis-Angebot endet in', noPayment: 'Jetzt keine Zahlung', units: ['Std', 'Min', 'Sek'], ticketTop: '{days} TAGE', ticketBottom: 'GRATIS', free: 'Gratis', today: 'Heute', day: 'Tag {n}', charge: '{price}/Monat', headline: 'Heute wird alles freigeschaltet. {days} Tage ohne Kosten.', note: '{days} Tage gratis, dann {price}/Monat', cta: '{days} Tage gratis testen', sub: 'Dann {price}/Monat · Jederzeit kündbar', renew: 'Kündige vor Ende des Tests und es fallen keine Kosten an. Danach {price}/Monat, verlängert sich bis zur Kündigung.' },
  fr: { titlePre: 'Comment fonctionne ton essai ', titleFree: 'GRATUIT', titlePost: '', steps: [['Aujourd’hui', 'Toutes les fonctions GainMode se débloquent tout de suite.'], ['Dans {n} jours', 'On te prévient un jour avant la fin de l’essai.'], ['Dans {days} jours', 'Ton abonnement démarre à {price}/mois. Annulable avant à tout moment.']], endsIn: 'L’offre d’essai gratuit se termine dans', noPayment: 'Aucun paiement maintenant', units: ['h', 'min', 's'], ticketTop: '{days} JOURS', ticketBottom: 'OFFERTS', free: 'Offert', today: 'Aujourd’hui', day: 'Jour {n}', charge: '{price}/mois', headline: 'Tout se débloque aujourd’hui. Rien à payer pendant {days} jours.', note: '{days} jours offerts, puis {price}/mois', cta: 'Essai gratuit de {days} jours', sub: 'Puis {price}/mois · Annulable à tout moment', renew: 'Annule avant la fin de l’essai et rien ne te sera facturé. Ensuite {price}/mois, renouvelé sauf résiliation.' },
  es: { titlePre: 'Cómo funciona tu prueba ', titleFree: 'GRATIS', titlePost: '', steps: [['Hoy', 'Desbloquea todas las funciones de GainMode al instante.'], ['En {n} días', 'Te avisaremos un día antes de que termine la prueba.'], ['En {days} días', 'Tu suscripción empieza a {price}/mes. Cancela antes cuando quieras.']], endsIn: 'La oferta de prueba gratis termina en', noPayment: 'Sin pago ahora', units: ['h', 'min', 's'], ticketTop: '{days} DÍAS', ticketBottom: 'GRATIS', free: 'Gratis', today: 'Hoy', day: 'Día {n}', charge: '{price}/mes', headline: 'Hoy se desbloquea todo. Sin cargo durante {days} días.', note: '{days} días gratis, luego {price}/mes', cta: 'Empieza {days} días gratis', sub: 'Luego {price}/mes · Cancela cuando quieras', renew: 'Cancela antes de que acabe la prueba y no se te cobrará. Luego {price}/mes, se renueva salvo que lo canceles.' },
};
/**
 * The plain terms of whatever is selected, shown right above the button: when the trial ends, what it costs
 * afterwards, and where to cancel. Google Play and the App Store require all three to be clear.
 */
type TermsCopy = {
  trial: string; annual: string; monthly: string; planTitle: string;
  steps: { annual: [string, string][]; monthly: [string, string][] };
  store: { android: string; ios: string };
};
const TERMS_COPY: Record<string, TermsCopy> = {
  tr: { trial: '{days} gün ücretsiz, sonra {price}/ay. Deneme {date} tarihinde biter. {store} üzerinden istediğin zaman iptal et.', annual: 'Bugün {price} ücretlendirilir, her yıl yenilenir. {store} üzerinden istediğin zaman iptal et.', monthly: 'Bugün {price} ücretlendirilir, her ay yenilenir. {store} üzerinden istediğin zaman iptal et.', planTitle: 'Planın nasıl işler?',
    steps: { annual: [['Bugün', '{price} ödenir, GainMode’un tüm özellikleri açılır.'], ['Her yıl', 'İptal etmezsen {price}/yıl ile yenilenir.'], ['İstediğin zaman', '{store} üzerinden iptal et.']], monthly: [['Bugün', '{price} ödenir, GainMode’un tüm özellikleri açılır.'], ['Her ay', 'İptal etmezsen {price}/ay ile yenilenir.'], ['İstediğin zaman', '{store} üzerinden iptal et.']] },
    store: { android: 'Google Play › Abonelikler', ios: 'App Store › Abonelikler' } },
  en: { trial: '{days} days free, then {price}/month. Trial ends on {date}. Cancel anytime in {store}.', annual: '{price} charged today, renews every year. Cancel anytime in {store}.', monthly: '{price} charged today, renews every month. Cancel anytime in {store}.', planTitle: 'How your plan works',
    steps: { annual: [['Today', 'You pay {price} and every GainMode feature unlocks.'], ['Every year', 'Renews at {price}/year unless you cancel.'], ['Anytime', 'Cancel in {store}.']], monthly: [['Today', 'You pay {price} and every GainMode feature unlocks.'], ['Every month', 'Renews at {price}/month unless you cancel.'], ['Anytime', 'Cancel in {store}.']] },
    store: { android: 'Google Play › Subscriptions', ios: 'App Store › Subscriptions' } },
  de: { trial: '{days} Tage gratis, dann {price}/Monat. Der Test endet am {date}. Jederzeit kündbar unter {store}.', annual: 'Heute werden {price} berechnet, jährliche Verlängerung. Jederzeit kündbar unter {store}.', monthly: 'Heute werden {price} berechnet, monatliche Verlängerung. Jederzeit kündbar unter {store}.', planTitle: 'So funktioniert dein Plan',
    steps: { annual: [['Heute', 'Du zahlst {price} und alle GainMode-Funktionen werden freigeschaltet.'], ['Jedes Jahr', 'Verlängert sich für {price}/Jahr, wenn du nicht kündigst.'], ['Jederzeit', 'Kündige unter {store}.']], monthly: [['Heute', 'Du zahlst {price} und alle GainMode-Funktionen werden freigeschaltet.'], ['Jeden Monat', 'Verlängert sich für {price}/Monat, wenn du nicht kündigst.'], ['Jederzeit', 'Kündige unter {store}.']] },
    store: { android: 'Google Play › Abos', ios: 'App Store › Abos' } },
  fr: { trial: '{days} jours offerts, puis {price}/mois. L’essai se termine le {date}. Annulable à tout moment dans {store}.', annual: '{price} débités aujourd’hui, renouvelé chaque année. Annulable à tout moment dans {store}.', monthly: '{price} débités aujourd’hui, renouvelé chaque mois. Annulable à tout moment dans {store}.', planTitle: 'Comment fonctionne ton plan',
    steps: { annual: [['Aujourd’hui', 'Tu paies {price} et toutes les fonctions GainMode se débloquent.'], ['Chaque année', 'Renouvelé à {price}/an sauf résiliation.'], ['À tout moment', 'Annule dans {store}.']], monthly: [['Aujourd’hui', 'Tu paies {price} et toutes les fonctions GainMode se débloquent.'], ['Chaque mois', 'Renouvelé à {price}/mois sauf résiliation.'], ['À tout moment', 'Annule dans {store}.']] },
    store: { android: 'Google Play › Abonnements', ios: 'App Store › Abonnements' } },
  es: { trial: '{days} días gratis, luego {price}/mes. La prueba termina el {date}. Cancela cuando quieras en {store}.', annual: 'Hoy se cobran {price}, se renueva cada año. Cancela cuando quieras en {store}.', monthly: 'Hoy se cobran {price}, se renueva cada mes. Cancela cuando quieras en {store}.', planTitle: 'Cómo funciona tu plan',
    steps: { annual: [['Hoy', 'Pagas {price} y se desbloquean todas las funciones de GainMode.'], ['Cada año', 'Se renueva a {price}/año salvo que canceles.'], ['Cuando quieras', 'Cancela en {store}.']], monthly: [['Hoy', 'Pagas {price} y se desbloquean todas las funciones de GainMode.'], ['Cada mes', 'Se renueva a {price}/mes salvo que canceles.'], ['Cuando quieras', 'Cancela en {store}.']] },
    store: { android: 'Google Play › Suscripciones', ios: 'App Store › Suscripciones' } },
};
const PLAN_ICONS: IconName[] = ['flag', 'restore-outline', 'close-circle-outline'];

const fillTrial = (text: string, days: number, price: string) => text.replace('{days}', String(days)).replace('{price}', price);

const STEP_ICONS: IconName[] = ['flag', 'notifications-outline', 'star'];
const STEP_RAIL = 46;
const STEP_DOT = 36;

type RailItem = { icon: IconName; title: string; body: string };

/**
 * Stops down a capsule rail. The rail fills (on arrival) down to the stop at `filledThrough`;
 * stops past it stay grey.
 */
function StepRail({ items, filledThrough }: { items: RailItem[]; filledThrough: number }) {
  const colors = useColors();
  const dark = colors.colorScheme === 'dark';
  const reduced = useReducedMotion();
  const [targetY, setTargetY] = React.useState<number | null>(filledThrough === 0 ? 0 : null);
  const fill = useSharedValue(reduced ? 1 : 0);
  React.useEffect(() => {
    if (!reduced && targetY !== null) fill.set(withDelay(250, withTiming(1, { duration: 1100, easing: EASE_OUT })));
  }, [fill, reduced, targetY]);
  const fillStyle = useAnimatedStyle(() => ({ height: STEP_RAIL + fill.get() * (targetY ?? 0) }));
  return <View style={styles.steps}>
    <View style={[styles.stepsRail, { backgroundColor: dark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' }]}>
      <Animated.View style={[styles.stepsRailFill, fillStyle]}>
        <LinearGradient colors={MONTHLY_TONES} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
    {items.map(({ icon, title, body }, index) => <View key={title} style={styles.step} onLayout={index === filledThrough && index > 0 ? (event) => setTargetY(event.nativeEvent.layout.y) : undefined}>
      <View style={styles.stepDotWrap}>
        <View style={[styles.stepDot, { backgroundColor: index <= filledThrough ? '#1D4ED8' : dark ? 'rgba(255,255,255,0.22)' : '#CBD5E1' }]}>
          <Ionicons name={icon} size={16} color="#FFFFFF" />
        </View>
      </View>
      <View style={styles.stepCopy}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.stepBody, { color: colors.mutedForeground }]}>{body}</Text>
      </View>
    </View>)}
  </View>;
}

/** The trial as three stops: today everything unlocks, a reminder comes before the end, then the subscription starts. */
function TrialSteps({ days, copy, price }: { days: number; copy: TrialCopy; price: string }) {
  const fillIn = (text: string) => text.replace('{n}', String(Math.max(1, days - 1))).replace('{days}', String(days)).replace('{price}', price);
  return <StepRail filledThrough={1} items={copy.steps.map(([title, body], index) => ({ icon: STEP_ICONS[index], title: fillIn(title), body: fillIn(body) }))} />;
}

/** Light rays fanning down from above the screen, behind the trial title, fading into the page. */
function RayHeader({ height }: { height: number }) {
  const { width } = useWindowDimensions();
  const cx = width / 2;
  const cy = -60;
  const r = Math.hypot(width, height) + 80;
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a0 = (i * 22.5) * Math.PI / 180;
    const a1 = a0 + 10 * Math.PI / 180;
    return `M${cx} ${cy} L${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} L${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r}Z`;
  }).join(' ');
  return <View pointerEvents="none" style={[styles.rayHeader, { height }]}>
    {/* Fades to transparent rather than to a colour, so it melts into whatever backdrop is behind it. */}
    <LinearGradient colors={['#1E3A8A', '#1D4ED8', '#2563EBE6', '#3B82F6B3', '#3B82F675', '#60A5FA3D', '#60A5FA14', '#60A5FA00']} locations={[0, 0.22, 0.36, 0.5, 0.63, 0.76, 0.89, 1]} style={StyleSheet.absoluteFill} />
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgGradient id="rayFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.1} />
          <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0.06} />
          <Stop offset="0.65" stopColor="#FFFFFF" stopOpacity={0.02} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Path d={rays} fill="url(#rayFade)" />
    </Svg>
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

/**
 * Plan bar. Its colour always flows slowly; at rest it only tints the price side of the bar, and when chosen it
 * floods the whole bar (420ms) and the text turns white.
 */
function PlanCard({ selected, onPress, title, price, unit, perMonth, note, badge, ticket, saveBadge, strike, tones, testID, compact = false }: {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: string;
  unit: string;
  /** What the plan works out to per month, shown under the price. */
  perMonth?: string | null;
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
        {perMonth ? <Text numberOfLines={1} style={[styles.planPerMonth, { color: selected || dark ? '#FFFFFF' : colors.foreground }]}>{perMonth}</Text> : null}
      </View>
    </View>
    {badge ? <View style={[styles.planBadge, compact && styles.planBadgeCompact, { backgroundColor: colors.foreground }]}><Text style={[styles.planBadgeText, { color: colors.background }]}>{badge}</Text></View> : null}
  </Pressable>;
}

/** The one action: a solid pill in the page's ink colour. */
function SubscribeButton({ label, busy, disabled, onPress }: { label: string; busy: boolean; disabled: boolean; onPress: () => void }) {
  const colors = useColors();
  return <Pressable testID="paywall-subscribe" accessibilityRole="button" disabled={disabled} onPress={onPress} scaleTo={0.98}
    style={[styles.subscribe, { backgroundColor: colors.foreground, opacity: disabled && !busy ? 0.6 : 1 }]}>
    {busy ? <ActivityIndicator color={colors.background} /> : <Text style={[styles.subscribeText, { color: colors.background }]}>{label}</Text>}
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

  const [reloadingPlans, setReloadingPlans] = React.useState(false);
  const reloadPlans = async () => {
    setReloadingPlans(true);
    await refreshPackages().catch(() => undefined);
    setReloadingPlans(false);
  };
  const usePreviewPrices = previewMode || Platform.OS === 'web';
  // Preview prices are illustrative; real purchases always use localized store products.
  const monthly: DisplayProduct | undefined = monthlyPackage?.product ?? (usePreviewPrices ? getPremiumPreviewProduct(language, 6.99) : undefined);
  const annual: DisplayProduct | undefined = annualPackage?.product ?? (usePreviewPrices ? getPremiumPreviewProduct(language, 49.99) : undefined);
  const savings = calculateAnnualSavingsPercent(monthly, annual);
  const annualPerMonth = formatAnnualMonthlyPrice(annual);
  const selectedProduct = plan === 'annual' ? annual : monthly;
  // Only promise a free trial the store actually offers on the monthly product.
  const storeTrialDays = monthlyPackage ? freeTrialDays(monthlyPackage.product) : usePreviewPrices ? PREVIEW_TRIAL_DAYS : null;
  // The trial is only ever presented when the store really offers it on the monthly plan.
  const trialDays: number | null = storeTrialDays;
  const termsCopy = TERMS_COPY[language] ?? TERMS_COPY.en;
  const storeName = Platform.OS === 'ios' ? termsCopy.store.ios : termsCopy.store.android;
  const fillTerms = (text: string, price: string, days = 0) => {
    const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    let date = end.toDateString();
    try { date = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' }).format(end); } catch { /* keep the default */ }
    return text.replace('{days}', String(days)).replace('{price}', price).replace('{date}', date).replace('{store}', storeName);
  };
  const trialCopy = TRIAL_COPY[language] ?? TRIAL_COPY.en;
  const monthlyTrial = plan === 'monthly' && trialDays !== null && monthly ? trialDays : null;
  // With a free trial on offer, the monthly plan is selected first, until the person picks a plan.
  const pickedPlan = React.useRef(false);
  React.useEffect(() => {
    if (trialDays !== null && !pickedPlan.current) setPlan('monthly');
  }, [trialDays]);
  const busy = isPurchasing || previewBusy;
  const checking = !previewMode && isAvailable && (isLoading || isSubscribed === undefined);

  const titleEntrance = useEntrance(120, 12);

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
      const customerInfo = await purchase(selectedPackage);
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

  const termsLine = !selectedProduct ? null
    : monthlyTrial !== null ? fillTerms(termsCopy.trial, selectedProduct.priceString, monthlyTrial)
      : fillTerms(plan === 'annual' ? termsCopy.annual : termsCopy.monthly, selectedProduct.priceString);
  const ctaLabel = monthlyTrial !== null ? fillTrial(trialCopy.cta, monthlyTrial, monthly?.priceString ?? '') : t('paywallCta');

  const [footerHeight, setFooterHeight] = React.useState(230 + insets.bottom);
  const planCards = (
          <View style={[styles.plans, styles.plansCompact]}>
            {annual ? <PlanCard
              testID="paywall-annual-plan"
              selected={plan === 'annual'}
              onPress={() => { pickedPlan.current = true; if (plan !== 'annual') { Haptics.selectionAsync().catch(() => undefined); setPlan('annual'); } }}
              title={t('premiumAnnualPlan')}
              price={annual.priceString}
              unit={t('premiumPerYear')}
              perMonth={annualPerMonth ? t('paywallMonthlyEquivalent').replace('{price}', annualPerMonth) : null}
              note={t('paywallYearlyNote')}
              badge={t('paywallBestValue')}
              saveBadge={savings !== null ? t('paywallSave').replace('{percent}', String(savings)) : null}
              tones={ANNUAL_TONES}
              compact
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
              compact
            /> : null}
            {!annual && !monthly ? <View style={[styles.plansLoading, { borderColor: colors.border }]}>
              {isLoading || reloadingPlans ? <>
                <ActivityIndicator color={colors.mutedForeground} />
                <Text style={[styles.planNote, { color: colors.mutedForeground }]}>{t('premiumLoading')}</Text>
              </> : <>
                {/* The store answered without any plans: say so instead of spinning forever, and let them ask again. */}
                <Text style={[styles.planNote, styles.plansMissing, { color: colors.mutedForeground }]}>{t('premiumStoreUnavailable')}</Text>
                <Pressable accessibilityRole="button" onPress={() => { void reloadPlans(); }} hitSlop={8} style={[styles.plansRetry, { borderColor: colors.border }]}>
                  <Text style={[styles.plansRetryText, { color: colors.foreground }]}>{RETRY_COPY[language] ?? RETRY_COPY.en}</Text>
                </Pressable>
              </>}
            </View> : null}
          </View>
  );

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <SkyBackdrop />
    <RayHeader height={insets.top + 400} />
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: footerHeight + 24 }} showsVerticalScrollIndicator={false} bounces={false}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <GainModeWordmark color="#FFFFFF" width={128} height={17} />
          <LinearGradient colors={['#F5C542', '#E39A1F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.proPill}><Text style={styles.proText}>ACCESS</Text></LinearGradient>
        </View>
        {onClose ? <Pressable accessibilityLabel={t('close')} onPress={onClose} hitSlop={10} style={styles.close}>
          <Ionicons name="close" size={22} color="#0F172A" />
        </Pressable> : null}
      </View>

      <View style={styles.content}>
        {/* The free-trial story only for the plan that has a trial; otherwise how the selected plan is charged. */}
        {monthlyTrial !== null && monthly ? <Animated.View style={titleEntrance}>
          <Text style={[styles.title, styles.trialTitle, { color: '#FFFFFF' }]}>
            {trialCopy.titlePre}<Text style={styles.trialFree}>{` ${trialCopy.titleFree} `}</Text>{trialCopy.titlePost}
          </Text>
          <TrialSteps days={monthlyTrial} copy={trialCopy} price={monthly.priceString} />
        </Animated.View> : <Animated.View style={titleEntrance}>
          <Text style={[styles.title, styles.trialTitle, { color: '#FFFFFF' }]}>{termsCopy.planTitle}</Text>
          {selectedProduct ? <StepRail filledThrough={0} items={termsCopy.steps[plan].map(([title, body], index) => ({ icon: PLAN_ICONS[index], title, body: fillTerms(body, selectedProduct.priceString) }))} /> : null}
        </Animated.View>}

      </View>
    </ScrollView>

    <View onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)} style={[styles.footer, styles.footerOffer, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border }]}>
      {/* The plans sit on the page itself, with no bar behind them, right above the button. */}
      <View style={styles.footerPlans}>{planCards}</View>
      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      {termsLine ? <Text testID="paywall-terms" style={[styles.terms, { color: colors.foreground }]}>{termsLine}</Text> : null}
      <SubscribeButton
        label={busy ? t('premiumLoading') : isSubscribed ? t('premiumAccessActiveContinue') : ctaLabel}
        busy={busy}
        disabled={busy || checking}
        onPress={() => { void handlePurchase(); }}
      />
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
  // A solid white circle so the way out is easy to spot on the blue header.
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  content: { paddingHorizontal: 20 },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 34, lineHeight: 38, letterSpacing: -1.6, textAlign: 'center' },
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
  planPerMonth: { fontFamily: 'Inter_700Bold', fontSize: 11.5, marginTop: 2, fontVariant: ['tabular-nums'] },
  planUnit: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 1 },
  planBadge: { position: 'absolute', top: -10, left: 18, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  planBadgeText: { fontFamily: 'Inter_800ExtraBold', fontSize: 9.5, letterSpacing: 0.9 },
  saveBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  saveBadgeText: { fontFamily: 'Inter_800ExtraBold', fontSize: 10, letterSpacing: 0.4 },
  terms: { fontFamily: 'Inter_600SemiBold', fontSize: 13.5, lineHeight: 19, textAlign: 'center', marginBottom: 10 },
  subscribe: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  subscribeText: { fontFamily: 'Inter_800ExtraBold', fontSize: 16, letterSpacing: -0.2 },
  trialTitle: { textAlign: 'center', marginTop: 22, marginBottom: 20 },
  trialFree: { color: '#1D4ED8', backgroundColor: '#FFFFFF', overflow: 'hidden', borderRadius: 10 },
  steps: { position: 'relative', gap: 18, marginBottom: 20 },
  stepsRail: { position: 'absolute', left: 0, top: 0, bottom: 0, width: STEP_RAIL, borderRadius: STEP_RAIL / 2, overflow: 'hidden' },
  stepsRailFill: { position: 'absolute', left: 0, top: 0, width: STEP_RAIL, borderRadius: STEP_RAIL / 2, overflow: 'hidden' },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  stepDotWrap: { width: STEP_RAIL, height: STEP_RAIL, alignItems: 'center', justifyContent: 'center' },
  stepDot: { width: STEP_DOT, height: STEP_DOT, borderRadius: STEP_DOT / 2, alignItems: 'center', justifyContent: 'center' },
  rayHeader: { position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden' },
  stepCopy: { flex: 1, paddingTop: 3 },
  stepTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 16, letterSpacing: -0.2 },
  stepBody: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18, marginTop: 2 },
  plansMissing: { textAlign: 'center', marginTop: 0 },
  plansRetry: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  plansRetryText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  plansLoading: { flex: 1, borderRadius: 26, borderWidth: 1, padding: 20, alignItems: 'center', gap: 8 },
  footerOffer: { paddingTop: 22, borderTopWidth: 0 },
  footerPlans: { marginBottom: 12 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  error: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17, textAlign: 'center', marginBottom: 10 },
  renew: { fontFamily: 'Inter_500Medium', fontSize: 12, textAlign: 'center', marginTop: 10, fontVariant: ['tabular-nums'] },
  links: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 14, rowGap: 8, marginTop: 10, paddingHorizontal: 8 },
  link: { flexShrink: 1, textAlign: 'center', fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 16 },
});
