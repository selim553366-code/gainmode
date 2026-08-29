---
name: Forge Fit AI and access model
description: Forge Fit uses a local-first profile and premium gate with server-side Replit OpenAI calls.
---

Forge Fit keeps onboarding profile, generated targets, workout plan, meal log, usage quotas, and premium state in AsyncStorage. GPT-5 mini is called only through the API server so the mobile client never receives provider credentials.

**Why:** The first release is local-first, while AI credentials and provider calls must remain server-side.

**How to apply:** Keep new AI features behind the existing premium/usage checks and include the current profile plus app records in coach context.