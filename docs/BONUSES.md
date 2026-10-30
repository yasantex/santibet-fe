# Bonus engine

One promotion engine with per-promotion config, not one hard-coded feature per bonus. Built from Yemi's
**"SantiBet Bonuses — Developer Spec"** and **"SantiBet Bonuses Explained"** (Oct 27, 2026).

Launch promotions (seeded **switched off** by the migration):

| | `NEW_MEMBER_1010` — ₦1,010 Free Deposit | `DEPOSIT_1000` — 100% First Deposit Bonus |
|---|---|---|
| Type | `NO_DEPOSIT` | `DEPOSIT_MATCH` |
| Trigger | First sign-in after registration (automatic) | First successful deposit, tickbox pre-ticked (automatic unless unticked) |
| Credit | ₦1,010 flat | 100% of deposit, max ₦10,000, min deposit ₦1,000 |
| Pays | Wins return to the bonus wallet; reach ₦10,101 settled → ₦1,010 cash | Stake consumed; profit → locked winnings; released once credit is bet 1× |
| Max cash out | ₦1,010 | ₦10,000 |
| Live markets | Allowed | Not allowed |
| Expiry | None | 14 days from credit |
| KYC | Before withdrawal | Before the bonus can be bet (PENDING_KYC until then) |

Player API: [API_SPECS_player_app_bonuses.md](API_SPECS_player_app_bonuses.md) · Admin API: [API_SPECS_admin_bonuses.md](API_SPECS_admin_bonuses.md)

## Switching it on

```
PATCH /api/admin/promotions/{id}   { "active": true, "startsAt": "...", "reason": "Launch" }
```

Also: flag `bonus-engine` (default **on**) is the master stop above every promotion — off means no new grants
and no bonus bets, while bonuses already live keep their balances and placed bets still settle.

## Code map

| | |
|---|---|
| `src/modules/bonuses/bonus.config.ts` | The config shape (zod), spec defaults per type, patch/merge + cross-field validation |
| `src/modules/bonuses/bonus-rules.ts` | Pure decisions: credit sizing, bonus-bet checks, settlement credit, end states, grant rules |
| `src/modules/bonuses/bonus.service.ts` | The engine: grants, bet hooks, settlement routing, end states, sweep |
| `src/modules/bonuses/bonus-player.service.ts`, `bonus.routes.ts` | `/api/bonuses/*` |
| `src/modules/bonuses/admin-bonus.service.ts`, `admin-bonus.routes.ts` | `/api/admin/promotions*`, `/api/admin/user-bonuses*` |
| `src/modules/wallet/ledger/bonus-posting.service.ts` | Every bonus journal (only the wallet module posts) |
| `src/jobs/bonus.jobs.ts` | `bonuses.sweep`, every 5 minutes |
| Hooks | `auth.controller.buildAuthResponse` (grant on sign-in), `DepositService.applyOutcome` + crypto deposit (deposit rule, in a savepoint), `BetService.placeBet` (`useBonus`), `SettlementService` (bonus payout routing), `WithdrawalService` (KYC gate), KYC approval (activate PENDING_KYC) |

## Money model

Two new **user** ledger accounts, created the first time a user is granted a bonus:

- `USER_BONUS` — the bonus wallet (credit that can be bet, never withdrawn)
- `USER_BONUS_LOCKED` — locked winnings (PROFIT_LOCKED payout mode)

```
grant      PROMOTIONS            → USER_BONUS              (expense)
bet        USER_BONUS → ORDER_HOLD → HOUSE_PL              (normal bet journals, split.fromBonus)
win        HOUSE_PL              → USER_BONUS              (BALANCE: whole return)
           HOUSE_PL              → USER_BONUS_LOCKED       (PROFIT_LOCKED: profit only)
void       HOUSE_PL              → USER_BONUS              (stake back; off the playthrough meter)
complete   USER_BONUS(_LOCKED)   → USER_WINNINGS           (the ONLY way bonus money becomes cash)
end        USER_BONUS            → PROMOTIONS              (unused credit removed)
           USER_BONUS_LOCKED     → HOUSE_PL                (locked winnings removed)
```

- A user holds **at most one live bonus** (`ACTIVE`/`PENDING_KYC`) — enforced by the engine and a partial
  unique index — so the two accounts always belong to it. `user_bonuses` money columns are a cache re-read
  from the ledger after every posting.
- **Bonus and cash positions never merge**: `positions.funding_key` (`CASH` or the bonus id) is part of the
  unique key, with a CHECK keeping it in step with `user_bonus_id`.
- The deposit hook runs **inside the deposit's transaction in a savepoint**: a bonus failure is logged and
  rolled back on its own, never undoing the credit. The sweep backstops it.
- Revenue: the bonus cost shows on the existing `promotions` stream (grants minus removed credit) and bonus
  bets land in `trading_book_pnl` like any bet.

## Lifecycle

`ACTIVE` · `PENDING_KYC` → terminal: `COMPLETED` · `LOST` · `FORFEITED` · `EXPIRED` · `VOIDED` · `CANCELLED`,
plus `DECLINED` (unticked) and `INELIGIBLE` (a grant rule failed; reason in `endedReason`).

End states are checked every time a bonus bet settles (`evaluate`) and nothing ends while a bonus bet is open:

- **COMPLETED** — TARGET_BALANCE: settled balance ≥ target → `min(balance, maxCashout)` to cash.
  PLAYTHROUGH: staked ≥ credit × multiple → `min(locked, maxCashout)` to cash. Everything else left is removed.
- **LOST** — credit below the minimum stake with nothing open (and, for PROFIT_LOCKED, nothing locked).
- **FORFEITED** — any deposit, when `endsOnDeposit` (new-member). The deposit bonus starts in the same transaction.
- **EXPIRED** — sweep, once `expiresAt` passes. Credit removed; locked winnings removed (or, with
  `expiryKeepsLockedWinnings`, released capped once open bets settle).
- **VOIDED / CANCELLED** — operator, or the engine finding both sides backed despite the checks.

Open bonus bets of an ended bonus still settle on the market, but credit nothing ("cancel open bonus bets").

## Bonus-bet checks (API and `GET /bonuses/eligibility` run the same code)

Status ACTIVE and not expired · market (not limit) bet · source/category allowed · not in play (if
`allowLive=false`; in play = `markets.in_play` or a live goal segment or a live series round) · closes ≥
`minMinutesToClose` from now · `minPrice ≤ price ≤ maxPrice` (the price the slip shows: seeded pool odds or
the marked-up fixed price) · no bonus position on another outcome (MARKET or EVENT scope; optionally no cash
position either) · stake within limits and ≤ bonus balance. Re-checked under a row lock on the bonus inside the
placement transaction, so racing slips cannot back both sides or overspend. Bonus positions cannot be cashed out.

## Config reference (`promotions.config`, all kobo)

| Key | NEW_MEMBER_1010 | DEPOSIT_1000 | Meaning |
|---|---|---|---|
| `bonusAmountKobo` | 101000 | null | NO_DEPOSIT flat credit |
| `matchPercent` / `minDepositKobo` / `maxBonusKobo` | — / — / 101000 | 100 / 100000 / 1000000 | DEPOSIT_MATCH sizing; cap |
| `payoutMode` | BALANCE | PROFIT_LOCKED | Where a win is credited |
| `completionMode` | TARGET_BALANCE | PLAYTHROUGH | How it completes |
| `targetBalanceKobo` / `playthroughMultiple` | 1010100 / — | — / 1 | |
| `completeWhenCreditBelowMinStake` | false | true | PLAYTHROUGH: leftover credit too small to bet → complete if anything was won |
| `maxCashoutKobo` | 101000 | 1000000 | |
| `minPrice` / `maxPrice` | 0.10 / 0.85 | 0.10 / 0.85 | |
| `minMinutesToClose` | 60 | 60 | |
| `allowLive` | true | false | |
| `allowedSources` / `allowedCategoryIds` / `excludedCategoryIds` | null / null / [] | same | |
| `oppositeSideScope` | MARKET | MARKET | or EVENT |
| `blockCashHedge` | **true** | **true** | also refuse hedging bonus against own cash (product decision, stricter than the spec) |
| `minStakeKobo` / `maxStakeKobo` | null / null | null / null | null = platform minimum, no max |
| `defaultUseBonus` | true | false | bet slip default |
| `expiryDays` / `expiryReminderHours` | null / 48 | 14 / 48 | |
| `expiryKeepsLockedWinnings` | false | false | spec default: lost |
| `requireKycToUse` / `requireKycToWithdraw` | false / true | true / true | |
| `endsOnDeposit` | true | false | |
| `optInWhenNotAsked` | — | true | deposit with no tickbox answer (crypto, old client) |
| `maxAccountAgeDays` | 7 | null | NO_DEPOSIT: only new accounts |
| `minAge` / `excludeStaff` / `staffEmailDomains` | 18 / true / [] | same | |
| `duplicateChecks` | phone, device | phone, device, paymentMethod | once per person — **IP off** (shared mobile IPs) |
| `ipWindowDays` | null | null | only count IP matches this recent (when the IP check is on) |
| `maxGrants` | null | null | budget cap |
| `fastCompletionHours` | 24 | null | review flag |
| `display.*` | title, grantedMessage, offerText, forfeitWarning, termsUrl | | player-facing copy |

A grant snapshots the config into `user_bonuses.terms`: edits apply to new grants only.

## Decisions taken (spec defaults unless noted)

| Question | Built as |
|---|---|
| Expired before full playthrough — keep locked winnings? | Lost (`expiryKeepsLockedWinnings=false`) |
| 14-day clock from credit or KYC? | From credit |
| New-member bonus allows live? | Yes (`allowLive`) |
| OTP before the ₦1,010? | No; duplicate checks on phone / IP / device |
| Smallest bet (LOST threshold) | Platform `bet.min-stake-kobo` (or promotion `minStakeKobo`) |
| Card/bank fingerprint | Hashed from the deposit's payment method when there is one; bank-transfer deposits usually have none, so the check is skipped for them |
| **Added:** which accounts are "new" | Created at/after the promotion's `startsAt` and ≤ `maxAccountAgeDays` (7) old — so switching it on does not gift the existing user base |
| **Added:** 18+ | No DOB is collected at signup; a declared/verified DOB under `minAge` is refused, a missing one passes |
| **Added:** self-excluded | There is no self-exclusion flag yet; suspended/deleted accounts are refused |
| **Added:** staff | An operator's email, or `staffEmailDomains` |
| **Added:** bonus bets | Market bets only, no cash-out, not on combos |
| **Added:** withdrawal | An unverified user holding bonus-released cash must pass KYC before any withdrawal (`KYC_REQUIRED`, `reason: BONUS_CASH`) |
| **Decided:** once per person | Phone and device (and payment method for the deposit bonus). **IP is not checked** — Nigerian mobile networks put many people behind one IP. `duplicateChecks.ip` turns it back on |
| **Decided:** hedging with own cash | Blocked (`blockCashHedge: true`): a bonus bet against an open cash position on the other side is refused, and so is a cash bet against an open bonus position (`BONUS_OPPOSITE_SIDE`) |
| **Added:** abuse review flags | `FAST_COMPLETION`; `SHARED_IP` (another account signed in from the grant IP in 30 days) only while the IP check is on |

## Watch-outs

- **Once per person rests on the device fingerprint.** With IP off, a farmer who changes device and phone is
  not caught at grant. The app must send `X-Device-Fingerprint` on sign-up/sign-in and deposits, or the device
  check does nothing. Watch the report's grants and `linkedBonuses` in admin.
- Bonus bets earn points and count toward affiliate figures like any bet.
- The customer T&C files named in the spec (`santibet-new-member-bonus.html`, `santibet-1000-bonus.html`) were not
  available here; the rules above follow the two docs. Check them against the T&Cs before launch.

## Ops

- Job `bonuses.sweep` every 5 minutes (also `POST /api/admin/bonuses/sweep`): expiry, finishing expired bonuses,
  PENDING_KYC → ACTIVE after KYC, 2-day reminders, and the deposit-hook backstop (last 48 h).
- Migrations: `20261029000000_bonus_engine_enums`, `20261029000100_bonus_engine` (widens the
  `ledger_accounts_ownership` CHECK; adds a partial unique index and two CHECKs Prisma does not model).
- Tests: `bonus-rules.test.ts` (pure) and `bonus-flows.test.ts` (DB, one case per acceptance test, ledger
  invariant after each). The flow suite points the engine at its own switched-off promotions.
