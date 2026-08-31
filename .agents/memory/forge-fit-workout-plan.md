---
name: Forge Fit workout planning
description: Workout plans are grouped by muscle area and completion is derived from individual exercise state.
---

Each generated workout must keep a 2–3 exercise range per focused muscle group and select only movements supported by the user’s equipment profile. Workout completion is derived from all exercise completion flags rather than maintained as an unrelated toggle.

**Why:** The plan UI needs to show meaningful muscle coverage, bodyweight users must not receive gym-only movements, and progress screens must not report a day complete while one exercise remains unfinished.

**How to apply:** When changing plan generation or completion behavior, preserve exercise-level completion through local storage and test bodyweight, home-equipment, gym, and partial-completion cases.