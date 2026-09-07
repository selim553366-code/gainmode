---
name: Forge Fit premium celebration routing
description: Why onboarding purchase success needs to be owned by the entry route rather than the offer screen
---

The onboarding premium offer can be unmounted as soon as RevenueCat or the preview entitlement changes `isPremium`. Any purchase success animation that is local to the offer screen may therefore never render.

**Why:** the entry route derives directly from premium state and immediately redirects premium users to Coach or tabs.

**How to apply:** keep the success overlay state in the parent entry flow, suppress its redirect effect while the overlay is visible, and navigate only from the overlay completion callback. The standalone premium modal in an already-mounted tab screen can keep its local success state.

For the onboarding preview promo, delay enabling the local test entitlement until the celebration completes; changing it first can trigger the entry redirect before the success UI has a chance to mount.