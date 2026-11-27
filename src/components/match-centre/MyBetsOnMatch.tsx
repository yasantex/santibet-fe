import { useMyMatchBets } from '../../data_layer/matchCentre'
import { formatCurrency, toMajorUnits } from '../../utils/functions'
import type { LiveStatus } from '../../types/matchCentre.types'

const VERDICT: Record<string, { label: string; className: string }> = {
  winning: { label: 'Winning', className: 'bg-surface-success text-success' },
  won: { label: 'Won', className: 'bg-success text-[#fff]' },
  losing: { label: 'Losing', className: 'bg-surface-error text-error' },
  lost: { label: 'Lost', className: 'bg-error text-[#fff]' },
  pending: { label: 'Not started', className: 'bg-hover text-neutral-10' },
}

export const VerdictBadge = ({ live }: { live: LiveStatus | null }) => {
  const meta = live ? VERDICT[live.verdict] : undefined
  if (!meta) return null
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${meta.className}`}>{meta.label}</span>
}

/**
 * The player's own bets on this match and how each would finish if the match
 * ended now. Signed-out players see nothing.
 */
const MyBetsOnMatch = ({ eventId, live }: { eventId: string; live: boolean }) => {
  const { data } = useMyMatchBets(eventId, live)
  const rows = [
    ...(data?.singles ?? []).map((s) => ({
      key: s.positionId,
      title: `${s.outcome}`,
      sub: `${s.market} · Stake ${formatCurrency(toMajorUnits(s.stake))}`,
      live: s.live,
    })),
    ...(data?.comboLegs ?? []).map((l) => ({
      key: l.legId,
      title: `${l.outcome}`,
      sub: `${l.market} · Leg of a ${l.comboLegs}-fold @ ${Number(l.combinedOdds).toFixed(2)}`,
      live: l.live,
    })),
  ]
  if (!rows.length) return null
  return (
    <section className='flex flex-col gap-2 rounded-lg border border-border p-3'>
      <h3 className='text-xs font-bold text-black'>Your bets on this match</h3>
      <ul className='flex flex-col gap-2'>
        {rows.map((r) => (
          <li key={r.key} className='flex items-start justify-between gap-3'>
            <div className='flex min-w-0 flex-col'>
              <span className='truncate text-sm font-semibold text-black'>{r.title}</span>
              <span className='truncate text-[11px] text-neutral-10'>{r.sub}</span>
              {r.live?.note && <span className='text-[11px] font-medium text-warning'>{r.live.note}</span>}
            </div>
            <VerdictBadge live={r.live} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default MyBetsOnMatch
