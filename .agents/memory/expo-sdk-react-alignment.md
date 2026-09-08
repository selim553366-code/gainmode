---
name: Expo SDK React alignment
description: Dependency rule for workspaces containing Expo artifacts on different SDK generations.
---

When Expo artifacts in the same workspace require different React versions, pin `react` and `react-dom` in each affected artifact instead of inheriting one shared catalog version.

**Why:** A catalog version suitable for the newest Expo artifact can silently reach an older Expo artifact; Metro may then fail during the production bundle even when development startup appears healthy.

**How to apply:** Run Expo dependency compatibility checks from the specific artifact directory and verify a production export for that artifact after changing shared React or Expo versions.