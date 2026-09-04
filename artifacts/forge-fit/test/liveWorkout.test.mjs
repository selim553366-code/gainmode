import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzePose, cameraDisplayX, initialRepState } from '../lib/liveWorkoutAnalysis.ts';

const point = (x, y, visibility = 0.95) => ({ x, y, visibility });

test('keeps real camera orientation for horizontal skeleton movement', () => {
  assert.equal(cameraDisplayX(0.2), 0.2);
  assert.ok(Math.abs(cameraDisplayX(0.8) - 0.8) < 1e-9);
  assert.equal(cameraDisplayX(0.5), 0.5);
});

function sidePose(kneeAngle, side = 'left') {
  const prefix = side === 'left' ? 'left' : 'right';
  const geometry = kneeAngle >= 160
    ? { hipX: 0.45, hipY: 0.45, kneeX: 0.45, kneeY: 0.68, ankleX: 0.45, ankleY: 0.9 }
    : kneeAngle <= 110
      ? { hipX: 0.3, hipY: 0.68, kneeX: 0.45, kneeY: 0.68, ankleX: 0.45, ankleY: 0.9 }
      : { hipX: 0.25, hipY: 0.5, kneeX: 0.45, kneeY: 0.68, ankleX: 0.45, ankleY: 0.9 };
  const pose = {
    [`${prefix}Shoulder`]: point(0.45, 0.2),
    [`${prefix}Hip`]: point(geometry.hipX, geometry.hipY),
    [`${prefix}Knee`]: point(geometry.kneeX, geometry.kneeY),
    [`${prefix}Ankle`]: point(geometry.ankleX, geometry.ankleY),
  };
  return pose;
}

function pushupPose(elbowAngle, includeRightArm = true) {
  const pose = {
    nose: point(0.5, elbowAngle <= 110 ? 0.52 : 0.3),
    leftShoulder: point(0.25, 0.45),
    leftElbow: point(elbowAngle <= 110 ? 0.35 : 0.4, 0.45),
    leftWrist: point(elbowAngle <= 110 ? 0.35 : 0.5, elbowAngle <= 110 ? 0.55 : 0.45),
    leftHip: point(0.6, 0.55),
    leftAnkle: point(0.9, 0.65),
    rightShoulder: point(0.75, 0.45),
    rightHip: point(0.6, 0.55),
    rightAnkle: point(0.9, 0.65),
  };
  if (includeRightArm) {
    pose.rightElbow = point(elbowAngle <= 110 ? 0.65 : 0.7, 0.45);
    pose.rightWrist = point(elbowAngle <= 110 ? 0.65 : 0.5, elbowAngle <= 110 ? 0.55 : 0.45);
  }
  return pose;
}

function runCycle(kind, poses) {
  let state = initialRepState;
  let timestamp = 1000;
  for (const pose of poses) {
    state = analyzePose(kind, pose, state, timestamp).state;
    timestamp += 500;
  }
  return state;
}

test('counts a side-view squat using the clearest single body side', () => {
  const state = runCycle('squat', [
    sidePose(170),
    sidePose(95),
    sidePose(130),
    sidePose(170),
  ]);

  assert.equal(state.activeSide, 'left');
  assert.equal(state.reps, 1);
});

test('counts a front-view squat from both bent knees', () => {
  const state = runCycle('squat', [
    { ...sidePose(170, 'left'), ...sidePose(170, 'right') },
    { ...sidePose(95, 'left'), ...sidePose(95, 'right') },
    { ...sidePose(130, 'left'), ...sidePose(130, 'right') },
    { ...sidePose(170, 'left'), ...sidePose(170, 'right') },
  ]);

  assert.equal(state.reps, 1);
});

test('counts a side-view lunge without requiring both overlapping legs', () => {
  const state = runCycle('lunge', [
    sidePose(170, 'right'),
    sidePose(95, 'right'),
    sidePose(130, 'right'),
    sidePose(170, 'right'),
  ]);

  assert.equal(state.activeSide, 'right');
  assert.equal(state.reps, 1);
});

test('counts a front-view push-up when one arm is the clearest track', () => {
  const state = runCycle('pushup', [
    pushupPose(170, false),
    pushupPose(90, false),
    pushupPose(130, false),
    pushupPose(170, false),
  ]);

  assert.equal(state.reps, 1);
});

test('does not count a push-up when elbows bend without the head dropping', () => {
  const bentArmsWithoutDepth = { ...pushupPose(90, false), nose: point(0.5, 0.3) };
  const state = runCycle('pushup', [
    pushupPose(170, false),
    bentArmsWithoutDepth,
    pushupPose(130, false),
    pushupPose(170, false),
  ]);

  assert.equal(state.reps, 0);
});