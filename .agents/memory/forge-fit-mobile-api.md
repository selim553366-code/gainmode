---
name: Forge Fit mobile API endpoint
description: Standalone Forge Fit Android builds need an explicit published API base URL.
---

Standalone EAS builds do not reliably inherit the Replit development environment domain, so native AI and generated API requests must resolve through the published API URL from build-time configuration with a validated fallback.

**Why:** The development preview injects `EXPO_PUBLIC_DOMAIN`, but an already-installed Android release can otherwise compile an empty or undefined host and fail every network request while the API server remains healthy.

**How to apply:** Keep the published API base URL in the mobile app's release configuration, route all absolute API calls through one helper, and verify the published health endpoint and public guide-asset endpoint before creating a new Android release. In proxied previews, public API assets must be mounted under `/api/...`; resolve asset paths relative to the compiled API module rather than `process.cwd()`, because production runs the API from the workspace root. Optional form/live-guide media is served there so it is not bundled into the native app.