import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient as SvgGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  withRepeat,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { EASE_OUT } from '@/components/Motion';
import { FIRE_MILESTONES, fireScale, fireTier, type FireTier } from '@/lib/streakFire';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Drawing space; the SVG scales to the stage.
const VIEW_W = 220;
const VIEW_H = 240;
const CX = VIEW_W / 2;
const BASE = 186;
const MAX_H = 168;
const MAX_W = 96;

type Palette = { outer: string[]; mid: string[]; core: string[]; glow: string; ember: string; hearth: string };

/** Each milestone is a different, hotter fire: orange spark, crimson blaze, blue flame, violet legend. */
const palettes: Record<Exclude<FireTier, 'none'>, Palette> = {
  spark: { outer: ['#FF8A00', '#FF4D00', '#B91C1C'], mid: ['#FFE08A', '#FFB020', '#FF6A00'], core: ['#FFFFFF', '#FFF3B0', '#FFD36B'], glow: '#FF6A00', ember: '#FFB347', hearth: '#1A0E07' },
  blaze: { outer: ['#FF5A1F', '#E11D48', '#7F1D1D'], mid: ['#FFF1A8', '#FFC233', '#FF3D1F'], core: ['#FFFFFF', '#FFF7C2', '#FFE066'], glow: '#FF2D2D', ember: '#FFD27A', hearth: '#1C0808' },
  inferno: { outer: ['#3B82F6', '#2563EB', '#1E3A8A'], mid: ['#BAE6FD', '#60A5FA', '#2563EB'], core: ['#FFFFFF', '#E0F2FE', '#93C5FD'], glow: '#3B82F6', ember: '#93C5FD', hearth: '#070D1C' },
  legend: { outer: ['#E879F9', '#9333EA', '#4C1D95'], mid: ['#FAE8FF', '#E879F9', '#A855F7'], core: ['#FFFFFF', '#FDF4FF', '#F0ABFC'], glow: '#A855F7', ember: '#F5D0FE', hearth: '#120720' },
};

type Tongue = { dx: number; k: number; ph: number };

/** Tongues per layer: the larger the fire, the more independent tongues lick upward. */
function tonguesFor(tier: FireTier) {
  const outer: Tongue[] = [{ dx: 0, k: 1, ph: 0 }, { dx: -0.3, k: 0.6, ph: 1.7 }, { dx: 0.32, k: 0.56, ph: 3.1 }];
  if (tier !== 'spark') outer.push({ dx: -0.14, k: 0.82, ph: 4.4 }, { dx: 0.17, k: 0.76, ph: 5.3 });
  if (tier === 'inferno' || tier === 'legend') outer.push({ dx: -0.42, k: 0.42, ph: 2.6 }, { dx: 0.44, k: 0.4, ph: 0.9 });
  const mid: Tongue[] = [{ dx: 0, k: 0.7, ph: 0.6 }, { dx: -0.2, k: 0.48, ph: 2.3 }, { dx: 0.21, k: 0.46, ph: 3.8 }];
  const core: Tongue[] = [{ dx: 0, k: 0.4, ph: 1.1 }, { dx: -0.08, k: 0.3, ph: 2.9 }];
  return { outer, mid, core };
}

/**
 * One flame tongue: a teardrop whose tip sways and curls. Height, width and sway each mix three
 * sine waves at unrelated frequencies, so the motion never visibly loops.
 */
function tonguePath(t: number, tongue: Tongue, width: number, height: number, layer: number) {
  'worklet';
  const ph = tongue.ph + layer * 0.7;
  const h = height * tongue.k * (1 + 0.08 * Math.sin(t * 7.1 + ph) + 0.05 * Math.sin(t * 11.3 + ph * 2) + 0.03 * Math.sin(t * 17.9 + ph));
  const w = width * (0.42 + tongue.k * 0.58) * (1 + 0.05 * Math.sin(t * 5.3 + ph));
  const sway = width * 0.2 * tongue.k * (0.6 * Math.sin(t * 3.7 + ph) + 0.4 * Math.sin(t * 9.1 + ph * 1.3));
  const cx = CX + tongue.dx * width;
  const half = w / 2;
  const tipX = cx + sway;
  const tipY = BASE - h;
  return `M ${cx - half} ${BASE}`
    + ` C ${cx - half - w * 0.06} ${BASE - h * 0.34}, ${cx - w * 0.26 + sway * 0.4} ${BASE - h * 0.64}, ${tipX} ${tipY}`
    + ` C ${cx + w * 0.26 + sway * 0.4} ${BASE - h * 0.64}, ${cx + half + w * 0.06} ${BASE - h * 0.34}, ${cx + half} ${BASE}`
    + ` C ${cx + half} ${BASE + w * 0.34}, ${cx - half} ${BASE + w * 0.34}, ${cx - half} ${BASE} Z`;
}

function layerPath(t: number, tongues: Tongue[], width: number, height: number, layer: number) {
  'worklet';
  let d = '';
  for (let i = 0; i < tongues.length; i += 1) d += tonguePath(t, tongues[i], width, height, layer);
  return d;
}

function Ember({ index, count, time, size, color, ignite }: { index: number; count: number; time: ReturnType<typeof useSharedValue<number>>; size: number; color: string; ignite: ReturnType<typeof useSharedValue<number>> }) {
  const seed = ((index * 9301 + 49297) % 233280) / 233280;
  const speed = 0.32 + seed * 0.28;
  const offset = index / count;
  const props = useAnimatedProps(() => {
    const p = (time.get() * speed + offset) % 1;
    const x = CX + (seed - 0.5) * MAX_W * size * 0.9 + Math.sin(time.get() * 2.6 + seed * 12) * 9 * p;
    const y = BASE - 24 - p * MAX_H * size * 1.15;
    const fade = p < 0.12 ? p / 0.12 : 1 - (p - 0.12) / 0.88;
    return { cx: x, cy: y, r: 0.8 + (1 - p) * 1.6, opacity: Math.max(0, fade) * ignite.get() };
  });
  return <AnimatedCircle fill={color} animatedProps={props} />;
}

/**
 * Streak fire. Day 1–9 is a small orange flame that grows a little each day; day 10 jumps to a
 * larger crimson blaze, day 50 to a blue flame, day 100 to a violet legend fire. Flames are
 * procedurally animated on the UI thread; reduced motion shows a still fire.
 */
export function StreakFire({ days, height = 250 }: { days: number; height?: number }) {
  const reduced = useReducedMotion();
  const tier = fireTier(days);
  const scale = fireScale(days);
  const lit = tier !== 'none';
  const palette = palettes[lit ? tier : 'spark'];
  const tongues = React.useMemo(() => tonguesFor(tier), [tier]);
  const width = MAX_W * scale;
  const flameHeight = MAX_H * scale;
  const isMilestone = (FIRE_MILESTONES as readonly number[]).includes(days);
  const emberCount = { none: 0, spark: 5, blaze: 9, inferno: 13, legend: 18 }[tier];

  const time = useSharedValue(0);
  const ignite = useSharedValue(reduced ? 1 : 0);
  const flare = useSharedValue(0);
  React.useEffect(() => {
    if (!lit || reduced) return undefined;
    // A slow linear clock in seconds; the flame maths turns it into flicker.
    time.set(withRepeat(withTiming(3600, { duration: 3600 * 1000, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(time);
  }, [lit, reduced, time]);

  React.useEffect(() => {
    if (reduced || !lit) { ignite.set(1); return; }
    ignite.set(0);
    ignite.set(withTiming(1, { duration: 1100, easing: EASE_OUT }));
    // Milestone days get a one-time flare as the fire reaches its new size and colour.
    if (isMilestone) flare.set(withDelay(500, withSequence(withTiming(1, { duration: 380, easing: EASE_OUT }), withTiming(0, { duration: 1200, easing: EASE_OUT }))));
  }, [flare, ignite, isMilestone, lit, reduced, tier]);

  // Shared values are read inline in each worklet so web tracks them as dependencies.
  const outerProps = useAnimatedProps(() => {
    const g = 0.25 + 0.75 * ignite.get() + flare.get() * 0.14;
    return { d: layerPath(time.get(), tongues.outer, width * g, flameHeight * g, 0) };
  });
  const haloProps = useAnimatedProps(() => {
    const g = 0.25 + 0.75 * ignite.get() + flare.get() * 0.14;
    return { d: layerPath(time.get() * 0.8 + 0.4, tongues.outer, width * g * 1.22, flameHeight * g * 1.1, 3) };
  });
  const midProps = useAnimatedProps(() => {
    const g = 0.25 + 0.75 * ignite.get() + flare.get() * 0.14;
    return { d: layerPath(time.get(), tongues.mid, width * g, flameHeight * g, 1) };
  });
  const coreProps = useAnimatedProps(() => {
    const g = 0.25 + 0.75 * ignite.get() + flare.get() * 0.14;
    return { d: layerPath(time.get(), tongues.core, width * g, flameHeight * g, 2) };
  });
  const glowStyle = useAnimatedStyle(() => {
    const t = time.get();
    const flicker = 0.78 + 0.12 * Math.sin(t * 6.3) + 0.07 * Math.sin(t * 13.7) + 0.03 * Math.sin(t * 23.1);
    return { opacity: (lit ? flicker : 0) * ignite.get() * (1 + flare.get() * 0.4), transform: [{ scale: 0.92 + scale * 0.25 + flare.get() * 0.25 }] };
  });

  return <View style={[styles.stage, { height }]}>
    <LinearGradient colors={['#08080A', lit ? palette.hearth : '#101114']} style={StyleSheet.absoluteFill} />
    <Animated.View pointerEvents="none" style={[styles.glowWrap, glowStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="fireGlow" cx="50%" cy="72%" r="50%">
            <Stop offset="0" stopColor={palette.glow} stopOpacity={0.55} />
            <Stop offset="0.45" stopColor={palette.glow} stopOpacity={0.18} />
            <Stop offset="1" stopColor={palette.glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={200} height={200} fill="url(#fireGlow)" />
      </Svg>
    </Animated.View>

    <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMax meet" style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgGradient id="flameOuter" x1="0" y1={BASE} x2="0" y2={BASE - flameHeight * 1.1} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={palette.outer[0]} stopOpacity={1} />
          <Stop offset="0.55" stopColor={palette.outer[1]} stopOpacity={0.92} />
          <Stop offset="1" stopColor={palette.outer[2]} stopOpacity={0} />
        </SvgGradient>
        <SvgGradient id="flameMid" x1="0" y1={BASE} x2="0" y2={BASE - flameHeight * 0.8} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={palette.mid[0]} stopOpacity={1} />
          <Stop offset="0.5" stopColor={palette.mid[1]} stopOpacity={0.95} />
          <Stop offset="1" stopColor={palette.mid[2]} stopOpacity={0} />
        </SvgGradient>
        <SvgGradient id="flameCore" x1="0" y1={BASE} x2="0" y2={BASE - flameHeight * 0.5} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={palette.core[0]} stopOpacity={1} />
          <Stop offset="0.55" stopColor={palette.core[1]} stopOpacity={0.9} />
          <Stop offset="1" stopColor={palette.core[2]} stopOpacity={0} />
        </SvgGradient>
        <SvgGradient id="logWood" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6B4528" />
          <Stop offset="1" stopColor="#2B1A0F" />
        </SvgGradient>
        <RadialGradient id="coals" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={lit ? palette.mid[1] : '#3A3D44'} stopOpacity={lit ? 0.95 : 0.6} />
          <Stop offset="0.6" stopColor={lit ? palette.outer[1] : '#24262B'} stopOpacity={lit ? 0.55 : 0.4} />
          <Stop offset="1" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Log bed: two crossed logs over a bed of glowing coals. */}
      <Ellipse cx={CX} cy={BASE + 22} rx={84} ry={14} fill="url(#coals)" />
      <G rotation={-13} origin={`${CX}, ${BASE + 18}`}>
        <Rect x={CX - 70} y={BASE + 9} width={140} height={17} rx={8.5} fill="url(#logWood)" />
        <Ellipse cx={CX + 66} cy={BASE + 17.5} rx={5} ry={8.5} fill="#8A5B36" />
        <Ellipse cx={CX + 66} cy={BASE + 17.5} rx={2.4} ry={4.4} fill="#5E3B21" />
      </G>

      {lit ? <>
        <AnimatedPath fill="url(#flameOuter)" opacity={0.28} animatedProps={haloProps} />
        <AnimatedPath fill="url(#flameOuter)" animatedProps={outerProps} />
        <AnimatedPath fill="url(#flameMid)" animatedProps={midProps} />
        <AnimatedPath fill="url(#flameCore)" animatedProps={coreProps} />
        {Array.from({ length: emberCount }, (_, index) => <Ember key={`${tier}-${index}`} index={index} count={emberCount} time={time} size={scale} color={palette.ember} ignite={ignite} />)}
      </> : null}

      {/* The front log sits over the flame roots, so the fire burns from inside the bed. */}
      <G rotation={13} origin={`${CX}, ${BASE + 18}`}>
        <Rect x={CX - 70} y={BASE + 9} width={140} height={17} rx={8.5} fill="url(#logWood)" />
        <Ellipse cx={CX - 66} cy={BASE + 17.5} rx={5} ry={8.5} fill="#8A5B36" />
        <Ellipse cx={CX - 66} cy={BASE + 17.5} rx={2.4} ry={4.4} fill="#5E3B21" />
      </G>
    </Svg>
  </View>;
}

const styles = StyleSheet.create({
  stage: { borderRadius: 20, overflow: 'hidden' },
  glowWrap: { position: 'absolute', left: -40, right: -40, top: -10, bottom: -60 },
});
