import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useEvent } from '../../data_layer/markets'
import { useFavorites } from '../../hooks/useFavorites'
import MarketCard from '../../components/markets/MarketCard'
import {
  categoryIcon,
  marketHref,
  moreMarketsSlug,
} from '../../utils/marketDisplay'
import { MarketCardSkeleton } from '../../components/globals/ReusedText'
import { formatCloseTimer } from '../../utils/functions'
import type { UiMarket, UiOutcome } from '../../types/market.types'

const EventDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: event, isLoading, isError } = useEvent(id)
  // The feed imports a match's spreads/totals as a separate
  // "<match> - More Markets" event; list them here too.
  const { data: moreEvent } = useEvent(moreMarketsSlug(event?.slug), {
    optional: true,
  })
  // On the match's own page its name is the heading, so each card shows just
  // the market ("Spread: Newcastle (-1.5)", not "Newcastle vs …: Spread…").
  const markets = useMemo(
    () =>
      [...(event?.markets ?? []), ...(moreEvent?.markets ?? [])].map((m) => ({
        ...m,
        eventTitle: undefined,
      })),
    [event, moreEvent],
  )
  const { isFavorite, toggle: toggleFavorite } = useFavorites()

  const goToMarket = (m: UiMarket) => navigate(marketHref(m))
  const goToTrade = (m: UiMarket, o: UiOutcome) => navigate(marketHref(m, o.id))

  return (
    <main className='mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 pt-4 pb-20 md:px-8'>
      {isLoading ? (
        <>
          <div className='h-8 w-64 animate-pulse rounded bg-card' />
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <MarketCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : isError || !event ? (
        <div className='flex flex-col items-center gap-4 py-20 text-center'>
          <p className='text-sm text-neutral-10'>We couldn’t load this event.</p>
          <button
            type='button'
            onClick={() => navigate('/')}
            className='rounded-full bg-brand-green px-5 py-2 text-sm font-semibold text-black'
          >
            Back to markets
          </button>
        </div>
      ) : (
        <>
          <div className='flex items-center gap-3'>
            <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-border/30 text-2xl'>
              {categoryIcon(event.category)}
            </div>
            <div className='flex flex-col gap-1'>
              <h1 className='text-lg font-bold text-black md:text-2xl'>
                {event.title}
              </h1>
              <div className='flex items-center gap-3 text-xs text-neutral-10'>
                <span>{event.category}</span>
                {event.closeTime && (
                  <span>{formatCloseTimer(event.closeTime)}</span>
                )}
                <span>{markets.length} markets</span>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {markets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                onSelect={goToMarket}
                onSelectOutcome={goToTrade}
                onSave={toggleFavorite}
                isSaved={isFavorite(market.id)}
              />
            ))}
            {!markets.length && (
              <p className='col-span-full py-16 text-center text-sm text-neutral-10'>
                No markets in this event.
              </p>
            )}
          </div>
        </>
      )}
    </main>
  )
}

export default EventDetail
