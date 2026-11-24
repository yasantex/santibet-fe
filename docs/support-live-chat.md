# Customer support — live chat

Live chat is in-house (replaced Chatwoot, 2026-11). Backend reference:
`santibet-be/docs/SUPPORT_LIVE_CHAT.md`.

| Channel | What it is | Transport |
|---|---|---|
| **Live chat** | Floating launcher → chat panel (full screen on phones), also opened from the Help Center, Contact page, suspended banner and `SUPPORT_REPLY` notifications | `/support/chat/*`, live over `/notifications/stream` |
| **Report an issue** | Structured ticket (category, description, reference, page/market context) | `POST /support/reports` — opens a conversation the player continues in chat |

## Code

- `src/support/SupportProvider.tsx` — panel open state, badge (`useChatSummary`), deep links (`?support=chat` / `?support=<conversationId>`).
- `src/support/useChatThread.ts` — one conversation: load, older pages, optimistic sends with `clientMessageId` (retry-safe), live merge, read receipts, typing pings, polling fallback when the stream is down.
- `src/components/support/ChatPanel.tsx` — thread, history, resolved/rating bar, signed-out state.
- `src/data_layer/supportChat.ts` — API calls + query keys.
- `src/data_layer/notificationStream.tsx` — `support_message` / `support_typing` / `support_conversation` events → `subscribeToSupport`.

No env vars are needed: chat is always on for signed-in players. Signed-out
players are asked to sign in, or sent to `/contact-us`.
