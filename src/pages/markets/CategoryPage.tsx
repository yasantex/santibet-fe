import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { FilterIcon, Search01Icon } from '@hugeicons/core-free-icons'
import MarketCard from '../../components/markets/MarketCard'
import { MarketCardSkeleton } from '../../components/globals/ReusedText'
import { Button } from '../../components/globals/Button'
import Dropdown from '../../components/globals/Dropdown'
import SearchInput from '../../components/globals/SearchInput'
import {
  useEventsInfinite,
  marketMatchesQuery,
  normalizeText,
  type EventQueryParams,
} from '../../data_layer/markets'
import { useFavorites } from '../../hooks/useFavorites'
import { marketHref } from '../../utils/marketDisplay'
import { formatCompact } from '../../utils/functions'
import { categoryLabel, categoryTopics, mockSportsTree } from '../../utils/constants'
import type { UiMarket, UiOutcome } from '../../types/market.types'

type SortOption = NonNullable<EventQueryParams['sort']>

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Trending', value: 'trending' },
  { label: 'Newest', value: 'newest' },
  { label: 'Closing soon', value: 'closing_soon' },
]

const matchesTopic = (market: UiMarket, topic: string) => {
  const q = topic.toLowerCase()
  return (
    market.title.toLowerCase().includes(q) ||
    (market.subtitle ?? '').toLowerCase().includes(q)
  )
}

// Sports events carry the sport in `seriesKey` (e.g. "apisports:football") and
// the league/competition in `subtitle` (e.g. "Bundesliga"). These drive the
// data-driven sport → league sub-navigation on the Sports page.
const SPORT_LABELS: Record<string, string> = {
  football: 'Football',
  basketball: 'Basketball',
  baseball: 'Baseball',
  hockey: 'Ice Hockey',
  'american-football': 'American Football',
  'nfl': 'American Football',
  rugby: 'Rugby',
  tennis: 'Tennis',
  cricket: 'Cricket',
  volleyball: 'Volleyball',
  handball: 'Handball',
  mma: 'MMA',
  boxing: 'Boxing',
}

const marketSport = (market: UiMarket): string | null => {
  const key = market.seriesKey ?? ''
  if (!key.startsWith('apisports:')) return null
  const raw = key.slice('apisports:'.length).toLowerCase()
  return (
    SPORT_LABELS[raw] ??
    raw.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

const OTHER = 'Other'
const marketLeague = (market: UiMarket): string =>
  (market.subtitle ?? '').trim() || OTHER

const CategoryPage = () => {
  const { category: routeCategory } = useParams<{ category?: string }>()
  const navigate = useNavigate()
  const active = routeCategory ?? 'All'

  const isSports = active.toLowerCase() === 'sports'

  const [sort, setSort] = useState<SortOption>('trending')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  // Sports sub-navigation: pick a sport type, then a league within it.
  const [activeSport, setActiveSport] = useState<string | null>(null)
  const [activeLeague, setActiveLeague] = useState<string | null>(null)

  // Sub-filters are scoped to whichever category is active — reset them
  // whenever the category itself changes (render-time reset, per
  // react.dev/learn/you-might-not-need-an-effect).
  const [topicResetKey, setTopicResetKey] = useState(active)
  if (topicResetKey !== active) {
    setTopicResetKey(active)
    setActiveTopic(null)
    setActiveSport(null)
    setActiveLeague(null)
  }

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEventsInfinite({
    limit: 100,
    sort,
    // Filter server-side by category slug (lower-case) so a busy category like
    // Sports paginates within itself instead of over the whole catalogue.
    ...(active !== 'All' ? { category: active.toLowerCase() } : {}),
  })
  const { isFavorite, toggle: toggleFavorite } = useFavorites()

  const allMarkets = useMemo<UiMarket[]>(() => {
    const markets = (data?.pages ?? [])
      .flatMap((p) => p.events)
      .flatMap((e) => e.markets)
    const open = markets.filter((m) => m.status !== 'closed' && m.yes)
    const pool = open.length ? open : markets.filter((m) => m.yes)
    return [...pool].sort((a, b) => b.volume - a.volume)
  }, [data])

  const byCategory = useMemo(
    () =>
      active === 'All'
        ? allMarkets
        : allMarkets.filter(
            (m) => m.category.toLowerCase() === active.toLowerCase(),
          ),
    [allMarkets, active],
  )

  const topics = useMemo(
    () => (active === 'All' ? [] : (categoryTopics[active] ?? [])),
    [active],
  )
  const topicCounts = useMemo(() => {
    const map = new Map<string, number>()
    topics.forEach((topic) => {
      const live = byCategory.filter((m) => matchesTopic(m, topic.name)).length
      map.set(
        topic.name,
        topic.mockCount != null ? Math.max(live, topic.mockCount) : live,
      )
    })
    return map
  }, [topics, byCategory])

  // Only show sub-topics that actually match loaded markets — the topic list
  // is a curated superset, so hiding the empties keeps the sidebar honest
  // (e.g. Business shows only the topics with markets, not all six). Topics
  // with a fixed mockCount always show, standing in until real data arrives.
  const visibleTopics = useMemo(
    () =>
      topics.filter(
        (topic) => topic.mockCount != null || (topicCounts.get(topic.name) ?? 0) > 0,
      ),
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
    // Merge in mock leagues/sports the live feed doesn't cover yet (e.g.
    // NFL, MLB) — skipped wherever a real league of the same name already
    // has markets, so mock data never overrides a live count.
    for (const mock of mockSportsTree) {
      if (!sports.has(mock.sport)) sports.set(mock.sport, new Map())
      const leagues = sports.get(mock.sport)!
      for (const league of mock.leagues) {
        if (!leagues.has(league.name)) leagues.set(league.name, league.count)
      }
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
    return activeTopic
      ? byCategory.filter((m) => matchesTopic(m, activeTopic))
      : byCategory
  }, [isSports, byCategory, activeSport, activeLeague, activeTopic])

  const filtered = useMemo(() => {
    const q = normalizeText(searchTerm.trim())
    if (!q) return byTopic
    return byTopic.filter((m) => marketMatchesQuery(m, q))
  }, [byTopic, searchTerm])

  const goToMarket = (m: UiMarket) => navigate(marketHref(m))
  const goToTrade = (m: UiMarket, o: UiOutcome) => navigate(marketHref(m, o.id))

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
                activeTopic === null
                    ? 'bg-hover'
                  : ''
              }`}
            >
              All
              <span className='text-xs text-neutral-10'>
                {formatCompact(byCategory.length)}
              </span>
            </button>
            {visibleTopics.map((topic) => (
              <button
                key={topic.name}
                type='button'
                onClick={() => setActiveTopic(topic.name)}
                className={`flex items-center text-black/60 cursor-pointer hover:bg-hover justify-between rounded-md px-3 py-2 text-left text-sm ${
                  activeTopic === topic.name
                    ? 'bg-hover'
                    : ''
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
                  ? (activeSport ?? categoryLabel(active))
                  : categoryLabel(active)))}
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
                        setSort(opt.value)
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
                      onSelectOutcome={goToTrade}
                      onSave={toggleFavorite}
                      isSaved={isFavorite(market.id)}
                    />
                  ))}
            </div>

            {!isLoading && !filtered.length && (
              <p className='py-12 text-center text-sm text-neutral-10'>
                {searchTerm
                  ? `No markets match "${searchTerm}".`
                  : `No open markets in ${
                      activeLeague ??
                      (isSports
                        ? (activeSport ?? categoryLabel(active))
                        : categoryLabel(active))
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
