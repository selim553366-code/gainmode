---
name: Forge Fit onboarding personalization
description: Onboarding separates required profile data from optional personalization and uses native-friendly coach media.
---

Forge Fit onboarding should collect the minimum profile first, then offer optional calorie and workout refinements. The coach's waving video is converted into transparent frame assets for the native Expo flow; static transparent coach PNGs handle writing and completion states.

**Why:** Native Expo video alpha support is inconsistent, while frame-based animation renders reliably across web and mobile.

**How to apply:** Keep required questions short, label refinement questions as optional, and let skipped refinements fall back to safe defaults in profile calculations.