import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import LiveEventCard from '../../components/markets/LiveEventCard'
import { LiveBadge } from '../../components/markets/LiveBits'
import { MarketCardSkeleton } from '../../components/globals/ReusedText'
import { useLiveEvents } from '../../data_layer/markets'
import { marketHref } from '../../utils/marketDisplay'
import type { UiEvent, UiMarket, UiOutcome } from '../../types/market.types'

const LiveMarkets = () => {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useLiveEvents({ limit: 40 })

  const events = useMemo<UiEvent[]>(() => data?.events ?? [], [data])

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
            Nothing in-play right now. Check back soon — new rounds open
            continuously.
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
