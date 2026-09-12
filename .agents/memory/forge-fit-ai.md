---
name: Forge Fit AI and access model
description: Forge Fit uses a local-first profile and premium gate with server-side Replit OpenAI calls.
---

Forge Fit keeps onboarding profile, generated targets, workout plan, meal log, usage quotas, and premium state in AsyncStorage. GPT-5 mini is called only through the API server so the mobile client never receives provider credentials.

**Why:** The first release is local-first, while AI credentials and provider calls must remain server-side.

**How to apply:** Keep new AI features behind the existing premium/usage checks and include the current profile plus app records in coach context.

Every coach request must include a compact baseline user summary, whether a workout plan exists, its schedule-level overview, and the recent conversation; detailed nutrition, workout, and progress records remain intent-gated.

**Why:** Greetings and vague follow-ups otherwise make FitBud appear to forget the user or invent a replacement program because only the current message is visible.

**How to apply:** Treat greetings as conversation only, ask one clarifying question for ambiguous requests, and never create or replace a program unless the user explicitly asks.

GPT-5 reasoning models need a generous completion budget for internal reasoning; keep short-answer behavior in the system prompt instead of using a very low token cap. This also applies to nano when it must return structured JSON.

**Why:** An overly small `max_completion_tokens` value can consume the model's reasoning budget and return an empty visible answer or truncated JSON, which the client surfaces as a generic failure.

**How to apply:** Use the provider-recommended completion budget for coach calls, then constrain user-facing length with explicit sentence, paragraph, and word guidance.

FitBud plan changes should travel as a small structured action list, but the mobile client must validate every action against its current local workout IDs and safe numeric ranges before showing an approval control.

**Why:** The app's source of truth is local AsyncStorage, so model output cannot be trusted to identify or mutate user data directly.

**How to apply:** Keep model actions pending until explicit user approval; apply only validated actions and recompute dependent projections when nutrition targets change.

Test-only Premium access must remain a separate local flag and must never alter RevenueCat entitlements, offerings, products, or purchase/restore behavior.

**Why:** Android QA needs a deterministic local unlock without creating or faking a real store subscription.

**How to apply:** Keep the test code and storage key isolated, preserve the real entitlement check, and treat the local unlock as temporary QA functionality.

Production AI access is issued by the API only after RevenueCat verifies the `forge_fit_pro` entitlement; the mobile app presents a short-lived signed access token on coach and food-analysis requests.

**Why:** A client-provided ID or local premium flag is spoofable and can expose paid AI calls or create uncontrolled provider costs.

**How to apply:** Keep RevenueCat's server API key in Replit Secrets, use the server token gate in production, and allow local bypasses only in development/test environments.

AI usage is limited to 30 coach messages and 30 food-photo analyses per customer per rolling hourly window; production buckets use the verified RevenueCat customer ID rather than only the IP address.

**Why:** The intended product limit is per person, and multiple devices or shared networks should not incorrectly combine or bypass a customer's allowance.

**How to apply:** Keep the server limit and the mobile UI limit aligned at 30 per hour, and reset the local display window on the device's local hour boundary.

RevenueCat anonymous customer IDs can use the `$RCAnonymousID:...` format, so server-side customer-ID validation must allow `$` as well as the usual identifier punctuation.

**Why:** Rejecting the leading `$` returns a misleading 400 before RevenueCat entitlement verification, blocking both FitBud and food-photo analysis even when the client flow is correct.

**How to apply:** Preserve strict length and character validation, but include the documented RevenueCat anonymous-ID prefix in the accepted character set.

Production RevenueCat reauthorization does not guarantee AI access recovery: the connected credential must be a valid server API key with customer/subscription read access, not a public store SDK key.

**Why:** The RevenueCat connector can remain connected and report healthy while the provider rejects the credential with `Invalid API Key`, causing `/api/ai/access` to return 503 and blocking both coach chat and food analysis.

**How to apply:** When both AI features fail in a production build, verify the live RevenueCat credential type and permissions before changing mobile or AI code; never disable the server entitlement gate as a workaround.