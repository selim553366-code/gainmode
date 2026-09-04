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
  activeSide?: 'left' | 'right';
};

export type AnalysisResult = {
  state: RepState;
  warning: LiveWarningKey;
  metric: number | null;
  confidence: number;
};

export const supportedExercises: ExerciseKind[] = ['squat', 'pushup', 'lunge'];

/**
 * Maps native pose coordinates into the selfie-mirrored display space used by
 * the front-camera preview and native skeleton overlay.
 */
export function selfieMirroredX(normalizedX: number) {
  return 1 - normalizedX;
}

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

function point(pose: PoseLandmarks, joint: PoseJoint) {
  return pose[joint];
}

function midpoint(a?: Point, b?: Point): Point | undefined {
  if (!a || !b) return undefined;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, visibility: Math.min(a.visibility, b.visibility) };
}

function centerPoint(pose: PoseLandmarks, left: PoseJoint, right: PoseJoint) {
  return midpoint(point(pose, left), point(pose, right)) ?? point(pose, left) ?? point(pose, right);
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

function visibilityFor(pose: PoseLandmarks, joints: PoseJoint[]) {
  return average(joints.map((joint) => point(pose, joint)?.visibility ?? 0)) ?? 0;
}

function sideVisibility(pose: PoseLandmarks, side: 'left' | 'right') {
  const prefix = side === 'left' ? 'left' : 'right';
  return visibilityFor(pose, [
    `${prefix}Shoulder` as PoseJoint,
    `${prefix}Hip` as PoseJoint,
    `${prefix}Knee` as PoseJoint,
    `${prefix}Ankle` as PoseJoint,
  ]);
}

function selectSide(pose: PoseLandmarks, preferred?: 'left' | 'right') {
  const left = sideVisibility(pose, 'left');
  const right = sideVisibility(pose, 'right');
  if (preferred && (preferred === 'left' ? left : right) >= 0.36) return preferred;
  return left >= right ? 'left' : 'right';
}

function sideConfidence(pose: PoseLandmarks, side: 'left' | 'right') {
  const prefix = side === 'left' ? 'left' : 'right';
  return visibilityFor(pose, [
    `${prefix}Shoulder` as PoseJoint,
    `${prefix}Hip` as PoseJoint,
    `${prefix}Knee` as PoseJoint,
    `${prefix}Ankle` as PoseJoint,
  ]);
}

function squatConfidence(pose: PoseLandmarks) {
  return Math.max(sideConfidence(pose, 'left'), sideConfidence(pose, 'right'));
}

function pushupConfidence(pose: PoseLandmarks) {
  const leftArm = visibilityFor(pose, ['leftShoulder', 'leftElbow', 'leftWrist']);
  const rightArm = visibilityFor(pose, ['rightShoulder', 'rightElbow', 'rightWrist']);
  const bestArm = Math.max(leftArm, rightArm);
  const shoulders = centerPoint(pose, 'leftShoulder', 'rightShoulder');
  const hips = centerPoint(pose, 'leftHip', 'rightHip');
  return average([bestArm, shoulders?.visibility ?? 0, hips?.visibility ?? 0]) ?? 0;
}

function bodyLength(pose: PoseLandmarks) {
  const shoulders = centerPoint(pose, 'leftShoulder', 'rightShoulder');
  const ankles = centerPoint(pose, 'leftAnkle', 'rightAnkle');
  if (!shoulders || !ankles) return null;
  return Math.hypot(ankles.x - shoulders.x, ankles.y - shoulders.y);
}

function baseWarning(kind: ExerciseKind, pose: PoseLandmarks, confidence: number, side: 'left' | 'right'): LiveWarningKey {
  if (confidence < 0.42) return 'liveLookingForBody';

  const shoulders = centerPoint(pose, 'leftShoulder', 'rightShoulder');
  const hips = centerPoint(pose, 'leftHip', 'rightHip');
  const ankles = centerPoint(pose, 'leftAnkle', 'rightAnkle');
  if (!shoulders || !hips || !ankles) return 'liveLookingForBody';

  const length = bodyLength(pose);
  if (length !== null && length < 0.34) return 'liveStepBack';
  if (length !== null && length > 1.25) return 'liveMoveCloser';

  if (kind === 'lunge') {
    const prefix = side === 'left' ? 'left' : 'right';
    const backAngle = angle(
      point(pose, `${prefix}Shoulder` as PoseJoint),
      point(pose, `${prefix}Hip` as PoseJoint),
      point(pose, `${prefix}Ankle` as PoseJoint),
    );
    if (backAngle !== null && backAngle < 112) return 'liveBackAngle';
  }

  if (kind === 'pushup') {
    const leftElbow = point(pose, 'leftElbow');
    const rightElbow = point(pose, 'rightElbow');
    if (leftElbow && Math.abs(leftElbow.x - shoulders.x) > 0.34) return 'liveElbowPosition';
    if (rightElbow && Math.abs(rightElbow.x - shoulders.x) > 0.34) return 'liveElbowPosition';
    const bodyAngle = angle(shoulders, hips, ankles);
    if (bodyAngle !== null && bodyAngle < 148) return 'liveHipPosition';
  }

  return 'liveGoodForm';
}

function kneeMetric(pose: PoseLandmarks, side: 'left' | 'right') {
  const prefix = side === 'left' ? 'left' : 'right';
  return angle(
    point(pose, `${prefix}Hip` as PoseJoint),
    point(pose, `${prefix}Knee` as PoseJoint),
    point(pose, `${prefix}Ankle` as PoseJoint),
  );
}

function squatMetric(pose: PoseLandmarks, side: 'left' | 'right') {
  return average([kneeMetric(pose, 'left'), kneeMetric(pose, 'right')]) ?? kneeMetric(pose, side);
}

function pushupMetric(pose: PoseLandmarks) {
  return average([
    angle(point(pose, 'leftShoulder'), point(pose, 'leftElbow'), point(pose, 'leftWrist')),
    angle(point(pose, 'rightShoulder'), point(pose, 'rightElbow'), point(pose, 'rightWrist')),
  ]);
}

function pushupHeadDrop(pose: PoseLandmarks) {
  const nose = point(pose, 'nose');
  const shoulders = centerPoint(pose, 'leftShoulder', 'rightShoulder');
  if (!nose || !shoulders) return null;
  return nose.y - shoulders.y;
}

function lungeMetric(pose: PoseLandmarks, side: 'left' | 'right') {
  return kneeMetric(pose, side) ?? kneeMetric(pose, side === 'left' ? 'right' : 'left');
}

export function analyzePose(kind: ExerciseKind, pose: PoseLandmarks, previous: RepState, timestamp: number): AnalysisResult {
  const side = selectSide(pose, previous.activeSide);
  const confidence = kind === 'pushup' ? pushupConfidence(pose) : kind === 'squat' ? squatConfidence(pose) : sideConfidence(pose, side);
  let warning = baseWarning(kind, pose, confidence, side);
  const metric = kind === 'squat' ? squatMetric(pose, side) : kind === 'pushup' ? pushupMetric(pose) : lungeMetric(pose, side);
  const next: RepState = {
    ...previous,
    activeSide: kind === 'pushup' ? undefined : side,
    lastWarning: warning,
    lastWarningAt: warning === previous.lastWarning ? previous.lastWarningAt : timestamp,
  };

  if (metric === null || confidence < 0.42) {
    return { state: next, warning, metric, confidence };
  }

  const downThreshold = kind === 'pushup' ? 105 : kind === 'lunge' ? 112 : 115;
  const startThreshold = kind === 'squat' ? 165 : 160;
  const upThreshold = kind === 'pushup' ? 155 : 160;
  const ascentThreshold = downThreshold + (kind === 'squat' ? 12 : 18);
  const pushupDepthReady = kind !== 'pushup' || (pushupHeadDrop(pose) ?? 0) >= -0.06;

  const previousPhase = next.phase;
  if (next.phase === 'ready' && metric <= downThreshold && pushupDepthReady) next.phase = 'bottom';
  else if (next.phase === 'ready' && metric < startThreshold) next.phase = 'descending';
  else if (next.phase === 'descending' && metric <= downThreshold && pushupDepthReady) next.phase = 'bottom';
  else if (next.phase === 'bottom' && metric >= ascentThreshold) next.phase = 'ascending';
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