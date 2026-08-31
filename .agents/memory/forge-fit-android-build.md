---
name: Forge Fit Android release builds
description: Native Android build prerequisites and release constraints for Forge Fit.
---

Forge Fit’s Expo native prebuild can validate the Android package identity, camera permission, and pose model without producing a distributable bundle. A production AAB requires an Android SDK/build-tools environment and a secure release keystore; the default generated debug keystore is not an acceptable production signer.

**Why:** The Replit preview workspace can resolve Expo native modules and generate Gradle files, but it does not provide the Android SDK or a production signing credential, and the supported Expo publishing flow does not produce Android Play bundles.

**How to apply:** Treat native prebuild plus config/type checks as source validation only. Build and sign the final AAB in a provisioned Android CI or local environment, keeping the keystore out of source control and chat.

For this pnpm monorepo, cloud Android build configuration must resolve from `artifacts/forge-fit`, where the complete Expo app configuration and `eas.json` live. A minimal workspace-root `app.json` makes EAS inspect the wrong project and can produce the misleading “Expo SDK < 41” warning even though Forge Fit uses SDK 54.

**Why:** The workspace contains several artifacts and its root package is not an Expo app; a root-level EAS configuration can shadow the actual mobile artifact.

**How to apply:** Keep the Forge Fit project ID in its artifact `app.json` and keep its build profiles beside that file. Avoid a competing root-level Expo config.