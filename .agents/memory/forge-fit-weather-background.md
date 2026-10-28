---
name: Forge Fit weather chat background
description: Opt-in location-based weather scenes behind the FitBud chat
---
Weather scenes are opt-in: intro modal first, OS location prompt only after "Kabul et". Data from keyless Open-Meteo; tornado is preview-only because forecasts cannot detect it.
**Why:** the user asked for consent-first location use and a scene per weather category from their list.
**How to apply:** keep labels without parentheses (use " · "), add new categories to WEATHER_KINDS, scenes and labels in all five languages. Expo web preview renders blank, so scenes were only type- and unit-checked.
