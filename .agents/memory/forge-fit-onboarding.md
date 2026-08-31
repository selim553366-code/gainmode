---
name: Forge Fit onboarding personalization
description: Onboarding separates required profile data from optional personalization and uses native-friendly coach media.
---

Forge Fit onboarding should collect the minimum profile first, then offer optional calorie and workout refinements. Profile refreshes are grouped into a multi-select flow, preserve unselected values, and consume one shared monthly allowance only after a successful save. Green-screen coach video should be cropped without trimming hands or feet, then converted into fixed-size transparent frame assets for the native Expo flow; static transparent coach PNGs handle writing and completion states. When a supplied full-frame coach image already has a compatible dark background, use it directly rather than risking a damaged cutout.

**Why:** Native Expo video alpha support is inconsistent, while fixed-size frame animation renders reliably across web and mobile and prevents the coach from being clipped by varying source video bounds. Image-editing output can appear transparent in previews while still containing a checkerboard, and aggressive background removal can make transparent holes look like missing body parts against the dark app background.

**How to apply:** Keep required questions short, label refinement questions as optional, let skipped refinements fall back to safe defaults in profile calculations, and use Lucide SVG icons instead of font icon packs for Android-safe UI icons.