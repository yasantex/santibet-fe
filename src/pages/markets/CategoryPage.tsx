import { useMemo, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { FilterIcon, Search01Icon } from '@hugeicons/core-free-icons'
import MarketCard from '../../components/markets/MarketCard'
import LiveEventCard from '../../components/markets/LiveEventCard'
import {
  LiveBadge,
  LiveIntervalFilter,
} from '../../components/markets/LiveBits'
import { MarketCardSkeleton } from '../../components/globals/ReusedText'
import { Button } from '../../components/globals/Button'
import Dropdown from '../../components/globals/Dropdown'
import SearchInput from '../../components/globals/SearchInput'
import {
  eventIntervalSeconds,
  LIVE_INTERVALS,
  useEventsInfinite,
  useLiveBets,
  useLobbyCategories,
  SEARCH_DEBOUNCE_MS,
  type EventQueryParams,
} from '../../data_layer/markets'
import { useFavorites } from '../../hooks/useFavorites'
import { useComboSlip, isSportsMarket } from '../../hooks/useComboSlip'
import { marketHref, marketSport } from '../../utils/marketDisplay'
import { formatCompact } from '../../utils/functions'
import { categoryTopics, type CategoryTopic } from '../../utils/constants'
import type { UiMarket, UiOutcome } from '../../types/market.types'

type SortOption = NonNullable<EventQueryParams['sort']>

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Trending', value: 'trending' },
  { label: 'Newest', value: 'newest' },
  { label: 'Closing soon', value: 'closing_soon' },
]

const isSortOption = (value: string | null): value is SortOption =>
  SORT_OPTIONS.some((opt) => opt.value === value)

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Whole-word match on any of the topic's keywords (or its name), so "eth"
// doesn't catch "MegaETH" and "base" doesn't catch "database".
const topicPattern = (topic: CategoryTopic) =>
  new RegExp(
    `\\b(${(topic.keywords ?? [topic.name]).map(escapeRegExp).join('|')})\\b`,
    'i',
  )

const matchesTopic = (market: UiMarket, pattern: RegExp) =>
  pattern.test(market.title) ||
  pattern.test(market.subtitle ?? '') ||
  pattern.test(market.eventTitle ?? '')

const OTHER = 'Other'
const marketLeague = (market: UiMarket): string =>
  (market.subtitle ?? '').trim() || OTHER

const CategoryPage = () => {
  const { category: routeCategory } = useParams<{ category?: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const active = routeCategory ?? 'All'

  const isSports = active.toLowerCase() === 'sports'
  const isCrypto = active.toLowerCase() === 'crypto'

  // Nav links (e.g. Header's New / Breaking / Upcoming) deep-link into a sort
  // mode via `?sort=`. Derive it from the URL on every render (not just the
  // first) so switching between those links while already on /browse works.
  const sortParam = searchParams.get('sort')
  const sort: SortOption = isSortOption(sortParam) ? sortParam : 'trending'
  const changeSort = (value: SortOption) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('sort', value)
        return next
      },
      { replace: true },
    )
  }
  // Admin-created subcategories (API `parentSlug`) — picked via `?sub=` so
  // the header's More menu can deep-link straight into one.
  const activeSlug = active.toLowerCase()
  const { data: apiCategories } = useLobbyCategories()
  const subcategories = useMemo(
    () =>
      (apiCategories ?? []).filter(
        (c) => c.parentSlug?.toLowerCase() === activeSlug && c.eventCount > 0,
      ),
    [apiCategories, activeSlug],
  )
  const subParam = searchParams.get('sub')?.toLowerCase() ?? null
  const activeSub =
    subcategories.find((c) => c.slug.toLowerCase() === subParam) ?? null
  const changeSub = (slug: string | null) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (slug) next.set('sub', slug)
        else next.delete('sub')
        return next
      },
      { replace: true },
    )
  // Admin-given name from the API, falling back to the raw slug.
  const categoryName =
    (apiCategories ?? []).find((c) => c.slug.toLowerCase() === activeSlug)
      ?.name ?? active
  const activeLabel = activeSub?.name ?? categoryName

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  // Sports sub-navigation: pick a sport type, then a league within it.
  const [activeSport, setActiveSport] = useState<string | null>(null)
  const [activeLeague, setActiveLeague] = useState<string | null>(null)
  // Crypto: round-length filter for the live section (seconds; null = all).
  const [liveInterval, setLiveInterval] = useState<number | null>(null)

  // Sub-filters are scoped to whichever category is active — reset them
  // whenever the category itself changes (render-time reset, per
  // react.dev/learn/you-might-not-need-an-effect).
  const [topicResetKey, setTopicResetKey] = useState(active)
  if (topicResetKey !== active) {
    setTopicResetKey(active)
    setActiveTopic(null)
    setActiveSport(null)
    setActiveLeague(null)
    setLiveInterval(null)
  }

  // Searched server-side via /lobby/events?q=, within the active category.
  const [searchQuery] = useDebounce(searchTerm.trim(), SEARCH_DEBOUNCE_MS)

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEventsInfinite(
    {
      limit: 100,
      sort,
      q: searchQuery || undefined,
      // Filter server-side by category slug (lower-case) so a busy category like
      // Sports paginates within itself instead of over the whole catalogue.
      ...(active !== 'All'
        ? { category: activeSub ? activeSub.slug.toLowerCase() : activeSlug }
        : {}),
    },
    { keepPrevious: !!searchQuery },
  )
  const { isFavorite, toggle: toggleFavorite } = useFavorites()

  // Crypto's live bets (rolling "Up or Down" rounds + anything in-play) get
  // their own section, so they're left out of the regular grid below.
  const { events: liveCrypto, isLoading: isLiveLoading } = useLiveBets({
    category: 'crypto',
    limit: 100,
    enabled: isCrypto,
  })
  const liveCryptoIds = useMemo(
    () => new Set(isCrypto ? liveCrypto.map((e) => e.id) : []),
    [isCrypto, liveCrypto],
  )
  const liveMarkets = useMemo(
    () => (isCrypto ? liveCrypto.flatMap((e) => e.markets) : []),
    [isCrypto, liveCrypto],
  )

  const allMarkets = useMemo<UiMarket[]>(() => {
    const markets = (data?.pages ?? [])
      .flatMap((p) => p.events)
      .flatMap((e) => e.markets)
      .filter((m) => !liveCryptoIds.has(m.eventId))
    const open = markets.filter((m) => m.status !== 'closed' && m.yes)
    const pool = open.length ? open : markets.filter((m) => m.yes)
    return [...pool].sort((a, b) => b.volume - a.volume)
  }, [data, liveCryptoIds])

  // Match on slug (falls back to the name for the raw feed) so admin-created
  // categories whose name differs from their slug ("Real Estate" vs
  // "real-estate") still match. A parent also keeps its subcategories' markets.
  const byCategory = useMemo(() => {
    if (active === 'All') return allMarkets
    const allowed = new Set(
      activeSub
        ? [activeSub.slug.toLowerCase()]
        : [activeSlug, ...subcategories.map((c) => c.slug.toLowerCase())],
    )
    return allMarkets.filter(
      (m) =>
        allowed.has(m.categorySlug ?? '') ||
        allowed.has(m.category.toLowerCase()),
    )
  }, [allMarkets, active, activeSlug, activeSub, subcategories])

  const topics = useMemo(
    () =>
      active === 'All'
        ? []
        : (Object.entries(categoryTopics).find(
            ([key]) => key.toLowerCase() === activeSlug,
          )?.[1] ?? []),
    [active, activeSlug],
  )
  const topicPatterns = useMemo(
    () => new Map(topics.map((t) => [t.name, topicPattern(t)])),
    [topics],
  )
  const activePattern = activeTopic ? topicPatterns.get(activeTopic) : undefined

  // Counts include Crypto's live rounds, which sit in their own section.
  const topicCounts = useMemo(() => {
    const map = new Map<string, number>()
    topics.forEach((topic) => {
      const pattern = topicPatterns.get(topic.name)!
      map.set(
        topic.name,
        [...byCategory, ...liveMarkets].filter((m) => matchesTopic(m, pattern))
          .length,
      )
    })
    return map
  }, [topics, topicPatterns, byCategory, liveMarkets])

  const liveFiltered = useMemo(
    () =>
      liveCrypto.filter(
        (e) =>
          (liveInterval == null || eventIntervalSeconds(e) === liveInterval) &&
          (!activePattern ||
            e.markets.some((m) => matchesTopic(m, activePattern))),
      ),
    [liveCrypto, liveInterval, activePattern],
  )
  const liveInTopic = useMemo(
    () =>
      activePattern
        ? liveCrypto.filter((e) =>
            e.markets.some((m) => matchesTopic(m, activePattern)),
          )
        : liveCrypto,
    [liveCrypto, activePattern],
  )
  const showLive =
    isCrypto &&
    !searchTerm &&
    (isLiveLoading || !activeTopic || liveInTopic.length > 0)

  // Only show sub-topics that actually match loaded markets — the topic list
  // is a curated superset, so hiding the empties keeps the sidebar honest
  // (e.g. Business shows only the topics with markets, not all six).
  const visibleTopics = useMemo(
    () => topics.filter((topic) => (topicCounts.get(topic.name) ?? 0) > 0),
    [topics, topicCounts],
  )

  // Sports: group loaded markets into sport → league with live counts.
  const sportsGroups = useMemo(() => {
    if (!isSports) return []
    const sports = new Map<string, Map<string, number>>()
    for (const m of byCategory) {
      const sport = marketSport(m) ?? OTHER
      const league = marketLeague(m)
      if (!sports.has(sport)) sports.set(sport, new Map())
      const leagues = sports.get(sport)!
      leagues.set(league, (leagues.get(league) ?? 0) + 1)
    }
    return [...sports.entries()]
      .map(([sport, leagues]) => ({
        sport,
        count: [...leagues.values()].reduce((a, b) => a + b, 0),
        leagues: [...leagues.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.count - a.count)
  }, [isSports, byCategory])

  const byTopic = useMemo(() => {
    if (isSports) {
      return byCategory.filter((m) => {
        if (activeSport && (marketSport(m) ?? OTHER) !== activeSport)
          return false
        if (activeLeague && marketLeague(m) !== activeLeague) return false
        return true
      })
    }
    return activePattern
      ? byCategory.filter((m) => matchesTopic(m, activePattern))
      : byCategory
  }, [isSports, byCategory, activeSport, activeLeague, activePattern])

  // The search itself runs server-side (see `q` above).
  const filtered = byTopic

  const goToMarket = (m: UiMarket) => navigate(marketHref(m))
  const goToTrade = (m: UiMarket, o: UiOutcome) => navigate(marketHref(m, o.id))
  // On sports surfaces, tapping an outcome adds it to the combo slip (parlay);
  // elsewhere it opens the market to trade singly.
  const combo = useComboSlip()
  const handleOutcome = (m: UiMarket, o: UiOutcome) => {
    if (isSportsMarket(m)) combo.toggle(m, o)
    else goToTrade(m, o)
  }

  return (
    <main className='mx-auto flex w-full max-w-8xl flex-col gap-5 px-5 pt-10 pb-20 md:flex-row md:px-8'>
      {/* Sports sub-navigation — pick a sport type, then a league within it.
          Data-driven from the loaded feed (seriesKey → sport, subtitle →
          league) rather than a curated topic list. */}
      {isSports && sportsGroups.length > 0 && (
        <aside className='hidden w-52 shrink-0 md:block'>
          <nav className='flex flex-col gap-0.5'>
            <button
              type='button'
              onClick={() => {
                setActiveSport(null)
                setActiveLeague(null)
              }}
              className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-black/60 hover:bg-hover ${
                !activeSport && !activeLeague ? 'bg-hover' : ''
              }`}
            >
              All sports
              <span className='text-xs text-neutral-10'>
                {formatCompact(byCategory.length)}
              </span>
            </button>
            {sportsGroups.map((group) => {
              const expanded =
                activeSport === group.sport || sportsGroups.length === 1
              return (
                <div key={group.sport} className='flex flex-col gap-0.5'>
                  <button
                    type='button'
                    onClick={() => {
                      setActiveSport(group.sport)
                      setActiveLeague(null)
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold text-black/70 hover:bg-hover ${
                      activeSport === group.sport && !activeLeague
                        ? 'bg-hover'
                        : ''
                    }`}
                  >
                    {group.sport}
                    <span className='text-xs font-normal text-neutral-10'>
                      {formatCompact(group.count)}
                    </span>
                  </button>
                  {expanded &&
                    group.leagues.map((league) => (
                      <button
                        key={league.name}
                        type='button'
                        onClick={() => {
                          setActiveSport(group.sport)
                          setActiveLeague(league.name)
                        }}
                        className={`flex cursor-pointer items-center justify-between rounded-md py-1.5 pr-3 pl-6 text-left text-sm text-black/60 hover:bg-hover ${
                          activeLeague === league.name &&
                          activeSport === group.sport
                            ? 'bg-hover'
                            : ''
                        }`}
                      >
                        <span className='truncate'>{league.name}</span>
                        <span className='shrink-0 text-xs text-neutral-10'>
                          {formatCompact(league.count)}
                        </span>
                      </button>
                    ))}
                </div>
              )
            })}
          </nav>
        </aside>
      )}

      {/* Topic sidebar — the markets *within* the active category (e.g. Trump,
          Midterms under Politics). Hidden on mobile and on the "All" view,
          since topics only make sense scoped to one category. */}
      {!isSports && active !== 'All' && visibleTopics.length > 0 && (
        <aside className='hidden w-46 shrink-0 md:block'>
          <nav className='flex flex-col gap-0.5'>
            <button
              type='button'
              onClick={() => setActiveTopic(null)}
              className={`flex items-center justify-between text-black/60 hover:bg-hover cursor-pointer rounded-md px-3 py-2 text-left text-sm ${
                activeTopic === null ? 'bg-hover' : ''
              }`}
            >
              All
              <span className='text-xs text-neutral-10'>
                {formatCompact(byCategory.length + liveMarkets.length)}
              </span>
            </button>
            {visibleTopics.map((topic) => (
              <button
                key={topic.name}
                type='button'
                onClick={() => setActiveTopic(topic.name)}
                className={`flex items-center text-black/60 cursor-pointer hover:bg-hover justify-between rounded-md px-3 py-2 text-left text-sm ${
                  activeTopic === topic.name ? 'bg-hover' : ''
                }`}
              >
                {topic.name}
                <span className='text-xs text-neutral-10'>
                  {formatCompact(topicCounts.get(topic.name) ?? 0)}
                </span>
              </button>
            ))}
          </nav>
        </aside>
      )}

      <div className='flex min-w-0 flex-1 flex-col gap-5'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='text-lg font-bold text-black md:text-2xl'>
            {active === 'All'
              ? 'Browse markets'
              : (activeLeague ??
                (isSports
                  ? (activeSport ?? activeLabel)
                  : activeLabel))}
          </h1>

          <div className='flex shrink-0 items-center gap-2'>
            {searchOpen ? (
              <SearchInput
                searchTerm={searchTerm}
                handleChange={(e) => setSearchTerm(e.target.value)}
                placeholder='Search markets'
                autoFocus
                containerClassName='max-w-150!'
              />
            ) : (
              <button
                type='button'
                aria-label={searchOpen ? 'Close search' : 'Search markets'}
                onClick={() => {
                  setSearchOpen((v) => !v)
                  if (searchOpen) setSearchTerm('')
                }}
                className={`rounded-full p-2 hover:text-black bg-card text-neutral-10`}
              >
                <HugeiconsIcon icon={Search01Icon} size={18} />
              </button>
            )}

            <Dropdown
              align='end'
              menuClassName='w-44 rounded-lg py-1'
              menu={({ close }) => (
                <div className='flex flex-col'>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type='button'
                      onClick={() => {
                        changeSort(opt.value)
                        close()
                      }}
                      className={`px-3 py-2 text-left text-sm hover:bg-hover ${
                        sort === opt.value
                          ? 'font-semibold text-black'
                          : 'text-neutral-10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            >
              <div className='rounded-full bg-card p-2 text-neutral-10 hover:text-black'>
                <HugeiconsIcon icon={FilterIcon} size={18} />
              </div>
            </Dropdown>
          </div>
        </div>

        {/* Admin-created subcategories — on every screen size, since the
            set changes at runtime and isn't part of the curated sidebar. */}
        {active !== 'All' && subcategories.length > 0 && (
          <div className='hide-scroll-bar -mt-2 flex gap-2 overflow-x-auto'>
            {[null, ...subcategories].map((sub) => (
              <button
                key={sub?.slug ?? 'all'}
                type='button'
                onClick={() => changeSub(sub ? sub.slug.toLowerCase() : null)}
                className={`shrink-0 cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium ${
                  (activeSub?.slug ?? null) === (sub?.slug ?? null)
                    ? 'bg-black text-white'
                    : 'bg-card text-neutral-10'
                }`}
              >
                {sub ? sub.name : `All ${categoryName}`}
              </button>
            ))}
          </div>
        )}

        {/* Sub-topic chips — the mobile stand-in for the topic sidebar. */}
        {!isSports && active !== 'All' && visibleTopics.length > 0 && (
          <div className='hide-scroll-bar -mt-2 flex gap-2 overflow-x-auto md:hidden'>
            {[null, ...visibleTopics.map((t) => t.name)].map((name) => (
              <button
                key={name ?? 'all'}
                type='button'
                onClick={() => setActiveTopic(name)}
                className={`shrink-0 cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium ${
                  activeTopic === name
                    ? 'bg-black text-white'
                    : 'bg-card text-neutral-10'
                }`}
              >
                {name ?? 'All'}
              </button>
            ))}
          </div>
        )}

        {/* Sports chips — the mobile stand-in for the sport → league sidebar:
            a row of sports, then the picked sport's leagues beneath it. */}
        {isSports && sportsGroups.length > 0 && (
          <div className='-mt-2 flex flex-col gap-2 md:hidden'>
            <div className='hide-scroll-bar flex gap-2 overflow-x-auto'>
              {[null, ...sportsGroups.map((g) => g.sport)].map((sport) => (
                <button
                  key={sport ?? 'all'}
                  type='button'
                  onClick={() => {
                    setActiveSport(sport)
                    setActiveLeague(null)
                  }}
                  className={`shrink-0 cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium ${
                    activeSport === sport
                      ? 'bg-black text-white'
                      : 'bg-card text-neutral-10'
                  }`}
                >
                  {sport ?? 'All sports'}
                </button>
              ))}
            </div>
            {activeSport && (
              <div className='hide-scroll-bar flex gap-2 overflow-x-auto'>
                {[
                  null,
                  ...(sportsGroups
                    .find((g) => g.sport === activeSport)
                    ?.leagues.map((l) => l.name) ?? []),
                ].map((league) => (
                  <button
                    key={league ?? 'all'}
                    type='button'
                    onClick={() => setActiveLeague(league)}
                    className={`shrink-0 cursor-pointer rounded-full px-3 py-1 text-xs font-medium ${
                      activeLeague === league
                        ? 'bg-black text-white'
                        : 'bg-card text-neutral-10'
                    }`}
                  >
                    {league ?? `All ${activeSport}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live rounds, narrowed by the active sub-topic; hidden when the
            topic has none (e.g. Stablecoins). */}
        {showLive && (
          <section className='flex flex-col gap-3'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <h2 className='text-sm font-semibold text-black uppercase'>
                  Live bets
                </h2>
                <LiveBadge />
              </div>
              <LiveIntervalFilter
                intervals={LIVE_INTERVALS}
                value={liveInterval}
                onChange={setLiveInterval}
              />
            </div>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {isLiveLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <MarketCardSkeleton key={i} />
                  ))
                : liveFiltered.map((event) => (
                    <LiveEventCard
                      key={event.id}
                      event={event}
                      onSelectMarket={goToMarket}
                      onSelectOutcome={goToTrade}
                    />
                  ))}
            </div>
            {!isLiveLoading && !liveFiltered.length && (
              <p className='py-6 text-center text-sm text-neutral-10'>
                No live crypto bets for this timeframe right now.
              </p>
            )}
          </section>
        )}

        {isError ? (
          <p className='py-16 text-center text-sm text-neutral-10'>
            We couldn’t load markets right now.
          </p>
        ) : (
          <>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {isLoading
                ? Array.from({ length: 9 }).map((_, i) => (
                    <MarketCardSkeleton key={i} />
                  ))
                : filtered.map((market) => (
                    <MarketCard
                      key={market.id}
                      market={market}
                      onSelect={goToMarket}
                      onSelectOutcome={handleOutcome}
                      onSave={toggleFavorite}
                      isSaved={isFavorite(market.id)}
                      activeOutcomeId={combo.selectedOutcomeIdForMarket(
                        market.id,
                      )}
                    />
                  ))}
            </div>

            {!isLoading &&
              !filtered.length &&
              !(showLive && liveInTopic.length) && (
                <p className='py-12 text-center text-sm text-neutral-10'>
                  {searchTerm
                    ? `No markets match "${searchTerm}".`
                    : `No open markets in ${
                        activeLeague ??
                        (isSports
                          ? (activeSport ?? activeLabel)
                          : activeLabel)
                      }${
                        !isSports && activeTopic ? ` / ${activeTopic}` : ''
                      }. Try loading more or another category.`}
                </p>
              )}

            {hasNextPage && (
              <div className='flex justify-center pt-2'>
                <Button
                  type='button'
                  text={isFetchingNextPage ? 'Loading…' : 'Load more'}
                  variation='plain'
                  size='medium'
                  className='w-fit!'
                  loading={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default CategoryPage
