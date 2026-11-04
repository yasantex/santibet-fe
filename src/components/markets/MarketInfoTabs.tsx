import { useState } from 'react'
import { formatNairaCompact, formatSharePrice } from '../../utils/functions'
import type { MarketTrade } from '../../types/market.types'

// Partner rules can run to several paragraphs; longer ones start collapsed.
const RULES_PREVIEW_CHARS = 360
// The history endpoint lists trades oldest first; show this many newest.
const RECENT_TRADES = 15

/** "14:05" today, "Oct 24, 14:05" before. */
const tradeTimeLabel = (iso: string) => {
  const d = new Date(iso)
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === new Date().toDateString()
    ? time
    : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`
}

/**
 * A market's Rules and Recent Trades tabs. Pool rounds and some admin
 * markets have no rules, so that tab only shows when there's something to
 * read. Shared by the market page and the multi-choice event view.
 */
const MarketInfoTabs = ({
  rules: rawRules,
  trades,
}: {
  rules?: string | null
  trades?: MarketTrade[]
}) => {
  const [tab, setTab] = useState<'rules' | 'trades'>('rules')
  const [expanded, setExpanded] = useState(false)

  const rules = rawRules?.trim() || null
  const activeTab = rules ? tab : 'trades'
  const rulesLong = !!rules && rules.length > RULES_PREVIEW_CHARS
  const recentTrades = [...(trades ?? [])].reverse().slice(0, RECENT_TRADES)

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-border bg-card p-5'>
      <div className='flex items-center gap-4 border-b border-border/60'>
        {(rules ? (['rules', 'trades'] as const) : (['trades'] as const)).map((t) => (
          <button
            key={t}
            type='button'
            onClick={() => setTab(t)}
            className={`-mb-px cursor-pointer border-b-2 pb-2 text-sm font-semibold capitalize transition-colors ${
              activeTab === t
                ? 'border-brand-green text-black'
                : 'border-transparent text-neutral-10 hover:text-black'
            }`}
          >
            {t === 'trades' ? 'Recent Trades' : 'Rules'}
          </button>
        ))}
      </div>

      {activeTab === 'rules' && rules ? (
        <div className='flex flex-col items-start gap-2'>
          {/* Plain text: paragraphs are blank-line separated, so keep the
              line breaks rather than parsing it as Markdown. */}
          <p
            className={`text-sm leading-relaxed whitespace-pre-line text-neutral-10 ${
              rulesLong && !expanded ? 'line-clamp-6' : ''
            }`}
          >
            {rules}
          </p>
          {rulesLong && (
            <button
              type='button'
              onClick={() => setExpanded((v) => !v)}
              className='cursor-pointer text-sm font-semibold text-black hover:underline'
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      ) : (
        <div className='flex flex-col'>
          {recentTrades.length ? (
            <>
              <div className='grid grid-cols-4 gap-2 pb-2 text-xs font-semibold text-neutral-10'>
                <span>Side</span>
                <span className='text-right'>Price</span>
                <span className='text-right'>Amount</span>
                <span className='text-right'>Time</span>
              </div>
              {recentTrades.map((t) => (
                <div
                  key={t.id}
                  className='grid grid-cols-4 gap-2 border-t border-border/40 py-2 text-xs'
                >
                  <span
                    className={`font-semibold capitalize ${
                      t.side === 'buy' ? 'text-success' : 'text-error'
                    }`}
                  >
                    {t.side}
                  </span>
                  <span className='text-right text-black'>
                    {t.price != null ? formatSharePrice(t.price) : 'Pool'}
                  </span>
                  {/* A combo leg has no stake of its own. */}
                  <span className='text-right text-neutral-10'>
                    {t.combo
                      ? 'Combo'
                      : t.amount != null
                        ? formatNairaCompact(t.amount)
                        : '—'}
                  </span>
                  <span className='text-right text-neutral-10'>
                    {tradeTimeLabel(t.ts)}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <p className='py-4 text-sm text-neutral-10'>No recent trades.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default MarketInfoTabs
