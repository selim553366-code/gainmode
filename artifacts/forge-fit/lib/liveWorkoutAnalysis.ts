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
  | 'liveGoodForm'
  | 'liveFaceCamera'
  | 'liveTurnSideways'
  | 'liveHeadForward'
  | 'liveHeadDown'
  | 'liveGetInPlank'
  | 'liveSplitStance';

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
  /** Deepest point (0–1) reached in the current repetition. */
  repDepth: number;
  /** A form fault seen during the current repetition; it will not be counted. */
  repFault: LiveWarningKey | null;
  /** Push-up only: shoulder height at the top of the movement, the zero point for depth. */
  topLevel: number | null;
  /** Push-up only: nose height at the top of the movement. */
  headTop: number | null;
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
  repDepth: 0,
  repFault: null,
  topLevel: null,
  headTop: null,
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
    x: previous.x * 0.15 + current.x * 0.85,
    y: previous.y * 0.15 + current.y * 0.85,
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

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** All listed joints present with at least this visibility. */
function has(pose: PoseLandmarks, joints: PoseJoint[], minVisibility = 0.4) {
  return joints.every((joint) => (point(pose, joint)?.visibility ?? 0) >= minVisibility);
}

/**
 * What one frame says about a repetition: whether the person is set up the way the exercise
 * needs to be seen, how deep they are (0 = start position, 1 = full depth), and any form fault.
 */
type FrameReading = {
  /** Null when the body is visible and oriented correctly; otherwise why counting is paused. */
  blocker: LiveWarningKey | null;
  depth: number;
  fault: LiveWarningKey | null;
  metric: number | null;
  confidence: number;
  topLevel?: number | null;
  headTop?: number | null;
};

/**
 * Squat, seen from the front. Both legs must be visible and the shoulders square to the camera.
 * Depth comes from how far the hips sink toward the knees (thigh length shrinks in a front view),
 * which is far steadier than a 2D knee angle when the thigh points at the lens.
 */
function readSquat(pose: PoseLandmarks): FrameReading {
  const legs: PoseJoint[] = ['leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'];
  const confidence = visibilityFor(pose, ['leftShoulder', 'rightShoulder', ...legs]);
  if (!has(pose, ['leftShoulder', 'rightShoulder', ...legs])) return { blocker: 'liveLookingForBody', depth: 0, fault: null, metric: null, confidence };
  const ls = pose.leftShoulder!; const rs = pose.rightShoulder!;
  const shoulders = midpoint(ls, rs)!;
  const hips = midpoint(pose.leftHip, pose.rightHip)!;
  const ankles = midpoint(pose.leftAnkle, pose.rightAnkle)!;
  const torso = Math.max(0.05, distance(shoulders, hips));
  if (Math.abs(ls.x - rs.x) < torso * 0.45) return { blocker: 'liveFaceCamera', depth: 0, fault: null, metric: null, confidence };
  const height = ankles.y - shoulders.y;
  if (height < 0.3) return { blocker: 'liveMoveCloser', depth: 0, fault: null, metric: null, confidence };
  if (height > 0.95) return { blocker: 'liveStepBack', depth: 0, fault: null, metric: null, confidence };

  const legRatio = (side: 'left' | 'right') => {
    const hip = pose[`${side}Hip`]!; const knee = pose[`${side}Knee`]!; const ankle = pose[`${side}Ankle`]!;
    return (knee.y - hip.y) / Math.max(0.02, ankle.y - knee.y);
  };
  const left = legRatio('left');
  const right = legRatio('right');
  const ratio = (left + right) / 2;
  // Standing: thigh about as long as the shin (ratio ~1). Parallel or lower: ~0.3 or less.
  const depth = clamp01((0.92 - ratio) / (0.92 - 0.32));

  let fault: LiveWarningKey | null = null;
  const kneeSpread = Math.abs(pose.leftKnee!.x - pose.rightKnee!.x);
  const ankleSpread = Math.abs(pose.leftAnkle!.x - pose.rightAnkle!.x);
  if (depth > 0.35 && kneeSpread < ankleSpread * 0.72) fault = 'liveKneeAlignment';
  else if (depth > 0.35 && Math.abs(left - right) > 0.38) fault = 'liveBalance';
  return { blocker: null, depth, fault, metric: Math.round(ratio * 100) / 100, confidence };
}

/**
 * Push-up, seen from the front with the camera on the floor and the head toward it. A repetition
 * is the head and both shoulders travelling down together and back up. Depth is measured in
 * shoulder widths below the top position, so it works at any distance from the phone.
 */
function readPushup(pose: PoseLandmarks, previous: RepState): FrameReading {
  const confidence = visibilityFor(pose, ['nose', 'leftShoulder', 'rightShoulder']);
  if (!has(pose, ['nose', 'leftShoulder', 'rightShoulder'])) return { blocker: 'liveLookingForBody', depth: 0, fault: null, metric: null, confidence, topLevel: previous.topLevel };
  const ls = pose.leftShoulder!; const rs = pose.rightShoulder!; const nose = pose.nose!;
  const width = Math.abs(ls.x - rs.x);
  if (width < 0.1) return { blocker: 'liveMoveCloser', depth: 0, fault: null, metric: null, confidence, topLevel: previous.topLevel };
  const minX = Math.min(ls.x, rs.x); const maxX = Math.max(ls.x, rs.x);
  // Head forward: the face sits between the shoulders, not off to one side.
  if (nose.x < minX + width * 0.18 || nose.x > maxX - width * 0.18) return { blocker: 'liveHeadForward', depth: 0, fault: null, metric: null, confidence, topLevel: previous.topLevel };
  const shoulderY = (ls.y + rs.y) / 2;
  // Standing up: ankles show far below the shoulders. In a plank facing the camera they are hidden or level.
  const ankles = centerPoint(pose, 'leftAnkle', 'rightAnkle');
  if (ankles && ankles.visibility >= 0.5 && ankles.y - shoulderY > width * 2.6) return { blocker: 'liveGetInPlank', depth: 0, fault: null, metric: null, confidence, topLevel: null, headTop: null };

  // The top of the movement is the highest the shoulders have been while resting at the start.
  // Both reference heights creep down slowly while resting at the top, so a shifted phone recovers.
  const settle = (current: number | null, value: number) => {
    const base = current ?? value;
    if (value < base) return value;
    return previous.phase === 'ready' ? base + (value - base) * 0.05 : base;
  };
  const top = settle(previous.topLevel, shoulderY);
  const headTop = settle(previous.headTop, nose.y);
  const shoulderDrop = (shoulderY - top) / width;
  const headDrop = (nose.y - headTop) / width;
  const shoulderDepth = clamp01(shoulderDrop / 0.42);
  const headDepth = clamp01(headDrop / 0.42);
  // The head has to come down with the shoulders; dropping only the hips or shoulders is not a rep.
  const depth = Math.min(shoulderDepth, headDepth);

  let fault: LiveWarningKey | null = null;
  if (shoulderDepth > 0.5 && headDepth < shoulderDepth * 0.55) fault = 'liveHeadDown';
  const le = pose.leftElbow; const re = pose.rightElbow;
  if (!fault && shoulderDepth > 0.4 && le && re && le.visibility > 0.5 && re.visibility > 0.5 && Math.abs(le.x - re.x) > width * 2.4) fault = 'liveElbowPosition';
  return { blocker: null, depth, fault, metric: Math.round(shoulderDrop * 100) / 100, confidence, topLevel: top, headTop };
}

/**
 * Lunge, seen from the side. The body must be turned sideways (shoulders and hips stacked), feet
 * split front and back, and a repetition needs both knees to bend: the depth follows the
 * straighter of the two knees, so bending only the front leg is not enough.
 */
function readLunge(pose: PoseLandmarks): FrameReading {
  const legs: PoseJoint[] = ['leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'];
  const confidence = visibilityFor(pose, legs);
  if (!has(pose, legs, 0.3) || !(pose.leftShoulder || pose.rightShoulder)) return { blocker: 'liveLookingForBody', depth: 0, fault: null, metric: null, confidence };
  const shoulders = centerPoint(pose, 'leftShoulder', 'rightShoulder')!;
  const hips = midpoint(pose.leftHip, pose.rightHip)!;
  const torso = Math.max(0.05, distance(shoulders, hips));
  const shoulderWidth = pose.leftShoulder && pose.rightShoulder ? Math.abs(pose.leftShoulder.x - pose.rightShoulder.x) : 0;
  const hipWidth = Math.abs(pose.leftHip!.x - pose.rightHip!.x);
  if (shoulderWidth > torso * 0.5 || hipWidth > torso * 0.45) return { blocker: 'liveTurnSideways', depth: 0, fault: null, metric: null, confidence };
  if (Math.abs(pose.leftAnkle!.x - pose.rightAnkle!.x) < torso * 0.55) return { blocker: 'liveSplitStance', depth: 0, fault: null, metric: null, confidence };

  const left = angle(pose.leftHip, pose.leftKnee, pose.leftAnkle) ?? 180;
  const right = angle(pose.rightHip, pose.rightKnee, pose.rightAnkle) ?? 180;
  const straighter = Math.max(left, right);
  // In 2D a back knee near the floor reads about 110–120°, so 120° counts as full depth.
  const depth = clamp01((165 - straighter) / (165 - 120));

  let fault: LiveWarningKey | null = null;
  const facing = Math.sign((pose.leftAnkle!.x + pose.rightAnkle!.x) / 2 - hips.x) || 1;
  const front = (facing > 0) === (pose.leftAnkle!.x > pose.rightAnkle!.x) ? 'left' : 'right';
  const frontKnee = pose[`${front}Knee`]!; const frontAnkle = pose[`${front}Ankle`]!;
  if (depth > 0.4 && (frontKnee.x - frontAnkle.x) * facing > torso * 0.38) fault = 'liveKneeAlignment';
  const lean = Math.abs(Math.atan2(shoulders.x - hips.x, hips.y - shoulders.y)) * 180 / Math.PI;
  if (!fault && lean > 30) fault = 'liveBackAngle';
  return { blocker: null, depth, fault, metric: straighter, confidence };
}

export function depthPercentForMetric(depth: number) {
  return Math.round(clamp01(depth) * 100);
}

const TOP = 0.18;
const BOTTOM = 0.92;
const RETURN = 0.15;
const MIN_REP_MS = 600;

/**
 * Turns frame readings into repetitions. A rep is counted only when the person starts at the top,
 * reaches full depth, and comes back up, with the body seen the right way the whole time and no
 * form fault along the way. Shallow reps and faulty reps are not counted and say why.
 */
export function analyzePose(kind: ExerciseKind, pose: PoseLandmarks, previous: RepState, timestamp: number): AnalysisResult {
  const reading = kind === 'squat' ? readSquat(pose) : kind === 'pushup' ? readPushup(pose, previous) : readLunge(pose);
  const next: RepState = {
    ...previous,
    topLevel: reading.topLevel === undefined ? previous.topLevel : reading.topLevel,
    headTop: reading.headTop === undefined ? previous.headTop : reading.headTop,
  };
  const depthPercent = depthPercentForMetric(reading.depth);
  const finish = (warning: LiveWarningKey): AnalysisResult => {
    next.lastWarningAt = warning === previous.lastWarning ? previous.lastWarningAt : timestamp;
    next.lastWarning = warning;
    return { state: next, warning, metric: reading.metric, depthPercent: reading.blocker ? 0 : depthPercent, confidence: reading.confidence };
  };

  if (reading.blocker) {
    // A short dropout keeps the rep alive; a longer one starts over from the top.
    if (!next.lastTrackedAt || timestamp - next.lastTrackedAt > 600) {
      next.phase = 'ready';
      next.cycleArmed = false;
      next.repDepth = 0;
      next.repFault = null;
      next.phaseStartedAt = timestamp;
    }
    return finish(reading.blocker);
  }
  next.lastTrackedAt = timestamp;
  const depth = reading.depth;
  if (next.phase !== 'ready' && reading.fault) next.repFault = next.repFault ?? reading.fault;
  next.repDepth = Math.max(next.repDepth, depth);

  let warning: LiveWarningKey = reading.fault ?? 'liveGoodForm';
  const phase = next.phase;
  if (phase === 'ready') {
    if (depth <= TOP) next.cycleArmed = true;
    if (next.cycleArmed && depth > TOP) {
      next.phase = 'descending';
      next.phaseStartedAt = timestamp;
      next.repDepth = depth;
      next.repFault = reading.fault;
    }
  } else if (phase === 'descending') {
    if (depth >= BOTTOM) { next.phase = 'bottom'; next.phaseStartedAt = timestamp; }
    else if (depth <= RETURN) {
      // Came back up without reaching depth.
      warning = 'liveReachDepth';
      next.phase = 'ready';
      next.phaseStartedAt = timestamp;
    }
  } else if (phase === 'bottom') {
    if (depth < BOTTOM - 0.12) { next.phase = 'ascending'; next.phaseStartedAt = timestamp; }
  } else if (phase === 'ascending') {
    if (depth >= BOTTOM) next.phase = 'bottom';
    else if (depth <= RETURN) {
      if (next.repFault) warning = next.repFault;
      else if (timestamp - next.lastRepAt < MIN_REP_MS) warning = 'liveTempo';
      else {
        next.reps += 1;
        next.lastRepAt = timestamp;
      }
      next.phase = 'ready';
      next.cycleArmed = true;
      next.repDepth = 0;
      next.repFault = null;
      next.phaseStartedAt = timestamp;
    }
  }
  if (warning === 'liveGoodForm' && next.repFault) warning = next.repFault;
  return finish(warning);
}
