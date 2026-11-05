import { useEffect, useRef, useState } from 'react'
import BetSlipFab from './BetSlipFab'
import ComboSlip from './ComboSlip'
import { useComboSlip } from '../../hooks/useComboSlip'

/**
 * App-level mount for the bet slip: the floating slip button plus the
 * slide-over panel. Rendered once in the layout so the slip is reachable from
 * any page and its state (Redux) persists across navigation.
 *
 * Tapping a sports outcome adds it to the slip (one pick = a single bet), so
 * the panel opens on every new pick — the tap goes straight to the stake.
 * Removing a pick, or a slip restored from a previous session, doesn't open it.
 */
const ComboSlipMount = () => {
  const [open, setOpen] = useState(false)
  const { legs } = useComboSlip()
  // Seed with the current (possibly persisted) picks so a restored slip
  // doesn't pop open on load.
  const seen = useRef(new Set(legs.map((l) => l.outcomeId)))

  useEffect(() => {
    const ids = new Set(legs.map((l) => l.outcomeId))
    if ([...ids].some((id) => !seen.current.has(id))) setOpen(true)
    seen.current = ids
  }, [legs])

  return (
    <>
      <BetSlipFab onClick={() => setOpen(true)} />
      <ComboSlip open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default ComboSlipMount
