---
name: Forge Fit Android release builds
description: Native Android build prerequisites and release constraints for Forge Fit.
---

Forge Fit’s Expo native prebuild can validate the Android package identity, camera permission, and pose model without producing a distributable bundle. A production AAB requires an Android SDK/build-tools environment and a secure release keystore; the default generated debug keystore is not an acceptable production signer.

**Why:** The Replit preview workspace can resolve Expo native modules and generate Gradle files, but it does not provide the Android SDK or a production signing credential, and the supported Expo publishing flow does not produce Android Play bundles.

**How to apply:** Treat native prebuild plus config/type checks as source validation only. Build and sign the final AAB in a provisioned Android CI or local environment, keeping the keystore out of source control and chat.