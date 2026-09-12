---
name: Resend feedback delivery
description: Constraints for reliable delivery of GainMode feedback and coach ratings through Resend.
---

Feedback and coach-rating emails must use a deployment-configured recipient rather than a repository-hardcoded address. When Resend is in test mode, the recipient must be an address verified for that Resend account.

**Why:** Resend rejects other recipients with a validation error even when the connector itself is healthy, making both mobile actions appear broken.

**How to apply:** Keep recipient identity outside public source control. Treat provider delivery failures as retryable and do not let failed upstream sends consume the user's feedback or rating rate-limit allowance.