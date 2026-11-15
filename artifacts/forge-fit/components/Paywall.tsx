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
  FadeInDown,
  FadeOutUp,
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

/** A laurel branch for one side of the countdown, built once from a curved stem with leaves along it. */
const LAUREL = (() => {
  const point = (t: number) => {
    const u = 1 - t;
    // Quadratic curve from the bottom of the branch up to its tip, bowing outwards.
    return { x: u * u * 30 + 2 * u * t * 2 + t * t * 20, y: u * u * 66 + 2 * u * t * 38 + t * t * 4 };
  };
  const leaf = (t: number, side: 1 | -1, length: number) => {
    const a = point(t);
    const b = point(Math.min(1, t + 0.02));
    const tx = b.x - a.x; const ty = b.y - a.y; const tl = Math.hypot(tx, ty) || 1;
    // Leaves lean forward along the stem and out to one side.
    const nx = -ty / tl * side; const ny = tx / tl * side;
    const dx = (tx / tl) * 0.75 + nx * 0.66; const dy = (ty / tl) * 0.75 + ny * 0.66;
    const tip = { x: a.x + dx * length, y: a.y + dy * length };
    const w = length * 0.36;
    const c1 = { x: a.x + dx * length * 0.5 - dy * w, y: a.y + dy * length * 0.5 + dx * w };
    const c2 = { x: a.x + dx * length * 0.5 + dy * w, y: a.y + dy * length * 0.5 - dx * w };
    const f = (n: number) => n.toFixed(1);
    return `M${f(a.x)} ${f(a.y)} Q${f(c1.x)} ${f(c1.y)} ${f(tip.x)} ${f(tip.y)} Q${f(c2.x)} ${f(c2.y)} ${f(a.x)} ${f(a.y)}Z`;
  };
  const leaves: string[] = [];
  [0.08, 0.26, 0.44, 0.62, 0.8].forEach((t, i) => {
    leaves.push(leaf(t, -1, 13 - i * 0.8));
    leaves.push(leaf(t + 0.09, 1, 11 - i * 0.8));
  });
  const top = point(1);
  leaves.push(`M${top.x.toFixed(1)} ${(top.y + 6).toFixed(1)} Q${(top.x - 5).toFixed(1)} ${(top.y - 2).toFixed(1)} ${(top.x + 1).toFixed(1)} ${(top.y - 4).toFixed(1)} Q${(top.x + 4).toFixed(1)} ${(top.y + 2).toFixed(1)} ${top.x.toFixed(1)} ${(top.y + 6).toFixed(1)}Z`);
  const stem = `M30 66 Q2 38 20 4`;
  return { stem, leaves: leaves.join(' ') };
})();

function Laurel({ color, flip = false }: { color: string; flip?: boolean }) {
  return <Svg width={36} height={70} viewBox="0 0 36 70" style={flip ? { transform: [{ scaleX: -1 }] } : undefined}>
    <Path d={LAUREL.stem} stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    <Path d={LAUREL.leaves} fill={color} />
  </Svg>;
}

/** One digit of the countdown; when it changes the old digit rolls up and away as the new one rises in. */
function RollingDigit({ digit, color }: { digit: string; color: string }) {
  return <View style={styles.rollDigit}>
    <Animated.Text key={digit} entering={FadeInDown.duration(280)} exiting={FadeOutUp.duration(280)} style={[styles.countDigits, styles.rollText, { color }]}>{digit}</Animated.Text>
  </View>;
}

/** One two-digit group of the countdown with its unit underneath. */
function CountdownUnit({ value, label }: { value: number; label: string }) {
  const colors = useColors();
  const text = String(value).padStart(2, '0');
  return <View style={styles.countUnit}>
    <View style={styles.countPair}>
      <RollingDigit digit={text[0]} color={colors.foreground} />
      <RollingDigit digit={text[1]} color={colors.foreground} />
    </View>
    <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>{label}</Text>
  </View>;
}

/** The time left on the free-trial offer between two laurels, and the reassurance that nothing is paid today. */
function OfferCountdown({ remaining, copy }: { remaining: number; copy: TrialCopy }) {
  const colors = useColors();
  const { hours, minutes, seconds } = countdownParts(remaining);
  const laurel = colors.colorScheme === 'dark' ? 'rgba(255,255,255,0.38)' : 'rgba(15,23,42,0.28)';
  return <View style={styles.countdown}>
    <Text style={[styles.countTitle, { color: colors.foreground }]}>{copy.endsIn}</Text>
    <View style={styles.countBand}>
      <Laurel color={laurel} />
      <View style={styles.countRow}>
        <CountdownUnit value={hours} label={copy.units[0]} />
        <Text style={[styles.countColon, { color: colors.foreground }]}>:</Text>
        <CountdownUnit value={minutes} label={copy.units[1]} />
        <Text style={[styles.countColon, { color: colors.foreground }]}>:</Text>
        <CountdownUnit value={seconds} label={copy.units[2]} />
      </View>
      <Laurel color={laurel} flip />
    </View>
    <View style={styles.noPayment}>
      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
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
  // The paywall always presents the free trial; the countdown runs for 15 minutes from the first time it is shown.
  const [offerStartedAt, setOfferStartedAt] = React.useState<number | null>(null);
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    let cancelled = false;
    void startTrialOfferWindow().then((startedAt) => { if (!cancelled) setOfferStartedAt(startedAt); });
    return () => { cancelled = true; };
  }, []);
  const offerRemaining = offerStartedAt === null ? TRIAL_OFFER_WINDOW_MS : trialOfferRemaining(offerStartedAt, now);
  const offerActive = offerRemaining > 0;
  React.useEffect(() => {
    if (!offerActive) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [offerActive]);
  const trialDays: number | null = storeTrialDays ?? PREVIEW_TRIAL_DAYS;
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

  const renewNote = monthlyTrial !== null && monthly
    ? fillTrial(trialCopy.renew, monthlyTrial, monthly.priceString)
    : selectedProduct
      ? t(plan === 'annual' ? 'paywallRenewsYearly' : 'paywallRenewsMonthly').replace('{price}', selectedProduct.priceString)
      : t('premiumTrust');
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
        {onClose ? <Pressable accessibilityLabel={t('close')} onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="close" size={18} color={colors.foreground} />
        </Pressable> : null}
      </View>

      <View style={styles.content}>
        <Animated.View style={titleEntrance}>
          <Text style={[styles.title, styles.trialTitle, { color: '#FFFFFF' }]}>
            {trialCopy.titlePre}<Text style={styles.trialFree}>{` ${trialCopy.titleFree} `}</Text>{trialCopy.titlePost}
          </Text>
          <TrialSteps days={trialDays} copy={trialCopy} price={monthly?.priceString ?? '…'} />
          {offerActive ? <OfferCountdown remaining={offerRemaining} copy={trialCopy} /> : null}
        </Animated.View>

      </View>
    </ScrollView>

    <View onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)} style={[styles.footer, styles.footerOffer, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border }]}>
      {/* The plans sit on the page itself, with no bar behind them, right above the button. */}
      <View style={styles.footerPlans}>{planCards}</View>
      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      <SubscribeButton
        label={busy ? t('premiumLoading') : isSubscribed ? t('premiumAccessActiveContinue') : ctaLabel}
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
  countdown: { alignItems: 'center', marginBottom: 22 },
  countTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, marginBottom: 4 },
  countBand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  countUnit: { alignItems: 'center', gap: 2 },
  countPair: { flexDirection: 'row' },
  rollDigit: { width: 27, height: 48, overflow: 'hidden' },
  rollText: { position: 'absolute', left: 0, right: 0, top: 0, textAlign: 'center' },
  countDigits: { fontFamily: 'Inter_800ExtraBold', fontSize: 40, lineHeight: 48, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  countLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  countColon: { fontFamily: 'Inter_800ExtraBold', fontSize: 34, lineHeight: 44, marginHorizontal: 2 },
  noPayment: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  noPaymentText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#10B981' },
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
