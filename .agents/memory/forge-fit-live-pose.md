---
name: Forge Fit live pose tracking
description: Native-only, on-device pose analysis constraints for the live workout flow.
---

Forge Fit live workouts use a native MediaPipe pose component with its Expo config plugin; barcode scanning and accelerometer-driven UI are native device features too. Expo Go and web previews must show explicit fallbacks rather than attempting fake camera, barcode, landmark, or sensor data.

**Why:** Native camera inference keeps video off the server and avoids external AI costs, while camera scanning and motion sensors are unavailable or unreliable in browser/Expo Go previews.

**How to apply:** Keep rep/form logic in JavaScript over throttled native landmark frames, use the native skeleton overlay for rendering, gate barcode and motion effects by platform support, and verify camera behavior with an Android development build.

The pose package’s published compatibility range is broader than its actual native source compatibility: both Android and iOS can reference Expo Modules binary-buffer APIs introduced after Expo 54 even though Expo 51+ is declared.

**Why:** Cloud release builds failed because the package expected a newer native array-buffer wrapper unavailable in Expo Modules Core 3.x. Expo 54 bridges Android byte arrays and iOS `Data` as typed arrays.

**How to apply:** Preserve the workspace pnpm compatibility patch while Forge Fit remains on Expo 54. Copy Android direct buffers safely, return iOS `Data`, and let the JS decoder accept both `ArrayBuffer` and typed-array views. Remove the patch only after an Expo upgrade compiles and runs the package unmodified.

Forge Fit intentionally keeps the front-camera preview natural while mirroring only the pose rig; JS-rendered skeleton fallbacks must match the rig transform.

**Why:** The product experience needs an unmirrored camera view, but the anatomical rig must be flipped so the user's left/right movement is represented correctly in the overlay.

**How to apply:** Keep the front-camera preview scale at `1f`, mirror native overlay landmarks, and use `1 - normalizedX` for any JS-rendered skeleton fallback. Keep the back camera and its rig unmirrored.

CameraX's `PreviewView` performance mode can composite its SurfaceView above a sibling pose overlay on some Android builds.

**Why:** The pose callback can be healthy while the skeleton remains invisible because the camera surface wins the native composition order.

**How to apply:** Use `PreviewView.ImplementationMode.COMPATIBLE` for the live pose screen and keep the overlay explicitly above the preview; re-test after every native rebuild.

The live workout overlay should be rendered from a smoothed JS landmark track while rep counting continues to use raw frames.

**Why:** Native landmark overlays can blink during one or two missed detections, while counting from held landmarks could create false repetitions.

**How to apply:** Keep the last reliable pose for a short dropout window, reject implausible torso jumps, then release the skeleton after the hold window; never feed the held pose into rep analysis.