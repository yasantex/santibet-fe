# Customer support — Chatwoot integration

The frontend ships two support channels, and both land in Chatwoot:

| Channel | What it is | Transport |
|---|---|---|
| **Live chat** | Real-time chat widget (bottom-left launcher, Help Center, Contact page, suspended-account banner) | Chatwoot **Website** inbox, loaded in the browser |
| **Report an issue** | Structured ticket: category + description + optional reference + auto-captured page/market context (Help Center, Contact page, flag icon on every market) | `POST /api/support/reports` → backend → Chatwoot **API** inbox |

FE code: `src/utils/chatwoot.ts` (SDK wrapper), `src/support/SupportProvider.tsx` (loading, identity, reset), `src/components/support/*` (launcher, report modal, actions), `src/data_layer/support.ts` (API hooks).

---

## 1. Chatwoot setup (ops)

1. **Website inbox** — "SantiBet Web Chat"
   - Website domain: `santibet.com` (plus staging/preview domains).
   - Copy `websiteToken` → FE env `VITE_APP_CHATWOOT_WEBSITE_TOKEN`.
   - **Enable "Enforce user identity validation"** and copy the inbox **HMAC token** → backend env `CHATWOOT_INBOX_HMAC_TOKEN` (secret).
   - Turn on "email continuity" so agent replies reach users who closed the tab.
   - Business hours: Mon–Sun 08:00–22:00 WAT (matches `/contact-us`).
   - Optional pre-chat form for logged-out visitors (email required).
2. **API inbox** — "SantiBet Reports" (for `/support/reports`). Note its `inbox_id` → `CHATWOOT_REPORTS_INBOX_ID`.
3. **Agent bot / API access token** — create an access token for a bot or admin user → `CHATWOOT_API_TOKEN`. Note the account id → `CHATWOOT_ACCOUNT_ID`.
4. **Contact custom attribute definitions** (Settings → Custom Attributes → Contact). The FE sets these. Define them so they render nicely in the agent sidebar:

   | key | type |
   |---|---|
   | `santibet_user_id` | text |
   | `email_verified`, `phone_verified`, `mfa_enabled`, `account_suspended` | checkbox |
   | `signed_up_at` | date |
   | `platform` | text (`web`) |
   | `last_page_url` | link |
   | `last_report_ticket`, `last_report_category` | text |
   | `kyc_status` (sent by backend, see §3.1) | list: NOT_STARTED / PENDING / APPROVED / REJECTED / MORE_INFO_REQUIRED |

5. **Conversation custom attributes** (for reports): `report_id`, `ticket_number`, `report_category`, `reference`, `market_id`, `market_title`, `page_url`.
6. **Labels**: `report`, `deposit`, `withdrawal`, `bet`, `market`, `account`, `technical`, `responsible-gambling`, `other`. Suggested automation: `responsible-gambling` → high priority + assign to the compliance team.
7. **Webhook** → `POST https://api.santibet.com/api/support/chatwoot/webhook` with events `message_created`, `conversation_status_changed`. Store the webhook secret → `CHATWOOT_WEBHOOK_SECRET`.

---

## 2. Environment variables

### Frontend (public — compiled into the bundle)

| Var | Example | Notes |
|---|---|---|
| `VITE_APP_CHATWOOT_BASE_URL` | `https://app.chatwoot.com` | Chatwoot install, no trailing slash |
| `VITE_APP_CHATWOOT_WEBSITE_TOKEN` | `aBcD1234…` | Website inbox token |

Leave either blank and live chat is turned off: the launcher is hidden and "Contact support" falls back to `/contact-us`. "Report an issue" still works. Set both in Netlify/Vercel for each environment (staging should use its own inbox).

If a Content-Security-Policy is ever added, allow `<BASE_URL>` in `script-src`, `frame-src`, `connect-src` and `img-src`, plus the `wss://` variant of `<BASE_URL>` in `connect-src`.

### Backend (secret)

| Var | Purpose |
|---|---|
| `CHATWOOT_BASE_URL` | e.g. `https://app.chatwoot.com` |
| `CHATWOOT_ACCOUNT_ID` | Numeric account id |
| `CHATWOOT_API_TOKEN` | Agent-bot/admin access token (`api_access_token` header) |
| `CHATWOOT_INBOX_HMAC_TOKEN` | Website inbox identity-validation secret — **never expose to the FE** |
| `CHATWOOT_REPORTS_INBOX_ID` | API inbox id for reports |
| `CHATWOOT_WEBHOOK_SECRET` | Verifies inbound webhooks |

---

## 3. Backend API

All routes sit under `/api`, use the existing bearer auth and return the standard `{message, code, details}` errors. **Suspended accounts (`ACCOUNT_SUSPENDED`) must still be allowed to use these**, since they're the users most likely to need support.

### 3.1 `GET /api/support/chatwoot/identity` (auth)

Signs the user's chat identity so nobody can open another user's chat history.

```jsonc
// 200
{
  "identifier": "6f1c…",                  // SantiBet user id (stable, opaque)
  "identifierHash": "a3f9…",              // hex HMAC-SHA256(identifier, CHATWOOT_INBOX_HMAC_TOKEN)
  "customAttributes": {                   // optional, server-trusted contact attributes
    "kyc_status": "APPROVED"
  }
}
```

```ts
crypto.createHmac('sha256', CHATWOOT_INBOX_HMAC_TOKEN).update(user.id).digest('hex')
```

The FE caches this response for the whole session. If the route is missing (404), the FE still identifies the user but without the hash, which only works while "Enforce user identity validation" is **off**. Ship this route before turning enforcement on.

### 3.2 `POST /api/support/reports` (auth)

```jsonc
// request
{
  "category": "DEPOSIT" | "WITHDRAWAL" | "BET" | "MARKET" | "ACCOUNT" | "TECHNICAL" | "RESPONSIBLE_GAMBLING" | "OTHER",
  "message": "string, 10–2000 chars (trimmed)",
  "reference": "string ≤100, optional",   // deposit/withdrawal/bet reference
  "context": {
    "pageUrl": "https://santibet.com/markets/…",
    "userAgent": "Mozilla/5.0 …",
    "marketId": "uuid, optional",
    "marketTitle": "string, optional"
  }
}

// 201
{
  "id": "uuid",
  "ticketNumber": "SB-10423",              // shown to the user
  "category": "DEPOSIT",
  "status": "OPEN",                        // OPEN | PENDING | RESOLVED
  "conversationId": 4211,                  // Chatwoot conversation id (null if queued)
  "createdAt": "2026-10-13T10:00:00Z"
}
```

Errors: `400 VALIDATION_ERROR`, `429 RATE_LIMITED` (suggest at most 5 per user per hour). The FE shows `message` inline.

Implementation:
1. Persist a `SupportReport` row (id, userId, ticketNumber, category, message, reference, context, status, chatwootConversationId).
2. Find or create the Chatwoot contact by `identifier = user.id`:
   - `GET /api/v1/accounts/{acc}/contacts/search?q=<email>` or filter on `identifier`; otherwise
   - `POST /api/v1/accounts/{acc}/contacts` `{inbox_id: REPORTS_INBOX, identifier, name, email, phone_number(E.164)}` → keep `contact_inboxes[].source_id`.
   - Using the same `identifier` merges the contact with the one live chat creates, so agents see one person with both histories.
3. `POST /api/v1/accounts/{acc}/conversations` `{source_id, inbox_id: REPORTS_INBOX, contact_id, custom_attributes: {report_id, ticket_number, report_category, reference, market_id, market_title, page_url}, message: {content: "<formatted report body>"}}`
4. `POST /conversations/{id}/labels` `{labels: ["report", "<category-kebab>"]}`; set `priority: urgent` for `RESPONSIBLE_GAMBLING`.
5. If Chatwoot is down, still return 201 with `conversationId: null` and retry the sync in a job. The user's report must never be lost.
6. Server-side enrichment (recommended): look up `reference` against deposits, withdrawals and bets, then add a private note with amount, status and provider ref.

### 3.3 `POST /api/support/chatwoot/webhook` (no user auth; verify `CHATWOOT_WEBHOOK_SECRET`)

- `message_created` where `message_type == "outgoing"` and not `private`, on a conversation tied to a `SupportReport` (or any conversation whose contact `identifier` maps to a user): create an in-app notification with **`type: "SUPPORT_REPLY"`** (already added to the FE `NotificationType` union and labelled "Support") and push it on `/notifications/stream`:
  ```jsonc
  { "type": "SUPPORT_REPLY", "title": "Support replied to SB-10423",
    "body": "<first 140 chars of reply>",
    "data": { "reportId": "…", "ticketNumber": "SB-10423", "conversationId": 4211 } }
  ```
  Also send an email for report conversations, since the API inbox doesn't email by itself.
- `conversation_status_changed` → mirror onto `SupportReport.status` (`open → OPEN`, `pending/snoozed → PENDING`, `resolved → RESOLVED`).

### 3.4 Optional, later

- `GET /api/support/reports?cursor=` → the user's tickets, for a "My reports" page.
- Add `chatwootIdentifierHash` to `/auth/me` to save a round-trip (the FE would then skip §3.1).

---

## 4. Frontend behaviour reference

- The widget lazy-loads on browser idle (≤4s after load), or immediately when the launcher is tapped. Chatwoot's own bubble is hidden, and our launcher shows an unread badge from `chatwoot:on-message`.
- **Identity:** on login → `setUser(identifier, {email, name, phone_number (E.164 only), avatar_url, identifier_hash})` plus contact attributes. Logged-out visitors chat anonymously (pre-chat form).
- **Logout/session revoked** → `$chatwoot.reset()`, so the next person on a shared device can't see the previous user's chat.
- **Dark mode:** the widget follows the OS, or is forced light when the user picked Light in-app. Chatwoot can't be forced dark.
- **Report modal:** sign-in required. On success it stores `last_report_ticket` on the chat contact and offers "Continue in live chat".
