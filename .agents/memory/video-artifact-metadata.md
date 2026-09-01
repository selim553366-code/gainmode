---
name: Video artifact metadata
description: How to recover a video artifact whose metadata lost its managed service definition.
---

When repairing a video artifact, preserve its existing immutable identity and version metadata; use the validated artifact TOML replacement flow to add only the missing preview and service configuration.

**Why:** The artifact verifier rejects attempts to add or alter identity/version fields, while a video artifact without a service has no managed preview workflow.

**How to apply:** Read the current artifact TOML first, keep its immutable fields unchanged, add the minimal `previewPath` and `[[services]]`/development configuration, validate the replacement, then restart the exact managed workflow.