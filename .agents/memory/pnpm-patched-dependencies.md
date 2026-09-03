---
name: PNPM patched dependencies
description: Constraints for maintaining pnpm patchedDependencies in this workspace.
---

Patched dependency files must remain valid unified diffs with a terminating newline, and the lockfile must be regenerated whenever the patch content changes.

**Why:** pnpm frozen installs validate the patchedDependencies hash before installing, while malformed or unterminated patch hunks fail later with a less actionable patch-application error.

**How to apply:** After editing a patch under patches/, run the workspace lockfile refresh in non-frozen mode, then verify with a frozen install and a clean-package patch application check.