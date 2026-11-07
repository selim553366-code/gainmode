import React from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@/components/AppIcon';
import { ChargeButton } from '@/components/ChargeButton';
import { PressableScale as Pressable } from '@/components/Motion';
import { WeatherBackground } from '@/components/WeatherBackground';
import { getWeatherLabel } from '@/lib/weatherLabels';
import type { Language } from '@/lib/i18n';
import type { WeatherKind } from '@/lib/weatherBackground';

// The preview window plays the real chat backgrounds one after another.
const SCENES: Array<{ kind: WeatherKind; isDay: boolean }> = [
  { kind: 'clear', isDay: true },
  { kind: 'rain', isDay: true },
  { kind: 'snow', isDay: true },
  { kind: 'thunderstorm', isDay: false },
  { kind: 'clear', isDay: false },
];
const SCENE_MS = 2600;

/** One scene of the preview: fades in over the previous one, so the window reads as weather changing. */
function Scene({ kind, isDay, background, dark }: { kind: WeatherKind; isDay: boolean; background: string; dark: boolean }) {
  const reveal = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(reveal, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, [reveal]);
  return <WeatherBackground kind={kind} isDay={isDay} reveal={reveal} background={background} dark={dark} />;
}

/**
 * Asks to turn on the weather chat background. A live window at the top cycles through real backgrounds
 * (sun, rain, snow, a night storm, a clear night) with the weather's name, so the choice is shown, not described.
 */
export function WeatherIntroSheet({ visible, language, title, body, note, acceptLabel, declineLabel, onAccept, onDecline }: {
  visible: boolean;
  language: Language;
  title: string;
  body: string;
  note: string;
  acceptLabel: string;
  declineLabel: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const colors = useColors();
  const dark = colors.colorScheme === 'dark';
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    if (!visible) return undefined;
    setIndex(0);
    const timer = setInterval(() => setIndex((value) => (value + 1) % SCENES.length), SCENE_MS);
    return () => clearInterval(timer);
  }, [visible]);
  const scene = SCENES[index];
  const previous = SCENES[(index + SCENES.length - 1) % SCENES.length];

  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDecline}>
    <View style={styles.backdrop}>
      <Pressable scaleTo={1} accessibilityLabel={declineLabel} onPress={onDecline} style={StyleSheet.absoluteFill} />
      <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.window}>
          {/* The previous scene stays underneath while the next one fades in. */}
          <View style={StyleSheet.absoluteFill}><Scene key={`p-${index}`} kind={previous.kind} isDay={previous.isDay} background={colors.background} dark={dark} /></View>
          <View style={StyleSheet.absoluteFill}><Scene key={`s-${index}`} kind={scene.kind} isDay={scene.isDay} background={colors.background} dark={dark} /></View>
          <LinearGradient colors={[`${colors.card}00`, colors.card]} style={styles.windowFade} />
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{getWeatherLabel(language, scene.kind)}</Text>
          </View>
          <View style={styles.bubble}><Text style={styles.bubbleText}>FitBud</Text></View>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{body}</Text>
          <View style={[styles.note, { backgroundColor: `${colors.success}12` }]}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colors.success} />
            <Text style={[styles.noteText, { color: colors.foreground }]}>{note}</Text>
          </View>
          <View style={styles.actions}>
            <ChargeButton testID="weather-accept" label={acceptLabel} tones={['#2563EB', '#38BDF8']} onPress={onAccept} />
            <Pressable testID="weather-decline" accessibilityRole="button" onPress={onDecline} hitSlop={8} style={styles.decline}>
              <Text style={[styles.declineText, { color: colors.mutedForeground }]}>{declineLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(6,10,24,0.55)', justifyContent: 'flex-end', padding: 12 },
  sheet: { borderRadius: 34, borderWidth: 1, overflow: 'hidden' },
  window: { height: 190, overflow: 'hidden' },
  windowFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70 },
  liveChip: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: 'rgba(11,21,48,0.55)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3DD68C' },
  liveText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#FFFFFF' },
  bubble: { position: 'absolute', right: 16, bottom: 40, borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.9)' },
  bubbleText: { fontFamily: 'Inter_800ExtraBold', fontSize: 12, color: '#0B1530' },
  copy: { paddingHorizontal: 22, paddingBottom: 18, marginTop: -8 },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 25, lineHeight: 29, letterSpacing: -1 },
  body: { fontFamily: 'Inter_500Medium', fontSize: 14.5, lineHeight: 21, marginTop: 8 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, marginTop: 14 },
  noteText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17 },
  actions: { marginTop: 18 },
  decline: { alignSelf: 'center', paddingVertical: 12, marginTop: 4 },
  declineText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
});
