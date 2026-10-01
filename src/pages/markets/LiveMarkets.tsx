import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import LiveEventCard from '../../components/markets/LiveEventCard'
import {
  LiveBadge,
  LiveIntervalFilter,
} from '../../components/markets/LiveBits'
import { MarketCardSkeleton } from '../../components/globals/ReusedText'
import {
  eventIntervalSeconds,
  LIVE_INTERVALS,
  useLiveBets,
} from '../../data_layer/markets'
import { formatCompact } from '../../utils/functions'
import { marketHref, marketSport } from '../../utils/marketDisplay'
import type { UiEvent, UiMarket, UiOutcome } from '../../types/market.types'

/** Sports and Crypto are always listed — the two kinds of in-play betting —
 *  plus any other category that currently has live events. */
const LIVE_CATEGORIES = [
  { key: 'sports', label: 'Sports' },
  { key: 'crypto', label: 'Crypto' },
]

const COIN_LABELS: Record<string, string> = {
  btc: 'Bitcoin',
  eth: 'Ethereum',
  ltc: 'Litecoin',
  sol: 'Solana',
  xrp: 'XRP',
  doge: 'Dogecoin',
  bnb: 'BNB',
}

const eventSport = (e: UiEvent) =>
  e.markets.map(marketSport).find(Boolean) ?? null

/** Coin of a rolling crypto round, from its series key ("btc-5m" → Bitcoin). */
const eventCoin = (e: UiEvent): string | null => {
  const key = e.markets.find((m) => m.seriesKey)?.seriesKey ?? ''
  if (!key || key.includes(':')) return null
  const raw = key.split('-')[0].toLowerCase()
  return raw ? (COIN_LABELS[raw] ?? raw.toUpperCase()) : null
}

/** Sidebar child of a category: the sport for live sports, the coin for
 *  crypto rounds. */
const eventSub = (e: UiEvent) => eventSport(e) ?? eventCoin(e)

type LiveSub = { value: string; count: number }

type LiveGroup = {
  key: string
  label: string
  count: number
  subs: LiveSub[]
}

const LiveMarkets = () => {
  const navigate = useNavigate()
  const { events: allEvents, isLoading, isError } = useLiveBets({ limit: 40 })

  // Sub-navigation lives in the URL (?category=crypto&sub=Bitcoin,
  // ?category=sports&sub=Football, &interval=300) so it survives refresh and
  // can be linked.
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryFilter = searchParams.get('category')?.toLowerCase() ?? null
  const subFilter = searchParams.get('sub')
  const intervalParam = Number(searchParams.get('interval'))
  const intervalFilter =
    Number.isFinite(intervalParam) && intervalParam > 0 ? intervalParam : null
  const setParams = (next: Record<string, string | number | null>) =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(next)) {
          if (value == null) params.delete(key)
          else params.set(key, String(value))
        }
        return params
      },
      { replace: true },
    )
  // Picking from the sidebar keeps the round-length filter only while it
  // still applies (All / Crypto).
  const select = (category: string | null, sub: string | null = null) =>
    setParams({
      category,
      sub,
      interval:
        category === null || category === 'crypto' ? intervalFilter : null,
    })

  // Category → sport / coin tree with live counts, mirroring the Sports
  // page's sport → league sidebar.
  const groups = useMemo<LiveGroup[]>(() => {
    const byCategory = new Map<string, { label: string; events: UiEvent[] }>(
      LIVE_CATEGORIES.map((c) => [c.key, { label: c.label, events: [] }]),
    )
    for (const e of allEvents) {
      const key = e.category.toLowerCase()
      const entry = byCategory.get(key) ?? { label: e.category, events: [] }
      entry.events.push(e)
      byCategory.set(key, entry)
    }
    return [...byCategory.entries()].map(([key, { label, events }]) => {
      const counts = new Map<string, number>()
      for (const e of events) {
        const sub = eventSub(e)
        if (sub) counts.set(sub, (counts.get(sub) ?? 0) + 1)
      }
      const subs: LiveSub[] = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([value, count]) => ({ value, count }))
      return { key, label, count: events.length, subs }
    })
  }, [allEvents])

  const activeGroup = groups.find((g) => g.key === categoryFilter) ?? null
  // Round-length chips (5 mins / 15 mins / 1 hour) only apply to the rolling
  // crypto rounds, so they show on "All live" and Crypto only.
  const showIntervals = categoryFilter === null || categoryFilter === 'crypto'
  const activeSub = activeGroup?.subs.find((s) => s.value === subFilter) ?? null

  const events = useMemo<UiEvent[]>(
    () =>
      allEvents.filter((e) => {
        if (categoryFilter && e.category.toLowerCase() !== categoryFilter)
          return false
        if (subFilter && eventSub(e) !== subFilter) return false
        if (
          showIntervals &&
          intervalFilter &&
          eventIntervalSeconds(e) !== intervalFilter
        )
          return false
        return true
      }),
    [allEvents, categoryFilter, subFilter, showIntervals, intervalFilter],
  )

  const goToMarket = (m: UiMarket) => navigate(marketHref(m))
  const goToOutcome = (m: UiMarket, o: UiOutcome) =>
    navigate(marketHref(m, o.id))

  return (
    <main className='mx-auto flex w-full max-w-8xl flex-col gap-5 px-3 pt-10 pb-20 md:flex-row md:px-8'>
      <aside className='hidden w-52 shrink-0 md:block'>
        <nav className='flex flex-col gap-0.5'>
          <button
            type='button'
            onClick={() => select(null)}
            className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-black/60 hover:bg-hover ${
              !categoryFilter ? 'bg-hover' : ''
            }`}
          >
            All live
            <span className='text-xs text-neutral-10'>
              {formatCompact(allEvents.length)}
            </span>
          </button>
          {groups.map((group) => {
            const active = categoryFilter === group.key
            return (
              <div key={group.key} className='flex flex-col gap-0.5'>
                <button
                  type='button'
                  onClick={() => select(group.key)}
                  className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold text-black/70 hover:bg-hover ${
                    active && !activeSub ? 'bg-hover' : ''
                  }`}
                >
                  {group.label}
                  <span className='text-xs font-normal text-neutral-10'>
                    {formatCompact(group.count)}
                  </span>
                </button>
                {active &&
                  group.subs.map((sub) => (
                    <button
                      key={sub.value}
                      type='button'
                      onClick={() => select(group.key, sub.value)}
                      className={`flex cursor-pointer items-center justify-between rounded-md py-1.5 pr-3 pl-6 text-left text-sm text-black/60 hover:bg-hover ${
                        subFilter === sub.value ? 'bg-hover' : ''
                      }`}
                    >
                      <span className='truncate'>{sub.value}</span>
                      <span className='shrink-0 text-xs text-neutral-10'>
                        {formatCompact(sub.count)}
                      </span>
                    </button>
                  ))}
              </div>
            )
          })}
        </nav>
      </aside>

      <div className='flex min-w-0 flex-1 flex-col gap-5'>
        <div className='flex items-center gap-3'>
          <h1 className='text-lg font-bold text-black md:text-2xl'>
            {activeSub?.value ?? activeGroup?.label ?? 'Live now'}
          </h1>
          <LiveBadge />
        </div>
        <p className='-mt-3 text-sm text-neutral-10'>
          In-play markets you can trade right now — short-duration crypto and
          live events.
        </p>

        {/* Chips — the mobile stand-in for the sidebar. */}
        <div className='flex flex-col gap-2 md:hidden'>
          <div className='hide-scroll-bar flex gap-2 overflow-x-auto'>
            {[null, ...groups].map((group) => (
              <button
                key={group?.key ?? 'all'}
                type='button'
                onClick={() => select(group?.key ?? null)}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium ${
                  categoryFilter === (group?.key ?? null)
                    ? 'bg-black text-white'
                    : 'bg-card text-neutral-10'
                }`}
              >
                {group?.label ?? 'All'}
                <span className='text-xs opacity-70'>
                  {group?.count ?? allEvents.length}
                </span>
              </button>
            ))}
          </div>
          {activeGroup && activeGroup.subs.length > 0 && (
            <div className='hide-scroll-bar flex gap-2 overflow-x-auto'>
              {[null, ...activeGroup.subs].map((sub) => (
                <button
                  key={sub?.value ?? 'all'}
                  type='button'
                  onClick={() => select(activeGroup.key, sub?.value ?? null)}
                  className={`shrink-0 cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium ${
                    (sub?.value ?? null) === (activeSub?.value ?? null)
                      ? 'bg-black/80 text-white'
                      : 'bg-card text-neutral-10'
                  }`}
                >
                  {sub?.value ?? `All ${activeGroup.label.toLowerCase()}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {showIntervals && (
          <LiveIntervalFilter
            intervals={LIVE_INTERVALS}
            value={intervalFilter}
            onChange={(interval) => setParams({ interval })}
          />
        )}

        {isError ? (
          <p className='py-16 text-center text-sm text-neutral-10'>
            We couldn’t load live markets right now.
          </p>
        ) : isLoading ? (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <MarketCardSkeleton key={i} />
            ))}
          </div>
        ) : events.length ? (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {events.map((event) => (
              <LiveEventCard
                key={event.id}
                event={event}
                onSelectMarket={goToMarket}
                onSelectOutcome={goToOutcome}
              />
            ))}
          </div>
        ) : (
          <div className='flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-16 text-center'>
            <p className='text-sm text-neutral-10'>
              {showIntervals && intervalFilter != null
                ? `No ${
                    activeSub?.value ?? ''
                  } ${LIVE_INTERVALS.find((i) => i.seconds === intervalFilter)?.label} rounds live right now.`
                    .replace(/\s+/g, ' ')
                    .trim()
                : activeGroup
                  ? `No live ${activeSub?.value ?? activeGroup.label} right now.`
                  : 'Nothing in-play right now.'}{' '}
              Check back soon — new rounds open continuously.
            </p>
            <button
              type='button'
              onClick={() => navigate('/browse')}
              className='rounded-full bg-brand-green px-5 py-2 text-sm font-semibold text-black'
            >
              Browse all markets
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

export default LiveMarkets
