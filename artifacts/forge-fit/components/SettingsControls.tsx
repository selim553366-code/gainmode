import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { languageLabels, type Language } from '@/lib/i18n';
import { Ionicons } from '@/components/AppIcon';
import { EASE_IN_OUT, PressableScale as Pressable } from '@/components/Motion';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const flags: Record<Language, number> = {
  tr: require('@/assets/images/flags/tr.png'),
  en: require('@/assets/images/flags/gb.png'),
  de: require('@/assets/images/flags/de.png'),
  fr: require('@/assets/images/flags/fr.png'),
  es: require('@/assets/images/flags/es.png'),
};

const select = () => Haptics.selectionAsync().catch(() => undefined);

/** Single-choice list in the iOS Settings pattern: flag, native name, code, and a check on the chosen row. */
export function LanguageList({ value, onChange }: { value: Language; onChange: (language: Language) => void }) {
  const colors = useColors();
  const languages = Object.keys(languageLabels) as Language[];
  return <View accessibilityRole="radiogroup" style={[styles.list, { borderColor: colors.border }]}>
    {languages.map((item, index) => {
      const active = item === value;
      return <Pressable
        key={item}
        scaleTo={0.985}
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
        accessibilityLabel={languageLabels[item]}
        onPress={() => { if (!active) { select(); onChange(item); } }}
        style={({ pressed }) => [styles.listRow, index > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border } : null, { backgroundColor: pressed ? colors.secondary : 'transparent' }]}
      >
        <View style={[styles.flag, { borderColor: colors.border }]}><Image source={flags[item]} resizeMode="cover" style={styles.flagImage} /></View>
        <Text style={[styles.listLabel, { color: colors.foreground, fontFamily: active ? 'Inter_600SemiBold' : 'Inter_500Medium' }]}>{languageLabels[item]}</Text>
        <Text style={[styles.listCode, { color: colors.mutedForeground }]}>{item.toUpperCase()}</Text>
        {active
          ? <View style={[styles.radio, { backgroundColor: colors.primary, borderColor: colors.primary }]}><Ionicons name="checkmark" size={13} color={colors.primaryForeground} /></View>
          : <View style={[styles.radio, { borderColor: colors.border }]} />}
      </Pressable>;
    })}
  </View>;
}

export type SegmentOption<T extends string> = { value: T; label: string; icon: IconName };

/**
 * Segmented control: one track, a raised thumb that glides to the chosen segment (250ms ease-in-out,
 * transform only). Equal segments, so the thumb position is derived from the track width.
 */
export function SegmentedControl<T extends string>({ options, value, onChange }: { options: SegmentOption<T>[]; value: T; onChange: (value: T) => void }) {
  const colors = useColors();
  const [trackWidth, setTrackWidth] = React.useState(0);
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  const segmentWidth = trackWidth ? (trackWidth - TRACK_PADDING * 2) / options.length : 0;
  const x = useSharedValue(0);
  const placed = React.useRef(false);

  React.useEffect(() => {
    if (!segmentWidth) return;
    const target = index * segmentWidth;
    if (!placed.current) {
      x.set(target);
      placed.current = true;
    } else {
      x.set(withTiming(target, { duration: 250, easing: EASE_IN_OUT, reduceMotion: ReduceMotion.System }));
    }
  }, [index, segmentWidth, x]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return <View
    accessibilityRole="radiogroup"
    onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
    style={[styles.track, { backgroundColor: colors.secondary }]}
  >
    {segmentWidth ? <Animated.View pointerEvents="none" style={[styles.thumb, { width: segmentWidth, backgroundColor: colors.segmentActive }, thumbStyle]} /> : null}
    {options.map((option) => {
      const active = option.value === value;
      return <Pressable
        key={option.value}
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
        accessibilityLabel={option.label}
        onPress={() => { if (!active) { select(); onChange(option.value); } }}
        style={styles.segment}
      >
        <Ionicons name={option.icon} size={16} color={active ? colors.foreground : colors.mutedForeground} />
        <Text style={[styles.segmentLabel, { color: active ? colors.foreground : colors.mutedForeground, fontFamily: active ? 'Inter_600SemiBold' : 'Inter_500Medium' }]}>{option.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const TRACK_PADDING = 4;

const styles = StyleSheet.create({
  list: { marginTop: 18, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  listRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 },
  flag: { width: 26, height: 26, borderRadius: 13, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  flagImage: { width: '100%', height: '100%' },
  listLabel: { flex: 1, fontSize: 15, letterSpacing: -0.2 },
  listCode: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  track: { marginTop: 18, height: 46, borderRadius: 23, padding: TRACK_PADDING, flexDirection: 'row' },
  thumb: {
    position: 'absolute',
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
    borderRadius: 19,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  segmentLabel: { fontSize: 13 },
});
