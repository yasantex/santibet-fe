import { LiveStreaming02Icon, SatelliteIcon, Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '../components/globals/Button'
import { useAppSelector } from '../utils/hooks'
import { useLocation, useNavigate } from 'react-router'
import { useLiveEvents } from '../data_layer/markets'

type MobileBottomNavProps = {
  onOpenDeposit: () => void
  onOpenSearch: () => void
}

const MobileBottomNav = ({
  onOpenDeposit,
  onOpenSearch,
}: MobileBottomNavProps) => {
  const { user } = useAppSelector((state) => state.user)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isMarketsActive = pathname === '/'
  const isLiveActive = pathname === '/live'

  // Same approximation as the desktop nav's "Live 81" badge — one page of
  // the live feed, not a dedicated count endpoint.
  const { data: liveEventsData } = useLiveEvents({ limit: 100 })
  const liveCount = liveEventsData?.events.length ?? 0

  return (
    <nav className='fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-between border-t border-border bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-2 lg:hidden'>
      <button
        type='button'
        onClick={() => navigate('/')}
        className='flex flex-1 flex-col items-center gap-1 py-1 text-xs'
      >
        <HugeiconsIcon
          icon={SatelliteIcon}
          size={20}
          className={isMarketsActive ? 'text-brand-green' : 'text-black'}
        />
        <span
          className={
            isMarketsActive ? 'text-brand-green font-medium' : 'text-black'
          }
        >
          Trending
        </span>
      </button>
      <button
        type='button'
        onClick={() => navigate('/live')}
        className='flex flex-1 flex-col items-center gap-1 py-1 text-xs'
      >
        <HugeiconsIcon
          icon={LiveStreaming02Icon}
          size={20}
          className={isLiveActive ? 'text-brand-green' : 'text-black'}
        />
        <span
          className={`flex items-center gap-1 ${
            isLiveActive ? 'text-brand-green font-medium' : 'text-black'
          }`}
        >
          Live
          {liveCount > 0 && <span className='text-error'>{liveCount}</span>}
        </span>
      </button>

      {user ? (
        <Button
          type='button'
          text='Deposit cash'
          onClick={onOpenDeposit}
          className='shrink-0 w-fit! mt-1.5!'
        />
      ) : (
        <Button
          type='button'
          text='Login'
          className='shrink-0 w-fit! mt-1.5!'
          onClick={() => navigate('/signin')}
        />
      )}

      <button
        type='button'
        onClick={onOpenSearch}
        className='flex flex-1 flex-col items-center gap-1 py-1 text-xs'
      >
        <HugeiconsIcon icon={Search01Icon} size={20} className='text-black' />
        <span className='text-black'>Search</span>
      </button>
    </nav>
  )
}

export default MobileBottomNav