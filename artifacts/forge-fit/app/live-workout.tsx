import React from 'react';
import { Animated, Easing, Image, Linking, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
  cameraDisplayX,
  type ExerciseKind,
  type LiveWarningKey,
  type PoseLandmarks,
  type PoseJoint,
  type RepState,
} from '@/lib/liveWorkout';

import Svg, { Circle, Line } from 'react-native-svg';

const skeletonConnections: Array<[PoseJoint, PoseJoint]> = [
  ['nose', 'leftShoulder'], ['nose', 'rightShoulder'],
  ['leftShoulder', 'rightShoulder'], ['leftShoulder', 'leftElbow'], ['leftElbow', 'leftWrist'],
  ['rightShoulder', 'rightElbow'], ['rightElbow', 'rightWrist'],
  ['leftShoulder', 'leftHip'], ['rightShoulder', 'rightHip'], ['leftHip', 'rightHip'],
  ['leftHip', 'leftKnee'], ['leftKnee', 'leftAnkle'],
  ['rightHip', 'rightKnee'], ['rightKnee', 'rightAnkle'],
];

function SkeletonOnlyOverlay({ pose, width, height, color }: { pose: PoseLandmarks; width: number; height: number; color: string }) {
  const displayX = (normalizedX: number) => cameraDisplayX(normalizedX) * width;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {skeletonConnections.map(([from, to]) => {
        const start = pose[from];
        const end = pose[to];
        if (!start || !end) return null;
        return <Line key={`${from}-${to}`} x1={displayX(start.x)} y1={start.y * height} x2={displayX(end.x)} y2={end.y * height} stroke={color} strokeWidth={4} strokeLinecap="round" opacity={0.92} />;
      })}
      {(Object.entries(pose) as Array<[PoseJoint, PoseLandmarks[PoseJoint]]>).map(([joint, point]) => point
        ? <Circle key={joint} cx={displayX(point.x)} cy={point.y * height} r={6} fill={color} opacity={0.98} />
        : null)}
    </Svg>
  </View>;
}

function guideImageForKind(kind: ExerciseKind) {
  if (kind === 'squat') return require('@/assets/images/live-guide-coach-squat-oblique-skeleton.png');
  if (kind === 'lunge') return require('@/assets/images/live-guide-coach-lunge-oblique-skeleton.png');
  return require('@/assets/images/live-guide-coach-pushup-oblique-skeleton.png');
}

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
  const [analysis, setAnalysis] = React.useState(() => ({ state: initialRepState, warning: 'liveLookingForBody' as LiveWarningKey, confidence: 0, metric: null as number | null, depthPercent: 0 }));
  const [cameraError, setCameraError] = React.useState(false);
  const [showRepsPanel, setShowRepsPanel] = React.useState(true);
  const [skeletonOnly, setSkeletonOnly] = React.useState(false);
  const [showFormGuide, setShowFormGuide] = React.useState(true);
  const [skeletonPose, setSkeletonPose] = React.useState<PoseLandmarks>({});
  const stateRef = React.useRef<RepState>(initialRepState);
  const repTone = useAudioPlayer(require('@/assets/sounds/rep-confirmation.wav'));
  const repPulse = React.useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();

  React.useEffect(() => {
    repTone.volume = 0.55;
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }, [repTone]);

  if (cameraError) return <UnsupportedLiveWorkout title={t('cameraUnavailableTitle')} body={t('poseEngineError')} />;
  if (permission.error) return <UnsupportedLiveWorkout title={t('cameraUnavailableTitle')} body={t('poseEngineError')} />;
  if (!permission.granted) return <PermissionView onAllow={() => { permission.request().catch(() => setCameraError(true)); }} pending={permission.pending} canAskAgain={permission.canAskAgain} />;

  const title = kind === 'squat' ? t('liveSquat') : kind === 'pushup' ? t('livePushup') : t('liveLunge');
  const directionHint = kind === 'pushup' ? t('livePushupView') : kind === 'squat' ? t('liveSquatView') : t('liveLungeView');
  const handlePose = (frame: PoseFrame) => {
    const previousState = stateRef.current;
    const currentPose = poseFromFrame(frame);
    setSkeletonPose(currentPose);
    const result = analyzePose(kind, currentPose, previousState, frame.timestamp);
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

  return <View testID="live-workout-compact-panel" style={[styles.cameraRoot, { backgroundColor: skeletonOnly ? colors.black : colors.background }]}>
    <PoseCamera
       style={[StyleSheet.absoluteFill, skeletonOnly ? styles.hiddenCamera : null]}
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
       onReady={({ facing }) => { if (facing !== 'front') setCameraError(true); }}
       onCameraChange={({ facing }) => { if (facing !== 'front') setCameraError(true); }}
      onError={() => setCameraError(true)}
    />
     {skeletonOnly ? <SkeletonOnlyOverlay pose={skeletonPose} width={width} height={height} color={colors.primary} /> : null}
     {!skeletonOnly ? <View pointerEvents="none" style={styles.cameraShade} /> : null}
     {!skeletonOnly ? <View pointerEvents="none" style={[styles.neonFrame, { borderColor: colors.primary, shadowColor: colors.primary }]} /> : null}
    <View style={[styles.liveHeader, { paddingTop: insets.top + 14 }]}>
      <View style={[styles.liveBadge, { backgroundColor: `${colors.destructive}D9` }]}><View style={styles.liveDot} /><Text style={styles.liveBadgeText}>{t('live')}</Text></View>
      <View style={[styles.exerciseBadge, { backgroundColor: `${colors.background}D9`, borderColor: `${colors.primary}65` }]}><Ionicons name="activity" size={15} color={colors.primary} /><Text style={[styles.exerciseBadgeText, { color: colors.foreground }]}>{title}</Text></View>
       <Pressable testID="toggle-skeleton-mode" accessibilityRole="button" accessibilityLabel={skeletonOnly ? t('cameraMode') : t('skeletonOnlyMode')} onPress={() => setSkeletonOnly((value) => !value)} style={({ pressed }) => [styles.modeToggle, { backgroundColor: `${colors.background}D9`, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}><Ionicons name={skeletonOnly ? 'camera-outline' : 'body-outline'} size={18} color={colors.primary} /></Pressable>
      <Pressable accessibilityLabel={t('stopLiveWorkout')} onPress={() => router.back()} style={[styles.closeButton, { backgroundColor: `${colors.background}D9`, borderColor: colors.border }]}><Ionicons name="close" size={20} color={colors.foreground} /></Pressable>
    </View>
       {!skeletonOnly && !showFormGuide ? <View pointerEvents="none" style={[styles.directionHint, { top: insets.top + 62, backgroundColor: `${colors.background}D9`, borderColor: `${colors.primary}55` }]}>
       <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
       <Text style={[styles.directionHintText, { color: colors.foreground }]}>{directionHint}</Text>
      </View> : null}
       <View
         accessibilityLabel={`${t('liveDepth')} ${analysis.depthPercent}%`}
         style={[styles.depthSideRail, { backgroundColor: `${colors.background}D9`, borderColor: `${colors.foreground}28` }]}
       >
         <Text style={[styles.depthSideCaption, { color: colors.mutedForeground }]}>{t('liveDepth').toUpperCase()}</Text>
         <Text style={[styles.depthSidePercent, { color: analysis.depthPercent >= 100 ? colors.success : colors.foreground }]}>{analysis.depthPercent}%</Text>
         <View style={[styles.depthTrack, { backgroundColor: `${colors.foreground}18`, borderColor: `${colors.foreground}28` }]}>
           <View style={[styles.depthTargetLine, { backgroundColor: colors.success }]} />
           <View style={[styles.depthFill, { height: `${analysis.depthPercent}%`, backgroundColor: analysis.depthPercent >= 100 ? colors.success : colors.primary }]} />
         </View>
         <Text style={[styles.depthSideTarget, { color: colors.success }]}>100%</Text>
       </View>
      {showRepsPanel ? <View testID="live-workout-reps-panel" style={[styles.cameraBottom, { paddingBottom: insets.bottom + 8, backgroundColor: `${colors.background}EC`, borderColor: colors.border }]}>
         <View style={styles.metricRow}>
          <View>
            <Text style={[styles.metricCaption, { color: colors.mutedForeground }]}>{t('reps').toUpperCase()}</Text>
            <Animated.Text style={[styles.repNumber, { color: colors.foreground, transform: [{ scale: repPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.24] }) }] }]}>{analysis.state.reps}</Animated.Text>
          </View>
          <View style={styles.panelControls}>
            <View style={[styles.confidencePill, { backgroundColor: `${analysis.confidence > 0.65 ? colors.success : colors.orange}20` }]}><View style={[styles.confidenceDot, { backgroundColor: analysis.confidence > 0.65 ? colors.success : colors.orange }]} /><Text style={[styles.confidenceText, { color: analysis.confidence > 0.65 ? colors.success : colors.orange }]}>{Math.round(analysis.confidence * 100)}%</Text></View>
            <Pressable testID="hide-live-reps-panel" accessibilityRole="button" accessibilityLabel={t('hideRepsPanel')} onPress={() => setShowRepsPanel(false)} hitSlop={8} style={({ pressed }) => [styles.panelToggleButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.65 : 1 }]}>
              <Ionicons name="eye-off-outline" size={16} color={colors.foreground} />
            </Pressable>
          </View>
        </View>
        <View style={[styles.cameraPlacementHint, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}35` }]}><Ionicons name="camera-outline" size={15} color={colors.primary} /><Text style={[styles.cameraPlacementText, { color: colors.mutedForeground }]}>{t('liveCameraPlacement')}</Text></View>
        <View style={[styles.feedback, { backgroundColor: analysis.warning === 'liveGoodForm' ? `${colors.success}18` : `${colors.orange}18`, borderColor: analysis.warning === 'liveGoodForm' ? `${colors.success}45` : `${colors.orange}45` }]}><Ionicons name={analysis.warning === 'liveGoodForm' ? 'checkmark-circle' : 'alert-circle'} size={19} color={analysis.warning === 'liveGoodForm' ? colors.success : colors.orange} /><Text style={[styles.feedbackText, { color: colors.foreground }]}>{t(analysis.warning)}</Text></View>
        <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>{t('livePrivacyNote')}</Text>
       </View> : <Pressable testID="show-live-reps-panel" accessibilityRole="button" accessibilityLabel={t('showRepsPanel')} onPress={() => setShowRepsPanel(true)} style={({ pressed }) => [styles.showRepsButton, { bottom: insets.bottom + 22, backgroundColor: `${colors.background}EC`, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
        <Ionicons name="eye-outline" size={16} color={colors.primary} />
        <Text style={[styles.showRepsButtonText, { color: colors.foreground }]}>{t('showRepsPanel')}</Text>
      </Pressable>}
       {showFormGuide ? <View style={styles.guideBackdrop}>
         <View style={[styles.guideCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
           <View style={styles.guideHeader}>
             <View style={styles.guideTitleRow}>
               <View style={[styles.guideIcon, { backgroundColor: `${colors.primary}18` }]}>
                 <Ionicons name="body-outline" size={18} color={colors.primary} />
               </View>
               <View style={styles.guideTitleWrap}>
                 <Text style={[styles.guideEyebrow, { color: colors.primary }]}>{title}</Text>
                 <Text style={[styles.guideTitle, { color: colors.foreground }]}>{t('liveFormGuideTitle')}</Text>
               </View>
             </View>
             <Pressable testID="dismiss-live-form-guide" accessibilityRole="button" accessibilityLabel={t('liveFormGuideDismiss')} onPress={() => setShowFormGuide(false)} hitSlop={10} style={[styles.guideClose, { backgroundColor: colors.secondary }]}>
               <Ionicons name="close" size={18} color={colors.foreground} />
             </Pressable>
           </View>
           <Image source={guideImageForKind(kind)} resizeMode="cover" style={styles.guideImage} />
           <Text style={[styles.guideBody, { color: colors.foreground }]}>{directionHint}</Text>
           <View style={[styles.guideTip, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}35` }]}>
             <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
             <Text style={[styles.guideTipText, { color: colors.mutedForeground }]}>{t('liveFormGuideTip')}</Text>
           </View>
           <Pressable testID="start-live-form-analysis" accessibilityRole="button" accessibilityLabel={t('liveFormGuideDismiss')} onPress={() => setShowFormGuide(false)} style={({ pressed }) => [styles.guideAction, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}>
             <Text style={[styles.guideActionText, { color: colors.primaryForeground }]}>{t('liveFormGuideDismiss')}</Text>
             <Ionicons name="arrow-forward" size={17} color={colors.primaryForeground} />
           </Pressable>
         </View>
       </View> : null}
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
  hiddenCamera: { opacity: 0 },
  cameraShade: { ...StyleSheet.absoluteFill, backgroundColor: '#020B1830' },
  neonFrame: { ...StyleSheet.absoluteFill, margin: 18, borderWidth: 2, borderRadius: 30, shadowOpacity: 0.7, shadowRadius: 18 },
  liveHeader: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveBadge: { height: 32, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF' },
  liveBadgeText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1 },
  exerciseBadge: { flex: 1, height: 38, borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  exerciseBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  directionHint: { position: 'absolute', left: 20, right: 20, minHeight: 34, borderRadius: 13, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 7 },
  directionHintText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 15 },
  closeButton: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modeToggle: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cameraBottom: { position: 'absolute', left: 18, right: 18, bottom: 18, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingTop: 10 },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
   depthSideRail: { position: 'absolute', right: 12, top: '22%', bottom: '22%', width: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', paddingVertical: 12, zIndex: 6 },
   depthSideCaption: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 1.1, transform: [{ rotate: '-90deg' }], marginBottom: 8 },
   depthSidePercent: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 19, marginBottom: 8 },
   depthTrack: { width: 10, flex: 1, minHeight: 180, maxHeight: 520, borderRadius: 6, borderWidth: 1, overflow: 'hidden', justifyContent: 'flex-end' },
  depthFill: { width: '100%', borderRadius: 4 },
  depthTargetLine: { position: 'absolute', top: 0, left: -2, right: -2, height: 2, zIndex: 2 },
   depthSideTarget: { fontFamily: 'Inter_700Bold', fontSize: 8, lineHeight: 11, marginTop: 8 },
  panelControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelToggleButton: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  showRepsButton: { position: 'absolute', right: 20, borderRadius: 14, borderWidth: 1, minHeight: 36, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6 },
  showRepsButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  metricCaption: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 },
  repNumber: { fontFamily: 'Inter_700Bold', fontSize: 36, letterSpacing: -1.4, lineHeight: 40, marginTop: 1 },
  cameraPlacementHint: { minHeight: 30, borderRadius: 10, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5, marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  cameraPlacementText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 9, lineHeight: 12 },
  confidencePill: { borderRadius: 11, paddingHorizontal: 9, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  confidenceDot: { width: 7, height: 7, borderRadius: 4 },
  confidenceText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  feedback: { minHeight: 40, borderRadius: 12, borderWidth: 1, marginTop: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  feedbackText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 15 },
  privacyText: { fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 12, marginTop: 7 },
  guideBackdrop: { ...StyleSheet.absoluteFill, zIndex: 20, backgroundColor: '#020B18B8', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  guideCard: { width: '100%', maxWidth: 420, borderRadius: 24, borderWidth: 1, padding: 12, shadowColor: '#000000', shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  guideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  guideTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 9 },
  guideIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  guideTitleWrap: { flex: 1 },
  guideEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  guideTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, lineHeight: 24, marginTop: 1 },
  guideClose: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  guideImage: { width: '100%', height: 218, borderRadius: 16, backgroundColor: '#0B0D0C' },
  guideBody: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18, marginTop: 11 },
  guideTip: { minHeight: 42, borderRadius: 12, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 7, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  guideTipText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 14 },
  guideAction: { minHeight: 44, borderRadius: 14, marginTop: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  guideActionText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  fallbackIcon: { width: 78, height: 78, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  fallbackTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, lineHeight: 32, letterSpacing: -0.8, textAlign: 'center' },
  fallbackBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12, marginBottom: 24 },
  actionButton: { width: '100%', height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  settingsLink: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 18 },
  privacyNote: { width: '100%', borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
});