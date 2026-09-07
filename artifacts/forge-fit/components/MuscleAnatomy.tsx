import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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

const frontShapes: Partial<Record<MuscleGroup, string[]>> = {
  shoulders: [
    'M27 17 C31 13 38 13 43 18 L41 27 C36 29 30 27 26 23 Z',
    'M73 17 C69 13 62 13 57 18 L59 27 C64 29 70 27 74 23 Z',
  ],
  chest: [
    'M39 22 C44 20 49 22 50 26 L49 36 C44 38 40 35 38 31 Z',
    'M61 22 C56 20 51 22 50 26 L51 36 C56 38 60 35 62 31 Z',
  ],
  biceps: [
    'M25 24 C20 27 20 37 23 45 L30 43 L34 27 Z',
    'M75 24 C80 27 80 37 77 45 L70 43 L66 27 Z',
  ],
  core: ['M41 35 L49 34 L49 53 L41 50 Z', 'M59 35 L51 34 L51 53 L59 50 Z'],
  quadriceps: [
    'M36 51 C33 59 35 70 36 76 L48 76 L49 52 Z',
    'M64 51 C67 59 65 70 64 76 L52 76 L51 52 Z',
  ],
  calves: [
    'M37 77 C34 83 36 91 37 94 L47 93 L49 77 Z',
    'M63 77 C66 83 64 91 63 94 L53 93 L51 77 Z',
  ],
};

const backShapes: Partial<Record<MuscleGroup, string[]>> = {
  shoulders: [
    'M27 17 C31 13 38 13 43 18 L41 27 C36 29 30 27 26 23 Z',
    'M73 17 C69 13 62 13 57 18 L59 27 C64 29 70 27 74 23 Z',
  ],
  back: [
    'M39 21 C44 24 48 24 50 21 L49 47 C44 44 40 39 38 30 Z',
    'M61 21 C56 24 52 24 50 21 L51 47 C56 44 60 39 62 30 Z',
  ],
  triceps: [
    'M25 24 C20 27 20 37 23 45 L30 43 L34 27 Z',
    'M75 24 C80 27 80 37 77 45 L70 43 L66 27 Z',
  ],
  glutes: ['M36 46 C39 42 47 43 50 48 L49 61 C44 64 38 60 36 55 Z', 'M64 46 C61 42 53 43 50 48 L51 61 C56 64 62 60 64 55 Z'],
  hamstrings: [
    'M36 58 C33 65 35 72 36 78 L48 77 L49 59 Z',
    'M64 58 C67 65 65 72 64 78 L52 77 L51 59 Z',
  ],
  calves: [
    'M37 79 C34 84 36 91 37 94 L47 93 L49 79 Z',
    'M63 79 C66 84 64 91 63 94 L53 93 L51 79 Z',
  ],
};

export function MuscleAnatomy({ side, activeMuscles, selectedMuscle, onSelect, activeColor, selectedColor }: MuscleAnatomyProps) {
  const hotspots = side === 'front' ? frontHotspots : backHotspots;
  const shapes = side === 'front' ? frontShapes : backShapes;
  return <View style={styles.crop}>
    <Image
      source={require('@/assets/images/muscle-anatomy-clean.png')}
      resizeMode="stretch"
      style={[styles.referenceImage, { left: side === 'front' ? 0 : '-100%' }]}
      accessibilityLabel={side === 'front' ? 'Front muscle anatomy' : 'Back muscle anatomy'}
    />
    <Svg pointerEvents="none" style={styles.highlightLayer} viewBox="0 0 100 100">
      {activeMuscles.flatMap((muscle) => (shapes[muscle] ?? []).map((path, index) => <Path
        key={`${muscle}-highlight-${index}`}
        d={path}
        fill={selectedMuscle === muscle ? `${selectedColor}D9` : `${activeColor}B8`}
        stroke={selectedMuscle === muscle ? selectedColor : activeColor}
        strokeWidth="0.6"
      />))}
    </Svg>
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
  highlightLayer: { ...StyleSheet.absoluteFillObject },
  hotspot: { position: 'absolute' },
});