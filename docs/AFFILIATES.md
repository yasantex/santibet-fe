# Affiliate Programme (v1)

Partners who are **not players** — creators, tipsters, community admins, offline agents — bring players to SantiBet with codes and links, and are paid commission. Built to *SantiBet Affiliate Programme — Developer Spec v1* and the *Partner Programme — Product Guide* (Oct 2026).

**The one rule:** commission is calculated on **Net Fee Revenue (NFR)** per referred player — fees and spread — never on player losses, deposits, or the platform's trading P&L.

Frontend specs: [partner dashboard](API_SPECS_affiliate_portal.md) · [agent portal](API_SPECS_agent_portal.md) · [player app](API_SPECS_player_app_affiliates.md) · [admin console](API_SPECS_admin_affiliates.md).

Code: `src/modules/affiliates/`, jobs `src/jobs/affiliate.jobs.ts`, migrations `20261028000000_affiliate_programme_enums` and `20261028000100_affiliate_programme_v1`.

## Map of the module

| File | Does |
|---|---|
| `affiliate-money.ts` | Kobo money `{kobo, formatted}`, WAT calendar (days, months, weekly cycle), peppered identity hashes, masking |
| `affiliate-plan.values.ts` | The five options' value shapes, validation, merge with overrides, tier / rate maths |
| `affiliate-plan.service.ts` | Versioned global options, per-affiliate overrides, plan history, switch requests, the weekly cycle (spec §4.8) |
| `affiliate-settings.service.ts` | The settings registry (spec §10.1) |
| `affiliate-link.service.ts` | Codes, clicks, **attribution** (priority, self-referral, binding, velocity), reassignment |
| `affiliate-nfr.ts` | Pure maths: day stats and NFR, wash-trade exclusion, QRT / code-reward rules, fee-waiver rebates, monthly share |
| `affiliate-daily.service.ts` | Daily job, welcome benefits, low-quality-CPA rule, monthly close |
| `affiliate-line.service.ts` | Commission lines, release + parent overrides, reversal and clawback (with proportional parent clawback), adjustments |
| `affiliate-fraud.service.ts` | Flags, the queue, clear / confirm, chargebacks |
| `affiliate-payout.service.ts` | Payout batches: draft, two-person approval, provider transfers, polling, ledger, statements, WHT schedule |
| `affiliate-kyc.service.ts` | The affiliate's own KYC (Dojah) and name-enquiry-verified bank account with the 72 h lock |
| `affiliate-agent.service.ts` | Agent-assisted signup with customer OTP, customer list, KYC reminders |
| `affiliate-sweep.service.ts` | Every-minute funnel stamps and KYC-time attribution checks |
| `affiliate-report.service.ts` | Home, funnel, daily series, masked lists, earnings, subs, admin reports |

## How money moves

```
player activity ──(daily 01:00)──▶ affiliate_daily_stats (per player per day: volume, fees, spread, … , NFR)
                                      │
            ┌─────────────────────────┼──────────────────────────────┐
   QRT / code-reward (daily)   monthly close (1st 03:00)       fraud rules
   → CPA / CODE_REWARD line    → FEE_SHARE line per option      → flags (hold)
            └─────────────────────────┼──────────────────────────────┘
                                      ▼
                        PENDING ──(release 04:00, after HOLD_DAYS)──▶ APPROVED  (or HELD while a flag is open)
                                      │                                  └─▶ parent SUB_OVERRIDE line created
                                      ▼
                    payout batch (PAYOUT_DAY 09:00): DRAFT → review → approve (2nd person) → IN_PAYOUT
                                      ▼
                    provider transfer → PAID (ledger: AFFILIATE_COMMISSIONS ⇢ PROVIDER_CLEARING + WHT_PAYABLE)
                                     or FAILED (lines back to APPROVED, retry)
```

- Lines are **append-only**; `lineKey` is unique, so every job is safe to re-run (`POST /api/admin/affiliates/jobs/:job/run`).
- Confirmed fraud reverses unpaid lines and adds negative `CLAWBACK` lines for paid ones; the parent's override follows in proportion.
- Money is only created while the **`affiliate-commissions`** feature flag is on. With it off, stats and qualification still run (dashboards stay true) but nothing is owed — and nothing is back-paid later.

## Plans

Five fixed options: `FEE_SHARE`, `CPA`, `HYBRID`, `CODE_REWARD` (standard) and `AGENT` (agents), seeded at the spec's defaults (Hybrid hidden). Values and visibility are **versioned by `effectiveFrom`**: every operator change lands at the next Monday 00:00 WAT, overrides likewise, and "the values in force at T" is the latest version at or before T. The monthly close prices each day's NFR at the rate in force that day, so a change never rewrites a past week.

Each referred player is **bound to the option the affiliate was on at their signup** (`affiliate_referrals.bound_plan_id`); all their commission follows it. Tiers count active traders across all options but apply only to fee-share-bound players' NFR.

## Turning it on

1. Deploy (runs both migrations: seeds the options, two house ledger accounts, and plan history for existing affiliates).
2. **Finance**: confirm `INCLUDE_SPREAD_IN_NFR`, set `WHT_RATE_BPS`, check `PAYOUT_MIN_KOBO`.
3. **Super admin**: review the options' values (`GET/PATCH /api/admin/affiliates/plans`) — the defaults are the spec's starting points, not commercial terms — and decide on the Code Rewards `welcomeBenefit` (defaults to `NONE`).
4. Create content pages `affiliate-terms`, `affiliate-resources`, `responsible-gaming` (the portal's Resources page).
5. `PUT /api/admin/affiliates/config` `{ enabled: true, signupMode }`.
6. When ready to owe money: turn on `affiliate-commissions`.

## Where this differs from the developer spec, and why

| Spec | Built | Why |
|---|---|---|
| Affiliates are users (`affiliates.user_id`); apply as a logged-in user | Affiliates stay a **separate account type** with their own login; KYC is done on the affiliate | Ops chose standalone partner registration (Oct 22). Self-referral still matches the affiliate against players on BVN/NIN, phone, email, bank account and device. |
| `affiliate_events` fed by a queue from every service | **No event table**: the daily job aggregates straight from trades, settlements, positions, markets, deposits and wallet transactions, replacing the day's rows | There is no domain-event bus here. Recomputing a day from the source of truth is idempotent and catches late or reversed data on a re-run. |
| `/api/v1/...` paths | `/api/affiliate/...` (portal, agents, public) and `/api/admin/affiliates/...` | Matches this API's existing layout. |
| Spread = shown price − Polymarket hedge price per fill | **Estimated from the market's `markupBps`** on hedged (EXECUTION_LINKED) buy fills: `notional × m / (10000 + m)` | The hedge fill price is not stored per trade. Behind `INCLUDE_SPREAD_IN_NFR`. |
| Settlement fees | `Settlement.feeAmount`, plus the **parimutuel rake attributed as stake × `rakeBps`** | Parimutuel rake comes off the pool, not any one payout. |
| "Bonus funds used" | **Bonus credited** (BONUS wallet credits) is deducted on the day it is credited | The wallet has no bonus bucket, so "used" cannot be measured; deducting at credit time is the conservative reading. The same amount is removed from CPA qualifying volume and code-reward "own money" stake. |
| Welcome credit expires after 14 days | Issued (once per BVN/NIN, via PROMOTIONS → trading balance); **expiry is not enforced** | Without a bonus bucket an expiry could take the player's own money. The trading balance already can't be withdrawn until played and won. Needs a wallet bonus bucket. |
| Fee waiver: no fees on the first ₦20,000 | **Next-morning rebate** of fees on the first ₦20,000 of volume in 7 days | Leaves the trading engine untouched; the rebate is recorded as the fee rebate in NFR. |
| Self-hedge: opposite positions held at once | Buying 2+ outcomes of one market in a day excludes that market's buys that day; round trips use the 10-minute window | Positions are not snapshotted over time; this errs toward excluding. |
| Device fingerprint | Optional `X-Device-Fingerprint` header from the client, stored hashed | The API had no fingerprinting. |
| "Existing customer" by BVN/phone | By verified BVN/NIN **hash** (new `kyc_profiles.id_number_hash`) at KYC; phone is already unique at signup | ID numbers were never stored; the hash only exists for KYCs done after this release. |
| Codes letters and digits only (examples show `TUNDE-X`) | Letters and digits, 4–16 | Followed the rule, not the examples. Older codes stay valid. |
| Payout webhook | **Status polling** every 5 minutes (`getWithdrawalStatus`) | Same as player withdrawals; no separate webhook needed. |
| PDF/CSV statement | CSV | PDF rendering not added. |
| `affiliate_audit_log` | The existing `audit_logs`, `entityType` `affiliate*` | One audit trail for the console. |
| One FEE_SHARE line per month | One per **bound option** per month (usually one) | A partner who switched has players bound to two share options at different rates. |
| Low-quality CPA | Needs ≥ 10 qualified traders (14–90 days old) before it can fire | Avoids flagging on a tiny sample. |
| Fee share on every referred player | Counts NFR only from the day the player is KYC-verified | Spec §6.1: no player counts until KYC is verified. |

## Not built (Phase 1 out of scope, or follow-ups)

- Market-creator commissions, widgets, leaderboards, agent cash handling (spec: out of scope).
- Wallet bonus bucket (needed for welcome-credit expiry and exact "bonus used").
- PDF statements; a proper provider bulk-transfer API (transfers are sent one by one).
- Affiliate MFA.
- Attribution of phone-only accounts created by campaign play.

## Verification status

- `affiliate-rules.test.ts` (no database): 32 tests on the maths, including the acceptance cases (Silver ₦500,000; hybrid ₦130,000 / parent ₦13,000; round trips; negative-NFR floor; BISI code reward; ₦700 override; weekly cycle). Passing.
- `affiliate.routes.test.ts` (database): attribution priority, self-referral, masking, plan visibility and switching, binding, close → release → override → two-person batch → PAID, chargeback clawback, agents, self-registration, daily-job idempotency. **Needs Postgres** to run.
