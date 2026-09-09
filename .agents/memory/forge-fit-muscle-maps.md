---
name: Forge Fit muscle map masks
description: The anatomy screen's front/back image is a fixed composite canvas and highlights must align to its source coordinates.
---

Use transparent full-canvas overlays aligned to the exact anatomy reference image for muscle highlights. The visible front and back bodies occupy different halves of the same source canvas, so a mask must preserve that canvas and be cropped by the existing side switch.

**Why:** Approximate percentage rectangles and generic SVG shapes bleed into adjacent muscles, especially shoulder/biceps boundaries, and make workout combinations look anatomically wrong.

**How to apply:** Keep one transparent mask per supported front/back muscle group and compose only the masks listed by the workout split. Push days must never activate the front biceps mask.

Workout split reference images have separate light-theme copies with the anatomy canvas color matched to the light secondary surface; dark mode continues using the navy originals.

**Why:** The original navy image background appears as a hard rectangle inside the light anatomy card, while reusing one asset across themes breaks the visual hierarchy.

**How to apply:** Select the light/dark asset set from the active color scheme without changing workout map keys or hotspot coordinates.