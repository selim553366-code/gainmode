import React from 'react';
import { Image, View } from 'react-native';
import { badgeMedalImages } from '@/lib/badgeMedalImages';
import type { BadgeDefinition } from '@/lib/badges';

/**
 * A badge as a matte metal medal rendered in Blender, its icon embossed as raised relief. Locked badges share one
 * grey rubber medal with an embossed padlock.
 */
export function BadgeMedal3D({ badge, size, locked = false }: { badge: BadgeDefinition; size: number; locked?: boolean }) {
  const source = locked ? badgeMedalImages.locked : badgeMedalImages[badge.id] ?? badgeMedalImages.locked;
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
    <Image source={source} resizeMode="contain" style={{ width: size, height: size }} />
  </View>;
}
