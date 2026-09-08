---
name: Forge Fit Expo Go notification imports
description: Expo SDK 57 notification-module loading behavior in Android Expo Go.
---

On Android Expo Go, never import `expo-notifications` as a runtime module at startup. Load it dynamically only after confirming the platform supports native notifications.

**Why:** SDK 57's package initializes its push-token auto-registration side effect during module evaluation; Android Expo Go throws before the app router can register route exports, even when every notification call is guarded.

**How to apply:** Keep notification types type-only, gate `Platform.OS === 'android' && isRunningInExpoGo()`, and use a guarded dynamic import for handlers, listeners, permissions, and scheduling. Native iOS/development builds may continue using the dynamically loaded module.