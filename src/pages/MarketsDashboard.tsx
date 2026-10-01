import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Link } from 'react-router'
import FeaturedCarousel from '../components/markets/FeaturedCarousel'
import MarketCard from '../components/markets/MarketCard'
import LiveEventCard from '../components/markets/LiveEventCard'
import { LiveBadge } from '../components/markets/LiveBits'
import { MarketCardSkeleton } from '../components/globals/ReusedText'
import FilterComponent, {
  type FilterCategory,
} from '../components/globals/FilterComponent'
import { useEvents, useLiveBets, useLobbyHome } from '../data_layer/markets'
import { useFavorites } from '../hooks/useFavorites'
import { marketHref } from '../utils/marketDisplay'
import type { UiEvent, UiMarket, UiOutcome } from '../types/market.types'
import { formatNairaCompact } from '../utils/functions'
import { pickHotTopics } from '../utils/topicRelevance'

type MarketFilters = Record<'status' | 'sort', string[]>

const FEATURED_COUNT = 5
const HOT_PICKS_COUNT = 5

// Rolling "<Coin> <interval> — Up or Down" series that always get a hero slide.
// pickHotTopics skips short-interval series, so they're picked separately.
const FEATURED_CRYPTO = ['Bitcoin', 'Ethereum', 'Litecoin']

const marketFilterCategories: FilterCategory[] = [
  {
    key: 'status',
    label: 'Status',
    multiple: false,
    options: [
      { label: 'Open', value: 'open' },
      { label: 'Closed', value: 'closed' },
      { label: 'Settled', value: 'settled' },
    ],
  },
  {
    key: 'sort',
    label: 'Sort by',
    multiple: false,
    options: [
      { label: 'Most volume', value: 'volume' },
      { label: 'Closing soon', value: 'closing_soon' },
    ],
  },
]

const MarketsDashboard = () => {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('All')
  const [filters, setFilters] = useState<MarketFilters>({
    status: [],
    sort: [],
  })

  const { isFavorite, toggle: toggleFavorite } = useFavorites()

  const { data, isLoading, isError, refetch } = useEvents({ limit: 60 })
  const { data: home, isLoading: isHomeLoading } = useLobbyHome()
  // Every admin-featured event, not just the few /lobby/home returns.
  const { data: featuredData } = useEvents({ featured: true, limit: 50 })
  // In-play sports + rolling crypto rounds — the same set as the /live page.
  const { events: allLiveEvents } = useLiveBets({ limit: 12 })
  const liveEvents = useMemo<UiEvent[]>(
    () => allLiveEvents.slice(0, 12),
    [allLiveEvents],
  )
  const liveEventIds = useMemo(
    () => new Set(allLiveEvents.map((e) => e.id)),
    [allLiveEvents],
  )

  const closingSoon = useMemo<UiMarket[]>(() => {
    // "Closing soon" is about the deadline, not in-play — anything live
    // belongs in the Live rail above, so leave it out here.
    return (home?.closingSoon ?? [])
      .filter((e) => !e.live && !liveEventIds.has(e.id))
      .flatMap((e) => e.markets)
      .filter((m) => m.yes && m.status !== 'closed' && !m.live)
      .sort(
        (a, b) =>
          new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime(),
      )
      .slice(0, 8)
  }, [home, liveEventIds])

  const allMarkets = useMemo<UiMarket[]>(() => {
    const markets = (data?.events ?? []).flatMap((e) => e.markets)
    // Prefer tradeable markets, richest volume first.
    const open = markets.filter((m) => m.status !== 'closed' && m.yes)
    const pool = open.length ? open : markets.filter((m) => m.yes)
    return [...pool].sort((a, b) => b.volume - a.volume)
  }, [data])

  const categories = useMemo(() => {
    const set = new Set<string>()
    ;(data?.events ?? []).forEach((e) => e.category && set.add(e.category))
    return ['All', ...Array.from(set)]
  }, [data])

  // Hero carousel: every admin-featured event first, then the most
  // audience-relevant events that actually trade (so each slide has a real
  // chart).
  const featuredEvents = useMemo<UiEvent[]>(() => {
    const tradeable = (e: UiEvent) =>
      e.markets.some((m) => m.yes && m.status === 'open')
    // Featured is an operator decision, so keep paused markets too — only
    // drop events with nothing left to trade or chart.
    const showable = (e: UiEvent) =>
      e.markets.some(
        (m) => m.yes && m.status !== 'closed' && m.status !== 'settled',
      )
    const contested = (e?: UiEvent) =>
      !!e?.markets.some(
        (m) => (m.yes?.price ?? 0) >= 0.02 && (m.yes?.price ?? 0) <= 0.98,
      )
    const picked = new Map<string, UiEvent>()
    const events = data?.events ?? []
    // The flag check guards the raw fallback feed, which ignores ?featured.
    for (const e of [
      ...(home?.featured ?? []),
      ...(featuredData?.events ?? []).filter((e) => e.featured),
      ...events.filter((e) => e.featured),
    ]) {
      if (!picked.has(e.id) && showable(e)) picked.set(e.id, e)
    }
    // One slide per coin: its longest open interval, so the slide doesn't
    // settle out from under the viewer mid-rotation.
    for (const coin of FEATURED_CRYPTO) {
      const series = events
        .filter(
          (e) =>
            e.title.startsWith(`${coin} `) &&
            tradeable(e) &&
            e.markets.some((m) => m.durationSeconds),
        )
        .sort(
          (a, b) =>
            Math.max(...b.markets.map((m) => m.durationSeconds ?? 0)) -
            Math.max(...a.markets.map((m) => m.durationSeconds ?? 0)),
        )[0]
      if (series && !picked.has(series.id)) picked.set(series.id, series)
    }
    const featuredLimit = picked.size + FEATURED_COUNT
    const eventOf = new Map(
      events.flatMap((e) => e.markets.map((m) => [m.id, e] as const)),
    )
    const ranked = pickHotTopics(
      events.flatMap((e) => e.markets),
      FEATURED_COUNT * 3,
    )
      // A hero slide needs a live question: real trading and an outcome that
      // isn't already a near-certainty either way.
      .filter((m) => m.volume > 0 && contested(eventOf.get(m.id)))
    for (const m of ranked) {
      if (picked.size >= featuredLimit) break
      const e = eventOf.get(m.id)
      if (e && !picked.has(e.id)) picked.set(e.id, e)
    }
    return Array.from(picked.values())
  }, [home, featuredData, data])

  // Operator-curated in admin (Events → Hot pick), served by /lobby/home in
  // the order the API returns them.
  const hotPicks = useMemo(
    () =>
      (home?.hotPicks ?? [])
        .filter((e) => e.markets.length > 0)
        .slice(0, HOT_PICKS_COUNT)
        .map((e) => ({
          event: e,
          volume: e.markets.reduce((sum, m) => sum + m.volume, 0),
        })),
    [home],
  )

  const gridMarkets = useMemo(() => {
    let list =
      activeCategory === 'All'
        ? allMarkets
        : allMarkets.filter((m) => m.category === activeCategory)

    const status = filters.status[0]
    if (status) {
      list = list.filter((m) => m.status === status)
    }

    const sort = filters.sort[0]
    if (sort === 'closing_soon') {
      list = [...list].sort(
        (a, b) =>
          new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime(),
      )
    } else if (sort === 'volume') {
      list = [...list].sort((a, b) => b.volume - a.volume)
    }

    return list
  }, [allMarkets, activeCategory, filters])

  const goToMarket = (m: UiMarket) => navigate(marketHref(m))
  const goToTrade = (m: UiMarket, o: UiOutcome) => navigate(marketHref(m, o.id))
  // A single-market event goes straight to its market; otherwise the event page.
  const goToEvent = (e: UiEvent) =>
    e.markets.length === 1
      ? goToMarket(e.markets[0])
      : navigate(`/events/${e.id}`)

  return (
    <main className='mx-auto flex w-full flex-col gap-6 px-3 pt-4 pb-20 md:px-8'>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]'>
        {!featuredEvents.length ? (
          <div className='h-85 animate-pulse rounded-lg bg-card' />
        ) : (
          <FeaturedCarousel
            events={featuredEvents}
            isSaved={isFavorite}
            onSave={toggleFavorite}
            onSelect={goToMarket}
            onSelectEvent={(e) => navigate(`/events/${e.id}`)}
            onSelectOutcome={goToTrade}
          />
        )}

        {isHomeLoading ? (
          <div className='h-85 animate-pulse rounded-lg bg-card' />
        ) : (
          <div className='flex flex-col gap-4 rounded-lg bg-card p-4'>
            <h2 className='text-xs font-semibold text-neutral-10 uppercase'>
              Hot Picks
            </h2>
            <div className='flex flex-col divide-y divide-border/40'>
              {hotPicks.map(({ event, volume }) => (
                <button
                  key={event.id}
                  type='button'
                  onClick={() => goToEvent(event)}
                  className='flex items-center justify-between gap-4 py-3 text-left hover:bg-hover cursor-pointer p-2.5'
                >
                  <span className='line-clamp-2 text-sm text-black'>
                    {event.title}
                  </span>
                  <span className='shrink-0 text-sm font-semibold text-neutral-10'>
                    {volume > 0 ? formatNairaCompact(volume) : 'New'}
                  </span>
                </button>
              ))}
              {!hotPicks.length && (
                <p className='py-3 text-sm text-neutral-10'>
                  No hot picks right now.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {liveEvents.length > 0 && (
        <section className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <LiveBadge />
              <h2 className='text-sm font-semibold text-black uppercase'>
                Live now
              </h2>
            </div>
            <Link
              to='/live'
              className='text-xs font-semibold text-neutral-10 hover:text-black'
            >
              See all
            </Link>
          </div>
          <div className='hide-scroll-bar flex gap-4 overflow-x-auto pb-1'>
            {liveEvents.map((event) => (
              <div key={event.id} className='w-[280px] shrink-0'>
                <LiveEventCard
                  event={event}
                  onSelectMarket={goToMarket}
                  onSelectOutcome={goToTrade}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {closingSoon.length > 0 && (
        <section className='flex flex-col gap-3'>
          <h2 className='text-sm font-semibold text-black uppercase'>
            Closing soon
          </h2>
          <div className='hide-scroll-bar flex gap-4 overflow-x-auto pb-1'>
            {closingSoon.map((market) => (
              <div key={market.id} className='w-[260px] shrink-0'>
                <MarketCard
                  market={market}
                  countdown
                  onSelect={goToMarket}
                  onSelectOutcome={goToTrade}
                  onSave={toggleFavorite}
                  isSaved={isFavorite(market.id)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {categories.length > 1 && (
        <div className='flex items-center gap-2'>
          <div className='hide-scroll-bar flex items-center gap-2 overflow-x-auto'>
            {categories.map((category) => (
              <button
                key={category}
                type='button'
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-full cursor-pointer px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeCategory === category
                    ? 'bg-brand-green text-black dark:text-text-black!'
                    : 'bg-card text-black hover:text-black/60'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className='shrink-0'>
            <FilterComponent
              categories={marketFilterCategories}
              initialFilters={filters}
              onApply={(next) =>
                setFilters({ status: next.status ?? [], sort: next.sort ?? [] })
              }
              onReset={() => setFilters({ status: [], sort: [] })}
            />
          </div>
        </div>
      )}

      {isError ? (
        <div className='flex flex-col items-center gap-3 rounded-lg bg-card py-16 text-center'>
          <p className='text-sm text-neutral-10'>
            We couldn’t load markets right now.
          </p>
          <button
            type='button'
            onClick={() => refetch()}
            className='rounded-full bg-brand-green px-5 py-2 text-sm font-semibold text-black'
          >
            Try again
          </button>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <MarketCardSkeleton key={i} />
              ))
            : gridMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  onSelect={goToMarket}
                  onSelectOutcome={goToTrade}
                  onSave={toggleFavorite}
                  isSaved={isFavorite(market.id)}
                />
              ))}
          {!isLoading && !gridMarkets.length && (
            <p className='col-span-full py-16 text-center text-sm text-neutral-10'>
              No markets in this category yet.
            </p>
          )}
        </div>
      )}
    </main>
  )
}

export default MarketsDashboard
