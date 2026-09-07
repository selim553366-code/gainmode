import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import type { MuscleGroup } from '@/lib/workoutPlan';

type BodySide = 'front' | 'back';

type MuscleAnatomyProps = {
  side: BodySide;
  activeMuscles: MuscleGroup[];
  selectedMuscle: MuscleGroup | null;
  onSelect: (muscle: MuscleGroup) => void;
  baseColor: string;
  lineColor: string;
  activeColor: string;
  selectedColor: string;
};

function muscleFill(group: MuscleGroup, activeMuscles: MuscleGroup[], selectedMuscle: MuscleGroup | null, baseColor: string, activeColor: string, selectedColor: string) {
  if (selectedMuscle === group) return selectedColor;
  if (activeMuscles.includes(group)) return activeColor;
  return baseColor;
}

export function MuscleAnatomy({
  side,
  activeMuscles,
  selectedMuscle,
  onSelect,
  baseColor,
  lineColor,
  activeColor,
  selectedColor,
}: MuscleAnatomyProps) {
  const fill = (group: MuscleGroup) => muscleFill(group, activeMuscles, selectedMuscle, baseColor, activeColor, selectedColor);
  const stroke = (group: MuscleGroup) => selectedMuscle === group ? selectedColor : lineColor;
  const press = (group: MuscleGroup) => () => {
    if (activeMuscles.includes(group)) onSelect(group);
  };

  return <Svg width="100%" height="100%" viewBox="0 0 240 430" accessibilityLabel={side}>
    <Circle cx="120" cy="35" r="25" fill={baseColor} stroke={lineColor} strokeWidth="2" />
    <Path d="M108 59 L106 78 L84 90 L72 133 L79 196 L92 232 L91 291 L83 385 L102 385 L117 285 L123 285 L138 385 L157 385 L149 291 L148 232 L161 196 L168 133 L156 90 L134 78 L132 59 Z" fill={baseColor} stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />
    <Path d="M84 91 L64 105 L49 169 L60 174 L79 124 Z" fill={baseColor} stroke={lineColor} strokeWidth="2" />
    <Path d="M49 169 L40 232 L52 235 L62 174 Z" fill={baseColor} stroke={lineColor} strokeWidth="2" />
    <Path d="M156 91 L176 105 L191 169 L180 174 L161 124 Z" fill={baseColor} stroke={lineColor} strokeWidth="2" />
    <Path d="M191 169 L200 232 L188 235 L178 174 Z" fill={baseColor} stroke={lineColor} strokeWidth="2" />
    <Path d="M40 232 L35 266 L41 279 L47 253 L52 235 Z" fill={baseColor} stroke={lineColor} strokeWidth="2" />
    <Path d="M200 232 L205 266 L199 279 L193 253 L188 235 Z" fill={baseColor} stroke={lineColor} strokeWidth="2" />
    <Path d="M83 385 L78 413 L101 413 L102 385 Z" fill={baseColor} stroke={lineColor} strokeWidth="2" />
    <Path d="M157 385 L162 413 L139 413 L138 385 Z" fill={baseColor} stroke={lineColor} strokeWidth="2" />

    {side === 'front' ? <G>
      <G onPress={press('shoulders')}>
        <Path d="M106 79 C92 79 80 87 75 102 C79 116 86 119 94 112 L104 91 Z" fill={fill('shoulders')} stroke={stroke('shoulders')} strokeWidth="2" />
        <Path d="M134 79 C148 79 160 87 165 102 C161 116 154 119 146 112 L136 91 Z" fill={fill('shoulders')} stroke={stroke('shoulders')} strokeWidth="2" />
      </G>
      <G onPress={press('chest')}>
        <Path d="M105 91 C92 92 91 113 96 133 C103 143 112 138 118 132 L118 94 Z" fill={fill('chest')} stroke={stroke('chest')} strokeWidth="2" />
        <Path d="M135 91 C148 92 149 113 144 133 C137 143 128 138 122 132 L122 94 Z" fill={fill('chest')} stroke={stroke('chest')} strokeWidth="2" />
      </G>
      <G onPress={press('biceps')}>
        <Path d="M72 112 C60 120 58 148 54 168 L65 171 C72 153 79 132 82 116 Z" fill={fill('biceps')} stroke={stroke('biceps')} strokeWidth="2" />
        <Path d="M168 112 C180 120 182 148 186 168 L175 171 C168 153 161 132 158 116 Z" fill={fill('biceps')} stroke={stroke('biceps')} strokeWidth="2" />
      </G>
      <G onPress={press('core')}>
        <Path d="M101 140 L118 137 L118 203 L99 194 Z" fill={fill('core')} stroke={stroke('core')} strokeWidth="2" />
        <Path d="M139 140 L122 137 L122 203 L141 194 Z" fill={fill('core')} stroke={stroke('core')} strokeWidth="2" />
        <Line x1="101" y1="160" x2="139" y2="160" stroke={lineColor} strokeWidth="1" />
        <Line x1="100" y1="180" x2="140" y2="180" stroke={lineColor} strokeWidth="1" />
      </G>
      <G onPress={press('quadriceps')}>
        <Path d="M94 219 C82 244 89 291 88 329 L111 327 L117 231 Z" fill={fill('quadriceps')} stroke={stroke('quadriceps')} strokeWidth="2" />
        <Path d="M146 219 C158 244 151 291 152 329 L129 327 L123 231 Z" fill={fill('quadriceps')} stroke={stroke('quadriceps')} strokeWidth="2" />
        <Line x1="101" y1="236" x2="99" y2="316" stroke={lineColor} strokeWidth="1" />
        <Line x1="139" y1="236" x2="141" y2="316" stroke={lineColor} strokeWidth="1" />
      </G>
      <G onPress={press('calves')}>
        <Path d="M88 333 C79 349 83 382 85 392 L101 390 L108 335 Z" fill={fill('calves')} stroke={stroke('calves')} strokeWidth="2" />
        <Path d="M152 333 C161 349 157 382 155 392 L139 390 L132 335 Z" fill={fill('calves')} stroke={stroke('calves')} strokeWidth="2" />
      </G>
    </G> : <G>
      <G onPress={press('shoulders')}>
        <Path d="M106 79 C91 80 80 87 75 103 C79 116 87 120 96 111 L106 91 Z" fill={fill('shoulders')} stroke={stroke('shoulders')} strokeWidth="2" />
        <Path d="M134 79 C149 80 160 87 165 103 C161 116 153 120 144 111 L134 91 Z" fill={fill('shoulders')} stroke={stroke('shoulders')} strokeWidth="2" />
      </G>
      <G onPress={press('back')}>
        <Path d="M107 89 C91 101 89 133 94 174 L115 197 L118 91 Z" fill={fill('back')} stroke={stroke('back')} strokeWidth="2" />
        <Path d="M133 89 C149 101 151 133 146 174 L125 197 L122 91 Z" fill={fill('back')} stroke={stroke('back')} strokeWidth="2" />
        <Line x1="120" y1="91" x2="120" y2="198" stroke={lineColor} strokeWidth="2" />
      </G>
      <G onPress={press('triceps')}>
        <Path d="M73 111 C62 122 58 148 54 168 L65 171 L81 117 Z" fill={fill('triceps')} stroke={stroke('triceps')} strokeWidth="2" />
        <Path d="M167 111 C178 122 182 148 186 168 L175 171 L159 117 Z" fill={fill('triceps')} stroke={stroke('triceps')} strokeWidth="2" />
      </G>
      <G onPress={press('glutes')}>
        <Ellipse cx="104" cy="217" rx="19" ry="24" fill={fill('glutes')} stroke={stroke('glutes')} strokeWidth="2" />
        <Ellipse cx="136" cy="217" rx="19" ry="24" fill={fill('glutes')} stroke={stroke('glutes')} strokeWidth="2" />
      </G>
      <G onPress={press('hamstrings')}>
        <Path d="M93 239 C84 263 89 303 89 329 L111 327 L117 239 Z" fill={fill('hamstrings')} stroke={stroke('hamstrings')} strokeWidth="2" />
        <Path d="M147 239 C156 263 151 303 151 329 L129 327 L123 239 Z" fill={fill('hamstrings')} stroke={stroke('hamstrings')} strokeWidth="2" />
      </G>
      <G onPress={press('calves')}>
        <Path d="M88 333 C79 350 83 382 85 392 L101 390 L108 335 Z" fill={fill('calves')} stroke={stroke('calves')} strokeWidth="2" />
        <Path d="M152 333 C161 350 157 382 155 392 L139 390 L132 335 Z" fill={fill('calves')} stroke={stroke('calves')} strokeWidth="2" />
      </G>
    </G>}
    <Rect x="104" y="64" width="32" height="4" rx="2" fill={lineColor} opacity="0.4" />
  </Svg>;
}