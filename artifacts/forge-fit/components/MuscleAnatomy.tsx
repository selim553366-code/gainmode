import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Path, Polygon } from 'react-native-svg';
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
  labelBackgroundColor: string;
  labelTextColor: string;
  muscleLabels: Partial<Record<MuscleGroup, string>>;
  isDark?: boolean;
};

type Hotspot = {
  muscle: MuscleGroup;
  left: `${number}%`;
  top: `${number}%`;
  width: `${number}%`;
  height: `${number}%`;
  radius: number;
};

type CalloutLayout = {
  side: 'left' | 'right';
  labelTop: number;
  targetLeft: number;
  targetTop: number;
};

const calloutLayouts: Record<BodySide, Partial<Record<MuscleGroup, CalloutLayout>>> = {
  front: {
    shoulders: { side: 'left', labelTop: 10, targetLeft: 34, targetTop: 20 },
    chest: { side: 'right', labelTop: 20, targetLeft: 58, targetTop: 29 },
    biceps: { side: 'left', labelTop: 31, targetLeft: 25, targetTop: 36 },
    core: { side: 'right', labelTop: 40, targetLeft: 50, targetTop: 44 },
    quadriceps: { side: 'left', labelTop: 59, targetLeft: 42, targetTop: 64 },
    calves: { side: 'right', labelTop: 79, targetLeft: 57, targetTop: 84 },
  },
  back: {
    shoulders: { side: 'left', labelTop: 10, targetLeft: 34, targetTop: 22 },
    back: { side: 'right', labelTop: 23, targetLeft: 50, targetTop: 34 },
    triceps: { side: 'left', labelTop: 34, targetLeft: 25, targetTop: 36 },
    glutes: { side: 'right', labelTop: 47, targetLeft: 58, targetTop: 53 },
    hamstrings: { side: 'left', labelTop: 61, targetLeft: 42, targetTop: 68 },
    calves: { side: 'right', labelTop: 80, targetLeft: 57, targetTop: 84 },
  },
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

const darkWorkoutMaps: Record<WorkoutMapKey, { front: number; back: number }> = {
  push: { front: require('@/assets/images/workout-day-visuals/crops/push-front.png'), back: require('@/assets/images/workout-day-visuals/crops/push-back.png') },
  pull: { front: require('@/assets/images/workout-day-visuals/crops/pull-front.png'), back: require('@/assets/images/workout-day-visuals/crops/pull-back.png') },
  leg: { front: require('@/assets/images/workout-day-visuals/crops/leg-front.png'), back: require('@/assets/images/workout-day-visuals/crops/leg-back.png') },
  upper: { front: require('@/assets/images/workout-day-visuals/crops/upper-front.png'), back: require('@/assets/images/workout-day-visuals/crops/upper-back.png') },
  lower: { front: require('@/assets/images/workout-day-visuals/crops/lower-front.png'), back: require('@/assets/images/workout-day-visuals/crops/lower-back.png') },
  'push-core': { front: require('@/assets/images/workout-day-visuals/crops/push-core-front.png'), back: require('@/assets/images/workout-day-visuals/crops/push-core-back.png') },
  'pull-triceps': { front: require('@/assets/images/workout-day-visuals/crops/pull-triceps-front.png'), back: require('@/assets/images/workout-day-visuals/crops/pull-triceps-back.png') },
  full: { front: require('@/assets/images/workout-day-visuals/crops/full-front.png'), back: require('@/assets/images/workout-day-visuals/crops/full-back.png') },
};

const lightWorkoutMaps: Record<WorkoutMapKey, { front: number; back: number }> = {
  push: { front: require('@/assets/images/workout-day-visuals/crops/light/push-front-light.png'), back: require('@/assets/images/workout-day-visuals/crops/light/push-back-light.png') },
  pull: { front: require('@/assets/images/workout-day-visuals/crops/light/pull-front-light.png'), back: require('@/assets/images/workout-day-visuals/crops/light/pull-back-light.png') },
  leg: { front: require('@/assets/images/workout-day-visuals/crops/light/leg-front-light.png'), back: require('@/assets/images/workout-day-visuals/crops/light/leg-back-light.png') },
  upper: { front: require('@/assets/images/workout-day-visuals/crops/light/upper-front-light.png'), back: require('@/assets/images/workout-day-visuals/crops/light/upper-back-light.png') },
  lower: { front: require('@/assets/images/workout-day-visuals/crops/light/lower-front-light.png'), back: require('@/assets/images/workout-day-visuals/crops/light/lower-back-light.png') },
  'push-core': { front: require('@/assets/images/workout-day-visuals/crops/light/push-core-front-light.png'), back: require('@/assets/images/workout-day-visuals/crops/light/push-core-back-light.png') },
  'pull-triceps': { front: require('@/assets/images/workout-day-visuals/crops/light/pull-triceps-front-light.png'), back: require('@/assets/images/workout-day-visuals/crops/light/pull-triceps-back-light.png') },
  full: { front: require('@/assets/images/workout-day-visuals/crops/light/full-front-light.png'), back: require('@/assets/images/workout-day-visuals/crops/light/full-back-light.png') },
};

function MuscleCallouts({
  side,
  activeMuscles,
  onSelect,
  activeColor,
  labelBackgroundColor,
  labelTextColor,
  muscleLabels,
}: Pick<MuscleAnatomyProps, 'side' | 'activeMuscles' | 'onSelect' | 'activeColor' | 'labelBackgroundColor' | 'labelTextColor' | 'muscleLabels'>) {
  const layouts = calloutLayouts[side];
  const callouts = activeMuscles
    .map((muscle) => {
      const layout = layouts[muscle];
      return layout ? { muscle, ...layout } : null;
    })
    .filter((callout): callout is { muscle: MuscleGroup } & CalloutLayout => Boolean(callout));

  return <>
    <Svg pointerEvents="none" viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.calloutLines}>
      {callouts.map((callout) => {
        const startX = callout.side === 'left' ? 28 : 72;
        const arrowHead = callout.side === 'left'
          ? `${callout.targetLeft},${callout.targetTop} ${callout.targetLeft - 2.8},${callout.targetTop - 1.7} ${callout.targetLeft - 2.8},${callout.targetTop + 1.7}`
          : `${callout.targetLeft},${callout.targetTop} ${callout.targetLeft + 2.8},${callout.targetTop - 1.7} ${callout.targetLeft + 2.8},${callout.targetTop + 1.7}`;
        return <G key={`callout-line-${callout.muscle}`}>
          <Line
            x1={startX}
            y1={callout.labelTop + 5}
            x2={callout.targetLeft}
            y2={callout.targetTop}
            stroke={activeColor}
            strokeWidth={0.7}
            strokeLinecap="round"
          />
          <Polygon points={arrowHead} fill={activeColor} />
        </G>;
      })}
    </Svg>
    {callouts.map((callout) => <Pressable
      key={`callout-label-${callout.muscle}`}
      accessibilityRole="button"
      accessibilityLabel={muscleLabels[callout.muscle] ?? callout.muscle}
      onPress={() => onSelect(callout.muscle)}
      style={[
        styles.calloutLabel,
        callout.side === 'left' ? styles.calloutLabelLeft : styles.calloutLabelRight,
        { top: `${callout.labelTop}%`, backgroundColor: labelBackgroundColor, borderColor: activeColor },
      ]}
    >
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        numberOfLines={2}
        style={[styles.calloutLabelText, { color: labelTextColor }]}
      >
        {muscleLabels[callout.muscle] ?? callout.muscle}
      </Text>
    </Pressable>)}
  </>;
}

export function MuscleAnatomy({ side, activeMuscles, mapKey, selectedMuscle, onSelect, activeColor, selectedColor, labelBackgroundColor, labelTextColor, muscleLabels, isDark = false }: MuscleAnatomyProps) {
  const hotspots = side === 'front' ? frontHotspots : backHotspots;
  const workoutMap = (isDark ? darkWorkoutMaps : lightWorkoutMaps)[mapKey];
  return <View style={styles.crop}>
    <Image
      source={workoutMap[side]}
      resizeMode="contain"
      style={styles.referenceImage}
      accessibilityLabel={side === 'front' ? 'Front muscle anatomy' : 'Back muscle anatomy'}
    />
    <MuscleCallouts
      side={side}
      activeMuscles={activeMuscles}
      onSelect={onSelect}
      activeColor={activeColor}
      labelBackgroundColor={labelBackgroundColor}
      labelTextColor={labelTextColor}
      muscleLabels={muscleLabels}
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
  referenceImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  calloutLines: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3 },
  calloutLabel: { position: 'absolute', width: '28%', minHeight: 26, borderWidth: 1, borderRadius: 10, paddingHorizontal: 4, paddingVertical: 3, alignItems: 'center', justifyContent: 'center', zIndex: 4, elevation: 3 },
  calloutLabelLeft: { left: '0.5%' },
  calloutLabelRight: { right: '0.5%' },
  calloutLabelText: { fontFamily: 'Inter_700Bold', fontSize: 9, lineHeight: 11, textAlign: 'center' },
  maskImage: { zIndex: 1 },
  highlightLayer: { position: 'absolute', top: 0, left: 0, zIndex: 1 },
  hotspot: { position: 'absolute', zIndex: 2 },
});