import { useMemo, useState } from 'react'
import { useDebounce } from 'use-debounce'
import {
  useBetQuote,
  useBonusEligibility,
  useCurrentBonus,
} from '../data_layer/bonuses'
import { toMajorUnits, toMinorUnits } from '../utils/functions'
import type { BetType } from '../types/bet.types'
import type { BonusEligibilityOutcome } from '../types/bonus.types'
import type { UiMarket, UiOutcome } from '../types/market.types'

interface UseBonusSlipArgs {
  market: UiMarket
  outcome?: UiOutcome
  type: BetType
  /** Naira. */
  stake: number
  /** 0–1, the price the slip shows. */
  price: number
  isSignedIn: boolean
}

/**
 * Everything the bet slip needs to stake bonus credit: the live bonus, the
 * "Use bonus" choice, which outcomes a bonus bet can go on, and what a win
 * would credit. Bonus bets are market bets only, so a limit order turns it off.
 */
const useBonusSlip = ({
  market,
  outcome,
  type,
  stake,
  price,
  isSignedIn,
}: UseBonusSlipArgs) => {
  const { bonus } = useCurrentBonus(isSignedIn)

  // The player's choice for this bonus; until they touch it, the bonus's own
  // default applies (on for the new-member bonus, off for the deposit bonus).
  const [choice, setChoice] = useState<{ bonusId: string; on: boolean } | null>(
    null,
  )
  const useBonus =
    !!bonus &&
    (choice?.bonusId === bonus.id ? choice.on : bonus.rules.defaultUseBonus)
  const setUseBonus = (on: boolean) => {
    if (bonus) setChoice({ bonusId: bonus.id, on })
  }

  const offered = !!bonus
  const pendingKyc = !!bonus && (bonus.kycRequired || bonus.status === 'PENDING_KYC')
  const marketOrdersOnly = type !== 'market'
  /** Bonus rules apply to this slip. */
  const active = offered && useBonus && !marketOrdersOnly && !pendingKyc && bonus.canBet

  const { data: eligibility } = useBonusEligibility(
    market.id,
    offered && useBonus && !pendingKyc,
  )

  const eligibilityById = useMemo(() => {
    const map = new Map<string, BonusEligibilityOutcome>()
    eligibility?.outcomes.forEach((o) => map.set(o.outcomeId, o))
    return map
  }, [eligibility])

  /** Why a bonus bet can't go on this outcome, or null if it can (or unknown). */
  const ineligibleReason = (outcomeId?: string) => {
    if (!active || !outcomeId) return null
    const entry = eligibilityById.get(outcomeId)
    return entry && !entry.eligible
      ? (entry.reason ?? "This option can't use bonus credit")
      : null
  }

  const balance = toMajorUnits(bonus?.balanceKobo ?? 0)
  const minStake = bonus?.rules.minStakeKobo
    ? toMajorUnits(bonus.rules.minStakeKobo)
    : null
  const maxStake = bonus?.rules.maxStakeKobo
    ? toMajorUnits(bonus.rules.maxStakeKobo)
    : null

  // Ask the server what a win would credit (only the profit for the deposit
  // bonus). Debounced so typing a stake doesn't fire a quote per keystroke.
  const [debouncedStake] = useDebounce(stake, 400)
  const quotePayload =
    active && outcome && debouncedStake > 0
      ? {
          marketId: market.id,
          outcomeId: outcome.id,
          stake: String(toMinorUnits(debouncedStake)),
          type: 'market' as const,
          useBonus: true,
        }
      : null
  const { data: quote, isFetching: quoteLoading } = useBetQuote(quotePayload)
  const quoteMatches = !!quote?.bonus && debouncedStake === stake

  const creditsTo =
    quote?.bonus?.creditsTo ??
    (bonus?.payoutMode === 'PROFIT_LOCKED' ? 'LOCKED_WINNINGS' : 'BONUS_BALANCE')

  // Server figure when it matches the stake on screen; otherwise the same sum
  // done locally so the slip never shows a blank.
  const fullReturn = price > 0 ? stake / price : 0
  const creditOnWin = quoteMatches
    ? toMajorUnits(quote!.bonus!.creditOnWin.amount)
    : creditsTo === 'LOCKED_WINNINGS'
      ? Math.max(fullReturn - stake, 0)
      : fullReturn

  return {
    bonus,
    offered,
    useBonus,
    setUseBonus,
    active,
    pendingKyc,
    marketOrdersOnly,
    balance,
    minStake,
    maxStake,
    ineligibleReason,
    creditsTo,
    creditOnWin,
    quoteLoading,
    /** The server's own verdict for this exact stake, when it has one. */
    quoteRefusal:
      quoteMatches && quote?.bonus && !quote.bonus.eligible
        ? (quote.bonus.reason ?? null)
        : null,
  }
}

export type BonusSlip = ReturnType<typeof useBonusSlip>

export default useBonusSlip
