---
name: Unpatched Expo dependency advisories
description: Handling security advisories in Expo transitive dependencies when upstream has not published compatible fixes.
---

Do not force arbitrary versions for vulnerable transitive dependencies used by the current Expo SDK when the upstream package has no patched release. Keep the advisory visible, confirm whether it is limited to the development/build toolchain, and move to a compatible Expo SDK/CLI release once it includes the fix.

**Why:** Expo SDK dependencies must stay aligned across the native toolchain; overriding a missing patch with an incompatible release can break iOS/Android builds without actually providing a verified fix.

**How to apply:** Before changing an Expo transitive dependency, verify its published versions and compatibility with the installed SDK, then run the mobile tests and native builds after any safe upgrade.
