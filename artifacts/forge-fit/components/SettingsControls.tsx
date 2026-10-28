import React from 'react';
import { Image, Modal, StyleSheet, Text, View } from 'react-native';
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


/** A titled group of rows in one card, in the iOS Settings pattern. Rows are separated by hairlines. */
export function SettingsGroup({ title, children, footer }: { title?: string; children: React.ReactNode; footer?: string }) {
  const colors = useColors();
  const rows = React.Children.toArray(children).filter(Boolean);
  return <View style={styles.group}>
    {title ? <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text> : null}
    <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {rows.map((row, index) => <View key={index}>
        {index > 0 ? <View style={[styles.groupDivider, { backgroundColor: colors.border }]} /> : null}
        {row}
      </View>)}
    </View>
    {footer ? <Text style={[styles.groupFooter, { color: colors.mutedForeground }]}>{footer}</Text> : null}
  </View>;
}

/** One-line settings row: icon chip, title, optional detail and value, and a chevron when it navigates. */
export function SettingsRow({ icon, title, detail, value, accessory, onPress, destructive = false, chevron = Boolean(onPress), testID, children }: {
  icon: IconName;
  title: string;
  detail?: string;
  value?: string;
  /** A control shown at the end of the row, such as a switch. */
  accessory?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
  testID?: string;
  children?: React.ReactNode;
}) {
  const colors = useColors();
  const tint = destructive ? colors.destructive : colors.foreground;
  const content = <>
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: destructive ? `${colors.destructive}18` : colors.secondary }]}><Ionicons name={icon} size={17} color={tint} /></View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: tint }]}>{title}</Text>
        {detail ? <Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>{detail}</Text> : null}
      </View>
      {value ? <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
      {accessory}
      {chevron ? <Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} /> : null}
    </View>
    {children}
  </>;
  if (!onPress) return <View style={styles.rowWrap}>{content}</View>;
  return <Pressable testID={testID} accessibilityRole="button" scaleTo={0.99} onPress={onPress} style={({ pressed }) => [styles.rowWrap, { backgroundColor: pressed ? colors.secondary : 'transparent' }]}>{content}</Pressable>;
}

/** In-app confirmation sheet for destructive actions; works on every platform, unlike native alerts. */
export function ConfirmSheet({ visible, title, body, confirmLabel, cancelLabel, onConfirm, onCancel, busy = false }: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const colors = useColors();
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
    <View style={styles.confirmRoot}>
      <Pressable scaleTo={1} accessibilityLabel={cancelLabel} onPress={onCancel} style={StyleSheet.absoluteFill} />
      <View style={[styles.confirmSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.confirmIcon, { backgroundColor: `${colors.destructive}18` }]}><Ionicons name="trash-outline" size={22} color={colors.destructive} /></View>
        <Text style={[styles.confirmTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.confirmBody, { color: colors.mutedForeground }]}>{body}</Text>
        <Pressable testID="confirm-destructive" accessibilityRole="button" disabled={busy} onPress={onConfirm} style={[styles.confirmButton, { backgroundColor: colors.destructive, opacity: busy ? 0.6 : 1 }]}>
          <Text style={[styles.confirmButtonText, { color: '#FFFFFF' }]}>{confirmLabel}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel} style={[styles.confirmButton, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.confirmButtonText, { color: colors.foreground }]}>{cancelLabel}</Text>
        </Pressable>
      </View>
    </View>
  </Modal>;
}

const TRACK_PADDING = 4;

const styles = StyleSheet.create({
  group: { marginBottom: 24 },
  groupTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.2, marginBottom: 8, marginLeft: 4 },
  groupCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  // The hairline starts under the row titles, not under the icons, as in iOS lists.
  groupDivider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  groupFooter: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 8, marginHorizontal: 4 },
  rowWrap: { paddingHorizontal: 14, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 34 },
  rowIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, letterSpacing: -0.2 },
  rowDetail: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 2 },
  rowValue: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  confirmRoot: { flex: 1, justifyContent: 'flex-end', padding: 12, backgroundColor: '#000000A6' },
  confirmSheet: { borderRadius: 28, borderWidth: 1, padding: 22, gap: 10 },
  confirmIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  confirmTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.5 },
  confirmBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  confirmButton: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  confirmButtonText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
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
