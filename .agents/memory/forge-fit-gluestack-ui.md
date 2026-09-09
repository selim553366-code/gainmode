---
name: Forge Fit Gluestack UI pilot
description: How gluestack UI is being introduced without disrupting the Expo app's existing theme and Metro setup.
---

Forge Fit uses the gluestack themed provider as an incremental component layer. The local `useColors` theme, StyleSheet layouts, i18n, and custom motion remain the source of truth; individual controls can adopt gluestack one at a time.

**Why:** The current app already has a working custom visual system and a liquid-glass navigation shell. Switching the whole project to NativeWind or a new styling engine would create unnecessary Metro and theme risk.

**How to apply:** Keep `GluestackUIProvider` at the root, prefer gluestack controls for new or isolated interactions, and preserve existing custom surfaces unless a screen is intentionally redesigned.