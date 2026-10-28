import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { EASE_OUT } from '@/components/Motion';

export type ScanMode = 'meal' | 'barcode';

export const SCAN_SLOGAN = 'Eat healthy, be healthy.';
const ACCENT: Record<ScanMode, string> = { meal: '#6E9BFF', barcode: '#3DD68C' };
const CORNER = 46;
const STROKE = 5;

/** Where the viewfinder sits for a given screen size: square-ish for plates, wide for barcodes. */
export function scanWindow(mode: ScanMode, width: number, height: number) {
  const w = mode === 'meal' ? Math.min(width - 56, 340) : Math.min(width - 48, 352);
  const h = mode === 'meal' ? w * 1.1 : w * 0.5;
  const radius = mode === 'meal' ? 36 : 26;
  return { x: (width - w) / 2, y: height * 0.47 - h / 2, w, h, radius };
}

function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  return `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

/** Brackets start pushed out and fade in as they lock, then drift a few points outward and back. */
function useCornerStyle(lock: ReturnType<typeof useSharedValue<number>>, breathe: ReturnType<typeof useSharedValue<number>>, dx: number, dy: number) {
  return useAnimatedStyle(() => {
    const out = (1 - lock.get()) * 22 + breathe.get() * 4;
    return { opacity: lock.get(), transform: [{ translateX: dx * out }, { translateY: dy * out }] };
  });
}

/** One corner bracket, drawn for the top-left and rotated into place for the others. */
function Corner({ accent, radius, rotate, style }: { accent: string; radius: number; rotate: number; style: object }) {
  const r = Math.min(radius, CORNER - 10);
  const s = STROKE / 2;
  return <Animated.View style={[styles.corner, style]}>
    <Svg width={CORNER} height={CORNER} style={{ transform: [{ rotate: `${rotate}deg` }] }}>
      <Defs>
        <SvgGradient id={`c${rotate}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor={accent} />
        </SvgGradient>
      </Defs>
      <Path d={`M ${s} ${CORNER - 2} V ${r + s} A ${r} ${r} 0 0 1 ${r + s} ${s} H ${CORNER - 2}`} stroke={`url(#c${rotate})`} strokeWidth={STROKE} strokeLinecap="round" fill="none" />
    </Svg>
  </Animated.View>;
}

/**
 * Full-screen viewfinder over the camera. The surroundings dim behind a frosted mask, four
 * gradient brackets lock onto the window and then breathe gently. Meal mode sweeps a soft band
 * of light across the plate; barcode mode runs a glowing laser up and down. The slogan sits above
 * the window and the hint below it. Reduced motion keeps everything still.
 */
export function ScanFrame({ mode, width, height, hint }: { mode: ScanMode; width: number; height: number; hint: string }) {
  const reduced = useReducedMotion();
  const accent = ACCENT[mode];
  const win = scanWindow(mode, width, height);
  const lock = useSharedValue(reduced ? 1 : 0);
  const breathe = useSharedValue(0);
  const sweep = useSharedValue(0);

  React.useEffect(() => {
    if (reduced) return undefined;
    lock.set(withTiming(1, { duration: 520, easing: EASE_OUT }));
    breathe.set(withDelay(600, withRepeat(withSequence(
      withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
    ), -1)));
    sweep.set(mode === 'barcode'
      ? withRepeat(withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.cubic) }),
      ), -1)
      : withDelay(500, withRepeat(withSequence(
        withTiming(1, { duration: 1600, easing: Easing.bezier(0.45, 0, 0.25, 1) }),
        withDelay(900, withTiming(0, { duration: 0 })),
      ), -1)));
    return () => [lock, breathe, sweep].forEach(cancelAnimation);
  }, [breathe, lock, mode, reduced, sweep]);

  const tl = useCornerStyle(lock, breathe, -1, -1);
  const tr = useCornerStyle(lock, breathe, 1, -1);
  const bl = useCornerStyle(lock, breathe, -1, 1);
  const br = useCornerStyle(lock, breathe, 1, 1);
  const sweepStyle = useAnimatedStyle(() => (mode === 'barcode'
    ? { transform: [{ translateY: 14 + sweep.get() * (win.h - 28) }] }
    : { opacity: sweep.get() > 0 && sweep.get() < 1 ? 1 : 0, transform: [{ translateX: -160 + sweep.get() * (win.w + 260) }, { rotate: '20deg' }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.35 + breathe.get() * 0.35 }));
  const textStyle = useAnimatedStyle(() => ({ opacity: lock.get(), transform: [{ translateY: (1 - lock.get()) * 10 }] }));

  if (!width || !height) return null;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Path d={`M 0 0 H ${width} V ${height} H 0 Z ${roundedRect(win.x, win.y, win.w, win.h, win.radius)}`} fill="rgba(4,6,12,0.62)" fillRule="evenodd" />
      <Rect x={win.x + 0.5} y={win.y + 0.5} width={win.w - 1} height={win.h - 1} rx={win.radius} stroke="rgba(255,255,255,0.18)" strokeWidth={1} fill="none" />
    </Svg>

    {/* Soft coloured halo around the window that breathes with the brackets. */}
    <Animated.View style={[styles.halo, { left: win.x - 10, top: win.y - 10, width: win.w + 20, height: win.h + 20, borderRadius: win.radius + 10, borderColor: accent, shadowColor: accent }, glowStyle]} />

    <View style={[styles.window, { left: win.x, top: win.y, width: win.w, height: win.h, borderRadius: win.radius }]}>
      {mode === 'meal' ? <>
        {/* Rule-of-thirds guides help centre the plate. */}
        {[1, 2].map((i) => <View key={`v${i}`} style={[styles.guide, { left: (win.w / 3) * i, top: 0, bottom: 0, width: StyleSheet.hairlineWidth }]} />)}
        {[1, 2].map((i) => <View key={`h${i}`} style={[styles.guide, { top: (win.h / 3) * i, left: 0, right: 0, height: StyleSheet.hairlineWidth }]} />)}
        <Animated.View style={[styles.sweep, { height: win.h * 1.6, top: -win.h * 0.3 }, sweepStyle]}>
          <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 'rgba(110,155,255,0.28)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </> : <Animated.View style={[styles.laserWrap, sweepStyle]}>
        <LinearGradient colors={[`${accent}00`, `${accent}55`, `${accent}00`]} style={styles.laserGlow} />
        <View style={[styles.laser, { backgroundColor: accent, shadowColor: accent }]} />
      </Animated.View>}
    </View>

    <Corner accent={accent} radius={win.radius} rotate={0} style={[{ left: win.x - 3, top: win.y - 3 }, tl]} />
    <Corner accent={accent} radius={win.radius} rotate={90} style={[{ left: win.x + win.w - CORNER + 3, top: win.y - 3 }, tr]} />
    <Corner accent={accent} radius={win.radius} rotate={270} style={[{ left: win.x - 3, top: win.y + win.h - CORNER + 3 }, bl]} />
    <Corner accent={accent} radius={win.radius} rotate={180} style={[{ left: win.x + win.w - CORNER + 3, top: win.y + win.h - CORNER + 3 }, br]} />

    <Animated.View style={[styles.sloganWrap, { top: win.y - 74 }, textStyle]}>
      <View style={[styles.sloganDot, { backgroundColor: accent }]} />
      <Text style={styles.slogan}>{SCAN_SLOGAN}</Text>
    </Animated.View>
    <Animated.Text style={[styles.hint, { top: win.y + win.h + 26 }, textStyle]}>{hint}</Animated.Text>
  </View>;
}

const styles = StyleSheet.create({
  corner: { position: 'absolute', width: CORNER, height: CORNER },
  halo: { position: 'absolute', borderWidth: 1, shadowOpacity: 0.9, shadowRadius: 24, shadowOffset: { width: 0, height: 0 } },
  window: { position: 'absolute', overflow: 'hidden' },
  guide: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.14)' },
  sweep: { position: 'absolute', left: 0, width: 110 },
  laserWrap: { position: 'absolute', left: 14, right: 14, top: 0, height: 0, alignItems: 'stretch', justifyContent: 'center' },
  laserGlow: { position: 'absolute', left: 0, right: 0, height: 56, top: -28 },
  laser: { height: 2.5, borderRadius: 2, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  sloganWrap: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  sloganDot: { width: 8, height: 8, borderRadius: 4 },
  slogan: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.6, color: '#FFFFFF' },
  hint: { position: 'absolute', left: 40, right: 40, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.78)', textAlign: 'center' },
});
