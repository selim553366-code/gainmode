---
name: SDK 58 Android release startup
description: Diagnose Expo SDK 58 Android release crashes during AndroidX Startup and WorkManager initialization.
---

SDK 58 Android release builds with R8 minification can strip reflected no-argument constructors for WorkManager's generated Room database and input mergers. The app then crashes before React Native starts with `Unable to get provider androidx.startup.InitializationProvider` and `Failed to create an instance of class androidx.work.impl.WorkDatabase`.

**Why:** Expo SDK 58 release builds enable strict R8 behavior; the same startup signature has been reproduced upstream and keep rules were validated as a workaround. The user confirmed the Android app opened successfully after this fix.

**How to apply:** Add `expo-build-properties` Android `extraProguardRules` for `RoomDatabase` and `androidx.work.InputMerger` constructors, then verify the generated release rules before asking for another EAS build. A Metro preview cannot validate this native startup fix.
