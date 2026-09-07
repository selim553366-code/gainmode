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
    'M28 20 C31 15 38 14 43 19 L41 27 C36 29 31 27 28 24 Z',
    'M72 20 C69 15 62 14 57 19 L59 27 C64 29 69 27 72 24 Z',
  ],
  chest: [
    'M35 21 C40 18 48 19 49 23 L49 31 C44 34 37 32 34 28 Z',
    'M65 21 C60 18 52 19 51 23 L51 31 C56 34 63 32 66 28 Z',
  ],
  biceps: [
    'M28 25 C23 27 22 35 25 40 L31 39 L34 27 Z',
    'M72 25 C77 27 78 35 75 40 L69 39 L66 27 Z',
  ],
  core: ['M40 29 L49 28 L49 45 L40 43 Z', 'M60 29 L51 28 L51 45 L60 43 Z'],
  quadriceps: [
    'M36 46 C33 52 35 61 37 66 L48 65 L49 47 Z',
    'M64 46 C67 52 65 61 63 66 L52 65 L51 47 Z',
  ],
  calves: [
    'M38 67 C35 72 36 81 39 86 L47 84 L48 68 Z',
    'M62 67 C65 72 64 81 61 86 L53 84 L52 68 Z',
  ],
};

const backShapes: Partial<Record<MuscleGroup, string[]>> = {
  shoulders: [
    'M28 20 C31 15 38 14 43 19 L41 27 C36 29 31 27 28 24 Z',
    'M72 20 C69 15 62 14 57 19 L59 27 C64 29 69 27 72 24 Z',
  ],
  back: [
    'M35 20 C41 19 46 22 49 20 L49 43 C44 40 38 35 35 27 Z',
    'M65 20 C59 19 54 22 51 20 L51 43 C56 40 62 35 65 27 Z',
  ],
  triceps: [
    'M28 25 C23 27 22 35 25 40 L31 39 L34 27 Z',
    'M72 25 C77 27 78 35 75 40 L69 39 L66 27 Z',
  ],
  glutes: ['M35 42 C39 39 47 40 50 44 L49 54 C44 56 38 53 35 49 Z', 'M65 42 C61 39 53 40 50 44 L51 54 C56 56 62 53 65 49 Z'],
  hamstrings: [
    'M36 52 C34 57 35 63 37 67 L48 66 L49 53 Z',
    'M64 52 C66 57 65 63 63 67 L52 66 L51 53 Z',
  ],
  calves: [
    'M38 68 C35 73 36 81 39 86 L47 84 L48 69 Z',
    'M62 68 C65 73 64 81 61 86 L53 84 L52 69 Z',
  ],
};

export function MuscleAnatomy({ side, activeMuscles, selectedMuscle, onSelect, activeColor, selectedColor }: MuscleAnatomyProps) {
  const hotspots = side === 'front' ? frontHotspots : backHotspots;
  const shapes = side === 'front' ? frontShapes : backShapes;
  return <View style={styles.crop}>
    <Image
      source={require('@/assets/images/muscle-anatomy-final.png')}
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
            backgroundColor: 'transparent',
            borderWidth: 0,
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