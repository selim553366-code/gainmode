import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { MuscleGroup } from '@/lib/workoutPlan';

type BodySide = 'front' | 'back';

type MuscleAnatomyProps = {
  side: BodySide;
  activeMuscles: MuscleGroup[];
  selectedMuscle: MuscleGroup | null;
  onSelect: (muscle: MuscleGroup) => void;
  activeColor: string;
  selectedColor: string;
};

type Hotspot = {
  muscle: MuscleGroup;
  left: `${number}%`;
  top: `${number}%`;
  width: `${number}%`;
  height: `${number}%`;
  radius: number;
};

const frontHotspots: Hotspot[] = [
  { muscle: 'shoulders', left: '26%', top: '13%', width: '48%', height: '16%', radius: 24 },
  { muscle: 'chest', left: '37%', top: '22%', width: '27%', height: '13%', radius: 22 },
  { muscle: 'biceps', left: '15%', top: '25%', width: '20%', height: '22%', radius: 20 },
  { muscle: 'biceps', left: '65%', top: '25%', width: '20%', height: '22%', radius: 20 },
  { muscle: 'core', left: '39%', top: '34%', width: '22%', height: '20%', radius: 18 },
  { muscle: 'quadriceps', left: '34%', top: '51%', width: '15%', height: '25%', radius: 18 },
  { muscle: 'quadriceps', left: '51%', top: '51%', width: '15%', height: '25%', radius: 18 },
  { muscle: 'calves', left: '36%', top: '76%', width: '14%', height: '18%', radius: 16 },
  { muscle: 'calves', left: '50%', top: '76%', width: '14%', height: '18%', radius: 16 },
];

const backHotspots: Hotspot[] = [
  { muscle: 'shoulders', left: '26%', top: '13%', width: '48%', height: '16%', radius: 24 },
  { muscle: 'back', left: '36%', top: '22%', width: '29%', height: '25%', radius: 22 },
  { muscle: 'triceps', left: '15%', top: '25%', width: '20%', height: '22%', radius: 20 },
  { muscle: 'triceps', left: '65%', top: '25%', width: '20%', height: '22%', radius: 20 },
  { muscle: 'glutes', left: '34%', top: '45%', width: '32%', height: '17%', radius: 20 },
  { muscle: 'hamstrings', left: '34%', top: '58%', width: '15%', height: '20%', radius: 18 },
  { muscle: 'hamstrings', left: '51%', top: '58%', width: '15%', height: '20%', radius: 18 },
  { muscle: 'calves', left: '36%', top: '76%', width: '14%', height: '18%', radius: 16 },
  { muscle: 'calves', left: '50%', top: '76%', width: '14%', height: '18%', radius: 16 },
];

const frontMasks: Partial<Record<MuscleGroup, number>> = {
  shoulders: require('@/assets/images/muscle-masks/front-shoulders-natural.png'),
  chest: require('@/assets/images/muscle-masks/front-chest-natural.png'),
  biceps: require('@/assets/images/muscle-masks/front-biceps-natural.png'),
  core: require('@/assets/images/muscle-masks/front-core-natural.png'),
  quadriceps: require('@/assets/images/muscle-masks/front-quadriceps-natural.png'),
  calves: require('@/assets/images/muscle-masks/front-calves-natural.png'),
};

const backMasks: Partial<Record<MuscleGroup, number>> = {
  shoulders: require('@/assets/images/muscle-masks/back-shoulders-natural.png'),
  back: require('@/assets/images/muscle-masks/back-back-natural.png'),
  triceps: require('@/assets/images/muscle-masks/back-triceps-natural.png'),
  glutes: require('@/assets/images/muscle-masks/back-glutes-natural.png'),
  hamstrings: require('@/assets/images/muscle-masks/back-hamstrings-natural.png'),
  calves: require('@/assets/images/muscle-masks/back-calves-natural.png'),
};

export function MuscleAnatomy({ side, activeMuscles, selectedMuscle, onSelect }: MuscleAnatomyProps) {
  const hotspots = side === 'front' ? frontHotspots : backHotspots;
  const masks = side === 'front' ? frontMasks : backMasks;
  const imageLeft = side === 'front' ? 0 : '-100%';
  return <View style={styles.crop}>
    <Image
      source={require('@/assets/images/muscle-anatomy-final.png')}
      resizeMode="stretch"
      style={[styles.referenceImage, { left: imageLeft }]}
      accessibilityLabel={side === 'front' ? 'Front muscle anatomy' : 'Back muscle anatomy'}
    />
    {activeMuscles.map((muscle) => {
      const mask = masks[muscle];
      if (!mask) return null;
      return <Image
        key={`${side}-${muscle}-mask`}
        source={mask}
        resizeMode="stretch"
        style={[
          styles.referenceImage,
          styles.maskImage,
          {
            left: imageLeft,
            opacity: selectedMuscle === muscle ? 0.98 : 0.88,
          },
        ]}
      />;
    })}
    {hotspots.map((hotspot, index) => {
      const isActive = activeMuscles.includes(hotspot.muscle);
      return <Pressable
        key={`${hotspot.muscle}-${index}`}
        disabled={!isActive}
        accessibilityRole="button"
        onPress={() => onSelect(hotspot.muscle)}
        style={[
          styles.hotspot,
          {
            left: hotspot.left,
            top: hotspot.top,
            width: hotspot.width,
            height: hotspot.height,
            borderRadius: hotspot.radius,
            backgroundColor: 'transparent',
            borderWidth: 0,
            zIndex: 2,
          },
        ]}
      />;
    })}
  </View>;
}

const styles = StyleSheet.create({
  crop: { width: '100%', height: '100%', position: 'relative', overflow: 'hidden' },
  referenceImage: { position: 'absolute', top: 0, width: '200%', height: '100%' },
  maskImage: { zIndex: 1 },
  hotspot: { position: 'absolute', zIndex: 2 },
});