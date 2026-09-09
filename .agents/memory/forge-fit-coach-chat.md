---
name: Forge Fit coach chat
description: Visual direction and motion constraint for the FitBud conversation screen.
---

The FitBud conversation should feel spacious, calm, and personal, with generous breathing room, readable message bubbles, and a comfortable composer. Keep AI-capability copy and preset question templates out of the chat screen so messages receive the available space. The reference direction uses a black FitBud header, black eyebrow/title text, and a tall outlined composer with the send control inside its lower-right corner. When the composer is empty, localized coaching prompts should type, pause, erase, and cycle until the user starts writing. AI messages are borderless white with black text; user messages are black with white text, independent of theme. The entrance reveal must begin from the screen's light blue atmosphere rather than flashing black. Existing entrance, background reveal, flying-coach, typing, welcome-media, and weekly-analysis animations must remain intact during visual refinements.

**Why:** The user explicitly preferred a more open chat layout while requiring that none of the established animations be broken.

**How to apply:** Treat future chat changes as visual refinements around the existing animation and interaction behavior; do not replace the supplied reference with a static image or trade motion behavior for layout changes.

Message feedback belongs to the first real coach reply after the user's first non-system message, never to the welcome bubble or automated weekly-analysis exchange.

**Why:** Rating the welcome text is not feedback on coaching quality, while later replies should not move the pending rating target before the user has answered it.

**How to apply:** Keep the rating target stable on that first user/coach exchange and hide it after the daily rating is submitted.

The full coach conversation is device-local and append-only; reopening the coach screen restores every stored turn without applying a history cap or delete action.

**Why:** Users expect their coaching context and past answers to remain available on the phone even when the screen or app is reopened.

**How to apply:** Persist the ordered message list in AsyncStorage after hydration and after every message/action update; treat the welcome animation as UI content, not a reason to reset history.