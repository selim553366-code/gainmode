---
name: Forge Fit workout planning
description: Workout plans are grouped by muscle area and completion is derived from individual exercise state.
---

Each generated workout must keep a 2–3 exercise range per focused muscle group and select only movements supported by the user’s equipment profile. Explicit equipment details such as dumbbells and a bench take priority over a generic gym selection. Workout completion is derived from all exercise completion flags rather than maintained as an unrelated toggle. Once every workout in a cycle is complete, the next return to the first training day should start a fresh rotated plan for the whole cycle.

**Why:** The plan UI needs meaningful muscle coverage, bodyweight users must not receive gym-only movements, and a user who lists specific available equipment expects the plan to use it instead of defaulting to unrelated machines. Progress screens must not report a day complete while one exercise remains unfinished.

**How to apply:** When changing plan generation or completion behavior, preserve exercise-level completion through local storage and test bodyweight, home-equipment, explicit gym equipment, generic gym, and partial-completion cases. Keep cycle refresh deferred until the first training day so the completed cycle remains visible and achievement totals remain intact.

Nutrition burn estimates use the same equipment intensity factors as goal projections and scale planned duration by the completed exercise ratio.

**Why:** The nutrition screen must reflect the workout progress the user actually completed without introducing a second calorie model.

**How to apply:** Reuse the shared workout intensity and completion helpers when changing workout calorie display, net calories, or remaining nutrition targets.