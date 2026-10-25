import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  interpolate,
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
const DURATION = 2000;

const unlocked: Array<{ icon: IconName; key: TranslationKey }> = [
  { icon: 'sparkles-outline', key: 'paywallFeature1Title' },
  { icon: 'camera-outline', key: 'paywallFeature2Title' },
  { icon: 'barbell-outline', key: 'paywallFeature3Title' },
  { icon: 'analytics-outline', key: 'paywallFeature4Title' },
];

function UnlockedRow({ icon, label, index, clock }: { icon: IconName; label: string; index: number; clock: SharedValue<number> }) {
  const colors = useColors();
  // Rows settle in between 1050ms and 1450ms of the timeline, 90ms apart.
  const from = (1050 + index * 90) / DURATION;
  const to = (1450 + index * 90) / DURATION;
  const style = useAnimatedStyle(() => {
    const local = interpolate(clock.get(), [from, to], [0, 1], 'clamp');
    return { opacity: local, transform: [{ translateY: (1 - local) * 10 }] };
  });
  return <Animated.View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }, style]}>
    <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}><Ionicons name={icon} size={16} color={colors.foreground} /></View>
    <Text style={[styles.rowText, { color: colors.foreground }]}>{label}</Text>
    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
  </Animated.View>;
}

/**
 * First-purchase welcome. One choreographed moment on a single 2s timeline: the brand disc arrives,
 * two light rings release outward, the check draws itself (sound and success haptic on the frame it
 * completes), then the copy and the unlocked features settle in. It waits for the user to continue.
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
    } else {
      clock.set(withTiming(1, { duration: DURATION, easing: (value) => value }));
      check.set(withDelay(380, withTiming(1, { duration: 460, easing: EASE_OUT }, (finished) => {
        if (finished) scheduleOnRN(land);
      })));
    }
    return () => { successTone.pause(); };
  }, [check, clock, reduced, successTone, visible]);

  const disc = useAnimatedStyle(() => {
    const local = interpolate(clock.get(), [0, 0.22], [0, 1], 'clamp');
    const eased = 1 - (1 - local) ** 3;
    return { opacity: local, transform: [{ scale: reduced ? 1 : 0.7 + eased * 0.3 }] };
  });
  // Two light rings release outward as the check starts drawing.
  const ringA = useAnimatedStyle(() => {
    const local = interpolate(clock.get(), [0.3, 0.75], [0, 1], 'clamp');
    return { opacity: reduced || local === 0 ? 0 : (1 - local) * 0.5, transform: [{ scale: 1 + local * 0.9 }] };
  });
  const ringB = useAnimatedStyle(() => {
    const local = interpolate(clock.get(), [0.4, 0.85], [0, 1], 'clamp');
    return { opacity: reduced || local === 0 ? 0 : (1 - local) * 0.5, transform: [{ scale: 1 + local * 0.9 }] };
  });
  const copy = useAnimatedStyle(() => {
    const local = interpolate(clock.get(), [0.42, 0.62], [0, 1], 'clamp');
    return { opacity: local, transform: [{ translateY: (1 - local) * 12 }] };
  });
  const cta = useAnimatedStyle(() => {
    const local = interpolate(clock.get(), [0.82, 1], [0, 1], 'clamp');
    return { opacity: local, transform: [{ translateY: (1 - local) * 10 }] };
  });
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LENGTH * (1 - check.get()) }));

  if (!visible) return null;
  const greeting = username ? `${t('premiumPurchaseSuccessEyebrow')} · ${username}` : t('premiumPurchaseSuccessEyebrow');
  const content = <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
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
    <View style={styles.rows}>
      {unlocked.map((item, index) => <UnlockedRow key={item.key} icon={item.icon} label={t(item.key)} index={index} clock={clock} />)}
    </View>
    <Animated.View style={[styles.ctaWrap, cta]}>
      <Pressable testID="welcome-continue" accessibilityRole="button" onPress={() => doneRef.current()} style={[styles.cta, { backgroundColor: colors.primary }]}>
        <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>{t('paywallWelcomeCta')}</Text>
        <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
      </Pressable>
    </Animated.View>
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
  rows: { gap: 8, marginTop: 26 },
  row: { minHeight: 52, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  ctaWrap: { marginTop: 'auto' },
  cta: { height: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontFamily: 'Inter_700Bold', fontSize: 16 },
});
