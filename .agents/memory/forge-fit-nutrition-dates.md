---
name: Forge Fit nutrition date ranges
description: Nutrition summaries use local calendar-day filtering while preserving historical meal records.
---

Daily calorie and macro totals must filter meals by the device’s local calendar date; weekly and monthly views may include historical meals without deleting them.

**Why:** Meal records are intentionally persistent for progress analysis, but summing the full history in a “today” card makes each new day start with yesterday’s calories.

**How to apply:** Use the shared date-range helper for home and nutrition summaries, and treat stored ISO timestamps as instants converted to local dates rather than slicing UTC strings.

Weight tracking follows the same local-calendar rule: keep one canonical weight measurement per local day, updating that day’s value rather than treating multiple same-day entries as progress.

**Why:** Multiple weigh-ins on one day are corrections or refinements, not separate daily progress points; comparing them creates a misleading gain/loss value.

**How to apply:** Normalize weight-log writes by local date before weekly change calculations.