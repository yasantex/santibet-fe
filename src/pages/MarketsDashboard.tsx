import { useState } from 'react'
import FeaturedMarketCard from '../components/markets/FeaturedMarketCard'
import { useMockDashboardData } from '../mockData/marketsMockData'
import { MarketCardSkeleton } from '../components/globals/ReusedText'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  FilterIcon,
  Bookmark02Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import { useSantiBetQuery } from '../data_layer/utils'
import type { MarketResponse } from '../types/market.types'

const categories = [
  'All',
  'Politics',
  'Sports',
  'Crypto',
  'Entertainment',
  'Tech',
] as const

const categoryIcons: Record<string, string> = {
  Politics: '🏛️',
  Sports: '🏴',
  Crypto: '₿',
  Entertainment: '🎤',
  Tech: '💻',
}

const MarketsDashboard = () => {
  const [activeCategory, setActiveCategory] = useState<
    'All' | 'Politics' | 'Sports' | 'Crypto' | 'Entertainment' | 'Tech'
  >('All')

  const { data: markets, isLoading: marketLoading } = useSantiBetQuery<MarketResponse>({
    path: '/market/markets',
  })

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
                className='flex flex-col gap-4 rounded-2xl border border-border bg-card p-4'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-border/30 text-base'>
                      {categoryIcons[market.category] ?? '🏴'}
                    </div>
                    <span className='text-xs font-medium text-neutral-10'>
                      {market.category}
                    </span>
                  </div>
                  <button
                    type='button'
                    aria-label='Save market'
                    className='text-neutral-10 hover:text-black'
                  >
                    <HugeiconsIcon icon={Bookmark02Icon} size={18} />
                  </button>
                </div>

                <h3 className='text-base font-bold leading-snug text-black line-clamp-2'>
                  {market.question}
                </h3>

                <div className='flex flex-col gap-4'>
                  <div className='flex items-center gap-3'>
                    <div className='flex-1 min-w-0'>
                      <div className='mb-1.5 flex items-baseline justify-between text-sm'>
                        <span className='font-bold text-black'>YES</span>
                        <span className='font-bold text-success'>
                          {market.yesPercent}%
                        </span>
                      </div>
                      <div className='h-1 w-full overflow-hidden rounded-full bg-border/40'>
                        <div
                          className='h-full rounded-full bg-success'
                          style={{ width: `${market.yesPercent}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type='button'
                      className='shrink-0 rounded-lg bg-market-success px-4 py-2.5 text-xs font-bold text-success'
                    >
                      YES {market.yesPercent}%
                    </button>
                  </div>

                  <div className='flex items-center gap-3'>
                    <div className='flex-1 min-w-0'>
                      <div className='mb-1.5 flex items-baseline justify-between text-sm'>
                        <span className='font-bold text-black'>NO</span>
                        <span className='font-bold text-error'>
                          {market.noPercent}%
                        </span>
                      </div>
                      <div className='h-1 w-full overflow-hidden rounded-full bg-border/40'>
                        <div
                          className='h-full rounded-full bg-error'
                          style={{ width: `${market.noPercent}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type='button'
                      className='shrink-0 rounded-lg bg-market-error px-4 py-2.5 text-xs font-bold text-error'
                    >
                      NO {market.noPercent}%
                    </button>
                  </div>
                </div>

                <div className='flex items-center justify-between pt-1'>
                  <span className='text-xs text-placeholder'>
                    Volume: ₦{market.volume}
                  </span>
                  <button
                    type='button'
                    className='flex items-center gap-0.5 text-xs font-semibold text-neutral-10 hover:text-black'
                  >
                    Explore
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </button>
                </div>
              </div>
            ))}
      </div>
    </main>
  )
}

export default MarketsDashboard
