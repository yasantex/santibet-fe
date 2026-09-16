import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import logo from '../assets/Santibet Logo.svg'
import logoDark from '../assets/Santibet Logo (white).svg'
import { Link, NavLink, useNavigate } from 'react-router'
import Dropdown from '../components/globals/Dropdown'
import SearchInput from '../components/globals/SearchInput'
import Deposit from '../components/appModals/Deposit'
import { useModalControl } from '../hooks/useModalControl'
import {
  moreNavLinks,
  primaryNavLinks,
  type NavLink as NavLinkConfig,
  type SearchResult,
} from '../utils/constants'
import {
  useMarketSearch,
  useAvailableCategories,
  useLiveEvents,
} from '../data_layer/markets'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Home01Icon,
  Menu01FreeIcons,
  Notification03Icon,
} from '@hugeicons/core-free-icons'
import SearchResultsList from '../data_layer/SearchResultsList'
import MobileSearchOverlay from '../mobile/MobileSearchOverlay'
import MobileBottomNav from '../mobile/MobileBottomNav'
import { Button } from '../components/globals/Button'
import { useAppSelector } from '../utils/hooks'
import { useTheme } from '../hooks/useTheme'
import useLogout from '../hooks/useLogout'
import ProfileDropdownMenu from '../components/globals/ProfileDropdownMenu'
import { useSantiBetQuery } from '../data_layer/utils'
import { useBetPositions } from '../data_layer/bets'
import { useUnreadNotificationCount } from '../data_layer/notifications'
import { formatCurrency, toMajorUnits } from '../utils/functions'
import type { WalletBalance } from '../types/wallet.types'

const CategoryRow = () => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState])

  const scrollByAmount = (delta: number) =>
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' })

  // Only surface category tabs that actually have markets behind them. Live /
  // Trending (non-`/category/` hrefs) and mock categories (no backend data
  // yet) always show; category links are kept while the feed is still
  // loading (`available === null`) to avoid flashing a near-empty nav, then
  // filtered to categories with open markets once loaded.
  const isLinkVisible = useCallback(
    (link: NavLinkConfig, availableSet: Set<string> | null) => {
      if (!availableSet || link.isMock) return true
      const category = link.href.startsWith('/category/')
        ? link.href.slice('/category/'.length)
        : null
      return !category || availableSet.has(category.toLowerCase())
    },
    [],
  )
  const available = useAvailableCategories()
  const visibleLinks = useMemo(
    () => primaryNavLinks.filter((link) => isLinkVisible(link, available)),
    [available, isLinkVisible],
  )
  const visibleMoreLinks = useMemo(
    () => moreNavLinks.filter((link) => isLinkVisible(link, available)),
    [available, isLinkVisible],
  )

  return (
    <div className='flex items-center w-full gap-6'>
      {/* Doc's GLOBAL row starts with a standalone Home icon before Trending. */}
      <NavLink
        to='/'
        end
        aria-label='Home'
        className={({ isActive }) =>
          `flex shrink-0 items-center ${
            isActive ? 'text-black' : 'text-black/60 hover:text-black'
          }`
        }
      >
        <HugeiconsIcon icon={Home01Icon} size={18} />
      </NavLink>
      <div className='relative flex min-w-0 flex-1 items-center'>
        {canScrollLeft && (
          <button
            type='button'
            aria-label='Scroll categories left'
            onClick={() => scrollByAmount(-160)}
            className='absolute left-0 z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-neutral-10 shadow-sm hover:text-black'
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          </button>
        )}
        <div
          ref={scrollRef}
          className='hide-scroll-bar flex items-center gap-6 overflow-x-auto scroll-smooth text-sm font-semibold'
        >
          {visibleLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.href}
              end={link.href === '/'}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 py-1 ${
                  isActive ? 'text-black' : 'text-black/60 hover:text-black'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        {/* Rendered outside the scrollable row (not as its last item) — that
            row's `overflow-x-auto` implicitly clips vertical overflow too
            (an axis can't stay `visible` once the other isn't), which was
            hiding this dropdown's menu even though it was in the DOM. */}
        {visibleMoreLinks.length > 0 && (
          <Dropdown
            align='end'
            className='ml-6 shrink-0'
            menuClassName='w-44 rounded-lg py-1'
            menu={({ close }) => (
              <div className='flex flex-col'>
                {visibleMoreLinks.map((link) => (
                  <NavLink
                    key={link.label}
                    to={link.href}
                    onClick={close}
                    className={({ isActive }) =>
                      `px-3 py-2 text-left text-sm hover:bg-hover ${
                        isActive ? 'font-semibold text-black' : 'text-black/60'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}
          >
            <span className='flex cursor-pointer items-center gap-1 py-1 text-sm font-semibold text-black/60 hover:text-black'>
              More
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
            </span>
          </Dropdown>
        )}
        {canScrollRight && (
          <button
            type='button'
            aria-label='Scroll categories right'
            onClick={() => scrollByAmount(160)}
            className='absolute right-0 z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-neutral-10 shadow-sm hover:text-black'
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

const Header = () => {
  const navigate = useNavigate()
  const { modal, modalOpen, handleModalOpen, handleModalClose } =
    useModalControl()
  const { isDark, toggleTheme } = useTheme()
  const { logout } = useLogout()
  const { user } = useAppSelector((state) => state.user)

  const { data: wallet } = useSantiBetQuery<WalletBalance>({
    path: '/wallet',
    enabled: !!user,
  })

  const { count: unreadNotifications } = useUnreadNotificationCount()

  // Live count badge next to the nav's "Live" link, Kalshi-style ("LIVE 81").
  // Approximate — one page of the live feed, not a dedicated count endpoint.
  const { data: liveEventsData } = useLiveEvents({ limit: 100 })
  const liveCount = liveEventsData?.events.length ?? 0

  const { data: openPositions } = useBetPositions('OPEN', 100)
  // Portfolio = unspent cash + the live market value of open positions;
  // cash alone (shown separately below) is just the available balance.
  const openPositionsValue = useMemo(
    () =>
      (openPositions?.pages ?? [])
        .flatMap((page) => page?.data ?? [])
        .reduce(
          (sum, p) => sum + toMajorUnits(p?.currentValue?.amount ?? 0),
          0,
        ),
    [openPositions],
  )
  const portfolioValue = toMajorUnits(wallet?.total ?? 0) + openPositionsValue

  const [searchTerm, setSearchTerm] = useState('')

  const { results: filteredResults } = useMarketSearch(searchTerm)

  const handleSelectResult = (result: SearchResult) => {
    navigate(result.href)
  }

  return (
    <header className='sticky top-0 z-50 px-3 md:px-6 bg-white border-b border-border py-2.5'>
      <div className='flex items-center justify-between! gap-5 w-full mb-2.5'>
        <div className='flex items-center gap-5 w-full'>
          <Link to='/'>
            <img
              src={isDark ? logoDark : logo}
              alt='Santibet'
              className='w-25 h-10 '
            />
          </Link>
          <div className='hidden shrink-0 items-center gap-4 text-sm font-semibold lg:flex'>
            <NavLink
              to='/browse'
              className={({ isActive }) =>
                `flex items-center ${
                  isActive ? 'text-black' : 'text-black/60 hover:text-black'
                }`
              }
            >
              Events
            </NavLink>
            <NavLink
              to='/live'
              className={({ isActive }) =>
                `flex items-center gap-1 ${
                  isActive ? 'text-black' : 'text-black/60 hover:text-black'
                }`
              }
            >
              Live
              {liveCount > 0 && <span className='text-error'>{liveCount}</span>}
            </NavLink>
            <NavLink
              to='/browse?sort=newest'
              className={({ isActive }) =>
                `flex items-center ${
                  isActive ? 'text-black' : 'text-black/60 hover:text-black'
                }`
              }
            >
              New
            </NavLink>
            <NavLink
              to='/browse?sort=trending'
              className={({ isActive }) =>
                `flex items-center ${
                  isActive ? 'text-black' : 'text-black/60 hover:text-black'
                }`
              }
            >
              Breaking
            </NavLink>
            <NavLink
              to='/browse?sort=closing_soon'
              className={({ isActive }) =>
                `flex items-center ${
                  isActive ? 'text-black' : 'text-black/60 hover:text-black'
                }`
              }
            >
              Upcoming
            </NavLink>
          </div>
        </div>
        <div className='flex items-center justify-end gap-5 w-full'>
          <main className='lg:flex items-center  gap-2.5 hidden'>
            <Dropdown
              className='flex-1 w-55! md:w-75!'
              menuClassName='w-[350px] max-h-[70vh] overflow-y-auto rounded-lg shadow-lg'
              menu={({ close }) => (
                <SearchResultsList
                  results={filteredResults}
                  onSelect={(result) => {
                    close()
                    handleSelectResult(result)
                  }}
                />
              )}
            >
              <SearchInput
                searchTerm={searchTerm}
                handleChange={(e) => setSearchTerm(e.target.value)}
                placeholder='Search markets'
              />
            </Dropdown>
          </main>
          {user ? (
            <div className='flex items-center gap-2.5'>
              <Link
                to='/account-portfolio'
                className='shrink-0 hidden md:flex flex-col items-center gap-px rounded-md px-3 text-xs font-semibold text-black py-1 hover:bg-hover/70'
              >
                <span>
                  {formatCurrency(String(portfolioValue), wallet?.currency)}
                </span>
                <span className='text-[10px] text-neutral-10'>Portfolio</span>
              </Link>
              <Link
                to='/account-wallet'
                className='shrink-0 flex flex-col items-center gap-px rounded-md px-3 text-xs font-semibold text-black py-1 hover:bg-hover/70'
              >
                <span>
                  {wallet
                    ? formatCurrency(
                        toMajorUnits(wallet.total ?? 0),
                        wallet.currency,
                      )
                    : '—'}
                </span>
                <span className='text-[10px] text-neutral-10'>Cash</span>
              </Link>
              <Button
                type='button'
                text='Deposit cash'
                onClick={() => handleModalOpen('deposit')}
                className='shrink-0 w-fit! lg:flex! hidden!'
              />
              <Link
                to='/notifications'
                className='relative p-2 hover:bg-hover rounded-md cursor-pointer transition-colors duration-200'
              >
                <HugeiconsIcon
                  icon={Notification03Icon}
                  size={22}
                  className='shrink-0 text-black'
                />
                {unreadNotifications > 0 && (
                  <span className='absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-green' />
                )}
              </Link>
              <Dropdown
                align='end'
                className='w-full'
                menuClassName='shadow-sm w-[300px] max-h-100 overflow-y-auto mt-2.5! px-2 rounded-lg!'
                menu={({ close }) => (
                  <ProfileDropdownMenu
                    user={user}
                    navigate={navigate}
                    close={close}
                    isDark={isDark}
                    toggleTheme={toggleTheme}
                    onLogout={logout}
                  />
                )}
              >
                <div className='p-2 hover:bg-hover rounded-md cursor-pointer transition-colors duration-200'>
                  <HugeiconsIcon
                    icon={Menu01FreeIcons}
                    size={20}
                    className='text-black'
                  />
                </div>
              </Dropdown>
            </div>
          ) : (
            <div className='flex items-center gap-2.5'>
              <Button
                type='button'
                text='Login'
                onClick={() => navigate('/signin')}
              />
              <Button
                type='button'
                text='Sign up'
                variation='plain'
                onClick={() => navigate('/signup')}
              />
              <Dropdown
                align='end'
                className='w-full'
                menuClassName='shadow-sm w-[300px] max-h-100 overflow-y-auto mt-2.5! px-2 rounded-lg!'
                menu={({ close }) => (
                  <ProfileDropdownMenu
                    user={user}
                    navigate={navigate}
                    close={close}
                    isDark={isDark}
                    toggleTheme={toggleTheme}
                    onLogout={logout}
                  />
                )}
              >
                <div className='p-2 hover:bg-hover rounded-md cursor-pointer transition-colors duration-200'>
                  <HugeiconsIcon
                    icon={Menu01FreeIcons}
                    size={20}
                    className='text-black'
                  />
                </div>
              </Dropdown>
            </div>
          )}
        </div>
      </div>
      <CategoryRow />

      <MobileBottomNav
        onOpenDeposit={() => handleModalOpen('deposit')}
        onOpenSearch={() => {
          handleModalOpen('mobileSearch')
        }}
      />
      <MobileSearchOverlay
        open={modalOpen && modal === 'mobileSearch'}
        handleClose={() => {
          handleModalClose()
        }}
        onSelectResult={handleSelectResult}
      />

      <Deposit
        open={modalOpen && modal === 'deposit'}
        handleClose={() => {
          handleModalClose()
        }}
      />
    </header>
  )
}

export default Header
