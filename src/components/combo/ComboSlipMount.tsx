import { useEffect, useRef, useState } from 'react'
import BetSlipFab from './BetSlipFab'
import ComboSlip from './ComboSlip'
import { useComboSlip } from '../../hooks/useComboSlip'

/**
 * App-level mount for the combo bet slip: the floating slip button plus the
 * slide-over panel. Rendered once in the layout so the slip is reachable from
 * any page and its state (Redux) persists across navigation.
 *
 * Combo mode is on by default for sports (tapping a sports outcome auto-adds a
 * leg — see useComboSlip). To make the ticket "show" without the user hunting
 * for it, the panel auto-opens the first time a selection is added (0 → 1),
 * SportyBet-style. It is NOT reopened on later adds (so the user can keep
 * selecting), nor on mount for a slip restored from a previous session.
 */
const ComboSlipMount = () => {
  const [open, setOpen] = useState(false)
  const { legCount } = useComboSlip()
  // Seed with the current (possibly persisted) count so a restored slip doesn't
  // pop open on load — only an in-session 0 → 1 does.
  const prevCount = useRef(legCount)

  useEffect(() => {
    if (prevCount.current === 0 && legCount > 0) setOpen(true)
    prevCount.current = legCount
  }, [legCount])

  return (
    <>
      <BetSlipFab onClick={() => setOpen(true)} />
      <ComboSlip open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default ComboSlipMount
