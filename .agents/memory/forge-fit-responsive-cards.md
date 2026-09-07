---
name: Forge Fit responsive feature cards
description: Why reference feature-card artwork should be rebuilt as responsive UI rather than used as a fixed image.
---

Reference artwork for feature cards should be recreated with responsive React Native layout when the card contains actionable regions.

**Why:** A full-size screenshot asset can overflow or crop unpredictably across device widths, and its printed buttons cannot provide reliable accessibility or navigation behavior.

**How to apply:** Match the reference with app-native colors, typography, icons, and rounded containers; keep each visible action backed by a real Pressable hit target.