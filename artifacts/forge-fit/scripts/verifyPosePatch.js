// Runs on EAS after dependencies are installed (the "eas-build-post-install" hook).
// Live form analysis breaks on Android when the react-native-pose-detection patch is missing
// (DETECTOR_INIT_FAILED: com.google.mediapipe.framework.Graph), and a missing patch is otherwise
// silent. Stop the build with a clear message instead of shipping a broken live form screen.
const fs = require('fs');
const path = require('path');

const root = path.dirname(require.resolve('react-native-pose-detection/package.json'));
const view = fs.readFileSync(path.join(root, 'android/src/main/java/com/posedetection/view/PoseCameraView.kt'), 'utf8');
const gradle = fs.readFileSync(path.join(root, 'android/build.gradle'), 'utf8');

if (!view.includes('describeFailure') || !gradle.includes("tasks-vision:0.10.29")) {
  console.error('\n[GainMode] The react-native-pose-detection patch was NOT applied (patches/react-native-pose-detection@0.1.0.patch).');
  console.error('[GainMode] Install with pnpm from the repository root so pnpm-workspace.yaml patchedDependencies is used.\n');
  process.exit(1);
}
console.log('[GainMode] react-native-pose-detection patch is applied.');
