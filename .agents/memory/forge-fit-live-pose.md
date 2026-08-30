---
name: Forge Fit live pose tracking
description: Native-only, on-device pose analysis constraints for the live workout flow.
---

Forge Fit live workouts use a native MediaPipe pose component with its Expo config plugin; barcode scanning and accelerometer-driven UI are native device features too. Expo Go and web previews must show explicit fallbacks rather than attempting fake camera, barcode, landmark, or sensor data.

**Why:** Native camera inference keeps video off the server and avoids external AI costs, while camera scanning and motion sensors are unavailable or unreliable in browser/Expo Go previews.

**How to apply:** Keep rep/form logic in JavaScript over throttled native landmark frames, use the native skeleton overlay for rendering, gate barcode and motion effects by platform support, and verify camera behavior with an Android development build.