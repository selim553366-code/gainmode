---
name: Expo static build workflow
description: Port coordination considerations when validating Forge Fit Expo bundles.
---

The managed Forge Fit preview can run Expo Metro on a dynamic port while the static Expo build helper probes port 8081; validate source changes with the managed workflow and a direct Expo export when those services overlap.

**Why:** The static build helper may ask for an interactive port change and fail in non-interactive mode when another managed artifact owns port 8081, even though the app itself bundles and renders correctly.

**How to apply:** Restart the Forge Fit workflow after code changes, inspect its bundling logs, and use a direct web export for compile validation. Treat a static-build port collision as an environment issue unless the workflow itself reports a bundle error.