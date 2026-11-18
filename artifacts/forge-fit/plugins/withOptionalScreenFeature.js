/**
 * The app is locked to portrait, which makes Android imply a *required* `android.hardware.screen.portrait`
 * feature. Google Play then hides the app from devices that do not report it (some tablets, Chromebooks,
 * Android XR). Declaring the feature as not required keeps portrait-only behaviour but lets every device
 * install the app.
 */
const { withAndroidManifest } = require('expo/config-plugins');

const FEATURES = ['android.hardware.screen.portrait'];

module.exports = function withOptionalScreenFeature(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const features = manifest['uses-feature'] ?? [];
    for (const name of FEATURES) {
      const existing = features.find((feature) => feature.$?.['android:name'] === name);
      if (existing) {
        existing.$['android:required'] = 'false';
      } else {
        features.push({ $: { 'android:name': name, 'android:required': 'false' } });
      }
    }
    manifest['uses-feature'] = features;
    return mod;
  });
};
