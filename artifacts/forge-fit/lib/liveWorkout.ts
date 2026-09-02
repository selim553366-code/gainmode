import { isVisible, landmark } from 'react-native-pose-detection';
import type { PoseFrame } from 'react-native-pose-detection';
import type { PoseJoint, PoseLandmarks } from './liveWorkoutAnalysis';

export * from './liveWorkoutAnalysis';

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

export function poseFromFrame(frame: PoseFrame): PoseLandmarks {
  const pose: PoseLandmarks = {};
  (Object.keys(JOINT_NAMES) as PoseJoint[]).forEach((joint) => {
    const nativeJoint = JOINT_NAMES[joint] as Parameters<typeof landmark>[1];
    if (!isVisible(frame, nativeJoint, 0.25)) return;
    const point = landmark(frame, nativeJoint);
    pose[joint] = { x: point.x, y: point.y, visibility: point.visibility };
  });
  return pose;
}