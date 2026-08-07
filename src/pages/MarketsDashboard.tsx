import { useState } from 'react'
import FeaturedMarketCard from '../components/markets/FeaturedMarketCard'
import { useMockDashboardData } from '../mockData/marketsMockData'
import { MarketCardSkeleton } from '../components/globals/ReusedText'
import { HugeiconsIcon } from '@hugeicons/react'
import { FilterIcon } from '@hugeicons/core-free-icons'

const categories = [
  'All',
  'Politics',
  'Sports',
  'Crypto',
  'Entertainment',
  'Tech',
] as const

const MarketsDashboard = () => {
  const [activeCategory, setActiveCategory] = useState<
    'All' | 'Politics' | 'Sports' | 'Crypto' | 'Entertainment' | 'Tech'
  >('All')

  const { data, isLoading } = useMockDashboardData(activeCategory)

  return (
    <main className='mx-auto flex w-full flex-col gap-6 px-3 pt-4 pb-20 md:px-8'>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]'>
        {isLoading || !data ? (
          <div className='h-85 animate-pulse rounded-lg bg-card' />
        ) : (
          <FeaturedMarketCard market={data.featured} />
        )}

        {isLoading || !data ? (
          <div className='h-85 animate-pulse rounded-lg bg-card' />
        ) : (
          <div className='flex flex-col gap-4 rounded-lg bg-card p-4'>
            <h2 className='text-xs font-semibold uppercase text-neutral-10'>
              Hot Topics
            </h2>
            <div className='flex flex-col divide-y divide-border/40'>
              {data?.hotTopics?.map((topic) => (
                <button
                  key={topic.id}
                  type='button'
                  className='flex items-center justify-between gap-4 py-3 text-left hover:opacity-80'
                >
                  <span className='text-sm text-black'>{topic.question}</span>
                  <span className='shrink-0 text-sm font-semibold text-neutral-10'>
                    {topic.percent}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className='flex items-center gap-2 overflow-x-auto hide-scroll-bar'>
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
          className='shrink-0 rounded-full bg-card p-2 text-neutral-10 hover:text-black'
        >
          <HugeiconsIcon icon={FilterIcon} size={18} />
        </button>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {isLoading || !data
          ? Array.from({ length: 8 }).map((_, i) => (
              <MarketCardSkeleton key={i} />
            ))
          : data.markets.map((market) => (
              <div
                key={market.id}
                className='flex flex-col gap-3 rounded-lg bg-card border border-border p-4'
              >
                <div className='flex items-start gap-2 text-sm font-semibold text-black'>
                  <span>🏴</span>
                  <span className='line-clamp-2'>{market.question}</span>
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <button
                    type='button'
                    className='rounded-md bg-market-success py-2 text-xs font-bold text-success'
                  >
                    YES {market.yesPercent}%
                  </button>
                  <button
                    type='button'
                    className='rounded-md bg-market-error py-2 text-xs font-bold text-error'
                  >
                    NO {market.noPercent}%
                  </button>
                </div>
                <span className='text-xs text-placeholder'>
                  ₦{market.volume} Vol
                </span>
              </div>
            ))}
      </div>
    </main>
  )
}

export default MarketsDashboard
