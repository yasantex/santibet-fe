# Player App — affiliate & agent changes (v2)

For the **SantiBet player frontend** (web + mobile). Three small pieces make the Partner Programme work. Developer spec §2 (attribution) and §4.6 (agents).

> **Changed from v1:** the link parameter is now **`?ref=<CODE>`** (was `?aff=`), also **`/r/<CODE>`**; the signup form's existing **"Referral code"** field (`referralCode`) now accepts partner codes too; and there is a new `/agent-signup` page.

## 1. Landing with a referral link — the click "snippet"

When the app opens with `?ref=<CODE>` (or at `/r/<CODE>`):

```
POST /api/affiliate/track/click
X-Device-Fingerprint: <visitorId>        (optional, recommended)
{ "code": "TUNDE", "landingUrl": "https://santibet.com/?ref=TUNDE&utm_source=x",
  "utmSource": "x", "utmMedium": "social", "utmCampaign": "afcon" }
```
→ `{ "valid": true, "code": "TUNDE", "cookieDays": 30 }`

- If `valid`, store `code` in a **first-party cookie and localStorage** for `cookieDays`. **Last click wins**: overwrite any earlier code.
- If not valid, store nothing (the code may be a player's friend code — that still works when typed at signup).
- No auth. Rate-limited (30/min per IP). Never block navigation on it.

A player's own friend-referral link uses the same `?ref=` parameter — treat both the same way. The backend works out which programme a code belongs to.

## 2. Signup — the "Referral code" field

The signup form already has an optional **Referral code** field. Now:

- **Pre-fill it from the stored code**, but keep it **editable**.
- Send the field's value as **`referralCode`** and the stored cookie code as **`affiliateCode`**:
  - `POST /api/auth/complete` → `{ verificationTicket, password, referralCode?, affiliateCode? }`
  - `POST /api/auth/google` → `{ code, redirectUri, codeVerifier?, referralCode?, affiliateCode? }`
- Send `X-Device-Fingerprint` on these calls too (used only, hashed, for self-referral checks).

How the backend decides (priority: agent-assisted > typed code > cookie):

| Field (`referralCode`) | Cookie (`affiliateCode`) | Result |
|---|---|---|
| Partner code | anything | That partner (typed wins; "via CODE", or "via LINK" if it equals the cookie) |
| Friend's player code | partner code | The **partner** from the cookie (one programme per player) |
| Friend's player code | none | Friend referral, as today |
| empty | partner code | The partner from the cookie |
| empty | none | Nobody — and nobody can claim the player later |

Codes are case-insensitive. A wrong or dead code never fails signup; it is silently ignored. Show a hint under the field: *"Got a code from a friend or partner? Enter it now — it can't be added later."*

## 3. `/agent-signup` — finishing an agent-assisted signup

An agent registers a customer in person; the customer gets an SMS with a 6-digit code and a link to **`<APP_URL>/agent-signup`**, which they open **on their own phone**.

The page: phone number, the code from the SMS, and a new password (with the usual strength rules and terms checkbox).

```
POST /api/affiliate/agent/customers/confirm
X-Client-Type: mobile        (on the app; omit on web to get the refresh cookie)
{ "phone": "+2348031234567", "code": "482913", "password": "TheirOwnPass1" }
```
→ `201` with **exactly the body of `POST /api/auth/complete`** — `user`, `accessToken`, `expiresIn`, and the refresh token (cookie on web, body on mobile). Treat it as a completed signup: sign the user in and send them to KYC.

| Error | Show |
|---|---|
| `400 AGENT_CODE_INVALID` | "That code is not right" |
| `400 AGENT_CODE_EXPIRED` | "Code expired — ask the agent to send a new one" |
| `429 AGENT_CODE_ATTEMPTS` | "Too many tries — ask the agent to send a new one" |
| `400 WEAK_PASSWORD` | Password rules |
| `409 PHONE_TAKEN` | "This number already has an account — sign in instead" |

Agents may text a "finish your KYC" reminder that links to **`<APP_URL>/kyc`** — make sure that route opens the KYC flow (after sign-in).

## Welcome gifts (Code Rewards)

Players who join with a Code Rewards partner's code may get a welcome gift after KYC and a first deposit — it just appears in their wallet history:
- **Welcome credit** — a `BONUS` transaction "Welcome credit" in the trading balance.
- **Fee waiver** — fees on the first ₦20,000 of trades in 7 days are refunded the next morning as `FEE` credits "Fee rebate (welcome offer)".

No new endpoints; they come through the existing wallet history.
