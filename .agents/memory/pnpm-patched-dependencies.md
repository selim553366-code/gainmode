---
name: PNPM patched dependencies
description: Constraints for maintaining pnpm patchedDependencies in this workspace.
---

Patched dependency files must remain valid unified diffs with a terminating newline, and the lockfile must be regenerated whenever the patch content changes.

**Why:** pnpm frozen installs validate the patchedDependencies hash before installing, while malformed or unterminated patch hunks fail later with a less actionable patch-application error.

**How to apply:** After editing a patch under patches/, keep each file's hunks in one ascending diff section, preserve space-only context lines, include generated declaration files when TypeScript resolves the package bundle, refresh the lockfile non-frozen, then verify with a frozen install and a clean-package patch application check.

The pose overlay must retain the library's original front-camera mirroring and landmark rotation behavior until those transformations are verified on a real Android development build; web previews cannot validate native overlay geometry.

**Why:** Forcing an unmirrored overlay and changing the detector rotation direction made the live skeleton regress on-device even though web bundling and static tests passed.

**How to apply:** Keep skeleton-only blackout changes isolated from coordinate transforms, and only revisit mirroring/rotation after device-camera verification.