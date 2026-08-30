---
name: Forge Fit live pose tracking
description: Native-only, on-device pose analysis constraints for the live workout flow.
---

Forge Fit live workouts use a native MediaPipe pose component with its Expo config plugin; Expo Go and web previews must show an explicit fallback rather than attempting camera or fake landmark data.

**Why:** Native camera inference keeps video off the server and avoids external AI costs, but the native module is not available in Expo Go or browser builds.

**How to apply:** Keep rep/form logic in JavaScript over throttled native landmark frames, use the native skeleton overlay for rendering, and verify camera behavior with an Android development build.