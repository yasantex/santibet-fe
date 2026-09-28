import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import LiveEventCard from '../../components/markets/LiveEventCard'
import {
  LiveBadge,
  LiveCategoryFilter,
  LiveIntervalFilter,
} from '../../components/markets/LiveBits'
import { MarketCardSkeleton } from '../../components/globals/ReusedText'
import {
  eventIntervalSeconds,
  LIVE_INTERVALS,
  useLiveBets,
} from '../../data_layer/markets'
import { marketHref } from '../../utils/marketDisplay'
import type { UiEvent, UiMarket, UiOutcome } from '../../types/market.types'

const LiveMarkets = () => {
  const navigate = useNavigate()
  const { events: allEvents, isLoading, isError } = useLiveBets({ limit: 40 })
  // Category sub-filter (Crypto / Sports …); null = every category.
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  // Round-length filter (seconds); null = everything in-play. Only meaningful
  // for crypto rounds, so it's hidden for non-crypto categories.
  const [intervalFilter, setIntervalFilter] = useState<number | null>(null)

  // Categories actually present in the live feed, with Crypto/Sports first.
  const categories = useMemo<string[]>(() => {
    const present = new Set<string>()
    for (const e of allEvents) if (e.category) present.add(e.category)
    const preferred = ['Crypto', 'Sports']
    return [
      ...preferred.filter((c) => present.has(c)),
      ...[...present].filter((c) => !preferred.includes(c)).sort(),
    ]
  }, [allEvents])

  // Round intervals only apply to the crypto up/down rounds.
  const showIntervalFilter =
    categoryFilter === null || categoryFilter === 'Crypto'

  const events = useMemo<UiEvent[]>(
    () =>
      allEvents.filter((e) => {
        if (categoryFilter && e.category !== categoryFilter) return false
        if (
          showIntervalFilter &&
          intervalFilter != null &&
          eventIntervalSeconds(e) !== intervalFilter
        )
          return false
        return true
      }),
    [allEvents, categoryFilter, intervalFilter, showIntervalFilter],
  )

  const handleCategoryChange = (category: string | null) => {
    setCategoryFilter(category)
    // Interval only applies to crypto — clear it when leaving that lane.
    if (category !== null && category !== 'Crypto') setIntervalFilter(null)
  }

  const goToMarket = (m: UiMarket) => navigate(marketHref(m))
  const goToOutcome = (m: UiMarket, o: UiOutcome) =>
    navigate(marketHref(m, o.id))

  return (
    <main className='mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 pt-10 pb-20 md:px-8'>
      <div className='flex items-center gap-3'>
        <h1 className='text-lg font-bold text-black md:text-2xl'>Live now</h1>
        <LiveBadge />
      </div>
      <p className='-mt-3 text-sm text-neutral-10'>
        In-play markets you can trade right now — short-duration crypto and live
        events.
      </p>

      {categories.length > 1 && (
        <LiveCategoryFilter
          categories={categories}
          value={categoryFilter}
          onChange={handleCategoryChange}
        />
      )}

      {showIntervalFilter && (
        <LiveIntervalFilter
          intervals={LIVE_INTERVALS}
          value={intervalFilter}
          onChange={setIntervalFilter}
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
            {categoryFilter
              ? `No ${categoryFilter} markets live right now.`
              : intervalFilter != null
                ? `No ${LIVE_INTERVALS.find((i) => i.seconds === intervalFilter)?.label} rounds live right now.`
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
    </main>
  )
}

export default LiveMarkets
