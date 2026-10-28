import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzePose, cameraDisplayX, initialPoseTrackState, initialRepState, stabilizePose } from '../lib/liveWorkoutAnalysis.ts';
import { repDepthAt, simulatedPose } from '../lib/livePoseSimulator.ts';

/** Feeds `cycles` rep cycles at 30 fps through the analyser, optionally reshaping each frame. */
function run(kind, cycles, { maxDepth = 1, transform = (pose) => pose } = {}) {
  let state = initialRepState;
  let warning = null;
  const warnings = new Set();
  const period = 2600;
  for (let time = 0; time <= period * cycles + 400; time += 33) {
    const depth = repDepthAt(time, period) * maxDepth;
    const result = analyzePose(kind, transform(simulatedPose(kind, depth, time), depth), state, time);
    state = result.state;
    warning = result.warning;
    warnings.add(result.warning);
  }
  return { reps: state.reps, warning, warnings };
}

test('mirrors front-camera skeleton movement for selfie alignment', () => {
  assert.equal(cameraDisplayX(0.2), 0.8);
  assert.equal(cameraDisplayX(0.5), 0.5);
});

for (const kind of ['squat', 'pushup', 'lunge']) {
  test(`counts every clean ${kind} repetition`, () => {
    const { reps, warnings } = run(kind, 5);
    assert.equal(reps, 5);
    assert.ok(warnings.has('liveGoodForm'));
  });
}

test('squat: not counted when the person is side-on to the camera', () => {
  const { reps, warnings } = run('squat', 3, { transform: (_, depth) => simulatedPose('lunge', depth) });
  assert.equal(reps, 0);
  assert.ok(warnings.has('liveFaceCamera'));
});

test('squat: shallow reps are not counted and ask for more depth', () => {
  const { reps, warnings } = run('squat', 3, { maxDepth: 0.55 });
  assert.equal(reps, 0);
  assert.ok(warnings.has('liveReachDepth'));
});

test('squat: knees caving in at the bottom voids the rep', () => {
  const { reps, warnings } = run('squat', 3, {
    transform: (pose, depth) => depth > 0.5 ? { ...pose, leftKnee: { ...pose.leftKnee, x: 0.48 }, rightKnee: { ...pose.rightKnee, x: 0.52 } } : pose,
  });
  assert.equal(reps, 0);
  assert.ok(warnings.has('liveKneeAlignment'));
});

test('push-up: the head must face the camera between the shoulders', () => {
  const { reps, warnings } = run('pushup', 3, { transform: (pose) => ({ ...pose, nose: { ...pose.nose, x: 0.3 } }) });
  assert.equal(reps, 0);
  assert.ok(warnings.has('liveHeadForward'));
});

test('push-up: shoulders dropping without the head is not a rep', () => {
  const { reps } = run('pushup', 3, { transform: (pose) => ({ ...pose, nose: { ...pose.nose, y: 0.36 } }) });
  assert.equal(reps, 0);
});

test('push-up: standing up in front of the camera is not counted', () => {
  const { reps, warnings } = run('pushup', 2, { transform: (_, depth) => simulatedPose('squat', depth) });
  assert.equal(reps, 0);
  assert.ok(warnings.has('liveGetInPlank'));
});

test('lunge: facing the camera asks to turn sideways', () => {
  const { reps, warnings } = run('lunge', 3, { transform: (_, depth) => simulatedPose('squat', depth) });
  assert.equal(reps, 0);
  assert.ok(warnings.has('liveTurnSideways'));
});

test('lunge: bending only the front knee is not a rep', () => {
  const { reps } = run('lunge', 3, {
    transform: (pose) => ({ ...pose, rightKnee: { ...pose.rightKnee, x: (pose.rightHip.x + pose.rightAnkle.x) / 2, y: (pose.rightHip.y + pose.rightAnkle.y) / 2 } }),
  });
  assert.equal(reps, 0);
});

test('lunge: feet together asks for a split stance', () => {
  const { reps, warnings } = run('lunge', 2, {
    transform: (pose) => ({ ...pose, leftAnkle: { ...pose.leftAnkle, x: 0.5 }, rightAnkle: { ...pose.rightAnkle, x: 0.52 } }),
  });
  assert.equal(reps, 0);
  assert.ok(warnings.has('liveSplitStance'));
});

test('keeps the last reliable skeleton during a short landmark dropout', () => {
  const first = stabilizePose(simulatedPose('squat', 0), initialPoseTrackState, 1000);
  const held = stabilizePose({}, first.state, 1250);
  const released = stabilizePose({}, held.state, 1600);
  assert.equal(first.locked, true);
  assert.deepEqual(held.pose, first.pose);
  assert.deepEqual(released.pose, {});
  assert.equal(released.locked, false);
});
