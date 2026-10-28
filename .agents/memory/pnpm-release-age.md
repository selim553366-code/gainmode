---
name: PNPM release-age policy
description: How to handle same-day Expo SDK releases with this workspace's package maturity delay.
---

When updating Expo on release day, the workspace's 24-hour `minimumReleaseAge` can reject newly published SDK-matched packages and transitives. Keep the maturity delay enabled; add only the explicitly blocked package names or tightly scoped optional-package families as temporary exclusions for the install, then remove those exclusions once the lockfile is refreshed.

**Why:** Broadly disabling the delay weakens the workspace's dependency supply-chain protection, while package-by-package temporary exceptions preserve that policy and allow the SDK migration to complete.

**How to apply:** Retry the SDK install after each reported blocker, keep the exception list limited to the Expo graph needed for that upgrade, and restore the original exclusions before verification and delivery.
