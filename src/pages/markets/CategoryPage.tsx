import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import MarketCard from '../../components/markets/MarketCard'
import { MarketCardSkeleton } from '../../components/globals/ReusedText'
import { Button } from '../../components/globals/Button'
import { useEventsInfinite } from '../../data_layer/markets'
import type { UiMarket, UiOutcome } from '../../types/market.types'

const CategoryPage = () => {
  const { category: routeCategory } = useParams<{ category?: string }>()
  const navigate = useNavigate()
  const active = routeCategory ?? 'All'

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useEventsInfinite({ limit: 100 })

  const allMarkets = useMemo<UiMarket[]>(() => {
    const markets = (data?.pages ?? [])
      .flatMap((p) => p.events)
      .flatMap((e) => e.markets)
    const open = markets.filter((m) => m.status !== 'closed' && m.yes)
    const pool = open.length ? open : markets.filter((m) => m.yes)
    return [...pool].sort((a, b) => b.volume - a.volume)
  }, [data])

  const categories = useMemo(() => {
    const set = new Set<string>()
    allMarkets.forEach((m) => m.category && set.add(m.category))
    return ['All', ...Array.from(set).sort()]
  }, [allMarkets])

  const filtered = useMemo(
    () =>
      active === 'All'
        ? allMarkets
        : allMarkets.filter(
            (m) => m.category.toLowerCase() === active.toLowerCase(),
          ),
    [allMarkets, active],
  )

  const goToMarket = (m: UiMarket) => navigate(`/markets/${m.id}`)
  const goToTrade = (m: UiMarket, o: UiOutcome) =>
    navigate(`/markets/${m.id}?outcome=${o.id}`)

  const selectCategory = (c: string) => {
    navigate(c === 'All' ? '/browse' : `/category/${c}`)
  }

  return (
    <main className='mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 pt-4 pb-20 md:px-8'>
      <h1 className='text-lg font-bold text-black md:text-2xl'>
        {active === 'All' ? 'Browse markets' : active}
      </h1>

      <div className='hide-scroll-bar flex items-center gap-2 overflow-x-auto'>
        {categories.map((c) => (
          <button
            key={c}
            type='button'
            onClick={() => selectCategory(c)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              active.toLowerCase() === c.toLowerCase()
                ? 'bg-brand-green text-black dark:text-text-black!'
                : 'bg-card text-neutral-10 hover:text-black'
            }`}
          >
            {c}
          </button>
        ))}
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
                  />
                ))}
          </div>

          {!isLoading && !filtered.length && (
            <p className='py-12 text-center text-sm text-neutral-10'>
              No open markets in {active}. Try loading more or another category.
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
    </main>
  )
}

export default CategoryPage
