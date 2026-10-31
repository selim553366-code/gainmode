import React from 'react';
import { Animated, Easing, Linking, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { PressableScale as Pressable } from '@/components/Motion';
import { router, useLocalSearchParams } from 'expo-router';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Ionicons } from '@/components/AppIcon';
import { useColors } from '@/hooks/useColors';
import { useFit } from '@/context/FitContext';
import { isDesignPreview } from '@/lib/designPreview';
import { repDepthAt, simulatedPose } from '@/lib/livePoseSimulator';
import { LinearGradient } from 'expo-linear-gradient';
import { PoseCamera, useCameraPermission } from 'react-native-pose-detection';
import type { PoseFrame } from 'react-native-pose-detection';
import { liveTranslate, type LiveWorkoutCopyKey } from '@/lib/liveWorkoutCopy';
import {
  analyzePose,
  exerciseKindFromName,
  initialPoseTrackState,
  initialRepState,
  poseFromFrame,
  cameraDisplayX,
  stabilizePose,
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

/**
 * The rig drawn over the person: a soft glow under every bone, a crisp core line, ringed joints
 * and a head circle sized from the shoulders. Green while the form is good, orange on a warning,
 * white while it is still looking for the body. `body` adds a faint silhouette for the preview.
 */
function RigOverlay({ pose, width, height, tone, body = false, mirror = true }: { pose: PoseLandmarks; width: number; height: number; tone: string; body?: boolean; mirror?: boolean }) {
  const x = (value: number) => (mirror ? cameraDisplayX(value) : value) * width;
  const y = (value: number) => value * height;
  const ls = pose.leftShoulder;
  const rs = pose.rightShoulder;
  const neckBase = ls && rs ? { x: (x(ls.x) + x(rs.x)) / 2, y: (y(ls.y) + y(rs.y)) / 2 } : null;
  const hipMid = pose.leftHip && pose.rightHip ? { y: (y(pose.leftHip.y) + y(pose.rightHip.y)) / 2 } : null;
  // Head size follows the shoulders when square to the camera and the torso when side-on.
  const shoulderSpan = ls && rs ? Math.hypot(x(ls.x) - x(rs.x), y(ls.y) - y(rs.y)) : 0;
  const torsoSpan = neckBase && hipMid ? Math.abs(hipMid.y - neckBase.y) : 0;
  const headRadius = Math.max(14, shoulderSpan * 0.42, torsoSpan * 0.14);
  const bones = skeletonConnections.filter(([from, to]) => from !== 'nose' && pose[from] && pose[to]);
  const neck = pose.nose && neckBase && neckBase.y > y(pose.nose.y) + headRadius
    ? { x1: x(pose.nose.x), y1: y(pose.nose.y) + headRadius, x2: neckBase.x, y2: neckBase.y }
    : null;
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 3 }]}>
    <Svg width={width} height={height}>
      {body ? bones.map(([from, to]) => <Line key={`b-${from}-${to}`} x1={x(pose[from]!.x)} y1={y(pose[from]!.y)} x2={x(pose[to]!.x)} y2={y(pose[to]!.y)} stroke="#FFFFFF" strokeOpacity={0.07} strokeWidth={to.includes('Hip') || from.includes('Hip') ? 46 : 30} strokeLinecap="round" />) : null}
      {body && pose.nose ? <Circle cx={x(pose.nose.x)} cy={y(pose.nose.y)} r={headRadius * 1.2} fill="#FFFFFF" fillOpacity={0.07} /> : null}
      {bones.map(([from, to]) => <Line key={`g-${from}-${to}`} x1={x(pose[from]!.x)} y1={y(pose[from]!.y)} x2={x(pose[to]!.x)} y2={y(pose[to]!.y)} stroke={tone} strokeOpacity={0.25} strokeWidth={14} strokeLinecap="round" />)}
      {bones.map(([from, to]) => <Line key={`c-${from}-${to}`} x1={x(pose[from]!.x)} y1={y(pose[from]!.y)} x2={x(pose[to]!.x)} y2={y(pose[to]!.y)} stroke={tone} strokeWidth={4} strokeLinecap="round" />)}
      {neck ? <Line {...neck} stroke={tone} strokeOpacity={0.25} strokeWidth={14} strokeLinecap="round" /> : null}
      {neck ? <Line {...neck} stroke={tone} strokeWidth={4} strokeLinecap="round" /> : null}
      {pose.nose ? <Circle cx={x(pose.nose.x)} cy={y(pose.nose.y)} r={headRadius} stroke={tone} strokeWidth={3.5} fill="none" /> : null}
      {(Object.entries(pose) as Array<[PoseJoint, PoseLandmarks[PoseJoint]]>).map(([joint, point]) => point && joint !== 'nose'
        ? <React.Fragment key={joint}>
          <Circle cx={x(point.x)} cy={y(point.y)} r={9} fill={tone} fillOpacity={0.25} />
          <Circle cx={x(point.x)} cy={y(point.y)} r={5} fill="#FFFFFF" stroke={tone} strokeWidth={2.5} />
        </React.Fragment>
        : null)}
    </Svg>
  </View>;
}

/** A looping demonstration of how to stand for the exercise, using the same rig. */
function RigDemo({ kind, tone }: { kind: ExerciseKind; tone: string }) {
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const [time, setTime] = React.useState(0);
  React.useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setTime(Date.now() - started), 40);
    return () => clearInterval(timer);
  }, []);
  const pose = simulatedPose(kind, repDepthAt(time, 2400));
  return <View onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })} style={styles.guideImage}>
    {size.width ? <RigOverlay pose={pose} width={size.width} height={size.height} tone={tone} body mirror={false} /> : null}
  </View>;
}

const PREVIEW_PERIOD_MS = 2800;
const DIAL = 156;
const DIAL_TICKS = 40;

function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Web preview stand-in for the camera: a person doing clean reps, fed through the real analyser. */
function SimulatedPoseSource({ kind, onPose }: { kind: ExerciseKind; onPose: (pose: PoseLandmarks, timestamp: number) => void }) {
  const handler = React.useRef(onPose);
  handler.current = onPose;
  React.useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - started;
      const pose = simulatedPose(kind, repDepthAt(elapsed, PREVIEW_PERIOD_MS), elapsed / 40);
      // Fit the stand-in person into the space between the header and the dial.
      (Object.keys(pose) as PoseJoint[]).forEach((joint) => {
        const point = pose[joint]!;
        pose[joint] = { ...point, x: 0.5 + (point.x - 0.5) * 0.78, y: 0.44 + (point.y - 0.5) * 0.78 };
      });
      handler.current(pose, elapsed);
    }, 33);
    return () => clearInterval(timer);
  }, [kind]);
  return <LinearGradient colors={['#141A2A', '#0A0D16', '#05060A']} style={StyleSheet.absoluteFill} />;
}

function ActionButton({ label, icon, onPress, disabled = false }: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; disabled?: boolean }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.actionButton, { backgroundColor: colors.primary, opacity: disabled ? 0.5 : pressed ? 0.75 : 1 }]}><Ionicons name={icon} size={18} color={colors.primaryForeground} /><Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>{label}</Text></Pressable>;
}

function UnsupportedLiveWorkout({ title, body, errorCode }: { title: string; body: string; errorCode?: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useFit();
  const t = (key: LiveWorkoutCopyKey) => liveTranslate(language, key);
  return <View style={[styles.fallback, { backgroundColor: colors.background, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 20 }]}>
    <Pressable onPress={() => router.back()} style={[styles.closeButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="close" size={20} color={colors.foreground} /></Pressable>
    <View style={[styles.fallbackIcon, { backgroundColor: `${colors.primary}20` }]}><Ionicons name="camera-scan" size={36} color={colors.primary} /></View>
    <Text style={[styles.fallbackTitle, { color: colors.foreground }]}>{title}</Text>
    <Text style={[styles.fallbackBody, { color: colors.mutedForeground }]}>{body}</Text>
    {errorCode ? <Text selectable style={styles.fallbackDiagnostic}>{errorCode}</Text> : null}
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

type CameraRenderer = (onPose: (pose: PoseLandmarks, timestamp: number) => void, hidden: boolean, onError: () => void) => React.ReactNode;

function NativeLiveCamera({ kind }: { kind: ExerciseKind }) {
  const { language } = useFit();
  const t = (key: LiveWorkoutCopyKey) => liveTranslate(language, key);
  const permission = useCameraPermission();
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  if (cameraError || permission.error) return <UnsupportedLiveWorkout title={t('cameraUnavailableTitle')} body={t('poseEngineError')} errorCode={cameraError ?? undefined} />;
  if (!permission.granted) return <PermissionView onAllow={() => { permission.request().catch(() => setCameraError('PERMISSION_DENIED')); }} pending={permission.pending} canAskAgain={permission.canAskAgain} />;
  return <LiveSession kind={kind} renderCamera={(onPose, hidden, onError) => <PoseCamera
    style={[StyleSheet.absoluteFill, hidden ? styles.hiddenCamera : null]}
    facing="front"
    profile="balanced"
    resolution="720p"
    analysisResolution="480p"
    targetFps={30}
    minConfidence={0.45}
    smoothing={{ minCutoff: 1, beta: 4 }}
    data={{ mode: 'live', landmarks: true }}
    overlay={{ landmarks: false, connections: false, color: '#3DD68C', lineWidth: 4, pointRadius: 6, minVisibility: 0.25 }}
    onPose={(frame: PoseFrame) => onPose(poseFromFrame(frame), frame.timestamp)}
    onReady={({ facing }) => { if (facing !== 'front') onError(); }}
    onCameraChange={({ facing }) => { if (facing !== 'front') onError(); }}
    onError={(error) => {
      console.error('[GainMode] Live pose engine failed', {
        code: error.code,
        message: error.message,
        fatal: error.fatal,
      });
      onError();
      setCameraError(error.code);
    }}
  />} />;
}

function LiveSession({ kind, renderCamera, preview = false }: { kind: ExerciseKind; renderCamera: CameraRenderer; preview?: boolean }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useFit();
  const t = (key: LiveWorkoutCopyKey) => liveTranslate(language, key);
  const [analysis, setAnalysis] = React.useState(() => ({ state: initialRepState, warning: 'liveLookingForBody' as LiveWarningKey, confidence: 0, metric: null as number | null, depthPercent: 0 }));
  const [cameraError, setCameraError] = React.useState(false);
  const [skeletonOnly, setSkeletonOnly] = React.useState(false);
  const [showFormGuide, setShowFormGuide] = React.useState(true);
  const [isStarted, setIsStarted] = React.useState(false);
  const [startOptionsVisible, setStartOptionsVisible] = React.useState(false);
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [countdownTotal, setCountdownTotal] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    if (!isStarted) return undefined;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - started), 1000);
    return () => clearInterval(timer);
  }, [isStarted]);
  const [skeletonPose, setSkeletonPose] = React.useState<PoseLandmarks>({});
  const poseTrackRef = React.useRef(initialPoseTrackState);
  const stateRef = React.useRef<RepState>(initialRepState);
  const isStartedRef = React.useRef(false);
  const countdownTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const repTone = useAudioPlayer(require('@/assets/sounds/rep-confirmation.wav'));
  const repPulse = React.useRef(new Animated.Value(0)).current;
  const countdownPulse = React.useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();

  React.useEffect(() => {
    repTone.volume = 0.55;
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }, [repTone]);

  React.useEffect(() => () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  }, []);

  React.useEffect(() => {
    if (countdown === null) return;
    countdownPulse.setValue(0);
    Animated.sequence([
      Animated.timing(countdownPulse, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(countdownPulse, { toValue: 0, duration: 740, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [countdown, countdownPulse]);

  const beginCountdown = (seconds: 5 | 10) => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    isStartedRef.current = false;
    setIsStarted(false);
    setStartOptionsVisible(false);
    setCountdownTotal(seconds);
    setCountdown(seconds);
    let remaining = seconds;
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        setCountdown(null);
        isStartedRef.current = true;
        setIsStarted(true);
        return;
      }
      setCountdown(remaining);
    }, 1000);
  };

  if (cameraError) return <UnsupportedLiveWorkout title={t('cameraUnavailableTitle')} body={t('poseEngineError')} />;

  const dialFill = countdown !== null && countdownTotal ? 1 - (countdown - 1) / countdownTotal : isStarted ? analysis.depthPercent / 100 : 0;
  const dialTone = countdown !== null ? '#FFFFFF' : analysis.depthPercent >= 100 ? '#3DD68C' : '#7FA6FF';
  const timeLabel = ({ tr: 'Süre', en: 'Time', de: 'Zeit', fr: 'Temps', es: 'Tiempo' } as const)[language] ?? 'Time';
  const blocked = !['liveGoodForm', 'liveReachDepth', 'liveTempo', 'liveKneeAlignment', 'liveBalance', 'liveBackAngle', 'liveHeadDown', 'liveElbowPosition', 'liveHipPosition'].includes(analysis.warning);
  const rigTone = !isStarted || blocked ? '#E8EEF9' : analysis.warning === 'liveGoodForm' ? '#3DD68C' : '#FF9F43';
  const toastTone = !isStarted ? '#7FA6FF' : blocked ? '#E8EEF9' : analysis.warning === 'liveGoodForm' ? '#3DD68C' : '#FF9F43';
  const title = kind === 'squat' ? t('liveSquat') : kind === 'pushup' ? t('livePushup') : t('liveLunge');
  const directionHint = kind === 'pushup' ? t('livePushupView') : kind === 'squat' ? t('liveSquatView') : t('liveLungeView');
  const handlePose = (currentPose: PoseLandmarks, timestamp: number) => {
    const previousState = stateRef.current;
    const trackedPose = stabilizePose(currentPose, poseTrackRef.current, timestamp);
    poseTrackRef.current = trackedPose.state;
    setSkeletonPose(trackedPose.pose);
    if (!isStartedRef.current) return;
    const result = analyzePose(kind, currentPose, previousState, timestamp);
    stateRef.current = result.state;
    if (result.state.reps > previousState.reps) {
      repPulse.stopAnimation();
      repPulse.setValue(0);
      Animated.sequence([
        Animated.timing(repPulse, { toValue: 1, duration: 130, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(repPulse, { toValue: 0, friction: 5, tension: 90, useNativeDriver: true }),
      ]).start();
      try {
        void repTone.seekTo(0).catch(() => undefined);
        const played = repTone.play() as unknown;
        if (played instanceof Promise) played.catch(() => undefined);
      } catch {
        // The tick is decoration; the counter still updates.
      }
    }
    setAnalysis(result);
  };

  return <View testID="live-workout-compact-panel" style={[styles.cameraRoot, { backgroundColor: skeletonOnly ? colors.black : colors.background }]}>
    {renderCamera(handlePose, skeletonOnly, () => setCameraError(true))}
      <RigOverlay pose={skeletonPose} width={width} height={height} tone={rigTone} body={preview} />
     {!skeletonOnly ? <View pointerEvents="none" style={styles.cameraShade} /> : null}

    <View style={[styles.hudTop, { paddingTop: insets.top + 10 }]}>
      <Pressable accessibilityLabel={t('stopLiveWorkout')} onPress={() => router.back()} style={styles.glassCircle}>
        <Ionicons name="close" size={20} color="#FFFFFF" />
      </Pressable>
      <View style={styles.titlePill}>
        <View style={[styles.recDot, { opacity: isStarted ? 1 : 0.45 }]} />
        <Text style={styles.titlePillLive}>{t('live')}</Text>
        <View style={styles.titleDivider} />
        <Text numberOfLines={1} style={styles.titlePillText}>{title}</Text>
      </View>
      <Pressable testID="toggle-skeleton-mode" accessibilityRole="button" accessibilityLabel={skeletonOnly ? t('cameraMode') : t('skeletonOnlyMode')} onPress={() => setSkeletonOnly((value) => !value)} style={styles.glassCircle}>
        <Ionicons name={skeletonOnly ? 'camera-outline' : 'body-outline'} size={19} color="#FFFFFF" />
      </Pressable>
    </View>

    <View pointerEvents="none" style={[styles.toastWrap, { top: insets.top + 66 }]}>
      <View style={[styles.toast, { borderColor: `${toastTone}55` }]}>
        <View style={[styles.toastDot, { backgroundColor: toastTone }]} />
        <Text numberOfLines={3} style={styles.toastText}>{isStarted ? t(analysis.warning) : directionHint}</Text>
      </View>
    </View>

    <LinearGradient pointerEvents="none" colors={['rgba(4,6,12,0)', 'rgba(4,6,12,0.75)']} style={styles.dockFade} />
    <View style={[styles.dock, { paddingBottom: insets.bottom + 22 }]}>
      {/* One fixed line above the dial, so the dial never shifts between states. */}
      <Text style={styles.dockHint}>{countdown !== null ? t('liveStarting') : startOptionsVisible && !isStarted ? t('liveStartDelayTitle') : ' '}</Text>
      <View style={styles.dockRow}>
        <View style={styles.sideStat}>
          {startOptionsVisible && !isStarted && countdown === null
            ? <Pressable testID="start-live-5-seconds" accessibilityRole="button" onPress={() => beginCountdown(5)} style={styles.delayChip}><Text numberOfLines={1} style={styles.delayChipText}>{t('liveStartFiveSeconds')}</Text></Pressable>
            : <>
              <Text style={styles.sideValue}>{isStarted ? `${analysis.depthPercent}%` : '—'}</Text>
              <Text style={styles.sideLabel}>{t('liveDepth').toLocaleUpperCase(language)}</Text>
            </>}
        </View>

        <Pressable
          testID={isStarted ? 'live-workout-reps-panel' : 'start-live-countdown'}
          accessibilityRole="button"
          accessibilityLabel={isStarted ? `${analysis.state.reps} ${t('reps')}` : t('liveStart')}
          disabled={isStarted || countdown !== null || showFormGuide}
          onPress={() => setStartOptionsVisible((value) => !value)}
          scaleTo={0.95}
          style={styles.dial}
        >
          <Svg width={DIAL} height={DIAL} style={StyleSheet.absoluteFill}>
            {Array.from({ length: DIAL_TICKS }, (_, index) => {
              const angleRad = (index / DIAL_TICKS) * Math.PI * 2 - Math.PI / 2;
              const lit = dialFill * DIAL_TICKS > index;
              const inner = DIAL / 2 - 12;
              const outer = DIAL / 2 - 4;
              return <Line key={index} x1={DIAL / 2 + Math.cos(angleRad) * inner} y1={DIAL / 2 + Math.sin(angleRad) * inner} x2={DIAL / 2 + Math.cos(angleRad) * outer} y2={DIAL / 2 + Math.sin(angleRad) * outer} stroke={lit ? dialTone : 'rgba(255,255,255,0.18)'} strokeWidth={3} strokeLinecap="round" />;
            })}
          </Svg>
          <View style={[styles.dialCore, isStarted || countdown !== null ? null : styles.dialCoreIdle]}>
            {countdown !== null
              ? <Animated.Text style={[styles.dialNumber, { transform: [{ scale: countdownPulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.06] }) }] }]}>{countdown}</Animated.Text>
              : isStarted
                ? <>
                  <Animated.Text style={[styles.dialNumber, { transform: [{ scale: repPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }] }]}>{analysis.state.reps}</Animated.Text>
                  <Text style={styles.dialLabel}>{t('reps').toLocaleUpperCase(language)}</Text>
                </>
                : <>
                  <Ionicons name={startOptionsVisible ? 'close' : 'arrow-forward'} size={22} color="#0A0B0D" />
                  <Text style={styles.dialStart}>{startOptionsVisible ? t('liveStartCancel') : t('liveStart')}</Text>
                </>}
          </View>
        </Pressable>

        <View style={styles.sideStat}>
          {startOptionsVisible && !isStarted && countdown === null
            ? <Pressable testID="start-live-10-seconds" accessibilityRole="button" onPress={() => beginCountdown(10)} style={styles.delayChip}><Text numberOfLines={1} style={styles.delayChipText}>{t('liveStartTenSeconds')}</Text></Pressable>
            : <>
              <Text style={styles.sideValue}>{formatElapsed(elapsed)}</Text>
              <Text style={styles.sideLabel}>{timeLabel.toLocaleUpperCase(language)}</Text>
            </>}
        </View>
      </View>
    </View>
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
            <RigDemo kind={kind} tone="#3DD68C" />
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

  if (Platform.OS === 'web' && isDesignPreview()) return <LiveSession kind={kind} preview renderCamera={(onPose) => <SimulatedPoseSource kind={kind} onPose={onPose} />} />;
  if (Platform.OS === 'web') return <UnsupportedLiveWorkout title={t('cameraUnavailableTitle')} body={t('cameraUnavailableBody')} />;
  if (Constants.executionEnvironment === 'storeClient') return <UnsupportedLiveWorkout title={t('cameraUnavailableTitle')} body={t('cameraUnavailableBody')} />;
  return <NativeLiveCamera kind={kind} />;
}

const styles = StyleSheet.create({
  cameraRoot: { flex: 1, backgroundColor: '#020B18' },
  hiddenCamera: { opacity: 0 },
  cameraShade: { ...StyleSheet.absoluteFill, backgroundColor: '#020B1826' },
  hudTop: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 8 },
  glassCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(10,12,18,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  titlePill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderRadius: 22, paddingHorizontal: 16, backgroundColor: 'rgba(10,12,18,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', maxWidth: '60%' },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4D5E' },
  titlePillLive: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.4, color: '#FF8A95' },
  titleDivider: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.2)' },
  titlePillText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#FFFFFF', flexShrink: 1 },
  toastWrap: { position: 'absolute', left: 20, right: 20, alignItems: 'center', zIndex: 7 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: '100%', borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(10,12,18,0.62)' },
  toastDot: { width: 8, height: 8, borderRadius: 4 },
  toastText: { flexShrink: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18, color: '#FFFFFF' },
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', zIndex: 9 },
  dockFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 280, zIndex: 8 },
  dockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  dockHint: { height: 18, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.4, color: 'rgba(255,255,255,0.75)', marginBottom: 10 },
  sideStat: { width: 96, alignItems: 'center' },
  sideValue: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.4, color: '#FFFFFF' },
  sideLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.3, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  delayChip: { height: 44, minWidth: 92, borderRadius: 22, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  delayChipText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#FFFFFF' },
  dial: { width: DIAL, height: DIAL, alignItems: 'center', justifyContent: 'center' },
  dialCore: { width: DIAL - 40, height: DIAL - 40, borderRadius: (DIAL - 40) / 2, backgroundColor: 'rgba(10,12,18,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  dialCoreIdle: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  dialNumber: { fontFamily: 'Inter_700Bold', fontSize: 46, lineHeight: 50, letterSpacing: -1.5, color: '#FFFFFF' },
  dialLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.6, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  dialStart: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#0A0B0D', marginTop: 4 },
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
   topStatusRow: { position: 'absolute', left: 20, right: 58, flexDirection: 'row', alignItems: 'stretch', gap: 8, zIndex: 8 },
   topRepsCard: { width: 70, minHeight: 68, borderRadius: 17, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 8, justifyContent: 'center' },
   topRepNumber: { fontFamily: 'Inter_700Bold', fontSize: 31, lineHeight: 34, letterSpacing: -1.2, marginTop: 1 },
   topFeedback: { flex: 1, minHeight: 68, marginTop: 0, paddingHorizontal: 10 },
    depthSideRail: { position: 'absolute', right: 10, top: '22%', bottom: '22%', width: 38, borderRadius: 20, borderWidth: 1, alignItems: 'center', paddingVertical: 10, zIndex: 6 },
   depthSideCaption: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 1.1, transform: [{ rotate: '-90deg' }], marginBottom: 8 },
   depthSidePercent: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 19, marginBottom: 8 },
    depthTrack: { width: 6, flex: 1, minHeight: 180, maxHeight: 520, borderRadius: 4, borderWidth: 1, overflow: 'hidden', justifyContent: 'flex-end' },
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
  countingRule: { minHeight: 30, borderRadius: 10, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5, marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  countingRuleText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 9, lineHeight: 12 },
  confidencePill: { borderRadius: 11, paddingHorizontal: 9, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  confidenceDot: { width: 7, height: 7, borderRadius: 4 },
  confidenceText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
   feedback: { minHeight: 40, borderRadius: 12, borderWidth: 1, marginTop: 0, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  feedbackText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 15 },
  privacyText: { fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 12, marginTop: 7 },
   startControls: { position: 'absolute', left: 20, right: 20, alignItems: 'center', zIndex: 12 },
   startLiveButton: { width: 190, minHeight: 50, borderRadius: 17, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
   startLiveButtonText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
   startOptionsCard: { width: '100%', maxWidth: 320, borderRadius: 18, borderWidth: 1, padding: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 15, shadowOffset: { width: 0, height: 6 }, elevation: 9 },
   startOptionsTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, textAlign: 'center', marginBottom: 10 },
   startOptionsRow: { flexDirection: 'row', gap: 8 },
   startOption: { flex: 1, minHeight: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
   startOptionText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
   startCancelButton: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 7, marginTop: 3 },
   startCancelText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
   countdownOverlay: { ...StyleSheet.absoluteFill, zIndex: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#020B1838' },
   countdownNumber: { fontFamily: 'Inter_700Bold', fontSize: 112, lineHeight: 124, letterSpacing: -5 },
   countdownLabel: { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 },
  guideBackdrop: { ...StyleSheet.absoluteFill, zIndex: 20, backgroundColor: '#020B18B8', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  guideCard: { width: '100%', maxWidth: 420, borderRadius: 24, borderWidth: 1, padding: 12, shadowColor: '#000000', shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  guideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  guideTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 9 },
  guideIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  guideTitleWrap: { flex: 1 },
  guideEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  guideTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, lineHeight: 24, marginTop: 1 },
  guideClose: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  guideImage: { width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: '#0B0F1A', overflow: 'hidden' },
  guideBody: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18, marginTop: 11 },
  guideTip: { minHeight: 42, borderRadius: 12, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 7, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  guideTipText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 14 },
  guideAction: { minHeight: 44, borderRadius: 14, marginTop: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  guideActionText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  fallbackIcon: { width: 78, height: 78, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  fallbackTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, lineHeight: 32, letterSpacing: -0.8, textAlign: 'center' },
  fallbackBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12, marginBottom: 24 },
  fallbackDiagnostic: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.5, color: '#D8DEEA', textAlign: 'center', marginTop: -14, marginBottom: 20 },
  actionButton: { width: '100%', height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  settingsLink: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 18 },
  privacyNote: { width: '100%', borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
});