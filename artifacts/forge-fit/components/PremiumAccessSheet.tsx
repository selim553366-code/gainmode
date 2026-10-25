import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
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

const features: Array<{ icon: IconName; key: TranslationKey }> = [
  { icon: 'sparkles-outline', key: 'premiumAccessActiveFeature1' },
  { icon: 'nutrition-outline', key: 'premiumAccessActiveFeature2' },
  { icon: 'barbell-outline', key: 'premiumAccessActiveFeature3' },
];

/** One feature row rising in after the check lands, 60ms apart. */
function FeatureRow({ icon, label, index, progress }: { icon: IconName; label: string; index: number; progress: SharedValue<number> }) {
  const colors = useColors();
  const style = useAnimatedStyle(() => {
    const local = interpolate(progress.get(), [0.45 + index * 0.08, 0.75 + index * 0.08], [0, 1], 'clamp');
    return { opacity: local, transform: [{ translateY: (1 - local) * 8 }] };
  });
  return <Animated.View style={[styles.feature, { borderColor: colors.border }, style]}>
    <View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}><Ionicons name={icon} size={16} color={colors.foreground} /></View>
    <Text style={[styles.featureText, { color: colors.foreground }]}>{label}</Text>
    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
  </Animated.View>;
}

/**
 * Shown when an active member taps their "Active" badge. A bottom sheet in the app's own language:
 * the brand-blue hero card, a check that draws itself once, and features that settle in after it.
 * Plays once per open; no looping motion.
 */
export function PremiumAccessStatusModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, isPremium } = useFit();
  const reduced = useReducedMotion();
  const t = (key: TranslationKey) => translate(language, key);
  const progress = useSharedValue(0);
  const check = useSharedValue(0);

  React.useEffect(() => {
    if (!visible || !isPremium) return;
    progress.set(0);
    check.set(0);
    if (reduced) {
      progress.set(withTiming(1, { duration: 220 }));
      check.set(1);
      return;
    }
    progress.set(withTiming(1, { duration: 900, easing: EASE_OUT }));
    // The check draws after the sheet has landed; the success haptic fires on the frame it completes.
    check.set(withDelay(260, withTiming(1, { duration: 420, easing: EASE_OUT }, (finished) => {
      if (finished) scheduleOnRN(() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); });
    })));
  }, [check, isPremium, progress, reduced, visible]);

  const sheetStyle = useAnimatedStyle(() => {
    const local = interpolate(progress.get(), [0, 0.4], [0, 1], 'clamp');
    return { opacity: local, transform: [{ translateY: reduced ? 0 : (1 - local) * 40 }] };
  });
  const badgeStyle = useAnimatedStyle(() => {
    const local = interpolate(progress.get(), [0.15, 0.5], [0, 1], 'clamp');
    return { opacity: local, transform: [{ scale: reduced ? 1 : 0.9 + local * 0.1 }] };
  });
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LENGTH * (1 - check.get()) }));

  if (!visible || !isPremium) return null;
  return <Modal transparent visible animationType="fade" onRequestClose={onClose}>
    <View style={[styles.root, { paddingBottom: insets.bottom + 12 }]}>
      <Pressable scaleTo={1} accessibilityLabel={t('close')} onPress={onClose} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }, sheetStyle]}>
        <LinearGradient colors={[colors.heroBackgroundStart, colors.heroBackgroundEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroGlow} />
          <Pressable accessibilityLabel={t('close')} onPress={onClose} hitSlop={10} style={styles.close}>
            <Ionicons name="close" size={18} color={colors.heroInk} />
          </Pressable>
          <Animated.View style={[styles.badge, badgeStyle]}>
            <Svg width={42} height={42} viewBox="0 0 24 24">
              <AnimatedPath
                d="M6.5 12.5l3.6 3.6L17.5 8.7"
                stroke={colors.heroBackgroundEnd}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={CHECK_LENGTH}
                animatedProps={checkProps}
              />
            </Svg>
          </Animated.View>
          <View style={[styles.statusPill, { backgroundColor: colors.success }]}>
            <Ionicons name="checkmark-circle" size={12} color={colors.primaryForeground} />
            <Text style={[styles.statusPillText, { color: colors.primaryForeground }]}>{t('premiumOwned')}</Text>
          </View>
        </LinearGradient>
        <View style={styles.body}>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{t('premiumAccessActiveEyebrow')}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('premiumAccessActiveTitle')}</Text>
          <Text style={[styles.text, { color: colors.mutedForeground }]}>{t('premiumAccessActiveBody')}</Text>
          <View style={styles.features}>
            {features.map((feature, index) => <FeatureRow key={feature.key} icon={feature.icon} label={t(feature.key)} index={index} progress={progress} />)}
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{t('premiumAccessActiveContinue')}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 12, backgroundColor: '#000000A6' },
  sheet: { borderRadius: 32, borderWidth: 1, overflow: 'hidden' },
  hero: { height: 168, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, right: -110, top: -140, backgroundColor: 'rgba(255,255,255,0.08)' },
  close: { position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  badge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  statusPill: { position: 'absolute', bottom: 16, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusPillText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.8 },
  body: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 18 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 26, lineHeight: 31, letterSpacing: -0.8, marginTop: 8 },
  text: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 8 },
  features: { gap: 8, marginTop: 18, marginBottom: 20 },
  feature: { minHeight: 52, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  featureIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  button: { height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
});
