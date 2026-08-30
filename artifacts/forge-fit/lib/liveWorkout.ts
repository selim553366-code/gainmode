import { isVisible, landmark } from 'react-native-pose-detection';
import type { PoseFrame } from 'react-native-pose-detection';

export type ExerciseKind = 'squat' | 'pushup' | 'lunge';
export type PoseJoint =
  | 'nose'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftElbow'
  | 'rightElbow'
  | 'leftWrist'
  | 'rightWrist'
  | 'leftHip'
  | 'rightHip'
  | 'leftKnee'
  | 'rightKnee'
  | 'leftAnkle'
  | 'rightAnkle';

export type Point = { x: number; y: number; visibility: number };
export type PoseLandmarks = Partial<Record<PoseJoint, Point>>;
export type RepPhase = 'ready' | 'descending' | 'bottom' | 'ascending';
export type LiveWarningKey =
  | 'liveLookingForBody'
  | 'liveStepBack'
  | 'liveMoveCloser'
  | 'liveKneeAlignment'
  | 'liveBackAngle'
  | 'liveReachDepth'
  | 'liveHipPosition'
  | 'liveElbowPosition'
  | 'liveBalance'
  | 'liveTempo'
  | 'liveGoodForm';

export type RepState = {
  reps: number;
  phase: RepPhase;
  phaseStartedAt: number;
  lastRepAt: number;
  lastWarning: LiveWarningKey;
  lastWarningAt: number;
};

export type AnalysisResult = {
  state: RepState;
  warning: LiveWarningKey;
  metric: number | null;
  confidence: number;
};

const JOINT_NAMES: Record<PoseJoint, string> = {
  nose: 'nose',
  leftShoulder: 'leftShoulder',
  rightShoulder: 'rightShoulder',
  leftElbow: 'leftElbow',
  rightElbow: 'rightElbow',
  leftWrist: 'leftWrist',
  rightWrist: 'rightWrist',
  leftHip: 'leftHip',
  rightHip: 'rightHip',
  leftKnee: 'leftKnee',
  rightKnee: 'rightKnee',
  leftAnkle: 'leftAnkle',
  rightAnkle: 'rightAnkle',
};

const REQUIRED_JOINTS: Record<ExerciseKind, PoseJoint[]> = {
  squat: ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'],
  pushup: ['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftHip', 'rightHip', 'leftAnkle', 'rightAnkle'],
  lunge: ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'],
};

export const supportedExercises: ExerciseKind[] = ['squat', 'pushup', 'lunge'];

export const initialRepState: RepState = {
  reps: 0,
  phase: 'ready',
  phaseStartedAt: 0,
  lastRepAt: 0,
  lastWarning: 'liveLookingForBody',
  lastWarningAt: 0,
};

export function exerciseKindFromName(name: string): ExerciseKind | null {
  const normalized = name.toLowerCase();
  if (normalized.includes('squat') || normalized.includes('kniebeuge') || normalized.includes('genuflex')) return 'squat';
  if (normalized.includes('push') || normalized.includes('şınav') || normalized.includes('pompe') || normalized.includes('liegest')) return 'pushup';
  if (normalized.includes('lunge') || normalized.includes('fente') || normalized.includes('ausfall')) return 'lunge';
  return null;
}

export function poseFromFrame(frame: PoseFrame): PoseLandmarks {
  const pose: PoseLandmarks = {};
  (Object.keys(JOINT_NAMES) as PoseJoint[]).forEach((joint) => {
    const nativeJoint = JOINT_NAMES[joint] as Parameters<typeof landmark>[1];
    if (!isVisible(frame, nativeJoint, 0.35)) return;
    const point = landmark(frame, nativeJoint);
    pose[joint] = { x: point.x, y: point.y, visibility: point.visibility };
  });
  return pose;
}

function point(pose: PoseLandmarks, joint: PoseJoint) {
  return pose[joint];
}

function midpoint(a?: Point, b?: Point): Point | undefined {
  if (!a || !b) return undefined;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, visibility: Math.min(a.visibility, b.visibility) };
}

function angle(a?: Point, vertex?: Point, b?: Point): number | null {
  if (!a || !vertex || !b) return null;
  const ax = a.x - vertex.x;
  const ay = a.y - vertex.y;
  const bx = b.x - vertex.x;
  const by = b.y - vertex.y;
  const denominator = Math.hypot(ax, ay) * Math.hypot(bx, by);
  if (!denominator) return null;
  const cosine = Math.max(-1, Math.min(1, (ax * bx + ay * by) / denominator));
  return Math.round((Math.acos(cosine) * 180) / Math.PI);
}

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value !== null);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function confidenceFor(pose: PoseLandmarks, joints: PoseJoint[]) {
  const visible = joints.map((joint) => point(pose, joint)?.visibility ?? 0);
  return visible.reduce((sum, value) => sum + value, 0) / joints.length;
}

function baseWarning(kind: ExerciseKind, pose: PoseLandmarks, confidence: number): LiveWarningKey {
  if (confidence < 0.48) return 'liveLookingForBody';

  const shoulders = midpoint(point(pose, 'leftShoulder'), point(pose, 'rightShoulder'));
  const hips = midpoint(point(pose, 'leftHip'), point(pose, 'rightHip'));
  const ankles = midpoint(point(pose, 'leftAnkle'), point(pose, 'rightAnkle'));
  if (!shoulders || !hips || !ankles) return 'liveLookingForBody';

  const bodyHeight = Math.abs(ankles.y - shoulders.y);
  if (bodyHeight < 0.38) return 'liveStepBack';
  if (bodyHeight > 0.95) return 'liveMoveCloser';

  if (kind === 'squat' || kind === 'lunge') {
    const leftKnee = point(pose, 'leftKnee');
    const rightKnee = point(pose, 'rightKnee');
    const leftAnkle = point(pose, 'leftAnkle');
    const rightAnkle = point(pose, 'rightAnkle');
    if (leftKnee && leftAnkle && Math.abs(leftKnee.x - leftAnkle.x) > 0.19) return 'liveKneeAlignment';
    if (rightKnee && rightAnkle && Math.abs(rightKnee.x - rightAnkle.x) > 0.19) return 'liveKneeAlignment';
    if (kind === 'lunge' && Math.abs(point(pose, 'leftAnkle')!.y - point(pose, 'rightAnkle')!.y) > 0.18) return 'liveBalance';
    if (Math.abs(shoulders.x - hips.x) > 0.14) return 'liveBackAngle';
  }

  if (kind === 'pushup') {
    const leftElbow = point(pose, 'leftElbow');
    const rightElbow = point(pose, 'rightElbow');
    if (leftElbow && Math.abs(leftElbow.x - shoulders.x) > 0.24) return 'liveElbowPosition';
    if (rightElbow && Math.abs(rightElbow.x - shoulders.x) > 0.24) return 'liveElbowPosition';
    const bodyAngle = angle(shoulders, hips, ankles);
    if (bodyAngle !== null && bodyAngle < 148) return 'liveHipPosition';
  }

  return 'liveGoodForm';
}

function squatMetric(pose: PoseLandmarks) {
  return average([
    angle(point(pose, 'leftHip'), point(pose, 'leftKnee'), point(pose, 'leftAnkle')),
    angle(point(pose, 'rightHip'), point(pose, 'rightKnee'), point(pose, 'rightAnkle')),
  ]);
}

function pushupMetric(pose: PoseLandmarks) {
  return average([
    angle(point(pose, 'leftShoulder'), point(pose, 'leftElbow'), point(pose, 'leftWrist')),
    angle(point(pose, 'rightShoulder'), point(pose, 'rightElbow'), point(pose, 'rightWrist')),
  ]);
}

function lungeMetric(pose: PoseLandmarks) {
  return Math.min(
    angle(point(pose, 'leftHip'), point(pose, 'leftKnee'), point(pose, 'leftAnkle')) ?? 180,
    angle(point(pose, 'rightHip'), point(pose, 'rightKnee'), point(pose, 'rightAnkle')) ?? 180,
  );
}

export function analyzePose(kind: ExerciseKind, pose: PoseLandmarks, previous: RepState, timestamp: number): AnalysisResult {
  const confidence = confidenceFor(pose, REQUIRED_JOINTS[kind]);
  let warning = baseWarning(kind, pose, confidence);
  const metric = kind === 'squat' ? squatMetric(pose) : kind === 'pushup' ? pushupMetric(pose) : lungeMetric(pose);
  const next: RepState = { ...previous, lastWarning: warning, lastWarningAt: warning === previous.lastWarning ? previous.lastWarningAt : timestamp };

  if (metric === null || confidence < 0.48) {
    return { state: next, warning, metric, confidence };
  }

  const downThreshold = kind === 'pushup' ? 100 : 108;
  const startThreshold = kind === 'pushup' ? 148 : 145;
  const upThreshold = kind === 'pushup' ? 160 : 155;

  const previousPhase = next.phase;
  if (next.phase === 'ready' && metric < startThreshold) next.phase = 'descending';
  else if (next.phase === 'descending' && metric < downThreshold) next.phase = 'bottom';
  else if (next.phase === 'bottom' && metric > downThreshold + 14) next.phase = 'ascending';
  else if (next.phase === 'ascending' && metric > upThreshold) {
    if (timestamp - next.lastRepAt > 450) {
      next.reps += 1;
      next.lastRepAt = timestamp;
    }
    next.phase = 'ready';
  }
  if (next.phase !== previousPhase) {
    if (next.phase === 'descending' && previousPhase === 'ready' && metric > downThreshold + 12) warning = 'liveReachDepth';
    if (next.phase === 'bottom' && timestamp - next.phaseStartedAt < 240) warning = 'liveTempo';
    next.phaseStartedAt = timestamp;
  }
  next.lastWarning = warning;

  return { state: next, warning, metric, confidence };
}