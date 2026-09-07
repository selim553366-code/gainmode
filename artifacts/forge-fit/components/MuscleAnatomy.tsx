import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import type { MuscleGroup } from '@/lib/workoutPlan';

type BodySide = 'front' | 'back';
export type WorkoutMapKey = 'push' | 'pull' | 'leg' | 'upper' | 'lower' | 'push-core' | 'pull-triceps' | 'full';

type MuscleAnatomyProps = {
  side: BodySide;
  activeMuscles: MuscleGroup[];
  mapKey: WorkoutMapKey;
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
  { muscle: 'shoulders', left: '25%', top: '14%', width: '18%', height: '11%', radius: 18 },
  { muscle: 'shoulders', left: '57%', top: '14%', width: '18%', height: '11%', radius: 18 },
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

function MuscleHighlight({ muscle, side, color, selected }: { muscle: MuscleGroup; side: BodySide; color: string; selected: boolean }) {
  const opacity = selected ? 0.42 : 0.24;
  const strokeWidth = selected ? 0.8 : 0.5;
  if (side === 'front') {
    if (muscle === 'shoulders') return <G fill={color} opacity={opacity} stroke={color} strokeWidth={strokeWidth}>
      <Path d="M25 17C27 13 34 12 40 15C43 17 43 22 40 25C36 27 29 25 26 22C25 20 24 18 25 17Z" />
      <Path d="M75 17C73 13 66 12 60 15C57 17 57 22 60 25C64 27 71 25 74 22C75 20 76 18 75 17Z" />
    </G>;
    if (muscle === 'chest') return <G fill={color} opacity={opacity} stroke={color} strokeWidth={strokeWidth}>
      <Path d="M38 23C41 20 46 20 50 23V32C46 34 41 33 38 30C37 28 37 25 38 23Z" />
      <Path d="M62 23C59 20 54 20 50 23V32C54 34 59 33 62 30C63 28 63 25 62 23Z" />
    </G>;
    if (muscle === 'biceps') return <G fill={color} opacity={opacity} stroke={color} strokeWidth={strokeWidth}>
      <Path d="M20 26C23 24 27 26 28 30L26 39C24 43 20 42 18 38L18 31C18 29 19 27 20 26Z" />
      <Path d="M80 26C77 24 73 26 72 30L74 39C76 43 80 42 82 38L82 31C82 29 81 27 80 26Z" />
    </G>;
    if (muscle === 'core') return <Path d="M42 35C46 33 54 33 58 35L57 51C53 54 47 54 43 51Z" fill={color} opacity={opacity} stroke={color} strokeWidth={strokeWidth} />;
    if (muscle === 'quadriceps') return <G fill={color} opacity={opacity} stroke={color} strokeWidth={strokeWidth}>
      <Path d="M35 52C38 50 43 51 46 54L44 73C42 78 37 78 35 73Z" />
      <Path d="M65 52C62 50 57 51 54 54L56 73C58 78 63 78 65 73Z" />
    </G>;
    if (muscle === 'calves') return <G fill={color} opacity={opacity} stroke={color} strokeWidth={strokeWidth}>
      <Path d="M37 76C40 74 43 76 44 80L43 92C41 96 37 95 36 91Z" />
      <Path d="M63 76C60 74 57 76 56 80L57 92C59 96 63 95 64 91Z" />
    </G>;
  }
  if (muscle === 'shoulders') return <G fill={color} opacity={opacity} stroke={color} strokeWidth={strokeWidth}>
    <Path d="M25 17C29 13 37 14 41 18C42 22 39 26 35 27C30 25 27 22 25 17Z" />
    <Path d="M75 17C71 13 63 14 59 18C58 22 61 26 65 27C70 25 73 22 75 17Z" />
  </G>;
  if (muscle === 'back') return <Path d="M39 22C44 19 56 19 61 22L65 39C60 46 54 48 50 47C46 48 40 46 35 39Z" fill={color} opacity={opacity} stroke={color} strokeWidth={strokeWidth} />;
  if (muscle === 'triceps') return <G fill={color} opacity={opacity} stroke={color} strokeWidth={strokeWidth}>
    <Path d="M19 26C22 24 27 27 28 31L26 40C23 43 20 41 18 37L18 31C18 29 18 27 19 26Z" />
    <Path d="M81 26C78 24 73 27 72 31L74 40C77 43 80 41 82 37L82 31C82 29 82 27 81 26Z" />
  </G>;
  if (muscle === 'glutes') return <G fill={color} opacity={opacity} stroke={color} strokeWidth={strokeWidth}>
    <Path d="M35 45C40 43 47 46 50 50C48 57 41 60 35 56Z" />
    <Path d="M65 45C60 43 53 46 50 50C52 57 59 60 65 56Z" />
  </G>;
  if (muscle === 'hamstrings') return <G fill={color} opacity={opacity} stroke={color} strokeWidth={strokeWidth}>
    <Path d="M35 58C39 56 44 58 46 61L44 76C41 80 37 78 35 74Z" />
    <Path d="M65 58C61 56 56 58 54 61L56 76C59 80 63 78 65 74Z" />
  </G>;
  if (muscle === 'calves') return <G fill={color} opacity={opacity} stroke={color} strokeWidth={strokeWidth}>
    <Path d="M37 76C40 74 43 76 44 80L43 92C41 96 37 95 36 91Z" />
    <Path d="M63 76C60 74 57 76 56 80L57 92C59 96 63 95 64 91Z" />
  </G>;
  return null;
}

const muscleMasks: Record<BodySide, Partial<Record<MuscleGroup, number>>> = {
  front: {
    shoulders: require('@/assets/images/muscle-masks/front-shoulders.png'),
    chest: require('@/assets/images/muscle-masks/front-chest.png'),
    biceps: require('@/assets/images/muscle-masks/front-biceps.png'),
    core: require('@/assets/images/muscle-masks/front-core.png'),
    quadriceps: require('@/assets/images/muscle-masks/front-quadriceps.png'),
    calves: require('@/assets/images/muscle-masks/front-calves.png'),
  },
  back: {
    shoulders: require('@/assets/images/muscle-masks/back-shoulders.png'),
    back: require('@/assets/images/muscle-masks/back-back.png'),
    triceps: require('@/assets/images/muscle-masks/back-triceps.png'),
    glutes: require('@/assets/images/muscle-masks/back-glutes.png'),
    hamstrings: require('@/assets/images/muscle-masks/back-hamstrings.png'),
    calves: require('@/assets/images/muscle-masks/back-calves.png'),
  },
};

const workoutMaps: Record<WorkoutMapKey, number> = {
  push: require('@/assets/images/workout-day-visuals/push.png'),
  pull: require('@/assets/images/workout-day-visuals/pull.png'),
  leg: require('@/assets/images/workout-day-visuals/leg.png'),
  upper: require('@/assets/images/workout-day-visuals/upper.png'),
  lower: require('@/assets/images/workout-day-visuals/lower.png'),
  'push-core': require('@/assets/images/workout-day-visuals/push-core.png'),
  'pull-triceps': require('@/assets/images/workout-day-visuals/pull-triceps.png'),
  full: require('@/assets/images/workout-day-visuals/full.png'),
};

export function MuscleAnatomy({ side, activeMuscles, mapKey, selectedMuscle, onSelect }: MuscleAnatomyProps) {
  const hotspots = side === 'front' ? frontHotspots : backHotspots;
  const imageLeft = side === 'front' ? 0 : '-100%';
  return <View style={styles.crop}>
    <Image
      source={workoutMaps[mapKey]}
      resizeMode="stretch"
      style={[styles.referenceImage, { left: imageLeft }]}
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
  highlightLayer: { position: 'absolute', top: 0, left: 0, zIndex: 1 },
  hotspot: { position: 'absolute', zIndex: 2 },
});