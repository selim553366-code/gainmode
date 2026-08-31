---
name: Forge Fit local notifications
description: Device-only notification behavior and the validation boundary for Forge Fit reminders
---

Forge Fit reminders are scheduled locally on the device and are not observable in the web preview.

**Why:** Expo’s web runtime can render the settings controls but cannot prove native permission prompts, scheduled delivery, or operating-system behavior.

**How to apply:** Validate permission handling, selected-day workout reminders, daily reminders, and weekly reminders on a physical Android or iOS device before release.