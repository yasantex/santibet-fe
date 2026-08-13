import {
  SatelliteIcon,
  Compass01Icon,
  MoneySend01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '../components/globals/Button'

type MobileTab = 'browse' | 'trending' | 'search' | 'social'

type MobileBottomNavProps = {
  activeTab?: MobileTab
  liveCount?: number
  onNavigate: (tab: MobileTab) => void
  onOpenDeposit: () => void
  onOpenSearch: () => void
}

const NAV_ITEMS: {
  key: MobileTab
  label: string
  icon: typeof Compass01Icon
}[] = [{ key: 'trending', label: 'Trending', icon: SatelliteIcon }]

const MobileBottomNav = ({
  activeTab,
  onNavigate,
  onOpenDeposit,
  onOpenSearch,
}: MobileBottomNavProps) => {
  return (
    <nav className='fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-between border-t border-border bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-2 lg:hidden'>
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.key
        const Icon = item.icon
        return (
          <button
            key={item.key}
            type='button'
            onClick={() => onNavigate(item.key)}
            className='flex flex-1 flex-col items-center gap-1 py-1 text-xs'
          >
            <HugeiconsIcon
              icon={Icon}
              size={20}
              className={isActive ? 'text-brand-green' : 'text-black'}
            />
            <span
              className={`flex items-center gap-1 ${isActive ? 'text-brand-green font-medium' : 'text-black'}`}
            >
              {item.label}
            </span>
          </button>
        )
      })}

      <Button
        type='button'
        text='Deposit cash'
        onClick={onOpenDeposit}
        className='shrink-0 w-fit! mt-1.5!'
      />

      <button
        type='button'
        onClick={onOpenSearch}
        className='flex flex-1 flex-col items-center gap-1 py-1 text-xs'
      >
        <HugeiconsIcon
          icon={Search01Icon}
          size={20}
          className={activeTab === 'search' ? 'text-brand-green' : 'text-black'}
        />
        <span
          className={
            activeTab === 'search'
              ? 'text-brand-green font-medium'
              : 'text-black'
          }
        >
          Search
        </span>
      </button>
    </nav>
  )
}

export default MobileBottomNav
