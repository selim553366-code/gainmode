import React from 'react';
import { Image, Modal, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { translate, type TranslationKey } from '@/lib/i18n';
import { Ionicons } from '@/components/AppIcon';
import { ChargeButton } from '@/components/ChargeButton';
import { SkyBackdrop } from '@/components/SkyBackdrop';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// One master timeline, in milliseconds. Every moving part reads its own window from it.
const TOTAL = 3900;
const T = {
  drop: [0, 820],      // the medal falls in, spinning like a tossed coin
  land: 820,           // sound, success haptic, confetti
  beam: [760, 1400],
  confetti: [820, 3000],
  copy: [1000, 1420],
  rowIn: 1250,         // + 110ms per row
  unlock: 1750,        // + 260ms per row: the lock turns into a check
  cta: [3000, 3400],
} as const;
const at = (ms: number) => ms / TOTAL;
const MEDAL = 150;

const unlocked: Array<{ icon: IconName; key: TranslationKey }> = [
  { icon: 'coach-outline', key: 'paywallFeature1Title' },
  { icon: 'camera-outline', key: 'paywallFeature2Title' },
  { icon: 'barbell-outline', key: 'paywallFeature3Title' },
  { icon: 'analytics-outline', key: 'paywallFeature4Title' },
];

// Streamers in the paywall's plan colours plus the medal's gold. Fixed, so every run looks the same.
const STREAMER_COLORS = ['#E8364F', '#FF8A3D', '#2563EB', '#38BDF8', '#F5C542', '#3DD68C'];
const streamers = Array.from({ length: 26 }, (_, i) => {
  const angle = -Math.PI / 2 + ((i / 26) - 0.5) * Math.PI * 1.5 + ((i * 37) % 10 - 5) * 0.03;
  const speed = 210 + ((i * 53) % 7) * 34;
  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    spin: ((i % 2 ? 1 : -1) * (360 + ((i * 29) % 5) * 160)),
    color: STREAMER_COLORS[i % STREAMER_COLORS.length],
    long: i % 3 !== 0,
    delay: (i % 4) * 0.025,
  };
});

/** One streamer: shot out of the medal, then pulled down by gravity while it tumbles and fades. */
function Streamer({ clock, piece }: { clock: SharedValue<number>; piece: (typeof streamers)[number] }) {
  const style = useAnimatedStyle(() => {
    const raw = interpolate(clock.get(), [at(T.confetti[0]), at(T.confetti[1])], [0, 1], 'clamp');
    const local = Math.max(0, raw - piece.delay);
    const tt = local * 1.9;
    const x = piece.vx * tt;
    const y = piece.vy * tt + 380 * tt * tt;
    return {
      opacity: raw === 0 ? 0 : interpolate(local, [0, 0.05, 0.75, 1], [0, 1, 1, 0], 'clamp'),
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${piece.spin * local}deg` }, { scaleY: 0.6 + Math.abs(Math.cos(local * 14)) * 0.4 }],
    };
  });
  return <Animated.View style={[styles.streamer, { backgroundColor: piece.color, width: piece.long ? 5 : 7, height: piece.long ? 16 : 9 }, style]} />;
}

/** An unlocked feature: slides in locked, then its lock flips into a check while a green wash sweeps across. */
function UnlockRow({ icon, label, index, clock }: { icon: IconName; label: string; index: number; clock: SharedValue<number> }) {
  const colors = useColors();
  const inFrom = at(T.rowIn + index * 110);
  const inTo = at(T.rowIn + index * 110 + 380);
  const unFrom = at(T.unlock + index * 260);
  const unTo = at(T.unlock + index * 260 + 320);
  const rowStyle = useAnimatedStyle(() => {
    const appear = interpolate(clock.get(), [inFrom, inTo], [0, 1], 'clamp');
    return { opacity: appear, transform: [{ translateY: (1 - appear) * 16 }] };
  });
  const washStyle = useAnimatedStyle(() => ({ width: `${interpolate(clock.get(), [unFrom, unTo], [0, 100], 'clamp')}%` }));
  const lockStyle = useAnimatedStyle(() => {
    const u = interpolate(clock.get(), [unFrom, unFrom + (unTo - unFrom) / 2], [0, 1], 'clamp');
    return { opacity: 1 - u, transform: [{ rotate: `${-u * 90}deg` }, { scale: 1 - u * 0.4 }] };
  });
  const checkStyle = useAnimatedStyle(() => {
    const u = interpolate(clock.get(), [unFrom + (unTo - unFrom) / 2, unTo], [0, 1], 'clamp');
    return { opacity: u, transform: [{ scale: 0.4 + u * 0.6 + Math.sin(u * Math.PI) * 0.25 }] };
  });
  return <Animated.View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }, rowStyle]}>
    <Animated.View style={[styles.rowWash, { backgroundColor: `${colors.success}1A` }, washStyle]} />
    <LinearGradient colors={[colors.accent, '#123A8F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rowIcon}>
      <Ionicons name={icon} size={16} color="#FFFFFF" />
    </LinearGradient>
    <Text numberOfLines={1} style={[styles.rowText, { color: colors.foreground }]}>{label}</Text>
    <View style={styles.rowState}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, lockStyle]}><Ionicons name="badge-lock" size={17} color={colors.mutedForeground} /></Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, checkStyle]}>
        <View style={[styles.checkTile, { backgroundColor: colors.success }]}><Ionicons name="checkmark" size={14} color="#FFFFFF" /></View>
      </Animated.View>
    </View>
  </Animated.View>;
}

/**
 * First-purchase welcome on one 3.9s timeline: the 3D Access medal is tossed in and spins down onto the page; when
 * it lands a beam of light rises behind it, streamers burst out (sound and success haptic), the title settles,
 * the four unlocked features slide in and unlock one by one, and the flowing "Let's go" button arrives.
 * Under reduced motion everything is shown in place with no confetti.
 */
export function PremiumSuccessCelebration({ visible, onDone, modal = true }: { visible: boolean; onDone: () => void; modal?: boolean }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { language, username } = useFit();
  const reduced = useReducedMotion();
  const t = (key: TranslationKey) => translate(language, key);
  const successTone = useAudioPlayer(require('@/assets/sounds/premium-success.wav'));
  const clock = useSharedValue(0);
  const drift = useSharedValue(0);
  const doneRef = React.useRef(onDone);
  doneRef.current = onDone;

  React.useEffect(() => {
    if (!visible) return undefined;
    clock.set(0);
    drift.set(0);
    const land = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      successTone.volume = 0.8;
      void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
      void successTone.seekTo(0).then(() => successTone.play()).catch(() => successTone.play());
    };
    if (reduced) {
      clock.set(1);
      land();
      return () => { successTone.pause(); };
    }
    clock.set(withTiming(1, { duration: TOTAL, easing: Easing.linear }));
    const landing = setTimeout(land, T.land);
    const unlocks = unlocked.map((_, index) => setTimeout(() => { Haptics.selectionAsync().catch(() => undefined); }, T.unlock + index * 260 + 200));
    drift.set(withDelay(T.land + 400, withRepeat(withSequence(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
    ), -1)));
    return () => {
      clearTimeout(landing);
      unlocks.forEach(clearTimeout);
      successTone.pause();
    };
  }, [clock, drift, reduced, successTone, visible]);

  const medalStyle = useAnimatedStyle(() => {
    const d = interpolate(clock.get(), [at(T.drop[0]), at(T.drop[1])], [0, 1], 'clamp');
    // falls with gravity, then a short squash-free bounce settles it
    const fall = d < 0.78 ? (d / 0.78) ** 2 : 1;
    const bounce = d >= 0.78 ? Math.sin(((d - 0.78) / 0.22) * Math.PI) * 14 : 0;
    const y = -height * 0.45 * (1 - fall) - bounce - drift.get() * 6;
    return {
      opacity: interpolate(d, [0, 0.12], [0, 1], 'clamp'),
      transform: [{ perspective: 700 }, { translateY: y }, { rotateY: `${(1 - d) * 900}deg` }, { rotate: `${-4 + drift.get() * 4}deg` }],
    };
  });
  const beamStyle = useAnimatedStyle(() => {
    const b = interpolate(clock.get(), [at(T.beam[0]), at(T.beam[1])], [0, 1], 'clamp');
    return { opacity: b * 0.9, transform: [{ scaleY: 0.3 + b * 0.7 }] };
  });
  const copyStyle = useAnimatedStyle(() => {
    const c = interpolate(clock.get(), [at(T.copy[0]), at(T.copy[1])], [0, 1], 'clamp');
    return { opacity: c, transform: [{ translateY: (1 - c) * 14 }] };
  });
  const ctaStyle = useAnimatedStyle(() => {
    const c = interpolate(clock.get(), [at(T.cta[0]), at(T.cta[1])], [0, 1], 'clamp');
    return { opacity: c, transform: [{ translateY: (1 - c) * 24 }] };
  });

  if (!visible) return null;
  const greeting = username ? `${t('premiumPurchaseSuccessEyebrow')} · ${username}` : t('premiumPurchaseSuccessEyebrow');
  const dark = colors.colorScheme === 'dark';

  const content = <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
    <SkyBackdrop />
    <View style={styles.stage}>
      <Animated.View pointerEvents="none" style={[styles.beam, beamStyle]}>
        <LinearGradient colors={[dark ? 'rgba(245,197,66,0)' : 'rgba(255,255,255,0)', dark ? 'rgba(245,197,66,0.28)' : 'rgba(255,255,255,0.95)', dark ? 'rgba(245,197,66,0)' : 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      {!reduced ? <View pointerEvents="none" style={styles.burst}>{streamers.map((piece, index) => <Streamer key={index} clock={clock} piece={piece} />)}</View> : null}
      <Animated.View style={medalStyle}>
        <Image source={require('@/assets/images/medals/access.png')} resizeMode="contain" style={{ width: MEDAL, height: MEDAL }} />
      </Animated.View>
    </View>
    <Animated.View style={[styles.copy, copyStyle]}>
      <LinearGradient colors={['#F5C542', '#E39A1F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.eyebrowPill}>
        <Text numberOfLines={1} style={styles.eyebrow}>{greeting.toUpperCase()}</Text>
      </LinearGradient>
      <Text style={[styles.title, { color: colors.foreground }]}>{t('premiumPurchaseSuccessTitle')}</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{t('premiumPurchaseSuccessBody')}</Text>
    </Animated.View>
    <View style={styles.rows}>
      {unlocked.map((item, index) => <UnlockRow key={item.key} icon={item.icon} label={t(item.key)} index={index} clock={clock} />)}
    </View>
    <Animated.View style={[styles.ctaWrap, ctaStyle]}>
      <ChargeButton testID="welcome-continue" label={t('paywallWelcomeCta')} tones={['#2563EB', '#38BDF8']} onPress={() => doneRef.current()} />
    </Animated.View>
  </View>;

  return modal ? <Modal visible animationType="fade" onRequestClose={() => doneRef.current()}>{content}</Modal> : content;
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, overflow: 'hidden' },
  stage: { height: 210, alignItems: 'center', justifyContent: 'center' },
  beam: { position: 'absolute', width: 170, top: -120, bottom: -10 },
  burst: { position: 'absolute', left: '50%', top: '50%', width: 0, height: 0 },
  streamer: { position: 'absolute', borderRadius: 2 },
  copy: { alignItems: 'center', marginTop: 6 },
  eyebrowPill: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, maxWidth: '100%' },
  eyebrow: { fontFamily: 'Inter_800ExtraBold', fontSize: 10.5, letterSpacing: 1.1, color: '#3A2600' },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 32, lineHeight: 36, letterSpacing: -1.4, textAlign: 'center', marginTop: 14 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8, maxWidth: 320 },
  rows: { gap: 8, marginTop: 24 },
  row: { height: 56, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
  rowWash: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 14.5, letterSpacing: -0.2 },
  rowState: { width: 28, height: 28 },
  center: { alignItems: 'center', justifyContent: 'center' },
  checkTile: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  ctaWrap: { marginTop: 'auto' },
});
