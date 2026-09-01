---
name: Forge Fit nutrition date ranges
description: Nutrition summaries use local calendar-day filtering while preserving historical meal records.
---

Daily calorie and macro totals must filter meals by the device’s local calendar date; weekly and monthly views may include historical meals without deleting them.

**Why:** Meal records are intentionally persistent for progress analysis, but summing the full history in a “today” card makes each new day start with yesterday’s calories.

**How to apply:** Use the shared date-range helper for home and nutrition summaries, and treat stored ISO timestamps as instants converted to local dates rather than slicing UTC strings.