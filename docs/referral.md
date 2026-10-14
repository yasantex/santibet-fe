# Player app handoff — points, boards, referrals and badges

**Date:** 2026-10-14
**Audience:** the SantiBet player app (main app, not campaigns).
**Backend status:** built, tested, **not merged yet** — wait for the PR to land on `staging` before shipping against it.
**Dormant on arrival.** Nothing awards a point or pays a reward until an operator configures the rules and turns two switches on. Until then every endpoint below works and returns zeroes or empty lists, so build the **empty states first**: that is what players will see on day one.

---

## What players get

1. **Points** for winning markets (by size of win), winning streaks, deposits and referrals.
2. **Weekly and monthly boards**, opt-in, shown by a handle you choose — never a name or number.
3. **Referrals**: a code to share, friends who count once they do something, and cash or airtime for it.
4. **Badges** shown on the profile, with a "you earned one" moment on login.

All endpoints need a signed-in user (`401` otherwise) and are under `/api`.

---

## 1. Points

### `GET /points/me`
```jsonc
{ "total": 130, "thisWeek": 40, "thisMonth": 95, "wins": 12, "deposits": 3,
  "streak": { "current": 2, "longest": 5 } }
```
A user who has earned nothing gets zeroes, **not** a 404. "This week" is Monday–Sunday in **Lagos** time.

### `GET /points/me/history?limit=20&cursor=<id>`
```jsonc
{ "data": [ { "id": "…", "points": 15, "source": "WIN", "reason": "Won a market", "createdAt": "…" } ],
  "nextCursor": "…" }   // null on the last page
```
Newest first. `source` is one of `WIN`, `STREAK`, `DEPOSIT`, `REFERRAL`, `REFEREE`, `ADJUSTMENT` — give each a friendly label. **A negative `points` is a correction** (an operator took points back); show it plainly, it is why the history always adds up to the total.

### Timing — important
Points arrive **about a minute after** the win or deposit, not instantly. Don't show "+15 points" the moment a market settles. Refetch `/points/me` when the points screen opens or regains focus.

---

## 2. Boards

### `GET /points/leaderboard?period=weekly|monthly&limit=25&offset=0`
```jsonc
{ "period": "weekly", "from": "…", "to": "…",
  "data": [ { "rank": 1, "handle": "ace_7", "points": 140 } ],
  "total": 312,
  "me": { "rank": 41, "handle": "ace_7", "points": 55 } }   // null if not on this board
```
- Ranked by points **earned in that window** — the weekly board resets every Monday.
- **Ties share a rank** and the next place skips (two on 2nd, then 4th).
- `me` is `null` when the caller isn't on this board: not opted in, or no points in the window. Render "join the board" or "earn points to appear", not an error.
- `from`/`to` are instants; use them to show "resets Monday".
- People who are **suspended or have left the boards are not shown.**

### Joining and leaving — `GET` / `PUT /points/leaderboard/profile`
`GET` → `{ "optedIn": false, "handle": null }`.
`PUT` → body `{ "optIn": true, "handle": "ace_7" }` or `{ "optIn": false }`; response is the same shape as `GET`.

- **Boards are off for everyone until they choose.** Show a clear opt-in, not a default.
- Handle: **3–20 letters, digits or underscores.** Validate client-side; the server returns `400` otherwise.
- `409 HANDLE_TAKEN` (case-insensitive) → ask for another. `400 HANDLE_RESERVED` → ask for another (admin/support-style names and anything containing the platform name are held back).
- Calling it again with a new handle **changes** the handle.
- `optIn: false` removes them **immediately**.

---

## 3. Referrals

### Sending the code at signup
A friend's code arrives as a link parameter (`?ref=CODE`). **Keep it until the last step of signup** and send it as `referralCode`:
- `POST /auth/complete` — add `"referralCode": "CODE"` next to `verificationTicket` and `password`.
- `POST /auth/google` — add `"referralCode": "CODE"` (only used if this call creates the account).

**A wrong, blank or missing code never fails signup** — it is silently ignored — so don't block on it or show an error. Don't validate it client-side beyond trimming.

### `GET /referrals/me`
```jsonc
{ "code": "K7M2QX9P", "link": "https://…/?ref=K7M2QX9P",
  "program": { "enabled": true, "trigger": "KYC_APPROVED" },
  "counts": { "pending": 3, "qualified": 2 },
  "milestones": [ { "friendCount": 5, "bonusPoints": 50,
                    "reward": { "kind": "AIRTIME", "amount": "1000.00" }, "reached": false } ],
  "rewards": [ { "id": "…", "kind": "CASH", "amount": "500.00", "currency": "NGN",
                 "status": "PAID", "milestone": null, "createdAt": "…" } ] }
```
- The code is created the first time this is called, then stable.
- **`program.enabled: false` → hide the referral screen** (or show it as unavailable).
- **`program.trigger`** says what a friend must do before they count. Write the copy from it:
  `KYC_APPROVED` ("when they verify their identity"), `FIRST_DEPOSIT` ("when they make their first deposit"), `FIRST_BET_SETTLED` ("when their first bet is settled").
- `counts.pending` are friends who have joined but not yet done that thing.
- `milestones` is the ladder; `reached` says which rungs are done.

### Reward `status` and what to tell the player
| status | meaning |
|---|---|
| `PENDING` | owed, not sent yet |
| `SENDING` | airtime sent, waiting on the network to confirm |
| `PAID` | done |
| `FAILED` | could not be sent — they should contact support |
| `CANCELLED` | the referral was rejected |

**Cash goes to the trading balance.** It can be bet immediately but **cannot be withdrawn until it has been played and won** — say so, or support will hear about it.
**Airtime goes to the user's verified phone number.** If they signed up with email only, an airtime reward **waits as `PENDING` until they add and verify a phone** — consider prompting them to.

---

## 4. Badges

### `GET /badges/me`
```jsonc
{ "data": [ { "key": "hot-streak", "name": "Hot streak", "description": "Win five in a row",
              "icon": "flame", "criterion": "WIN_STREAK", "threshold": 5,
              "earned": true, "awardedAt": "…", "isNew": true,
              "progress": { "current": 5, "target": 5 } } ],
  "newCount": 1 }
```
Every active badge, earned **and locked**, with progress — render locked ones with a progress bar. `progress.current` is capped at `target`. `icon` is a name or URL for **you** to resolve; the API doesn't host artwork. A badge that has since been switched off stays visible to people who earned it.

### "When they log in"
After login, call `GET /badges/me`. If `newCount > 0`, show the celebration, then call **`POST /badges/me/seen`** (→ `{ "marked": n }`) so it happens once and not on every login.

---

## Suspended accounts
A suspended player can **read** all of this but every write (`PUT` profile, `POST seen`) returns `403 ACCOUNT_SUSPENDED`. Show the screens read-only.

## Please don't build pressure features
This system deliberately avoids them, and the backend sends no streak or rank notifications. Please don't add countdowns, "you'll lose your streak" warnings, or push notifications about rank drops or near-misses. Show streaks and ranks as information, not as a reason to come back and bet.

---

## Checklist
- [ ] Empty states for zero points, empty boards, no badges, program disabled.
- [ ] Points screen refetches on focus; no instant "+N" after a win.
- [ ] Board: weekly/monthly toggle, shared ranks, `me` null handled, "resets Monday".
- [ ] Opt-in flow with handle validation and `HANDLE_TAKEN` / `HANDLE_RESERVED` messages.
- [ ] Capture `?ref=` and send `referralCode` on `/auth/complete` and `/auth/google`; never block signup on it.
- [ ] Referral screen: code + link, trigger-based copy, ladder, reward statuses, trading-balance and verified-phone notes.
- [ ] Badges on the profile with progress; login celebration then `POST /badges/me/seen`.
- [ ] Read-only behaviour for suspended accounts.