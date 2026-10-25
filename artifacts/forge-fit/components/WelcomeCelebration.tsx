import React from 'react';
import { Modal, StyleSheet, Text, View, type LayoutRectangle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate, type TranslationKey } from '@/lib/i18n';
import { Ionicons } from '@/components/AppIcon';
import { EASE_OUT, PressableScale as Pressable } from '@/components/Motion';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const AnimatedPath = Animated.createAnimatedComponent(Path);
const CHECK_LENGTH = 18;

// One master timeline, in milliseconds. Every moving part reads its own window from it.
const TOTAL = 4400;
const T = {
  disc: [0, 440],
  ringA: [600, 1500],
  ringB: [800, 1700],
  copy: [840, 1240],
  rowIn: 1050, // + 90ms per row, 400ms each
  boxIn: [1950, 2250],
  flapsOpen: [2150, 2450],
  rowFly: 2500, // + 80ms per row, 450ms each
  flapsClose: [3200, 3450],
  morph: [3600, 4200],
  cta: [4150, 4350],
} as const;
const at = (ms: number) => ms / TOTAL;

const ROW_HEIGHT = 52;
const ROW_GAP = 8;
const BOX = { width: 92, height: 70 };
const CTA_HEIGHT = 58;

// Kraft cardboard: the one place the app borrows a material instead of its own palette.
const CARDBOARD = '#C8935A';
const CARDBOARD_DARK = '#A9743F';
const CARDBOARD_FLAP = '#D6A46C';
const TAPE = '#E7C78F';

const unlocked: Array<{ icon: IconName; key: TranslationKey }> = [
  { icon: 'sparkles-outline', key: 'paywallFeature1Title' },
  { icon: 'camera-outline', key: 'paywallFeature2Title' },
  { icon: 'barbell-outline', key: 'paywallFeature3Title' },
  { icon: 'analytics-outline', key: 'paywallFeature4Title' },
];

type Geometry = { rows: LayoutRectangle; cta: LayoutRectangle; width: number };

/** A feature row: settles in, then shrinks and drops into the box's opening. */
function UnlockedRow({ icon, label, index, clock, flyDistance, packs }: {
  icon: IconName;
  label: string;
  index: number;
  clock: SharedValue<number>;
  flyDistance: number;
  packs: boolean;
}) {
  const colors = useColors();
  const inFrom = at(T.rowIn + index * 90);
  const inTo = at(T.rowIn + index * 90 + 400);
  const flyFrom = at(T.rowFly + index * 80);
  const flyTo = at(T.rowFly + index * 80 + 450);
  const style = useAnimatedStyle(() => {
    const time = clock.get();
    const appear = interpolate(time, [inFrom, inTo], [0, 1], 'clamp');
    if (!packs) return { opacity: appear, transform: [{ translateY: (1 - appear) * 10 }] };
    const fly = interpolate(time, [flyFrom, flyTo], [0, 1], 'clamp');
    const eased = fly * fly * (3 - 2 * fly);
    return {
      opacity: appear * interpolate(fly, [0, 0.75, 1], [1, 1, 0]),
      transform: [
        { translateY: (1 - appear) * 10 + eased * flyDistance },
        { scale: 1 - eased * 0.82 },
      ],
    };
  });
  return <Animated.View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }, style]}>
    <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}><Ionicons name={icon} size={16} color={colors.foreground} /></View>
    <Text style={[styles.rowText, { color: colors.foreground }]}>{label}</Text>
    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
  </Animated.View>;
}

/**
 * The cardboard box: arrives under the rows, opens its flaps, takes the rows in, closes, then slides
 * down while stretching into the shape and color of the "Let's go" button it hands over to.
 */
function PackingBox({ clock, geometry }: { clock: SharedValue<number>; geometry: Geometry }) {
  const colors = useColors();
  const gapTop = geometry.rows.y + geometry.rows.height;
  const startTop = gapTop + Math.max(0, (geometry.cta.y - gapTop - BOX.height) / 2);
  const startLeft = (geometry.width - BOX.width) / 2;

  const boxStyle = useAnimatedStyle(() => {
    const time = clock.get();
    const appear = interpolate(time, [at(T.boxIn[0]), at(T.boxIn[1])], [0, 1], 'clamp');
    const morph = interpolate(time, [at(T.morph[0]), at(T.morph[1])], [0, 1], 'clamp');
    const eased = 1 - (1 - morph) ** 3;
    const handOff = interpolate(time, [at(T.cta[0]), at(T.cta[1])], [1, 0], 'clamp');
    return {
      opacity: appear * handOff,
      top: startTop + (geometry.cta.y - startTop) * eased,
      left: startLeft + (geometry.cta.x - startLeft) * eased,
      width: BOX.width + (geometry.cta.width - BOX.width) * eased,
      height: BOX.height + (CTA_HEIGHT - BOX.height) * eased,
      borderRadius: 10 + 19 * eased,
      backgroundColor: interpolateColor(eased, [0, 1], [CARDBOARD, colors.primary]),
      transform: [{ scale: 0.85 + appear * 0.15 }],
    };
  });
  const detailStyle = useAnimatedStyle(() => ({
    opacity: interpolate(clock.get(), [at(T.morph[0]), at(T.morph[0] + 220)], [1, 0], 'clamp'),
  }));
  // Flaps swing open around their outer corners, then fold back shut once the rows are in.
  const leftFlap = useAnimatedStyle(() => {
    const time = clock.get();
    const open = interpolate(time, [at(T.flapsOpen[0]), at(T.flapsOpen[1])], [0, 1], 'clamp');
    const close = interpolate(time, [at(T.flapsClose[0]), at(T.flapsClose[1])], [0, 1], 'clamp');
    return { transform: [{ rotate: `${-125 * open * (1 - close)}deg` }] };
  });
  const rightFlap = useAnimatedStyle(() => {
    const time = clock.get();
    const open = interpolate(time, [at(T.flapsOpen[0]), at(T.flapsOpen[1])], [0, 1], 'clamp');
    const close = interpolate(time, [at(T.flapsClose[0]), at(T.flapsClose[1])], [0, 1], 'clamp');
    return { transform: [{ rotate: `${125 * open * (1 - close)}deg` }] };
  });

  return <Animated.View pointerEvents="none" style={[styles.box, boxStyle]}>
    <Animated.View style={[StyleSheet.absoluteFill, detailStyle]}>
      <View style={[styles.boxShade, { backgroundColor: CARDBOARD_DARK }]} />
      <View style={[styles.boxTape, { backgroundColor: TAPE }]} />
      <Animated.View style={[styles.flap, styles.flapLeft, { backgroundColor: CARDBOARD_FLAP }, leftFlap]} />
      <Animated.View style={[styles.flap, styles.flapRight, { backgroundColor: CARDBOARD_FLAP }, rightFlap]} />
    </Animated.View>
  </Animated.View>;
}

/**
 * First-purchase welcome on one 4.4s timeline: the brand disc arrives, light rings release, the check
 * draws itself (sound and success haptic on completion), the unlocked features settle in, a cardboard
 * box opens and takes them in, closes, and slides down to become the "Let's go" button.
 * Under reduced motion the box is skipped: the rows stay and the button simply fades in.
 */
export function PremiumSuccessCelebration({ visible, onDone, modal = true }: { visible: boolean; onDone: () => void; modal?: boolean }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, username } = useFit();
  const reduced = useReducedMotion();
  const t = (key: TranslationKey) => translate(language, key);
  const successTone = useAudioPlayer(require('@/assets/sounds/premium-success.wav'));
  const clock = useSharedValue(0);
  const check = useSharedValue(0);
  const doneRef = React.useRef(onDone);
  doneRef.current = onDone;
  const [rowsLayout, setRowsLayout] = React.useState<LayoutRectangle | null>(null);
  const [ctaLayout, setCtaLayout] = React.useState<LayoutRectangle | null>(null);
  const [rootWidth, setRootWidth] = React.useState(0);
  const geometry = rowsLayout && ctaLayout && rootWidth ? { rows: rowsLayout, cta: ctaLayout, width: rootWidth } : null;
  const packs = !reduced && geometry !== null;

  React.useEffect(() => {
    if (!visible) return undefined;
    clock.set(0);
    check.set(0);
    const land = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      successTone.volume = 0.8;
      void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
      void successTone.seekTo(0).then(() => successTone.play()).catch(() => successTone.play());
    };
    if (reduced) {
      clock.set(withTiming(1, { duration: 300 }));
      check.set(1);
      land();
      return () => { successTone.pause(); };
    }
    clock.set(withTiming(1, { duration: TOTAL, easing: Easing.linear }));
    check.set(withDelay(380, withTiming(1, { duration: 460, easing: EASE_OUT }, (finished) => {
      if (finished) scheduleOnRN(land);
    })));
    // The box lid closing is the one physical "thud" of the packing sequence.
    const lid = setTimeout(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined); }, T.flapsClose[1]);
    return () => {
      clearTimeout(lid);
      successTone.pause();
    };
  }, [check, clock, reduced, successTone, visible]);

  const disc = useAnimatedStyle(() => {
    const local = interpolate(clock.get(), [at(T.disc[0]), at(T.disc[1])], [0, 1], 'clamp');
    const eased = 1 - (1 - local) ** 3;
    return { opacity: local, transform: [{ scale: reduced ? 1 : 0.7 + eased * 0.3 }] };
  });
  const ringA = useAnimatedStyle(() => {
    const local = interpolate(clock.get(), [at(T.ringA[0]), at(T.ringA[1])], [0, 1], 'clamp');
    return { opacity: reduced || local === 0 ? 0 : (1 - local) * 0.5, transform: [{ scale: 1 + local * 0.9 }] };
  });
  const ringB = useAnimatedStyle(() => {
    const local = interpolate(clock.get(), [at(T.ringB[0]), at(T.ringB[1])], [0, 1], 'clamp');
    return { opacity: reduced || local === 0 ? 0 : (1 - local) * 0.5, transform: [{ scale: 1 + local * 0.9 }] };
  });
  const copy = useAnimatedStyle(() => {
    const local = interpolate(clock.get(), [at(T.copy[0]), at(T.copy[1])], [0, 1], 'clamp');
    return { opacity: local, transform: [{ translateY: (1 - local) * 12 }] };
  });
  const cta = useAnimatedStyle(() => {
    const window = packs ? [at(T.cta[0]), at(T.cta[1])] : [0.8, 1];
    return { opacity: interpolate(clock.get(), window, [0, 1], 'clamp') };
  });
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LENGTH * (1 - check.get()) }));

  if (!visible) return null;
  const greeting = username ? `${t('premiumPurchaseSuccessEyebrow')} · ${username}` : t('premiumPurchaseSuccessEyebrow');
  // Where the box's opening sits relative to each row, so the rows drop into it.
  const boxMouth = geometry ? geometry.rows.y + geometry.rows.height + Math.max(0, (geometry.cta.y - geometry.rows.y - geometry.rows.height - BOX.height) / 2) + 8 : 0;

  const content = <View
    onLayout={(event) => setRootWidth(event.nativeEvent.layout.width)}
    style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
  >
    <View style={styles.stage}>
      <Animated.View style={[styles.ring, { borderColor: colors.accent }, ringA]} />
      <Animated.View style={[styles.ring, { borderColor: colors.accent }, ringB]} />
      <Animated.View style={disc}>
        <LinearGradient colors={[colors.heroBackgroundStart, colors.heroBackgroundEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.disc}>
          <Svg width={64} height={64} viewBox="0 0 24 24">
            <AnimatedPath d="M6.5 12.5l3.6 3.6L17.5 8.7" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={CHECK_LENGTH} animatedProps={checkProps} />
          </Svg>
        </LinearGradient>
      </Animated.View>
    </View>
    <Animated.View style={[styles.copy, copy]}>
      <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{greeting.toUpperCase()}</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{t('premiumPurchaseSuccessTitle')}</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{t('premiumPurchaseSuccessBody')}</Text>
    </Animated.View>
    <View onLayout={(event) => setRowsLayout(event.nativeEvent.layout)} style={styles.rows}>
      {unlocked.map((item, index) => {
        const rowCenter = geometry ? geometry.rows.y + index * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2 : 0;
        return <UnlockedRow key={item.key} icon={item.icon} label={t(item.key)} index={index} clock={clock} flyDistance={boxMouth - rowCenter} packs={packs} />;
      })}
    </View>
    <Animated.View onLayout={(event) => setCtaLayout(event.nativeEvent.layout)} style={[styles.ctaWrap, cta]}>
      <Pressable testID="welcome-continue" accessibilityRole="button" onPress={() => doneRef.current()} style={[styles.cta, { backgroundColor: colors.primary }]}>
        <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>{t('paywallWelcomeCta')}</Text>
        <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
      </Pressable>
    </Animated.View>
    {packs && geometry ? <PackingBox clock={clock} geometry={geometry} /> : null}
  </View>;

  return modal ? <Modal visible animationType="fade" onRequestClose={() => doneRef.current()}>{content}</Modal> : content;
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22 },
  stage: { height: 200, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 132, height: 132, borderRadius: 66, borderWidth: 2 },
  disc: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center' },
  copy: { alignItems: 'center', marginTop: 12 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 35, letterSpacing: -1.1, textAlign: 'center', marginTop: 10 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10, maxWidth: 320 },
  rows: { gap: ROW_GAP, marginTop: 26 },
  row: { height: ROW_HEIGHT, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  ctaWrap: { marginTop: 'auto' },
  cta: { height: CTA_HEIGHT, borderRadius: CTA_HEIGHT / 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  box: { position: 'absolute', overflow: 'visible' },
  boxShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%', opacity: 0.35, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  boxTape: { position: 'absolute', top: 0, bottom: 0, left: '44%', width: '12%', opacity: 0.85 },
  flap: { position: 'absolute', top: -2, width: '50%', height: 14, borderRadius: 3 },
  flapLeft: { left: 0, transformOrigin: 'left bottom' },
  flapRight: { right: 0, transformOrigin: 'right bottom' },
});
