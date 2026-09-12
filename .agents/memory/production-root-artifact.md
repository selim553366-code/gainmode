---
name: Production root artifact
description: Which artifact should own the public domain root in this multi-artifact project.
---

Globe Studios web must own the project root route. Keep the Forge Fit Expo artifact on its dedicated non-root path.

**Why:** A custom domain serves the project’s root artifact. When Expo owned the root, the public Globe Studios domain opened the Expo Go preview instead of the website.

**How to apply:** Preserve the web artifact as the root whenever artifact routing is changed. After route changes, republish the project before checking the custom domain because the live deployment retains the previous artifact manifest until then.