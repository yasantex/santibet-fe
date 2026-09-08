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
  type EventQueryParams,
} from '../../data_layer/markets'
import { useFavorites } from '../../hooks/useFavorites'
import { marketHref } from '../../utils/marketDisplay'
import { categoryTopics } from '../../utils/constants'
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

const CategoryPage = () => {
  const { category: routeCategory } = useParams<{ category?: string }>()
  const navigate = useNavigate()
  const active = routeCategory ?? 'All'

  const [sort, setSort] = useState<SortOption>('trending')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTopic, setActiveTopic] = useState<string | null>(null)

  // Topics are scoped to whichever category is active — reset the topic
  // filter whenever the category itself changes (render-time reset, per
  // react.dev/learn/you-might-not-need-an-effect).
  const [topicResetKey, setTopicResetKey] = useState(active)
  if (topicResetKey !== active) {
    setTopicResetKey(active)
    setActiveTopic(null)
  }

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEventsInfinite({ limit: 100, sort })
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
    topics.forEach((topic) =>
      map.set(topic, byCategory.filter((m) => matchesTopic(m, topic)).length),
    )
    return map
  }, [topics, byCategory])

  // Only show sub-topics that actually match loaded markets — the topic list
  // is a curated superset, so hiding the empties keeps the sidebar honest
  // (e.g. Business shows only the topics with markets, not all six).
  const visibleTopics = useMemo(
    () => topics.filter((topic) => (topicCounts.get(topic) ?? 0) > 0),
    [topics, topicCounts],
  )

  const byTopic = useMemo(
    () =>
      activeTopic
        ? byCategory.filter((m) => matchesTopic(m, activeTopic))
        : byCategory,
    [byCategory, activeTopic],
  )

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return byTopic
    return byTopic.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.subtitle?.toLowerCase().includes(q),
    )
  }, [byTopic, searchTerm])

  const goToMarket = (m: UiMarket) => navigate(marketHref(m))
  const goToTrade = (m: UiMarket, o: UiOutcome) => navigate(marketHref(m, o.id))

  return (
    <main className='mx-auto flex w-full max-w-8xl flex-col gap-5 px-5 pt-10 pb-20 md:flex-row md:px-8'>
      {/* Topic sidebar — the markets *within* the active category (e.g. Trump,
          Midterms under Politics). Hidden on mobile and on the "All" view,
          since topics only make sense scoped to one category. */}
      {active !== 'All' && visibleTopics.length > 0 && (
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
                {byCategory.length}
              </span>
            </button>
            {visibleTopics.map((topic) => (
              <button
                key={topic}
                type='button'
                onClick={() => setActiveTopic(topic)}
                className={`flex items-center text-black/60 cursor-pointer hover:bg-hover justify-between rounded-md px-3 py-2 text-left text-sm ${
                  activeTopic === topic
                    ? 'bg-hover'
                    : ''
                }`}
              >
                {topic}
                <span className='text-xs text-neutral-10'>
                  {topicCounts.get(topic)}
                </span>
              </button>
            ))}
          </nav>
        </aside>
      )}

      <div className='flex min-w-0 flex-1 flex-col gap-5'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='text-lg font-bold text-black md:text-2xl'>
            {active === 'All' ? 'Browse markets' : active}
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
                  : `No open markets in ${active}${
                      activeTopic ? ` / ${activeTopic}` : ''
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
