---
name: Workspace package removal
description: Safely removing an unused dependency from one artifact in the pnpm monorepo.
---

When removing packages from a specific artifact, verify that artifact's `package.json` and generated native configuration after the package tool reports success. If the generic package-removal helper does not change the intended artifact, use a package-scoped pnpm filter and confirm the lockfile was updated.

**Why:** The generic helper reported success without removing the native packages from the Forge Fit artifact, so their permission contributions remained in Expo's generated configuration. A filtered pnpm removal updated the intended workspace.

**How to apply:** Use this check for any dependency removal in the multi-artifact workspace, especially Expo packages that add native permissions or services.