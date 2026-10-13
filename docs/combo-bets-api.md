# Combo / Accumulator Bets — Backend API Spec

Status: **frontend implemented; backend endpoints NOT yet live** (as of 2026-10-13,
`POST /api/bets/combo` and all variants return 404 on `api.santibet.com`; the
single-bet `POST /api/bets` exists).

A combo (parlay/accumulator) is a **single stake across several sports
selections that must ALL win**. The frontend builds the ticket client-side (a
persisted slip), computes indicative combined odds, and submits the whole ticket
in one request. The backend re-prices, validates, and settles.

All endpoints require an authenticated session. All money is in **kobo (minor
units)**, as strings, consistent with the rest of the wallet/bets API.

---

## Core rules (must be enforced server-side)

1. **Sports only.** Every leg must be a market in the Sports category.
2. **One market per event.** A ticket may contain **at most one selection per
   `eventId`**. Two legs from the same event (e.g. "Arsenal win" + "Over 2.5" in
   the same match) are correlated and must be rejected. The frontend already
   blocks this with the message _"You can only select one market per event in a
   combo bet."_, but the backend must enforce it independently.
3. **Leg count:** minimum **2**, maximum **12**.
4. **Re-price on the server.** The client odds are indicative only; the backend
   recomputes from live prices at placement time.
5. **Atomic debit.** Reserve/debit the stake all-or-nothing; reject if any leg is
   closed/suspended/resolved or the event rule is violated.

### Odds model
Each outcome price is an implied probability in `(0, 1)`. Per-leg decimal odds =
`1 / price`. Combined decimal odds = `∏ (1 / priceᵢ) = 1 / ∏ priceᵢ`.
Potential return = `stake × combinedOdds`. (This matches the single-bet model
where a share pays out at `stake / price`.)

---

## 1. `POST /api/bets/combo` — place a combo *(required)*

Request:
```jsonc
{
  "stake": "500000",                       // kobo, whole-ticket stake
  "legs": [
    { "marketId": "uuid", "outcomeId": "uuid" },
    { "marketId": "uuid", "outcomeId": "uuid" }
  ]
}
```

Success `201`:
```jsonc
{
  "id": "uuid",
  "status": "ACCEPTED",                    // or PENDING
  "stake": { "amount": "500000", "currency": "NGN" },
  "combinedOdds": "9.84",                  // decimal odds accepted at
  "potentialReturn": { "amount": "4920000", "currency": "NGN" },
  "legs": [
    { "marketId": "uuid", "outcomeId": "uuid", "status": "OPEN", "price": "0.33" }
  ],
  "createdAt": "2026-10-13T..."
}
```
This is the `ComboBetResponse` shape the frontend already types
(`src/types/combo.types.ts`).

### Structured error codes (so the UI can message precisely)
Return `{ code, message, details? }` like the single-bet errors:

| Code | When | `details` |
|---|---|---|
| `COMBO_CORRELATED_LEGS` | two legs share an `eventId` | `{ eventId }` |
| `COMBO_TOO_FEW_LEGS` | fewer than 2 legs | `{ min: 2 }` |
| `COMBO_TOO_MANY_LEGS` | more than 12 legs | `{ max: 12 }` |
| `COMBO_LEG_UNAVAILABLE` | a leg's market is closed/suspended/resolved | `{ marketId, outcomeId }` |
| `COMBO_ODDS_MOVED` | combined odds moved beyond tolerance | `{ combinedOdds }` (new) |
| `COMBO_STAKE_BELOW_MINIMUM` | stake under the combo floor | `{ minimumStakeMinor, currency }` |
| (existing) insufficient balance | stake > wallet | — |

The frontend surfaces `message` inline in the slip and, for `COMBO_ODDS_MOVED`,
can show the new odds for re-confirm.

---

## 2. `POST /api/bets/combo/quote` — pre-placement quote *(recommended)*

Same request body as placement, **no commit**. Lets the slip show
server-authoritative odds and flag an unavailable leg before the user commits
(the client currently computes odds from the price captured when each leg was
added).

Response `200`:
```jsonc
{
  "combinedOdds": "9.84",
  "potentialReturn": { "amount": "4920000", "currency": "NGN" },
  "legs": [
    { "marketId": "uuid", "outcomeId": "uuid", "price": "0.33", "available": true }
  ]
}
```

---

## 3. Combo minimum stake

Confirm whether a combo has its own floor or inherits the **max of its legs'**
`minStakeMinor` (current frontend assumption). Ideally expose a platform setting,
e.g. `bet.combo-min-stake-kobo`, and echo the effective minimum in
`COMBO_STAKE_BELOW_MINIMUM.details.minimumStakeMinor`.

---

## 4. Positions / history must represent combos

`GET /api/bets` and `GET /api/bets/positions` (and the Orders view) need to return
combo tickets so users can track them:

- A type/flag, e.g. `type: "COMBO"`, with an embedded `legs[]` — each leg carrying
  its market summary (`{ id, title, slug, imageUrl }`), `outcomeLabel`, `price`,
  and per-leg result (`WON` / `LOST` / `VOID`).
- Ticket-level `status` / `result`: **`WON` only if every leg won; `LOST` if any
  leg lost**; plus `combinedOdds`, `potentialReturn`, and the settled payout.
- **Void handling:** if a leg voids (match cancelled), define whether the combo
  recomputes odds on the remaining legs or voids entirely. The UI renders whatever
  is returned.

---

## 5. Settlement & notifications

- Settle a combo only when **all** legs resolve. Pay `stake × combinedOdds` on a
  full win, otherwise nothing.
- Emit a notification over the existing SSE `GET /api/notifications/stream` on
  settlement (reuse `WINNINGS_CREDITED` or a bet-result type) so the portfolio and
  toasts update live.
- `GET /api/bets/combo/:id` (or the same record via `/bets`) should reflect live
  status so the client can poll as a fallback.

---

## 6. Cash-out (optional, future)

If in-play combo cash-out is wanted later, mirror the single-position endpoints:
`GET /api/bets/combo/:id/cash-out-quote` → `{ valueMinor, currency, ... }` and
`POST /api/bets/combo/:id/cash-out`. These plug straight into the existing
cash-out UI pattern.

---

## Frontend contract reference

- Types: `src/types/combo.types.ts` (`ComboLeg`, `ComboBetPayload`,
  `ComboBetResponse`).
- Placement hook: `useComboBet` → `POST /bets/combo` in `src/data_layer/bets.ts`.
- Slip state + one-market-per-event rule: `src/redux/comboSlipSlice.ts` +
  `src/hooks/useComboSlip.ts`.
- UI: `src/components/combo/*` (slip drawer, floating button), wired on the Sports
  category page and the Live page.
