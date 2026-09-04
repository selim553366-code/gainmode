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

Android's front-camera PreviewView must be mirrored around its center when the native pose overlay mirrors front-camera landmarks; otherwise the skeleton and preview use different horizontal coordinate systems.

**Why:** CameraX's PreviewView does not reliably mirror the front-camera preview by itself, while the pose overlay intentionally mirrors normalized landmarks for selfie alignment.

**How to apply:** Keep the preview mirror and overlay mirror in sync inside the native pose package patch; reset the preview scale to `1f` for the rear camera, and apply the same `1 - x` transform to any JS-rendered skeleton fallback.

CameraX's `PreviewView` performance mode can composite its SurfaceView above a sibling pose overlay on some Android builds.

**Why:** The pose callback can be healthy while the skeleton remains invisible because the camera surface wins the native composition order.

**How to apply:** Use `PreviewView.ImplementationMode.COMPATIBLE` for the live pose screen and keep the overlay explicitly above the preview; re-test after every native rebuild.