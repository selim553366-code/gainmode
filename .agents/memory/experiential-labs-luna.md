---
name: Experiential Labs Luna gateway
description: Provider-specific endpoint and availability behavior for the external Luna model gateway.
---

The Experiential Labs gateway uses an OpenAI-compatible API at `https://api.experientiallabs.ai/v1` with model ID `gpt-5.6-luna`. Its organization review can return `429 org_under_review` even when an API key is active, so FitBud should retain an explicit provider fallback rather than failing all AI requests.

**Why:** The provider dashboard can show an active key and model access while the organization is still blocked from inference.

**How to apply:** Keep the Luna key in Replit Secrets and the base URL as a non-secret environment value. When Luna is unavailable, log the provider failure without exposing the key and use the configured OpenAI fallback; once review is cleared, Luna should be selected automatically.