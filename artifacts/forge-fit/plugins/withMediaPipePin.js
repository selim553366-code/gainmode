/**
 * Live form analysis on Android needs MediaPipe Tasks 0.10.29.
 *
 * From 0.10.33 on, `tasks-vision` is a thin facade and release builds fail to create the pose
 * landmarker with "DETECTOR_INIT_FAILED: com.google.mediapipe.framework.Graph". The pnpm patch on
 * react-native-pose-detection pins 0.10.29 inside the library, but a build that installs packages
 * without applying that patch silently goes back to 0.10.35. This plugin forces the version from the
 * app itself, so every EAS build gets it no matter how dependencies were installed.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const VERSION = '0.10.29';
const MARKER = '// GainMode: MediaPipe pin';

module.exports = function withMediaPipePin(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy' || mod.modResults.contents.includes(MARKER)) return mod;
    mod.modResults.contents += `
${MARKER}
configurations.all {
    resolutionStrategy {
        force 'com.google.mediapipe:tasks-vision:${VERSION}'
        force 'com.google.mediapipe:tasks-core:${VERSION}'
    }
}
`;
    return mod;
  });
};
