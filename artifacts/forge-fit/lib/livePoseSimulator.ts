import type { ExerciseKind, Point, PoseJoint, PoseLandmarks } from './liveWorkoutAnalysis';

type Joints = Partial<Record<PoseJoint, [number, number]>>;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: [number, number], b: [number, number], t: number): [number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/**
 * Keyframes for each exercise as the camera should see it, in normalised image coordinates
 * (x to the right, y down). `top` is the start position and `bottom` full depth.
 */
const keyframes: Record<ExerciseKind, { top: Joints; bottom: Joints }> = {
  // Front view, standing square to the camera.
  squat: {
    top: {
      nose: [0.5, 0.2], leftShoulder: [0.42, 0.29], rightShoulder: [0.58, 0.29],
      leftElbow: [0.39, 0.4], rightElbow: [0.61, 0.4], leftWrist: [0.4, 0.5], rightWrist: [0.6, 0.5],
      leftHip: [0.45, 0.52], rightHip: [0.55, 0.52], leftKnee: [0.445, 0.7], rightKnee: [0.555, 0.7],
      leftAnkle: [0.44, 0.88], rightAnkle: [0.56, 0.88],
    },
    bottom: {
      nose: [0.5, 0.36], leftShoulder: [0.42, 0.45], rightShoulder: [0.58, 0.45],
      leftElbow: [0.4, 0.46], rightElbow: [0.6, 0.46], leftWrist: [0.44, 0.47], rightWrist: [0.56, 0.47],
      leftHip: [0.44, 0.66], rightHip: [0.56, 0.66], leftKnee: [0.4, 0.71], rightKnee: [0.6, 0.71],
      leftAnkle: [0.44, 0.88], rightAnkle: [0.56, 0.88],
    },
  },
  // Front view from the floor: plank with the head toward the camera, hands under the shoulders;
  // the hips and legs are hidden behind the torso.
  pushup: {
    top: {
      nose: [0.5, 0.36], leftShoulder: [0.37, 0.44], rightShoulder: [0.63, 0.44],
      leftElbow: [0.35, 0.58], rightElbow: [0.65, 0.58], leftWrist: [0.36, 0.72], rightWrist: [0.64, 0.72],
    },
    bottom: {
      nose: [0.5, 0.52], leftShoulder: [0.37, 0.58], rightShoulder: [0.63, 0.58],
      leftElbow: [0.28, 0.62], rightElbow: [0.72, 0.62], leftWrist: [0.36, 0.72], rightWrist: [0.64, 0.72],
    },
  },
  // Side view, facing right, left foot forward and right foot back.
  lunge: {
    top: {
      nose: [0.53, 0.18], leftShoulder: [0.5, 0.28], rightShoulder: [0.51, 0.28],
      leftElbow: [0.5, 0.4], rightElbow: [0.51, 0.4], leftWrist: [0.52, 0.5], rightWrist: [0.53, 0.5],
      leftHip: [0.49, 0.52], rightHip: [0.5, 0.52], leftKnee: [0.575, 0.7], rightKnee: [0.41, 0.7],
      leftAnkle: [0.66, 0.88], rightAnkle: [0.32, 0.88],
    },
    bottom: {
      nose: [0.53, 0.3], leftShoulder: [0.5, 0.4], rightShoulder: [0.51, 0.4],
      leftElbow: [0.5, 0.52], rightElbow: [0.51, 0.52], leftWrist: [0.52, 0.62], rightWrist: [0.53, 0.62],
      leftHip: [0.49, 0.64], rightHip: [0.5, 0.64], leftKnee: [0.65, 0.68], rightKnee: [0.45, 0.85],
      leftAnkle: [0.66, 0.88], rightAnkle: [0.32, 0.88],
    },
  },
};

/** Pose at a given depth (0 = top, 1 = bottom), with a little deterministic jitter. */
export function simulatedPose(kind: ExerciseKind, depth: number, jitterSeed = 0): PoseLandmarks {
  const { top, bottom } = keyframes[kind];
  const pose: PoseLandmarks = {};
  (Object.keys(top) as PoseJoint[]).forEach((joint, index) => {
    const [x, y] = mix(top[joint]!, bottom[joint] ?? top[joint]!, depth);
    const wobble = Math.sin(jitterSeed * 1.7 + index * 2.3) * 0.002;
    pose[joint] = { x: x + wobble, y: y - wobble, visibility: 0.92 } satisfies Point;
  });
  return pose;
}

/** Depth over time for a steady rep cycle: rest at the top, down, short pause, up. */
export function repDepthAt(timeMs: number, periodMs = 2600) {
  const t = (timeMs % periodMs) / periodMs;
  if (t < 0.18) return 0;
  const p = (t - 0.18) / 0.82;
  return (1 - Math.cos(p * Math.PI * 2)) / 2;
}
