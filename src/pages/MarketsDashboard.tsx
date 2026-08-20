import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import FeaturedMarketCard from '../components/markets/FeaturedMarketCard'
import MarketCard from '../components/markets/MarketCard'
import { MarketCardSkeleton } from '../components/globals/ReusedText'
import { HugeiconsIcon } from '@hugeicons/react'
import { FilterIcon } from '@hugeicons/core-free-icons'
import { useEvents } from '../data_layer/markets'
import { marketHref } from '../utils/marketDisplay'
import type { UiMarket, UiOutcome } from '../types/market.types'
import { formatNairaCompact } from '../utils/functions'

const MarketsDashboard = () => {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('All')

  const { data, isLoading, isError, refetch } = useEvents({ limit: 60 })

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

  const featured = allMarkets[0]
  const hotTopics = allMarkets.slice(1, 6)

  const gridMarkets = useMemo(() => {
    const list =
      activeCategory === 'All'
        ? allMarkets
        : allMarkets.filter((m) => m.category === activeCategory)
    return list
  }, [allMarkets, activeCategory])

  const goToMarket = (m: UiMarket) => navigate(marketHref(m))
  const goToTrade = (m: UiMarket, o: UiOutcome) => navigate(marketHref(m, o.id))

  return (
    <main className='mx-auto flex w-full flex-col gap-6 px-3 pt-4 pb-20 md:px-8'>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]'>
        {isLoading || !featured ? (
          <div className='h-85 animate-pulse rounded-lg bg-card' />
        ) : (
          <FeaturedMarketCard
            market={featured}
            onSelect={goToMarket}
            onSelectOutcome={goToTrade}
          />
        )}

        {isLoading ? (
          <div className='h-85 animate-pulse rounded-lg bg-card' />
        ) : (
          <div className='flex flex-col gap-4 rounded-lg bg-card p-4'>
            <h2 className='text-xs font-semibold text-neutral-10 uppercase'>
              Hot Topics
            </h2>
            <div className='flex flex-col divide-y divide-border/40'>
              {hotTopics.map((topic) => (
                <button
                  key={topic.id}
                  type='button'
                  onClick={() => goToMarket(topic)}
                  className='flex items-center justify-between gap-4 py-3 text-left hover:bg-hover cursor-pointer p-2.5'
                >
                  <span className='line-clamp-2 text-sm text-black'>
                    {topic.title}
                  </span>
                  <span className='shrink-0 text-sm font-semibold text-neutral-10'>
                    {formatNairaCompact(topic.volume)}
                  </span>
                </button>
              ))}
              {!hotTopics.length && (
                <p className='py-3 text-sm text-neutral-10'>
                  No markets available yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {categories.length > 1 && (
        <div className='hide-scroll-bar flex items-center gap-2 overflow-x-auto'>
          {categories.map((category) => (
            <button
              key={category}
              type='button'
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeCategory === category
                  ? 'bg-brand-green text-black dark:text-text-black!'
                  : 'bg-card text-neutral-10 hover:text-black'
              }`}
            >
              {category}
            </button>
          ))}
          <button
            type='button'
            aria-label='Filter markets'
            className='shrink-0 rounded-full bg-card p-2 text-neutral-10 hover:text-black'
          >
            <HugeiconsIcon icon={FilterIcon} size={18} />
          </button>
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
