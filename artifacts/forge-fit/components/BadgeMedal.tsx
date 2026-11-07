import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
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
import { badgeMedalImages } from '@/lib/badgeMedalImages';
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

/**
 * A badge as a matte metal medal rendered in Blender, its icon embossed on it as raised relief (see
 * scripts/renderBadgeMedals.py). Locked badges are the same medal in grey rubber with a small padlock. An optional
 * shared value sweeps a band of light across the face.
 */
export function BadgeMedal({ badge, size, locked = false, shine }: { badge: Pick<BadgeDefinition, 'id' | 'tier' | 'color' | 'icon'>; size: number; locked?: boolean; shine?: SharedValue<number> }) {
  const source = locked
    ? badgeMedalImages[`locked-${badge.id}`] ?? badgeMedalImages.locked
    : badgeMedalImages[badge.id] ?? badgeMedalImages.locked;
  const shineStyle = useAnimatedStyle(() => {
    const p = shine ? shine.get() : 0;
    return { opacity: p > 0 && p < 1 ? 1 : 0, transform: [{ translateX: -size + p * size * 2.2 }, { rotate: '22deg' }] };
  });

  return <View style={{ width: size, height: size }}>
    <Image source={source} resizeMode="contain" style={{ width: size, height: size }} />
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
  lock: { position: 'absolute', backgroundColor: '#2A2E35', borderWidth: 1.5, borderColor: '#4A505A', alignItems: 'center', justifyContent: 'center' },
  shine: { position: 'absolute', left: 0 },
});
