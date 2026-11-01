# Player App — bonuses (v1)

For the **SantiBet player frontend** (web + mobile). Two automatic bonuses on one engine (Developer Spec
"SantiBet Bonuses"): the **₦1,010 Free Deposit** (new members) and the **100% First Deposit Bonus** (up to
₦10,000). Engine design: [BONUSES.md](BONUSES.md).

Money is **kobo as a string** everywhere (`"101000"` = ₦1,010). All endpoints need the player's bearer token.
Send **`X-Device-Fingerprint`** on sign-in, sign-up and deposit calls. **It matters:** "once per person" is
checked by phone and device, not IP, so without it the device check does nothing. It is stored only as a hash.

## What changes, at a glance

| Surface | Change |
|---|---|
| First log-in | Nothing to call: the ₦1,010 is granted by sign-in itself. Show the banner from `GET /bonuses/current` (or the `BONUS_UPDATE` notification). |
| Wallet | `GET /wallet` gains `bonus` and `bonusLocked` (never part of `total`). Bonus card from `GET /bonuses/current`. |
| Deposit screen | `GET /bonuses/offer` → pre-ticked tickbox + warning line. `POST /wallet/deposits` gains `bonusOptIn`. |
| Bet slip | `POST /bets` gains `useBonus`; quote gains a `bonus` block; `GET /bonuses/eligibility` greys out options. |
| Bets / positions | `fundedBy: "CASH" \| "BONUS"`; bonus positions cannot be cashed out. |
| Withdraw | `KYC_REQUIRED` with `reason: "BONUS_CASH"` → KYC prompt. |
| Notifications | New type `BONUS_UPDATE` with `data.event`. |
| History | Wallet transactions may have `type: "BONUS"` and `bucket: "BONUS"`. |

---

## 1. `GET /api/bonuses/current` — the live bonus

A user has **at most one** live bonus. Returns `{ "bonus": null }` when there is none.

```json
{
  "bonus": {
    "id": "6d0c…",
    "promotionId": "a1b2…",
    "code": "NEW_MEMBER_1010",
    "type": "NO_DEPOSIT",
    "title": "₦1,010 Free Deposit",
    "status": "ACTIVE",
    "canBet": true,
    "kycRequired": false,
    "bonusAmountKobo": "101000",
    "balanceKobo": "202000",
    "lockedWinningsKobo": "0",
    "stakedKobo": "101000",
    "payoutMode": "BALANCE",
    "completionMode": "TARGET_BALANCE",
    "progress": {
      "percent": 20,
      "targetBalanceKobo": "1010100",
      "playthroughRequiredKobo": null,
      "remainingToBetKobo": null
    },
    "maxCashoutKobo": "101000",
    "openBets": { "count": 0, "stakeKobo": "0" },
    "grantedAt": "2026-11-01T09:00:00.000Z",
    "activatedAt": "2026-11-01T09:00:00.000Z",
    "expiresAt": null,
    "daysLeft": null,
    "rules": {
      "minPrice": 0.1,
      "maxPrice": 0.85,
      "minMinutesToClose": 60,
      "allowLive": true,
      "oppositeSideScope": "MARKET",
      "minStakeKobo": "10000",
      "maxStakeKobo": null,
      "defaultUseBonus": true,
      "cashOutAllowed": false
    },
    "display": {
      "title": "₦1,010 Free Deposit",
      "grantedMessage": "₦1,010 Free Deposit added",
      "termsUrl": "/terms/new-member-bonus"
    }
  }
}
```

How to render it:

- **New member** (`completionMode: TARGET_BALANCE`): progress bar `balanceKobo` → `progress.targetBalanceKobo`
  (₦10,101). Copy: "Grow it to ₦10,101 and we'll give you ₦1,010 in cash."
- **Deposit bonus** (`completionMode: PLAYTHROUGH`): "₦X still to bet" = `progress.remainingToBetKobo`,
  "Locked winnings" = `lockedWinningsKobo`, "N days left" = `daysLeft`.
- **`kycRequired: true`** (status `PENDING_KYC`): show the KYC prompt. Credit is shown but cannot be bet.
  Once KYC passes this call returns it `ACTIVE`.
- Show the bonus balance **apart from cash**, never added to it.
- **First log-in banner:** when you first see a bonus whose `id` you have not shown before, show
  `display.grantedMessage` with a link to `display.termsUrl`.

## 2. `GET /api/bonuses` — all my bonuses

```json
{ "data": [ { "id": "…", "code": "DEPOSIT_1000", "type": "DEPOSIT_MATCH", "title": "100% First Deposit Bonus",
  "status": "COMPLETED", "bonusAmountKobo": "500000", "cashReleasedKobo": "320000",
  "grantedAt": "…", "endedAt": "…", "endedReason": "TERMS_MET" } ] }
```

Statuses: `ACTIVE`, `PENDING_KYC`, `COMPLETED`, `LOST`, `FORFEITED`, `EXPIRED`, `VOIDED`, `CANCELLED`,
`DECLINED` (unticked), `INELIGIBLE` (not eligible — don't surface `endedReason` codes to players).

## 3. Deposit screen

### `GET /api/bonuses/offer`

```json
{
  "show": true,
  "hiddenReason": null,
  "promotionId": "…",
  "code": "DEPOSIT_1000",
  "label": "Get 100% bonus, up to ₦10,000",
  "defaultChecked": true,
  "matchPercent": 100,
  "minDepositKobo": "100000",
  "maxBonusKobo": "1000000",
  "expiryDays": 14,
  "kycRequired": true,
  "termsUrl": "/terms/1000-bonus",
  "forfeitWarning": "This ends your ₦1,010 Free Deposit bonus."
}
```

- `show: true` → a **pre-ticked** tickbox beside the amount field, **clearly visible (not folded away)**, label
  `label`, T&Cs link `termsUrl`. If `kycRequired`, add "You'll need to verify your ID to use it".
- `show: false` → no tickbox (`hiddenReason`: `NOT_FIRST_DEPOSIT`, `ALREADY_DECIDED`, `NO_PROMOTION`, `PAUSED`).
- **`forfeitWarning`** is independent of `show`: whenever it is not null, show that line — any deposit ends the
  live new-member bonus, ticked or not.
- Below `minDepositKobo` the bonus will not be granted (hint: "Deposit ₦1,000 or more to get the bonus").

### `POST /api/wallet/deposits` — new field

```json
{ "amount": "500000", "channel": "bank", "bonusOptIn": true }
```

Send `bonusOptIn` with the box's value whenever the box was shown. Unticked on a first deposit **declines the
bonus for good**. Omitted (no box shown) is treated as ticked. The deposit response echoes `bonusOptIn`.

When the deposit lands, in the same transaction: a live new-member bonus is **FORFEITED**, and on a first
deposit the deposit bonus is granted (`ACTIVE`, or `PENDING_KYC` without KYC). Refresh `GET /bonuses/current`
on the deposit-success notification.

## 4. Bet slip

### `POST /api/bets` — new field `useBonus`

```json
{ "marketId": "…", "outcomeId": "…", "stake": "100000", "type": "market", "useBonus": true }
```

- **New member:** the user has no cash, so the slip bets bonus by default (`rules.defaultUseBonus: true`) —
  no toggle needed; sending nothing works.
- **Deposit bonus:** show a **"Use bonus" toggle** (default `rules.defaultUseBonus`, i.e. off). Bonus rules
  apply only when it is on.
- Response gains **`fundedBy`: `"CASH"` | `"BONUS"`**.

Refusals are **422** with `code` and a one-line `message` you can show as-is:

| `code` | Typical `message` |
|---|---|
| `BONUS_NOT_ACTIVE` | You have no active bonus |
| `BONUS_PENDING_KYC` | Verify your identity to start using your bonus → KYC prompt |
| `BONUS_EXPIRED` | Your bonus has expired |
| `BONUS_PAUSED` | Bonus bets are paused right now |
| `BONUS_MARKET_ORDERS_ONLY` | Bonus bets are placed at the current price (no limit bets) |
| `BONUS_MARKET_NOT_ELIGIBLE` | This market can't use bonus credit |
| `BONUS_LIVE_NOT_ALLOWED` | Live markets can't use bonus |
| `BONUS_CLOSES_TOO_SOON` | Bonus bets need a market closing at least 1 hour from now |
| `BONUS_PRICE_OUT_OF_RANGE` | Bonus bets need a chance between 10% and 85% |
| `BONUS_OPPOSITE_SIDE` | You can't back both sides with bonus credit — also when the other side is held with your own cash |
| `BONUS_STAKE_BELOW_MINIMUM` / `BONUS_STAKE_ABOVE_MAXIMUM` | The minimum/maximum bonus bet is ₦X |
| `BONUS_INSUFFICIENT_BALANCE` | Not enough bonus credit for this stake |

Combo bets never use bonus credit.

**Hedging is blocked both ways** while a bonus is live: a bonus bet against an open cash bet on the other side
of the same market, and a **cash** bet against an open bonus bet, are both refused with `BONUS_OPPOSITE_SIDE`
(message "You can't bet against your own bonus bet" on the cash side). `GET /bonuses/eligibility` already greys
out bonus options that would hedge; for cash bets, show the message from the 422.

### `GET /api/bonuses/eligibility?marketId=…[&stake=…]` — grey out options

The same checks as `POST /bets`, for every outcome of a market. Without `stake`, stake limits and balance are
not judged.

```json
{
  "marketId": "…",
  "bonus": { "id": "…", "status": "ACTIVE", "balanceKobo": "101000" },
  "outcomes": [
    { "outcomeId": "…", "label": "Yes", "price": 0.62, "eligible": true,  "code": null, "reason": null },
    { "outcomeId": "…", "label": "No",  "price": 0.92, "eligible": false, "code": "BONUS_PRICE_OUT_OF_RANGE",
      "reason": "Bonus bets need a chance between 10% and 85%" }
  ]
}
```

Call it when the slip opens on a market with "Use bonus" on (or always, for a new member). `bonus: null` →
the user has no live bonus. You can also pre-filter client-side with `rules` from `/bonuses/current`.

### `POST /api/bets/quote` — new field `useBonus`

With `useBonus: true` the quote adds:

```json
"bonus": {
  "eligible": true, "code": null, "reason": null,
  "creditsTo": "LOCKED_WINNINGS",
  "creditOnWin": { "amount": "200000", "currency": "NGN" }
}
```

For the deposit bonus the **stake is not returned** — a win credits only the profit to locked winnings. Show
`creditOnWin` ("Win ₦2,000 locked winnings") instead of the normal potential return. For the new member it is
the whole return (`creditsTo: "BONUS_BALANCE"`).

## 5. Bets, positions, cash-out

- `GET /bets`, `GET /bets/positions` items gain **`fundedBy`** — label bonus bets "Bonus bet".
- Bonus positions have no cash-out: hide the button when `fundedBy === "BONUS"`. The API answers
  **409 `BONUS_CASH_OUT_NOT_ALLOWED`** on cash-out and its quote.

## 6. Wallet

`GET /api/wallet` gains two fields (not part of `total`):

```json
{ "currency": "NGN", "trading": "500000", "winnings": "0", "pendingWithdrawal": "0", "pendingDeposit": "0",
  "total": "500000", "bonus": "500000", "bonusLocked": "0" }
```

Wallet history (`GET /wallet/transactions`) can now contain `bucket: "BONUS"` rows (bonus bets, bonus wins,
refunds) and `type: "BONUS"` rows (credit granted, credit removed, bonus moved to cash).

## 7. Withdrawals

Cash released by a bonus can be withdrawn only after KYC. A user with such cash and no KYC gets:

```json
{ "statusCode": 403, "code": "KYC_REQUIRED", "message": "Verify your identity to withdraw bonus winnings",
  "kycStatus": "NOT_STARTED", "reason": "BONUS_CASH" }
```

Route to KYC, as for the existing `KYC_REQUIRED`.

## 8. Notifications

Type **`BONUS_UPDATE`**, with `data.event` and `data.userBonusId` (plus `amount`/`currency` where relevant):

| `event` | When |
|---|---|
| `GRANTED` | Bonus added (title = the banner text) |
| `ACTIVATED` | KYC passed, deposit bonus can now be bet |
| `BET_WON` | A bonus bet won (to bonus balance or locked winnings) |
| `COMPLETED` | Terms met — amount moved to cash |
| `EXPIRING` | 2 days before expiry |
| `EXPIRED`, `LOST`, `FORFEITED`, `VOIDED`, `CANCELLED` | Bonus ended |

Open the bonus screen on tap; refresh `GET /bonuses/current`.

## 9. History — `GET /api/bonuses/history?limit=30&cursor=…&userBonusId=…`

```json
{ "data": [ { "id": "…", "userBonusId": "…", "code": "NEW_MEMBER_1010", "title": "₦1,010 Free Deposit",
  "type": "BET_WON", "amountKobo": "202000", "betId": null, "note": "Will Super Eagles win?",
  "balanceAfterKobo": "202000", "lockedAfterKobo": "0", "createdAt": "…" } ],
  "nextCursor": "…" }
```

Event `type`s: `GRANTED`, `ACTIVATED`, `BET_PLACED`, `BET_RELEASED`, `BET_WON`, `BET_LOST`, `BET_REFUNDED`,
`CASH_RELEASED`, `CREDIT_REMOVED`, `WINNINGS_REMOVED`, `COMPLETED`, `LOST`, `FORFEITED`, `EXPIRED`, `VOIDED`,
`CANCELLED`, `EXPIRY_REMINDER`. (`PAYOUT_FORFEITED`, `FLAGGED`, `REVIEWED`, `DECLINED`, `INELIGIBLE` can also
appear; hide them or show them neutrally.)
