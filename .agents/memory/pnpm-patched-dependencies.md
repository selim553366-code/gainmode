---
name: PNPM patched dependencies
description: Constraints for maintaining pnpm patchedDependencies in this workspace.
---

Patched dependency files must remain valid unified diffs with a terminating newline, and the lockfile must be regenerated whenever the patch content changes.

**Why:** pnpm frozen installs validate the patchedDependencies hash before installing, while malformed or unterminated patch hunks fail later with a less actionable patch-application error.

**How to apply:** After editing a patch under patches/, keep each file's hunks in one ascending diff section, preserve space-only context lines, include generated declaration files when TypeScript resolves the package bundle, refresh the lockfile non-frozen, then verify with a frozen install and a clean-package patch application check.

The pose overlay and front-camera preview must be mirrored together, while detector rotation should remain at the library default until verified on a real Android development build; web previews cannot validate native overlay geometry.

**Why:** The original front-camera mirroring made a raised left hand appear as the opposite skeleton hand; changing detector rotation at the same time made the native skeleton regress on-device even though web bundling and static tests passed.

**How to apply:** Keep detector rotation unchanged, apply the same front-camera mirror transform to both PreviewView and OverlayView, and verify hand-side alignment on a real Android build.