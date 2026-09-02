import React from 'react';
import { Animated, Easing, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/AppIcon';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { PoseCamera, useCameraPermission } from 'react-native-pose-detection';
import type { PoseFrame } from 'react-native-pose-detection';
import { liveTranslate, type LiveWorkoutCopyKey } from '@/lib/liveWorkoutCopy';
import {
  analyzePose,
  exerciseKindFromName,
  initialRepState,
  poseFromFrame,
  type ExerciseKind,
  type LiveWarningKey,
  type RepState,
} from '@/lib/liveWorkout';

function ActionButton({ label, icon, onPress, disabled = false }: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; disabled?: boolean }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.actionButton, { backgroundColor: colors.primary, opacity: disabled ? 0.5 : pressed ? 0.75 : 1 }]}><Ionicons name={icon} size={18} color={colors.primaryForeground} /><Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>{label}</Text></Pressable>;
}

function UnsupportedLiveWorkout({ title, body }: { title: string; body: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useFit();
  const t = (key: LiveWorkoutCopyKey) => liveTranslate(language, key);
  return <View style={[styles.fallback, { backgroundColor: colors.background, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 20 }]}>
    <Pressable onPress={() => router.back()} style={[styles.closeButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="close" size={20} color={colors.foreground} /></Pressable>
    <View style={[styles.fallbackIcon, { backgroundColor: `${colors.primary}20` }]}><Ionicons name="camera-scan" size={36} color={colors.primary} /></View>
    <Text style={[styles.fallbackTitle, { color: colors.foreground }]}>{title}</Text>
    <Text style={[styles.fallbackBody, { color: colors.mutedForeground }]}>{body}</Text>
    <View style={[styles.privacyNote, { backgroundColor: `${colors.success}14`, borderColor: `${colors.success}35` }]}><Ionicons name="shield-checkmark-outline" size={17} color={colors.success} /><Text style={[styles.privacyText, { color: colors.success }]}>{t('livePrivacyNote')}</Text></View>
    <ActionButton label={t('stopLiveWorkout')} icon="close" onPress={() => router.back()} />
  </View>;
}

function PermissionView({ onAllow, pending, canAskAgain }: { onAllow: () => void; pending: boolean; canAskAgain: boolean }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useFit();
  const t = (key: LiveWorkoutCopyKey) => liveTranslate(language, key);
  return <View style={[styles.fallback, { backgroundColor: colors.background, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 20 }]}>
    <Pressable onPress={() => router.back()} style={[styles.closeButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="close" size={20} color={colors.foreground} /></Pressable>
    <View style={[styles.fallbackIcon, { backgroundColor: `${colors.primary}20` }]}><Ionicons name="camera-outline" size={36} color={colors.primary} /></View>
    <Text style={[styles.fallbackTitle, { color: colors.foreground }]}>{t('liveCameraPermissionTitle')}</Text>
    <Text style={[styles.fallbackBody, { color: colors.mutedForeground }]}>{t('liveCameraPermissionBody')}</Text>
    <ActionButton label={pending ? '…' : canAskAgain ? t('allowCamera') : t('openSettings')} icon="camera-outline" onPress={canAskAgain ? onAllow : () => Linking.openSettings().catch(() => undefined)} disabled={pending} />
    {!canAskAgain && <Pressable onPress={() => Linking.openSettings().catch(() => undefined)}><Text style={[styles.settingsLink, { color: colors.primary }]}>{t('openSettings')}</Text></Pressable>}
  </View>;
}

function NativeLiveCamera({ kind }: { kind: ExerciseKind }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useFit();
  const t = (key: LiveWorkoutCopyKey) => liveTranslate(language, key);
  const permission = useCameraPermission();
  const [analysis, setAnalysis] = React.useState(() => ({ state: initialRepState, warning: 'liveLookingForBody' as LiveWarningKey, confidence: 0, metric: null as number | null }));
  const [cameraError, setCameraError] = React.useState(false);
  const stateRef = React.useRef<RepState>(initialRepState);
  const repTone = useAudioPlayer(require('@/assets/sounds/rep-confirmation.wav'));
  const repPulse = React.useRef(new Animated.Value(0)).current;
  const guidePulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    repTone.volume = 0.55;
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }, [repTone]);

  React.useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(guidePulse, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(guidePulse, { toValue: 0, duration: 720, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [guidePulse]);

  if (cameraError) return <UnsupportedLiveWorkout title={t('cameraUnavailableTitle')} body={t('poseEngineError')} />;
  if (permission.error) return <UnsupportedLiveWorkout title={t('cameraUnavailableTitle')} body={t('poseEngineError')} />;
  if (!permission.granted) return <PermissionView onAllow={() => { permission.request().catch(() => setCameraError(true)); }} pending={permission.pending} canAskAgain={permission.canAskAgain} />;

  const title = kind === 'squat' ? t('liveSquat') : kind === 'pushup' ? t('livePushup') : t('liveLunge');
  const directionHint = kind === 'pushup' ? t('livePushupView') : kind === 'squat' ? t('liveSquatView') : t('liveLungeView');
  const poseGuide = kind === 'pushup' ? t('livePushupGuide') : kind === 'squat' ? t('liveSquatGuide') : t('liveLungeGuide');
  const handlePose = (frame: PoseFrame) => {
    const previousState = stateRef.current;
    const result = analyzePose(kind, poseFromFrame(frame), previousState, frame.timestamp);
    stateRef.current = result.state;
    if (result.state.reps > previousState.reps) {
      repPulse.stopAnimation();
      repPulse.setValue(0);
      Animated.sequence([
        Animated.timing(repPulse, { toValue: 1, duration: 130, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(repPulse, { toValue: 0, friction: 5, tension: 90, useNativeDriver: true }),
      ]).start();
      void repTone.seekTo(0).then(() => repTone.play()).catch(() => repTone.play());
    }
    setAnalysis(result);
  };

  const showPoseGuide = analysis.warning === 'liveLookingForBody' || analysis.confidence < 0.55;

  return <View style={styles.cameraRoot}>
    <PoseCamera
      style={StyleSheet.absoluteFillObject}
      facing="front"
       profile="quality"
      resolution="720p"
       analysisResolution="720p"
      targetFps={30}
       minConfidence={0.45}
      smoothing
      data={{ mode: 'throttled', throttleMs: 90, landmarks: true }}
       overlay={{ landmarks: true, connections: true, color: colors.primary, lineWidth: 4, pointRadius: 6, minVisibility: 0.25 }}
      onPose={handlePose}
      onError={() => setCameraError(true)}
    />
    <View pointerEvents="none" style={styles.cameraShade} />
    <View pointerEvents="none" style={[styles.neonFrame, { borderColor: colors.primary, shadowColor: colors.primary }]} />
    <View style={[styles.liveHeader, { paddingTop: insets.top + 14 }]}>
      <View style={[styles.liveBadge, { backgroundColor: `${colors.destructive}D9` }]}><View style={styles.liveDot} /><Text style={styles.liveBadgeText}>{t('live')}</Text></View>
      <View style={[styles.exerciseBadge, { backgroundColor: `${colors.background}D9`, borderColor: `${colors.primary}65` }]}><Ionicons name="activity" size={15} color={colors.primary} /><Text style={[styles.exerciseBadgeText, { color: colors.foreground }]}>{title}</Text></View>
      <Pressable accessibilityLabel={t('stopLiveWorkout')} onPress={() => router.back()} style={[styles.closeButton, { backgroundColor: `${colors.background}D9`, borderColor: colors.border }]}><Ionicons name="close" size={20} color={colors.foreground} /></Pressable>
    </View>
     <View pointerEvents="none" style={[styles.directionHint, { top: insets.top + 62, backgroundColor: `${colors.background}D9`, borderColor: `${colors.primary}55` }]}>
       <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
       <Text style={[styles.directionHintText, { color: colors.foreground }]}>{directionHint}</Text>
     </View>
      {showPoseGuide ? <Animated.View pointerEvents="none" style={[styles.poseGuide, { backgroundColor: `${colors.background}E8`, borderColor: `${colors.primary}70`, opacity: guidePulse.interpolate({ inputRange: [0, 1], outputRange: [0.58, 1] }) }]}>
        <Ionicons name="body-outline" size={24} color={colors.primary} />
        <Text style={[styles.poseGuideText, { color: colors.foreground }]}>{poseGuide}</Text>
      </Animated.View> : null}
    <View style={[styles.cameraBottom, { paddingBottom: insets.bottom + 14, backgroundColor: `${colors.background}EC`, borderColor: colors.border }]}>
       <View style={styles.metricRow}><View><Text style={[styles.metricCaption, { color: colors.mutedForeground }]}>{t('reps').toUpperCase()}</Text><Animated.Text style={[styles.repNumber, { color: colors.foreground, transform: [{ scale: repPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.24] }) }] }]}>{analysis.state.reps}</Animated.Text></View><View style={[styles.confidencePill, { backgroundColor: `${analysis.confidence > 0.65 ? colors.success : colors.orange}20` }]}><View style={[styles.confidenceDot, { backgroundColor: analysis.confidence > 0.65 ? colors.success : colors.orange }]} /><Text style={[styles.confidenceText, { color: analysis.confidence > 0.65 ? colors.success : colors.orange }]}>{Math.round(analysis.confidence * 100)}%</Text></View></View>
       <View style={[styles.cameraPlacementHint, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}35` }]}><Ionicons name="camera-outline" size={15} color={colors.primary} /><Text style={[styles.cameraPlacementText, { color: colors.mutedForeground }]}>{t('liveCameraPlacement')}</Text></View>
      <View style={[styles.feedback, { backgroundColor: analysis.warning === 'liveGoodForm' ? `${colors.success}18` : `${colors.orange}18`, borderColor: analysis.warning === 'liveGoodForm' ? `${colors.success}45` : `${colors.orange}45` }]}><Ionicons name={analysis.warning === 'liveGoodForm' ? 'checkmark-circle' : 'alert-circle'} size={19} color={analysis.warning === 'liveGoodForm' ? colors.success : colors.orange} /><Text style={[styles.feedbackText, { color: colors.foreground }]}>{t(analysis.warning)}</Text></View>
      <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>{t('livePrivacyNote')}</Text>
    </View>
  </View>;
}

export default function LiveWorkoutScreen() {
  const { language } = useFit();
  const params = useLocalSearchParams<{ exercise?: string }>();
  const t = (key: LiveWorkoutCopyKey) => liveTranslate(language, key);
  const kind = exerciseKindFromName(params.exercise ?? '') ?? 'squat';

  if (Platform.OS === 'web') return <UnsupportedLiveWorkout title={t('cameraUnavailableTitle')} body={t('cameraUnavailableBody')} />;
  return <NativeLiveCamera kind={kind} />;
}

const styles = StyleSheet.create({
  cameraRoot: { flex: 1, backgroundColor: '#020B18' },
  cameraShade: { ...StyleSheet.absoluteFillObject, backgroundColor: '#020B1830' },
  neonFrame: { ...StyleSheet.absoluteFillObject, margin: 18, borderWidth: 2, borderRadius: 30, shadowOpacity: 0.7, shadowRadius: 18 },
  liveHeader: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveBadge: { height: 32, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF' },
  liveBadgeText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1 },
  exerciseBadge: { flex: 1, height: 38, borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  exerciseBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  directionHint: { position: 'absolute', left: 20, right: 20, minHeight: 34, borderRadius: 13, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 7 },
  directionHintText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 15 },
  poseGuide: { position: 'absolute', left: 28, right: 28, top: '39%', borderRadius: 20, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 16, alignItems: 'center', gap: 8 },
  poseGuideText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  closeButton: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cameraBottom: { position: 'absolute', left: 18, right: 18, bottom: 18, borderRadius: 24, borderWidth: 1, paddingHorizontal: 18, paddingTop: 16 },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricCaption: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 },
  repNumber: { fontFamily: 'Inter_700Bold', fontSize: 43, letterSpacing: -1.8, lineHeight: 48, marginTop: 2 },
  cameraPlacementHint: { minHeight: 34, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  cameraPlacementText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 14 },
  confidencePill: { borderRadius: 13, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  confidenceDot: { width: 7, height: 7, borderRadius: 4 },
  confidenceText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  feedback: { minHeight: 48, borderRadius: 15, borderWidth: 1, marginTop: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  feedbackText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 17 },
  privacyText: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14, marginTop: 10 },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  fallbackIcon: { width: 78, height: 78, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  fallbackTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, lineHeight: 32, letterSpacing: -0.8, textAlign: 'center' },
  fallbackBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12, marginBottom: 24 },
  actionButton: { width: '100%', height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  settingsLink: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 18 },
  privacyNote: { width: '100%', borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
});