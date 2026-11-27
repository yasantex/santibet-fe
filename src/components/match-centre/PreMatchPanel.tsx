import type { MatchCentre } from '../../types/matchCentre.types'
import { shortTeam } from './matchText'

const FORM_CLASS: Record<string, string> = {
  W: 'bg-[#2f9e44]',
  D: 'bg-[#868e96]',
  L: 'bg-[#e03131]',
}

const Form = ({ form }: { form: string | null }) =>
  form ? (
    <span className='flex gap-0.5'>
      {form.slice(-5).split('').map((r, i) => (
        <span key={i} className={`flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-bold text-[#fff] ${FORM_CLASS[r] ?? 'bg-[#868e96]'}`}>
          {r}
        </span>
      ))}
    </span>
  ) : null

/** Head-to-head record, the two teams' league table rows and form, and who is missing. */
const PreMatchPanel = ({ match }: { match: MatchCentre }) => {
  const pre = match.preMatch
  if (!pre) return <p className='py-6 text-center text-xs text-neutral-10'>Loading match facts…</p>

  const home = match.home.name
  const away = match.away.name
  const wins = { home: 0, draw: 0, away: 0 }
  for (const g of pre.headToHead) {
    if (g.homeGoals === null || g.awayGoals === null) continue
    if (g.homeGoals === g.awayGoals) wins.draw += 1
    else {
      const winner = g.homeGoals > g.awayGoals ? g.home : g.away
      if (winner === home) wins.home += 1
      else if (winner === away) wins.away += 1
    }
  }
  const rows = pre.table.filter((r) => r.teamId === match.home.id || r.teamId === match.away.id)
  const missing = (teamId: number) => pre.missing.filter((m) => m.teamId === teamId)

  return (
    <div className='flex flex-col gap-5'>
      {pre.headToHead.length > 0 && (
        <section className='flex flex-col gap-2'>
          <h3 className='text-xs font-bold text-black'>Head to head (last {pre.headToHead.length})</h3>
          <div className='grid grid-cols-3 text-center'>
            {[
              [shortTeam(home), wins.home, 'text-[#2fbf71]'],
              ['Draws', wins.draw, 'text-neutral-10'],
              [shortTeam(away), wins.away, 'text-[#4c6ef5]'],
            ].map(([label, n, cls]) => (
              <div key={String(label)} className='flex flex-col'>
                <span className={`text-xl font-bold ${cls}`}>{n}</span>
                <span className='truncate text-[11px] text-neutral-10'>{label}</span>
              </div>
            ))}
          </div>
          <ul className='flex flex-col'>
            {pre.headToHead.map((g) => (
              <li key={g.date + g.home} className='grid grid-cols-[72px_1fr_auto_1fr] items-center gap-2 border-b border-border py-1.5 text-xs'>
                <span className='text-neutral-10'>{new Date(g.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                <span className='truncate text-right text-black'>{shortTeam(g.home)}</span>
                <span className='rounded bg-surface-base px-1.5 font-bold tabular-nums text-black'>{g.homeGoals ?? '-'}–{g.awayGoals ?? '-'}</span>
                <span className='truncate text-black'>{shortTeam(g.away)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rows.length > 0 && (
        <section className='flex flex-col gap-2'>
          <h3 className='text-xs font-bold text-black'>League table</h3>
          <table className='w-full text-xs'>
            <thead className='text-neutral-10'>
              <tr>
                <th className='text-left font-normal'>#</th>
                <th className='text-left font-normal'>Team</th>
                <th className='font-normal'>P</th>
                <th className='font-normal'>GD</th>
                <th className='font-normal'>Pts</th>
                <th className='text-right font-normal'>Form</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.teamId} className='border-t border-border text-black'>
                  <td className='py-1.5'>{r.rank}</td>
                  <td className='truncate'>{shortTeam(r.team)}</td>
                  <td className='text-center'>{r.played}</td>
                  <td className='text-center'>{r.goalsFor - r.goalsAgainst}</td>
                  <td className='text-center font-bold'>{r.points}</td>
                  <td className='flex justify-end py-1.5'><Form form={r.form} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {pre.missing.length > 0 && (
        <section className='flex flex-col gap-2'>
          <h3 className='text-xs font-bold text-black'>Missing players</h3>
          <div className='grid grid-cols-2 gap-4'>
            {[match.home, match.away].map((team) => (
              <ul key={team.id} className='flex flex-col gap-1'>
                <li className='text-[11px] font-semibold text-neutral-10'>{shortTeam(team.name)}</li>
                {missing(team.id).map((m) => (
                  <li key={m.player} className='text-xs text-black'>
                    {m.player}
                    <span className='block text-[10px] text-neutral-10'>{[m.type, m.reason].filter(Boolean).join(' · ')}</span>
                  </li>
                ))}
                {!missing(team.id).length && <li className='text-xs text-neutral-10'>None reported</li>}
              </ul>
            ))}
          </div>
        </section>
      )}

      {!pre.headToHead.length && !rows.length && !pre.missing.length && (
        <p className='py-6 text-center text-xs text-neutral-10'>No match facts available for this fixture.</p>
      )}
    </div>
  )
}

export default PreMatchPanel
