---
name: PNPM release-age policy
description: How to handle same-day Expo SDK releases with this workspace's package maturity delay.
---

When updating Expo on release day, the workspace's 24-hour `minimumReleaseAge` can reject newly published SDK-matched packages and transitives. If a blocked package is close to its 24-hour threshold, prefer waiting for it to mature; EAS may run a non-frozen install and apply the age check again. If the build cannot wait, keep the maturity delay enabled and add only explicitly blocked package names or tightly scoped optional-package families as temporary exclusions, then remove those exclusions once the lockfile is refreshed.

**Why:** Broadly disabling the delay weakens the workspace's dependency supply-chain protection, while package-by-package temporary exceptions preserve that policy and allow the SDK migration to complete.

**How to apply:** Compare the package publish time with the age cutoff in the log. Retry after the threshold when practical; otherwise allowlist only the reported Expo package, refresh the lockfile, remove the temporary exclusion, and verify with a frozen install before delivery.
