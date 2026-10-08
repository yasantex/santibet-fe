import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import logo from '../assets/Santibet Logo.svg'
import logoDark from '../assets/Santibet Logo (white).svg'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import useAuthNavigate from '../hooks/useAuthNavigate'
import Dropdown from '../components/globals/Dropdown'
import SearchInput from '../components/globals/SearchInput'
import Deposit from '../components/appModals/Deposit'
import { useModalControl } from '../hooks/useModalControl'
import {
  type NavLink as NavLinkConfig,
  type SearchResult,
} from '../utils/constants'
import {
  useGlobalSearch,
  useLiveBets,
  useLobbyCategories,
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
import useAccountSuspended from '../hooks/useAccountSuspended'
import { SUSPENDED_CTA_HINT } from '../utils/constants'
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

  // Nav is driven entirely by the lobby's category list — admins create
  // categories at runtime, so nothing here is hard-coded. Only categories
  // (and subcategories) with events show; a parent with no events of its own
  // still shows if one of its subcategories has some. Subcategories whose
  // parent isn't returned get their own top-level tab so they stay reachable.
  const { data: apiCategories } = useLobbyCategories()
  const { visibleLinks, visibleMoreLinks } = useMemo(() => {
    const cats = apiCategories ?? []
    const slugs = new Set(cats.map((c) => c.slug.toLowerCase()))
    const childrenOf = (parent: string) =>
      cats
        .filter(
          (c) => c.parentSlug?.toLowerCase() === parent && c.eventCount > 0,
        )
        .map((c) => ({
          label: c.name,
          href: `/category/${parent}?sub=${c.slug.toLowerCase()}`,
        }))

    const topLevel = cats
      .filter((c) => {
        const parent = c.parentSlug?.toLowerCase()
        return !parent || !slugs.has(parent)
      })
      .map((c) => {
        const slug = c.slug.toLowerCase()
        return {
          label: c.name,
          href: `/category/${slug}`,
          eventCount: c.eventCount,
          children: childrenOf(slug),
        }
      })
      .filter((c) => c.eventCount > 0 || c.children.length > 0)

    const links: NavLinkConfig[] = [
      { label: 'Trending', href: '/' },
      ...topLevel.map(({ label, href }) => ({ label, href })),
    ]
    // "More" lists the categories that have subcategories, nested beneath.
    return {
      visibleLinks: links,
      visibleMoreLinks: topLevel.filter((c) => c.children.length > 0),
    }
  }, [apiCategories])

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
            menuClassName='w-52 max-h-[70vh] overflow-y-auto rounded-lg py-1'
            menu={({ close }) => (
              <div className='flex flex-col'>
                {visibleMoreLinks.map((link) => (
                  <div key={link.href} className='flex flex-col'>
                    <NavLink
                      to={link.href}
                      end
                      onClick={close}
                      className={({ isActive }) =>
                        `px-3 py-2 text-left text-sm hover:bg-hover ${
                          isActive ? 'font-semibold text-black' : 'text-black/60'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        onClick={close}
                        className='py-1.5 pr-3 pl-6 text-left text-xs text-black/60 hover:bg-hover hover:text-black'
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
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
  const location = useLocation()
  // NavLink matches on pathname only, so every /browse?sort=… link would light
  // up at once. Match the sort param too (no param = plain "Events").
  const browseSort =
    location.pathname === '/browse'
      ? (new URLSearchParams(location.search).get('sort') ?? '')
      : null
  const browseLinkClass = (sort: string) =>
    `flex items-center ${
      browseSort === sort ? 'text-black' : 'text-black/60 hover:text-black'
    }`
  const authNavigate = useAuthNavigate()
  const { modal, modalOpen, handleModalOpen, handleModalClose } =
    useModalControl()
  const { isDark, toggleTheme } = useTheme()
  const { logout } = useLogout()
  const { user } = useAppSelector((state) => state.user)
  const suspended = useAccountSuspended()

  const { data: wallet } = useSantiBetQuery<WalletBalance>({
    path: '/wallet',
    enabled: !!user,
  })

  const { count: unreadNotifications } = useUnreadNotificationCount()

  // Live count badge next to the nav's "Live" link, Kalshi-style ("LIVE 81").
  // Approximate — one page of the live feed, not a dedicated count endpoint.
  const { events: liveBets } = useLiveBets({ limit: 100 })
  const liveCount = liveBets.length

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

  const { sections, query, isSearching } = useGlobalSearch(searchTerm)

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
            <Link to='/browse' className={browseLinkClass('')}>
              Events
            </Link>
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
            <Link to='/browse?sort=trending' className={browseLinkClass('trending')}>
              Breaking
            </Link>
            <Link to='/browse?sort=closing_soon' className={browseLinkClass('closing_soon')}>
              Upcoming
            </Link>
            <a
              href='https://santibet.com'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center text-black/60 hover:text-black'
            >
              Campaign
            </a>
          </div>
        </div>
        <div className='flex items-center justify-end gap-5 w-full'>
          <main className='lg:flex items-center  gap-2.5 hidden'>
            <Dropdown
              className='flex-1 w-55! md:w-75!'
              menuClassName='w-[350px] max-h-[70vh] overflow-y-auto rounded-lg shadow-lg'
              menu={({ close }) => (
                <SearchResultsList
                  sections={sections}
                  loading={isSearching}
                  emptyLabel={query ? `No results for "${query}"` : undefined}
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
                placeholder='Search events and markets'
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
              <span
                title={suspended ? SUSPENDED_CTA_HINT : undefined}
                className='shrink-0 hidden lg:flex'
              >
                <Button
                  type='button'
                  text='Deposit cash'
                  disabled={suspended}
                  onClick={() => handleModalOpen('deposit')}
                  className='shrink-0 w-fit!'
                />
              </span>
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
                onClick={() => authNavigate('/signin')}
              />
              <Button
                type='button'
                text='Sign up'
                variation='plain'
                onClick={() => authNavigate('/signup')}
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
