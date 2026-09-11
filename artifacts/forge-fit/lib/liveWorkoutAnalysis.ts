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
  lastTrackedAt: number;
  cycleArmed: boolean;
  activeSide?: 'left' | 'right';
};

export type AnalysisResult = {
  state: RepState;
  warning: LiveWarningKey;
  metric: number | null;
  depthPercent: number;
  confidence: number;
};

export const supportedExercises: ExerciseKind[] = ['squat', 'pushup', 'lunge'];

/**
 * The front-camera preview is shown as a selfie mirror, so JS-rendered
 * landmarks need the same horizontal transform as the native overlay.
 */
export function cameraDisplayX(normalizedX: number) {
  return 1 - normalizedX;
}

export const initialRepState: RepState = {
  reps: 0,
  phase: 'ready',
  phaseStartedAt: 0,
  lastRepAt: 0,
  lastWarning: 'liveLookingForBody',
  lastWarningAt: 0,
  lastTrackedAt: 0,
  cycleArmed: false,
};

export type PoseTrackState = {
  pose: PoseLandmarks;
  lastSeenAt: number;
  locked: boolean;
};

export const initialPoseTrackState: PoseTrackState = {
  pose: {},
  lastSeenAt: 0,
  locked: false,
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

const trackingJoints: PoseJoint[] = [
  'nose',
  'leftShoulder',
  'rightShoulder',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle',
];

export function trackingConfidenceForPose(pose: PoseLandmarks) {
  const visible = trackingJoints.filter((joint) => point(pose, joint));
  if (visible.length < 3) return 0;
  const coverage = visible.length / trackingJoints.length;
  const quality = visibilityFor(pose, visible);
  return Math.min(1, coverage * 0.55 + quality * 0.45);
}

function torsoCenter(pose: PoseLandmarks) {
  const shoulders = centerPoint(pose, 'leftShoulder', 'rightShoulder');
  const hips = centerPoint(pose, 'leftHip', 'rightHip');
  if (!shoulders || !hips) return undefined;
  return { x: (shoulders.x + hips.x) / 2, y: (shoulders.y + hips.y) / 2 };
}

function torsoScale(pose: PoseLandmarks) {
  const shoulders = centerPoint(pose, 'leftShoulder', 'rightShoulder');
  const hips = centerPoint(pose, 'leftHip', 'rightHip');
  if (!shoulders || !hips) return null;
  return Math.max(0.08, Math.hypot(shoulders.x - hips.x, shoulders.y - hips.y));
}

function plausibleTrackTransition(previous: PoseLandmarks, current: PoseLandmarks) {
  const previousCenter = torsoCenter(previous);
  const currentCenter = torsoCenter(current);
  if (!previousCenter || !currentCenter) return true;
  if (Math.hypot(previousCenter.x - currentCenter.x, previousCenter.y - currentCenter.y) > 0.24) return false;

  const previousScale = torsoScale(previous);
  const currentScale = torsoScale(current);
  if (!previousScale || !currentScale) return true;
  const scaleRatio = currentScale / previousScale;
  return scaleRatio >= 0.45 && scaleRatio <= 2.2;
}

function blendPoint(previous: Point | undefined, current: Point | undefined): Point | undefined {
  if (!current) return previous;
  if (!previous) return current;
  return {
    x: previous.x * 0.35 + current.x * 0.65,
    y: previous.y * 0.35 + current.y * 0.65,
    visibility: Math.max(previous.visibility, current.visibility),
  };
}

/**
 * Keeps the visual rig locked to the last reliable person for a short
 * detection gap. Rep counting still uses the raw frame, so a frozen pose can
 * never create a repetition by itself.
 */
export function stabilizePose(current: PoseLandmarks, previous: PoseTrackState, timestamp: number) {
  const currentConfidence = trackingConfidenceForPose(current);
  const hasReliableCurrent = currentConfidence >= 0.42
    && plausibleTrackTransition(previous.pose, current);
  const lostForMs = previous.lastSeenAt ? timestamp - previous.lastSeenAt : Number.POSITIVE_INFINITY;

  if (hasReliableCurrent) {
    const merged = {} as PoseLandmarks;
    (Object.keys({ ...previous.pose, ...current }) as PoseJoint[]).forEach((joint) => {
      merged[joint] = blendPoint(previous.pose[joint], current[joint]) as Point;
    });
    return {
      state: { pose: merged, lastSeenAt: timestamp, locked: true } satisfies PoseTrackState,
      pose: merged,
      locked: true,
      stale: false,
    };
  }

  if (previous.locked && lostForMs <= 500) {
    return {
      state: previous,
      pose: previous.pose,
      locked: true,
      stale: true,
    };
  }

  return {
    state: { pose: {}, lastSeenAt: previous.lastSeenAt, locked: false } satisfies PoseTrackState,
    pose: {},
    locked: false,
    stale: true,
  };
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
  const frontView = visibilityFor(pose, [
    'nose',
    'leftShoulder',
    'rightShoulder',
    'leftHip',
    'rightHip',
    'leftKnee',
    'rightKnee',
    'leftAnkle',
    'rightAnkle',
  ]);
  return Math.max(sideConfidence(pose, 'left'), sideConfidence(pose, 'right'), frontView);
}

function pushupConfidence(pose: PoseLandmarks) {
  const leftArm = visibilityFor(pose, ['leftShoulder', 'leftElbow', 'leftWrist']);
  const rightArm = visibilityFor(pose, ['rightShoulder', 'rightElbow', 'rightWrist']);
  const bestArm = Math.max(leftArm, rightArm);
  const shoulders = centerPoint(pose, 'leftShoulder', 'rightShoulder');
  const hips = centerPoint(pose, 'leftHip', 'rightHip');
  const head = point(pose, 'nose');
  return average([bestArm, shoulders?.visibility ?? 0, hips?.visibility ?? 0, head?.visibility ?? 0]) ?? 0;
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
    const frontView = (point(pose, 'nose')?.visibility ?? 0) >= 0.55
      && shoulders.visibility >= 0.55
      && (point(pose, 'leftShoulder')?.visibility ?? 0) >= 0.5
      && (point(pose, 'rightShoulder')?.visibility ?? 0) >= 0.5;
    const elbowSpreadLimit = frontView ? 0.48 : 0.34;
    if (leftElbow && Math.abs(leftElbow.x - shoulders.x) > elbowSpreadLimit) return 'liveElbowPosition';
    if (rightElbow && Math.abs(rightElbow.x - shoulders.x) > elbowSpreadLimit) return 'liveElbowPosition';
    const bodyAngle = angle(shoulders, hips, ankles);
    if (bodyAngle !== null && bodyAngle < 148) return 'liveHipPosition';
  }

  return 'liveGoodForm';
}

function kneeIsAligned(pose: PoseLandmarks, side: 'left' | 'right') {
  const prefix = side === 'left' ? 'left' : 'right';
  const knee = point(pose, `${prefix}Knee` as PoseJoint);
  const ankle = point(pose, `${prefix}Ankle` as PoseJoint);
  if (!knee || !ankle) return false;
  return Math.abs(knee.x - ankle.x) <= 0.18;
}

function formIsCountable(kind: ExerciseKind, pose: PoseLandmarks, side: 'left' | 'right') {
  if (kind === 'squat') {
    const availableSides = (['left', 'right'] as const).filter((candidate) => kneeIsAligned(pose, candidate));
    return availableSides.length > 0;
  }

  if (kind === 'lunge') {
    if (!kneeIsAligned(pose, side)) return false;
    const prefix = side === 'left' ? 'left' : 'right';
    const backAngle = angle(
      point(pose, `${prefix}Shoulder` as PoseJoint),
      point(pose, `${prefix}Hip` as PoseJoint),
      point(pose, `${prefix}Ankle` as PoseJoint),
    );
    return backAngle === null || backAngle >= 112;
  }

  const shoulders = centerPoint(pose, 'leftShoulder', 'rightShoulder');
  const hips = centerPoint(pose, 'leftHip', 'rightHip');
  const ankles = centerPoint(pose, 'leftAnkle', 'rightAnkle');
  const bodyAngle = angle(shoulders, hips, ankles);
  if (bodyAngle !== null && bodyAngle < 128) return false;

  const leftElbow = point(pose, 'leftElbow');
  const rightElbow = point(pose, 'rightElbow');
  const frontView = (point(pose, 'nose')?.visibility ?? 0) >= 0.55
    && (point(pose, 'leftShoulder')?.visibility ?? 0) >= 0.55
    && (point(pose, 'rightShoulder')?.visibility ?? 0) >= 0.55;
  const elbowSpreadLimit = frontView ? 0.48 : 0.34;
  if (leftElbow && shoulders && Math.abs(leftElbow.x - shoulders.x) > elbowSpreadLimit) return false;
  if (rightElbow && shoulders && Math.abs(rightElbow.x - shoulders.x) > elbowSpreadLimit) return false;
  return true;
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

const depthThresholds: Record<ExerciseKind, { standing: number; fullDepth: number }> = {
  squat: { standing: 165, fullDepth: 115 },
  pushup: { standing: 160, fullDepth: 105 },
  lunge: { standing: 160, fullDepth: 112 },
};

export function depthPercentForMetric(kind: ExerciseKind, metric: number | null) {
  if (metric === null) return 0;
  const { standing, fullDepth } = depthThresholds[kind];
  const percent = ((standing - metric) / (standing - fullDepth)) * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

export function analyzePose(kind: ExerciseKind, pose: PoseLandmarks, previous: RepState, timestamp: number): AnalysisResult {
  const side = selectSide(pose, previous.activeSide);
  const confidence = kind === 'pushup' ? pushupConfidence(pose) : kind === 'squat' ? squatConfidence(pose) : sideConfidence(pose, side);
  let warning = baseWarning(kind, pose, confidence, side);
  const metric = kind === 'squat' ? squatMetric(pose, side) : kind === 'pushup' ? pushupMetric(pose) : lungeMetric(pose, side);
  const depthPercent = depthPercentForMetric(kind, metric);
  const next: RepState = {
    ...previous,
    activeSide: kind === 'pushup' ? undefined : side,
    lastWarning: warning,
    lastWarningAt: warning === previous.lastWarning ? previous.lastWarningAt : timestamp,
  };

  if (metric === null || confidence < 0.42) {
    if (next.lastTrackedAt && timestamp - next.lastTrackedAt > 500) {
      next.phase = 'ready';
      next.cycleArmed = false;
      next.phaseStartedAt = timestamp;
    }
    return { state: next, warning, metric, depthPercent, confidence };
  }

  next.lastTrackedAt = timestamp;
  const countableForm = formIsCountable(kind, pose, side);
  if (!countableForm) {
    warning = kind === 'pushup' ? 'liveHipPosition' : kind === 'lunge' ? 'liveBackAngle' : 'liveKneeAlignment';
    next.phase = 'ready';
    next.cycleArmed = false;
    next.phaseStartedAt = timestamp;
    next.lastWarning = warning;
    next.lastWarningAt = warning === previous.lastWarning ? previous.lastWarningAt : timestamp;
    return { state: next, warning, metric, depthPercent, confidence };
  }

  const { fullDepth: downThreshold, standing: startThreshold } = depthThresholds[kind];
  const upThreshold = kind === 'pushup' ? 155 : 160;
  const ascentThreshold = downThreshold + (kind === 'squat' ? 12 : 18);
  const pushupDepthReady = kind !== 'pushup' || (pushupHeadDrop(pose) ?? 0) >= -0.06;
  const fullDepthReached = depthPercent >= 100;

  const previousPhase = next.phase;
  if (next.phase === 'ready' && metric >= startThreshold) next.cycleArmed = true;
  if (next.phase === 'ready' && next.cycleArmed && fullDepthReached && pushupDepthReady) next.phase = 'bottom';
  else if (next.phase === 'ready' && next.cycleArmed && metric < startThreshold) next.phase = 'descending';
  else if (next.phase === 'descending' && fullDepthReached && pushupDepthReady) next.phase = 'bottom';
  else if (next.phase === 'bottom' && metric >= ascentThreshold) next.phase = 'ascending';
  else if (next.phase === 'ascending' && metric > upThreshold) {
    if (next.cycleArmed && timestamp - next.lastRepAt > 450) {
      next.reps += 1;
      next.lastRepAt = timestamp;
    }
    next.phase = 'ready';
    next.cycleArmed = false;
  }
  if (next.phase !== previousPhase) {
    if (next.phase === 'descending' && previousPhase === 'ready' && metric > downThreshold + 12) warning = 'liveReachDepth';
    if (next.phase === 'bottom' && timestamp - next.phaseStartedAt < 240) warning = 'liveTempo';
    next.phaseStartedAt = timestamp;
  }
  next.lastWarning = warning;

  return { state: next, warning, metric, depthPercent, confidence };
}