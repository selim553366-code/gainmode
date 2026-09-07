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

export function MuscleAnatomy({ side, activeMuscles, selectedMuscle, onSelect, activeColor, selectedColor }: MuscleAnatomyProps) {
  const hotspots = side === 'front' ? frontHotspots : backHotspots;
  return <View style={styles.crop}>
    <Image
      source={require('@/assets/images/muscle-anatomy-reference.png')}
      resizeMode="stretch"
      style={[styles.referenceImage, { left: side === 'front' ? 0 : '-100%' }]}
      accessibilityLabel={side === 'front' ? 'Front muscle anatomy' : 'Back muscle anatomy'}
    />
    {hotspots.map((hotspot, index) => {
      const isActive = activeMuscles.includes(hotspot.muscle);
      const isSelected = selectedMuscle === hotspot.muscle;
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
            backgroundColor: isActive ? `${isSelected ? selectedColor : activeColor}42` : 'transparent',
            borderColor: isSelected ? selectedColor : activeColor,
            borderWidth: isActive ? (isSelected ? 2 : 1) : 0,
          },
        ]}
      />;
    })}
  </View>;
}

const styles = StyleSheet.create({
  crop: { width: '100%', height: '100%', position: 'relative', overflow: 'hidden' },
  referenceImage: { position: 'absolute', top: 0, width: '200%', height: '100%' },
  hotspot: { position: 'absolute' },
});