import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import FeaturedMarketCard from './FeaturedMarketCard'
import type { UiEvent, UiMarket, UiOutcome } from '../../types/market.types'

const ROTATE_MS = 8000
const SWIPE_PX = 40

interface FeaturedCarouselProps {
  events: UiEvent[]
  isSaved?: (marketId: string) => boolean
  onSave?: (market: UiMarket) => void
  onSelect?: (market: UiMarket) => void
  onSelectEvent?: (event: UiEvent) => void
  onSelectOutcome?: (market: UiMarket, outcome: UiOutcome) => void
}

/**
 * Rotating hero for the lobby (Polymarket-style): one featured event at a
 * time, auto-advancing every few seconds. Rotation pauses while the pointer
 * or keyboard focus is inside (so a user reading the chart or picking a range
 * isn't yanked away) and while the tab is hidden; manual navigation restarts
 * the timer. Arrows, dots and swipe move between slides.
 */
const FeaturedCarousel = ({ events, ...cardProps }: FeaturedCarouselProps) => {
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(
    () => typeof document !== 'undefined' && document.hidden,
  )
  const touchX = useRef<number | null>(null)
  const count = events.length
  const current = count ? index % count : 0

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const paused = hovered || focused || hidden
  useEffect(() => {
    if (paused || count < 2) return
    const id = window.setTimeout(
      () => setIndex((i) => (i + 1) % count),
      ROTATE_MS,
    )
    return () => window.clearTimeout(id)
  }, [paused, count, current])

  if (!count) return null
  const go = (next: number) => setIndex((next + count) % count)

  const controls =
    count > 1 ? (
      <div
        className='flex items-center gap-2'
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type='button'
          aria-label='Previous featured market'
          onClick={() => go(current - 1)}
          className='flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-neutral-10 hover:bg-hover hover:text-black'
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        </button>
        <div className='flex items-center gap-1.5'>
          {events.map((e, i) => (
            <button
              key={e.id}
              type='button'
              aria-label={`Show featured market ${i + 1} of ${count}`}
              aria-current={i === current}
              onClick={() => go(i)}
              className={`h-1.5 cursor-pointer rounded-full transition-all ${
                i === current
                  ? 'w-5 bg-black'
                  : 'w-1.5 bg-neutral-10/40 hover:bg-neutral-10'
              }`}
            />
          ))}
        </div>
        <button
          type='button'
          aria-label='Next featured market'
          onClick={() => go(current + 1)}
          className='flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-neutral-10 hover:bg-hover hover:text-black'
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </button>
      </div>
    ) : null

  return (
    <section
      aria-roledescription='carousel'
      aria-label='Featured markets'
      className='min-w-0'
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(e) => {
        const start = touchX.current
        touchX.current = null
        const end = e.changedTouches[0]?.clientX
        if (start == null || end == null) return
        if (Math.abs(end - start) > SWIPE_PX) go(current + (end < start ? 1 : -1))
      }}
    >
      <FeaturedMarketCard
        // Remount per slide so range tabs reset and the slide animates in.
        key={events[current].id}
        event={events[current]}
        controls={controls}
        {...cardProps}
      />
    </section>
  )
}

export default FeaturedCarousel
