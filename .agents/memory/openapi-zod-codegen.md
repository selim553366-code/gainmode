---
name: OpenAPI and Zod codegen
description: Compatibility constraint between the workspace OpenAPI generator and installed Zod version
---

The installed API Zod generator emits `zod.int()` for OpenAPI `integer` response fields, but the workspace currently resolves Zod 3, which has no `zod.int()` API. Numeric response fields should avoid this generator path until the Zod/codegen versions are aligned.

**Why:** Regenerating the API client can succeed while the subsequent library typecheck fails inside generated Zod code.

**How to apply:** After changing `lib/api-spec/openapi.yaml`, always run the API codegen and library typecheck; inspect generated Zod output before accepting integer response fields.