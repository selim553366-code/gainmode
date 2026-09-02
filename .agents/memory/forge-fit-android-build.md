---
name: Forge Fit Android release builds
description: Native Android build prerequisites and release constraints for Forge Fit.
---

Forge Fit’s Expo native prebuild can validate the Android package identity, camera permission, and pose model without producing a distributable bundle. A production AAB requires an Android SDK/build-tools environment and a secure release keystore; the default generated debug keystore is not an acceptable production signer.

**Why:** The Replit preview workspace can resolve Expo native modules and generate Gradle files, but it does not provide the Android SDK or a production signing credential, and the supported Expo publishing flow does not produce Android Play bundles.

**How to apply:** Treat native prebuild plus config/type checks as source validation only. Build and sign the final AAB in a provisioned Android CI or local environment, keeping the keystore out of source control and chat.

For this pnpm monorepo, cloud Android build configuration must resolve from `artifacts/forge-fit`, where the complete Expo app configuration and `eas.json` live. A minimal workspace-root `app.json` makes EAS inspect the wrong project and can produce the misleading “Expo SDK < 41” warning even though Forge Fit uses SDK 54. Do not copy the workspace project ID into the Forge Fit app config.

**Why:** The workspace contains several artifacts and its root package is not an Expo app; a root-level EAS configuration can shadow the actual mobile artifact.

**How to apply:** Keep Forge Fit’s own EAS project association beside its app configuration, and keep its build profiles there. Avoid a competing root-level Expo config or a project ID belonging to another slug.

EAS cloud builds for Forge Fit validate the workspace-wide pnpm lockfile, so an unrelated artifact with package changes can block the Android build before Expo compilation starts.

**Why:** The repository is a pnpm monorepo and EAS resolves dependencies across its workspace rather than only the mobile artifact.

**How to apply:** Before retrying an Android build, run a workspace lockfile-only sync and verify `pnpm install --frozen-lockfile` succeeds; do not bypass the frozen install or remove unrelated workspace packages.