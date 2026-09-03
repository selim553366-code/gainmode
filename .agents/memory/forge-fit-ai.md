---
name: Forge Fit AI and access model
description: Forge Fit uses a local-first profile and premium gate with server-side Replit OpenAI calls.
---

Forge Fit keeps onboarding profile, generated targets, workout plan, meal log, usage quotas, and premium state in AsyncStorage. GPT-5 mini is called only through the API server so the mobile client never receives provider credentials.

**Why:** The first release is local-first, while AI credentials and provider calls must remain server-side.

**How to apply:** Keep new AI features behind the existing premium/usage checks and include the current profile plus app records in coach context.

GPT-5 mini needs a generous completion budget for internal reasoning; keep short-answer behavior in the system prompt instead of using a very low token cap.

**Why:** An overly small `max_completion_tokens` value can consume the model's reasoning budget and return an empty visible answer, which the client surfaces as a generic failure.

**How to apply:** Use the provider-recommended completion budget for coach calls, then constrain user-facing length with explicit sentence, paragraph, and word guidance.

FitBud plan changes should travel as a small structured action list, but the mobile client must validate every action against its current local workout IDs and safe numeric ranges before showing an approval control.

**Why:** The app's source of truth is local AsyncStorage, so model output cannot be trusted to identify or mutate user data directly.

**How to apply:** Keep model actions pending until explicit user approval; apply only validated actions and recompute dependent projections when nutrition targets change.

Test-only Premium access must remain a separate local flag and must never alter RevenueCat entitlements, offerings, products, or purchase/restore behavior.

**Why:** Android QA needs a deterministic local unlock without creating or faking a real store subscription.

**How to apply:** Keep the test code and storage key isolated, preserve the real entitlement check, and treat the local unlock as temporary QA functionality.