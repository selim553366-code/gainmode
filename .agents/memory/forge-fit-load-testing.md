---
name: GainMode mocked load testing
description: How to load-test the API without sending paid requests to the AI provider.
---

Use an isolated API process on a dedicated local port with an OpenAI-compatible mock upstream when testing many users. Simulate the expected request mix against the mock, not the live AI provider.

**Why:** Real photo and coach requests create provider charges, while the API's normal IP rate limit can hide concurrency behavior during localhost tests.

**How to apply:** Keep any load-test bypass temporary and test-only, use isolated ports, report status and latency percentiles, then rebuild and restart the normal API with production rate limits restored.