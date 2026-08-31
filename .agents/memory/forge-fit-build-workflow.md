---
name: Expo static build workflow
description: Port coordination considerations when validating Forge Fit Expo bundles.
---

The managed Forge Fit preview can run Expo Metro on a dynamic port while the static Expo build helper probes port 8081; validate source changes with the managed workflow and a direct Expo export when those services overlap.

**Why:** The static build helper may ask for an interactive port change and fail in non-interactive mode when another managed artifact owns port 8081, even though the app itself bundles and renders correctly.

**How to apply:** Restart the Forge Fit workflow after code changes, inspect its bundling logs, and use a direct web export for compile validation. Treat a static-build port collision as an environment issue unless the workflow itself reports a bundle error.

Expo dependencies in this pnpm monorepo must be added to the Forge Fit workspace with an SDK-matched version; generic package installation can target the workspace root or select an incompatible latest version.

**Why:** The package helper targeted the monorepo root and the latest clipboard package did not match Expo SDK 54, while the workspace-scoped SDK version bundled cleanly.

**How to apply:** Prefer the package’s workspace filter and the version requested by Expo’s compatibility check when adding native Expo modules.

Expo CLI may fail before Metro starts when its online dependency-version request returns an empty JSON response; offline mode skips that check and still serves the managed preview.

**Why:** The Forge Fit workflow encountered `Unexpected end of JSON input` inside Expo’s remote version lookup while local dependency checks were already clean.

**How to apply:** If this exact startup failure recurs, use `EXPO_OFFLINE=1` in the Forge Fit dev command, then restart the managed workflow and verify Metro opens its configured port.