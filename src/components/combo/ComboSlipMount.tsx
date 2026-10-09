import { useState } from 'react'
import BetSlipFab from './BetSlipFab'
import ComboSlip from './ComboSlip'

/**
 * App-level mount for the combo bet slip: the floating slip button plus the
 * slide-over panel. Rendered once in the layout so the slip is reachable from
 * any page and its state (Redux) persists across navigation.
 */
const ComboSlipMount = () => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <BetSlipFab onClick={() => setOpen(true)} />
      <ComboSlip open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default ComboSlipMount
