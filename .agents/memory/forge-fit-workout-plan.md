---
name: Forge Fit workout planning
description: Workout plans are grouped by muscle area and completion is derived from individual exercise state.
---

Each generated workout must keep a 2–3 exercise range per focused muscle group and select only movements supported by the user’s equipment profile. Explicit equipment details such as dumbbells and a bench take priority over a generic gym selection. Workout completion is derived from all exercise completion flags rather than maintained as an unrelated toggle. Once every workout in a cycle is complete, the next return to the first training day should start a fresh rotated plan for the whole cycle.

**Why:** The plan UI needs meaningful muscle coverage, bodyweight users must not receive gym-only movements, and a user who lists specific available equipment expects the plan to use it instead of defaulting to unrelated machines. Progress screens must not report a day complete while one exercise remains unfinished.

**How to apply:** When changing plan generation or completion behavior, preserve exercise-level completion through local storage and test bodyweight, home-equipment, explicit gym equipment, generic gym, and partial-completion cases. Keep cycle refresh deferred until the first training day so the completed cycle remains visible and achievement totals remain intact.

Nutrition burn estimates use the same equipment intensity factors as goal projections and sum movement-specific exercise estimates for completed exercises.

**Why:** The nutrition screen must reflect the workout progress the user actually completed without introducing a second calorie model.

**How to apply:** Reuse the shared workout intensity, movement-effort, dumbbell-load, and completion helpers when changing workout calorie display, net calories, or remaining nutrition targets. Preserve the stored profile dumbbell weight as the source of truth rather than copying it into workout records.

Per-exercise calorie labels now weight each movement by its type, muscle group, set/rep volume, user body weight, and dumbbell load, then distribute the planned workout burn by relative effort. Completed movement estimates sum into the workout burn.

**Why:** Users need movement-specific estimates instead of a misleading equal split, while nutrition totals must remain aligned with the same duration and equipment intensity model.

**How to apply:** Keep body weight and dumbbell weight in the profile, use recognized movement/muscle fallbacks for the exercise effort, and calculate a label from the exercise’s position in the complete workout rather than its completion flag.