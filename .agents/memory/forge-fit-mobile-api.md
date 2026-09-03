---
name: Forge Fit mobile API endpoint
description: Standalone Forge Fit Android builds need an explicit published API base URL.
---

Standalone EAS builds do not reliably inherit the Replit development environment domain, so native AI and generated API requests must resolve through the published API URL from build-time configuration with a validated fallback.

**Why:** The development preview injects `EXPO_PUBLIC_DOMAIN`, but an already-installed Android release can otherwise compile an empty or undefined host and fail every network request while the API server remains healthy.

**How to apply:** Keep the published API base URL in the mobile app's release configuration, route all absolute API calls through one helper, and verify the published health endpoint before creating a new Android release.