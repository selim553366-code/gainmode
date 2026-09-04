---
name: Forge Fit live pose tracking
description: Native-only, on-device pose analysis constraints for the live workout flow.
---

Forge Fit live workouts use a native MediaPipe pose component with its Expo config plugin; barcode scanning and accelerometer-driven UI are native device features too. Expo Go and web previews must show explicit fallbacks rather than attempting fake camera, barcode, landmark, or sensor data.

**Why:** Native camera inference keeps video off the server and avoids external AI costs, while camera scanning and motion sensors are unavailable or unreliable in browser/Expo Go previews.

**How to apply:** Keep rep/form logic in JavaScript over throttled native landmark frames, use the native skeleton overlay for rendering, gate barcode and motion effects by platform support, and verify camera behavior with an Android development build.

The pose package’s published compatibility range is broader than its actual native source compatibility: its Android code can reference Expo Modules APIs introduced after Expo 54 even though Expo 51+ is declared.

**Why:** A cloud release build failed in Kotlin compilation because the package expected a newer binary-buffer wrapper unavailable in Expo Modules Core 3.x. The pose engine returns direct byte buffers, while Expo 54’s typed-array bridge accepts byte arrays.

**How to apply:** Preserve the workspace-level pnpm compatibility patch while Forge Fit remains on Expo 54. Convert buffers by duplicating and copying their remaining bytes (direct buffers cannot use `array()`), and remove the patch only after an Expo upgrade compiles the package unmodified.

Forge Fit intentionally keeps the front-camera preview natural while mirroring only the pose rig; JS-rendered skeleton fallbacks must match the rig transform.

**Why:** The product experience needs an unmirrored camera view, but the anatomical rig must be flipped so the user's left/right movement is represented correctly in the overlay.

**How to apply:** Keep the front-camera preview scale at `1f`, mirror native overlay landmarks, and use `1 - normalizedX` for any JS-rendered skeleton fallback. Keep the back camera and its rig unmirrored.

CameraX's `PreviewView` performance mode can composite its SurfaceView above a sibling pose overlay on some Android builds.

**Why:** The pose callback can be healthy while the skeleton remains invisible because the camera surface wins the native composition order.

**How to apply:** Use `PreviewView.ImplementationMode.COMPATIBLE` for the live pose screen and keep the overlay explicitly above the preview; re-test after every native rebuild.