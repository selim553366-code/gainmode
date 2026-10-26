import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { LinearGradient as ViewGradient } from 'expo-linear-gradient';
import {
  Activity,
  Anvil,
  Apple,
  BicepsFlexed,
  CalendarCheck,
  ChefHat,
  CircleCheckBig,
  Clock,
  Crosshair,
  Crown,
  Dumbbell,
  Flame,
  Footprints,
  Gem,
  Hourglass,
  Infinity as InfinityIcon,
  ListChecks,
  LockKeyhole,
  Mountain,
  MountainSnow,
  Orbit,
  Salad,
  Scale,
  ShieldHalf,
  Star,
  Sun,
  Swords,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import type { BadgeDefinition, BadgeTier } from '@/lib/badges';

const icons: Record<string, LucideIcon> = {
  activity: Activity,
  anvil: Anvil,
  apple: Apple,
  biceps: BicepsFlexed,
  'calendar-check': CalendarCheck,
  'chef-hat': ChefHat,
  'circle-check': CircleCheckBig,
  clock: Clock,
  crosshair: Crosshair,
  crown: Crown,
  dumbbell: Dumbbell,
  flame: Flame,
  footprints: Footprints,
  gem: Gem,
  hourglass: Hourglass,
  infinity: InfinityIcon,
  'list-checks': ListChecks,
  mountain: Mountain,
  'mountain-snow': MountainSnow,
  orbit: Orbit,
  salad: Salad,
  scale: Scale,
  shield: ShieldHalf,
  star: Star,
  sun: Sun,
  swords: Swords,
  trophy: Trophy,
  zap: Zap,
};

export function BadgeGlyph({ icon, size, color, strokeWidth = 2 }: { icon: string; size: number; color: string; strokeWidth?: number }) {
  const Icon = icons[icon] ?? Trophy;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

/** Metal for each tier: light, mid, shadow, light again, so the rim reads as polished. */
export const tierMetal: Record<BadgeTier, [string, string, string, string]> = {
  bronze: ['#F6CFA0', '#C47F43', '#7A4317', '#E3A46B'],
  silver: ['#FFFFFF', '#CDD2DA', '#7F8794', '#EEF1F5'],
  gold: ['#FFF4B8', '#F4C24F', '#A16C08', '#FFDD7A'],
  platinum: ['#F4F8FF', '#B9C8E4', '#5F6E8E', '#E2EBFF'],
  legendary: ['#FFD9F6', '#B794F6', '#38D7C4', '#FDE68A'],
};

/** A readable accent per tier, for chips and labels. */
export const tierAccent: Record<BadgeTier, string> = {
  bronze: '#C47F43',
  silver: '#8E97A5',
  gold: '#D9A21B',
  platinum: '#6C82B5',
  legendary: '#B26CF0',
};

function polygon(points: number, outer: number, inner: number, rotation = -Math.PI / 2) {
  let d = '';
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (i * Math.PI) / points;
    d += `${i === 0 ? 'M' : 'L'} ${50 + r * Math.cos(a)} ${50 + r * Math.sin(a)} `;
  }
  return `${d}Z`;
}

const shapes: Record<BadgeTier, string> = {
  bronze: 'M 50 2 A 48 48 0 1 1 49.99 2 Z',
  silver: polygon(30, 48.5, 46),
  gold: polygon(14, 49, 44.5),
  platinum: polygon(6, 49, 44, -Math.PI / 2),
  legendary: polygon(9, 50, 41),
};

/**
 * A minted medal: tier-shaped metal rim, a face in the badge's own colour with a soft dome light,
 * and its glyph in the middle. Locked medals are unpainted pewter. An optional shared value sweeps
 * a band of light across the face.
 */
export function BadgeMedal({ badge, size, locked = false, shine }: { badge: Pick<BadgeDefinition, 'tier' | 'color' | 'icon'>; size: number; locked?: boolean; shine?: SharedValue<number> }) {
  const id = React.useId().replace(/:/g, '');
  const metal = locked ? ['#9AA0AA', '#6B717C', '#3D424B', '#848A95'] : tierMetal[badge.tier];
  const face = locked ? ['#5A606B', '#353A42'] : [`${badge.color}`, shade(badge.color, -0.42)];
  const shineStyle = useAnimatedStyle(() => {
    const p = shine ? shine.get() : 0;
    return { opacity: p > 0 && p < 1 ? 1 : 0, transform: [{ translateX: -size + p * size * 2.2 }, { rotate: '22deg' }] };
  });

  return <View style={{ width: size, height: size }}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={`${id}m`} x1="0.1" y1="0" x2="0.9" y2="1">
          <Stop offset="0" stopColor={metal[0]} />
          <Stop offset="0.38" stopColor={metal[1]} />
          <Stop offset="0.7" stopColor={metal[2]} />
          <Stop offset="1" stopColor={metal[3]} />
        </LinearGradient>
        <LinearGradient id={`${id}b`} x1="0.9" y1="1" x2="0.1" y2="0">
          <Stop offset="0" stopColor={metal[0]} />
          <Stop offset="0.5" stopColor={metal[1]} />
          <Stop offset="1" stopColor={metal[2]} />
        </LinearGradient>
        <RadialGradient id={`${id}f`} cx="42%" cy="34%" r="70%">
          <Stop offset="0" stopColor={locked ? face[0] : shade(badge.color, 0.32)} />
          <Stop offset="0.55" stopColor={face[0]} />
          <Stop offset="1" stopColor={face[1]} />
        </RadialGradient>
        <LinearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.42} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {badge.tier === 'legendary' && !locked
        ? <Path d={polygon(9, 50, 41, -Math.PI / 2 + Math.PI / 9)} fill={`url(#${id}b)`} opacity={0.7} />
        : null}
      <Path d={shapes[badge.tier]} fill={`url(#${id}m)`} />
      {/* Bevel: a counter-lit ring between rim and face. */}
      <Circle cx={50} cy={50} r={39.5} fill={`url(#${id}b)`} />
      <Circle cx={50} cy={50} r={36.5} fill={`url(#${id}f)`} />
      <Circle cx={50} cy={50} r={32.5} fill="none" stroke="#FFFFFF" strokeOpacity={locked ? 0.12 : 0.22} strokeWidth={0.8} strokeDasharray="1.2 2.2" />
      <G opacity={locked ? 0.4 : 1}>
        <Path d="M 18 44 A 33 33 0 0 1 82 44 Q 50 30 18 44 Z" fill={`url(#${id}g)`} />
      </G>
    </Svg>
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
      <View style={{ opacity: locked ? 0.55 : 1 }}>
        <BadgeGlyph icon={badge.icon} size={size * 0.34} color={locked ? '#C9CDD4' : '#FFFFFF'} strokeWidth={2.1} />
      </View>
    </View>
    {locked ? <View style={[styles.lock, { width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15, right: size * 0.02, bottom: size * 0.02 }]}>
      <LockKeyhole size={size * 0.15} color="#E7E9ED" strokeWidth={2.2} />
    </View> : null}
    {shine ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: size / 2, overflow: 'hidden' }]}>
      <Animated.View style={[styles.shine, { width: size * 0.35, height: size * 1.6, top: -size * 0.3 }, shineStyle]}>
        <ViewGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View> : null}
  </View>;
}

/** Lightens (amount > 0) or darkens (amount < 0) a #RRGGBB colour. */
export function shade(hex: string, amount: number) {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
  const mixed = channels.map((channel) => Math.round(amount >= 0 ? channel + (255 - channel) * amount : channel * (1 + amount)));
  return `#${mixed.map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, '0')).join('')}`;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  lock: { position: 'absolute', backgroundColor: '#2A2E35', borderWidth: 1.5, borderColor: '#4A505A', alignItems: 'center', justifyContent: 'center' },
  shine: { position: 'absolute', left: 0 },
});
