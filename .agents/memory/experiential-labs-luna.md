---
name: Experiential Labs Luna gateway
description: Project decision for avoiding the external GPT-5.6 Luna model.
---

Do not route GainMode coach or food-photo requests through GPT-5.6 Luna. Use the existing OpenAI-backed GPT-5 mini/nano model choices instead.

**Why:** The user explicitly asked not to use GPT-5.6 Luna.

**How to apply:** Keep coach and food analysis on the configured OpenAI integration. Do not add a Luna primary route or fallback unless the user changes this instruction.