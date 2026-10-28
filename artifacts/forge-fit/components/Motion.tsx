import React from 'react';
import { Pressable, type PressableProps, type PressableStateCallbackType, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

// Shared motion vocabulary: every animated surface in the app pulls its curve and timing from here.
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  /** Scale the element settles at while held. 1 disables the effect (full-screen backdrops). */
  scaleTo?: number;
};

/**
 * Drop-in Pressable with near-imperceptible press feedback: scales to 0.97 on press-in in 120ms and
 * springs back on release. Runs on the UI thread; respects the system reduced-motion setting.
 */
export const PressableScale = React.forwardRef<React.ElementRef<typeof Pressable>, PressableScaleProps>(function PressableScale(
  { style, scaleTo = 0.97, onPressIn, onPressOut, onHoverIn, onHoverOut, pressRetentionOffset = 16, disabled, ...rest },
  ref,
) {
  const reduced = useReducedMotion();
  const [pressed, setPressed] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const progress = useSharedValue(0);
  const target = reduced || disabled ? 1 : scaleTo;
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.get(), [0, 1], [1, target]) }],
  }));
  const resolvedStyle = typeof style === 'function' ? style({ pressed, hovered }) : style;

  return (
    <AnimatedPressable
      ref={ref}
      {...rest}
      disabled={disabled}
      pressRetentionOffset={pressRetentionOffset}
      onPressIn={(event) => {
        setPressed(true);
        progress.set(withTiming(1, { duration: 120, easing: EASE_OUT }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        progress.set(withTiming(0, { duration: 220, easing: EASE_OUT }));
        onPressOut?.(event);
      }}
      onHoverIn={(event) => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      style={target === 1 ? resolvedStyle : [resolvedStyle, animatedStyle]}
    />
  );
});

/**
 * Staggered entrance for a screen section: fades in while rising 10pt, 280ms ease-out, 45ms apart.
 * Plays once on mount; tab screens stay mounted, so it doesn't replay on every tab switch.
 */
export function Reveal({ index = 0, children, style }: { index?: number; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  React.useEffect(() => {
    if (reduced) return;
    progress.set(withDelay(Math.min(index, 8) * 45, withTiming(1, { duration: 280, easing: EASE_OUT })));
  }, [index, progress, reduced]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * 10 }],
  }));
  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/** Progress fill that eases to its new value instead of jumping. Childless and clipped, so animating width is safe. */
export function AnimatedFill({ value, color, style }: { value: number; color: string; style?: StyleProp<ViewStyle> }) {
  const clamped = Math.min(Math.max(value, 0), 1);
  const width = useSharedValue(clamped);
  React.useEffect(() => {
    width.set(withTiming(clamped, { duration: 650, easing: EASE_OUT, reduceMotion: ReduceMotion.System }));
  }, [clamped, width]);
  const animatedStyle = useAnimatedStyle(() => ({ width: `${width.get() * 100}%` }));
  return <Animated.View style={[style, { backgroundColor: color }, animatedStyle]} />;
}
