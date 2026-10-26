import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@/components/AppIcon';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const STAGE_HEIGHT = 150;
const TOTAL = 1900;
const T = {
  flight: [0, 1000],
  trailFade: [900, 1300],
  check: [1050, 1450],
  checkDraw: [1150, 1550],
  copy: [1350, 1750],
} as const;
const at = (ms: number) => ms / TOTAL;
const CHECK_LENGTH = 18;
const PLANE = 30;

/** Point and tangent angle on a cubic bezier, used to fly the plane along the same curve as its trail. */
function bezier(p: number, a: number[], b: number[], c: number[], d: number[]) {
  'worklet';
  const u = 1 - p;
  const x = u * u * u * a[0] + 3 * u * u * p * b[0] + 3 * u * p * p * c[0] + p * p * p * d[0];
  const y = u * u * u * a[1] + 3 * u * u * p * b[1] + 3 * u * p * p * c[1] + p * p * p * d[1];
  const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * p * (c[0] - b[0]) + 3 * p * p * (d[0] - c[0]);
  const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * p * (c[1] - b[1]) + 3 * p * p * (d[1] - c[1]);
  return { x, y, angle: Math.atan2(dy, dx) };
}

/**
 * Feedback sent: a paper plane takes off from the bottom left, banks along a curve leaving a thin
 * trail, and leaves the card at the top right. As the trail fades a check draws itself in the
 * center (success haptic on completion) and the confirmation copy settles in. Plays once, 1.9s.
 * Reduced motion skips the flight and shows the check and copy with a fade.
 */
export function FeedbackSent({ title, body }: { title: string; body: string }) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const [width, setWidth] = React.useState(0);
  const clock = useSharedValue(reduced ? 1 : 0);

  // The flight curve, in stage coordinates: low left, a lift through the middle, out past the top right.
  const a = [18, STAGE_HEIGHT - 22];
  const b = [width * 0.35, STAGE_HEIGHT + 10];
  const c = [width * 0.55, 20];
  const d = [width + 40, -30];
  const curve = `M ${a[0]} ${a[1]} C ${b[0]} ${b[1]}, ${c[0]} ${c[1]}, ${d[0]} ${d[1]}`;
  const trailLength = width * 1.5 + 200;

  React.useEffect(() => {
    if (!width) return;
    const land = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); };
    if (reduced) {
      land();
      return;
    }
    clock.set(0);
    clock.set(withTiming(1, { duration: TOTAL, easing: Easing.linear }));
    const timer = setTimeout(land, T.checkDraw[1]);
    return () => clearTimeout(timer);
  }, [clock, reduced, width]);

  const planeStyle = useAnimatedStyle(() => {
    const local = interpolate(clock.get(), [at(T.flight[0]), at(T.flight[1])], [0, 1], 'clamp');
    // Ease in-out so the plane gathers speed, then glides out.
    const p = local < 0.5 ? 2 * local * local : 1 - (-2 * local + 2) ** 2 / 2;
    const point = bezier(p, a, b, c, d);
    return {
      opacity: reduced ? 0 : interpolate(local, [0, 0.05, 0.92, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: point.x - PLANE / 2 },
        { translateY: point.y - PLANE / 2 },
        { rotate: `${point.angle + Math.PI / 4}rad` },
      ],
    };
  });
  const trailProps = useAnimatedProps(() => {
    const local = interpolate(clock.get(), [at(T.flight[0]), at(T.flight[1])], [0, 1], 'clamp');
    const p = local < 0.5 ? 2 * local * local : 1 - (-2 * local + 2) ** 2 / 2;
    return {
      strokeDashoffset: trailLength * (1 - p),
      strokeOpacity: reduced ? 0 : interpolate(clock.get(), [at(T.trailFade[0]), at(T.trailFade[1])], [0.45, 0], 'clamp'),
    };
  });
  const badgeStyle = useAnimatedStyle(() => {
    const local = interpolate(clock.get(), [at(T.check[0]), at(T.check[1])], [0, 1], 'clamp');
    const eased = 1 - (1 - local) ** 3;
    return { opacity: local, transform: [{ scale: reduced ? 1 : 0.8 + eased * 0.2 }] };
  });
  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - interpolate(clock.get(), [at(T.checkDraw[0]), at(T.checkDraw[1])], [0, 1], 'clamp')),
  }));
  const copyStyle = useAnimatedStyle(() => {
    const local = interpolate(clock.get(), [at(T.copy[0]), at(T.copy[1])], [0, 1], 'clamp');
    return { opacity: local, transform: [{ translateY: (1 - local) * 8 }] };
  });

  return <View style={styles.root}>
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.stage}>
      {width ? <>
        <Svg width={width} height={STAGE_HEIGHT} style={StyleSheet.absoluteFill} pointerEvents="none">
          <AnimatedPath d={curve} stroke={colors.mutedForeground} strokeWidth={1.5} strokeLinecap="round" strokeDasharray={`${trailLength} ${trailLength}`} fill="none" animatedProps={trailProps} />
        </Svg>
        <Animated.View pointerEvents="none" style={[styles.plane, planeStyle]}>
          <Ionicons name="send-outline" size={PLANE - 4} color={colors.foreground} />
        </Animated.View>
      </> : null}
      <Animated.View style={[styles.badge, { backgroundColor: `${colors.success}1F` }, badgeStyle]}>
        <View style={[styles.badgeInner, { backgroundColor: colors.success }]}>
          <Svg width={34} height={34} viewBox="0 0 24 24">
            <AnimatedPath d="M6.5 12.5l3.6 3.6L17.5 8.7" stroke={colors.primaryForeground} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={CHECK_LENGTH} animatedProps={checkProps} />
          </Svg>
        </View>
      </Animated.View>
    </View>
    <Animated.View style={[styles.copy, copyStyle]}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{body}</Text>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  root: { alignItems: 'stretch', paddingBottom: 6 },
  stage: { height: STAGE_HEIGHT, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  plane: { position: 'absolute', left: 0, top: 0, width: PLANE, height: PLANE, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  badgeInner: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  copy: { alignItems: 'center', marginTop: 6 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 19, letterSpacing: -0.4, textAlign: 'center' },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6, maxWidth: 290 },
});
