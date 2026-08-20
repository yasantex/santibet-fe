import { useState } from 'react'
import logo from '../assets/Santibet Logo.svg'
import logoDark from '../assets/Santibet Logo (white).svg'

import { Link, useNavigate } from 'react-router'
import Dropdown from '../components/globals/Dropdown'
import SearchInput from '../components/globals/SearchInput'
import Deposit from '../components/appModals/Deposit'
import { useModalControl } from '../hooks/useModalControl'
import { primaryNavLinks, type SearchResult } from '../utils/constants'
import { useMarketSearch } from '../data_layer/markets'
import { HugeiconsIcon } from '@hugeicons/react'
import { Menu01FreeIcons, Notification03Icon } from '@hugeicons/core-free-icons'
import SearchResultsList from '../data_layer/SearchResultsList'
import MobileSearchOverlay from '../mobile/MobileSearchOverlay'
import MobileBottomNav from '../mobile/MobileBottomNav'
import { Button } from '../components/globals/Button'
import { useAppSelector } from '../utils/hooks'
import { useTheme } from '../hooks/useTheme'
import useLogout from '../hooks/useLogout'
import ProfileDropdownMenu from '../components/globals/ProfileDropdownMenu'

const CategoryRow = () => (
  <div className='hide-scroll-bar  lg:hidden flex items-center gap-6 overflow-x-auto px-4  text-sm font-medium text-neutral-10 md:px-6'>
    {primaryNavLinks.map((link) => (
      <Link
        key={link.label}
        to={link.href}
        className='flex items-center gap-1.5'
      >
        {link.label}
      </Link>
    ))}
  </div>
)

const Header = () => {
  const navigate = useNavigate()
  const { modal, modalOpen, handleModalOpen, handleModalClose } =
    useModalControl()
  const { isDark, toggleTheme } = useTheme()
  const { logout } = useLogout()

  const { user } = useAppSelector((state) => state.user)

  const [searchTerm, setSearchTerm] = useState('')

  const { results: filteredResults } = useMarketSearch(searchTerm)

  const handleSelectResult = (result: SearchResult) => {
    navigate(result.href)
  }

  return (
    <header className='sticky top-0 z-50 px-3 md:px-6 bg-white border-b border-border shadow-md py-2.5'>
      <div className='flex items-center justify-between! gap-5 w-full mb-2.5'>
        <div className='flex items-center gap-5 w-full'>
          <Link to='/'>
            <img
              src={isDark ? logoDark : logo}
              alt='Santibet'
              className='w-25 h-10'
            />
          </Link>
          <nav className='lg:flex items-center gap-5 text-sm font-semibold hidden'>
            {primaryNavLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className='flex items-center gap-1.5 text-neutral-10 hover:text-black'
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className='flex items-center justify-end gap-5 w-full'>
          <main className='lg:flex items-center  gap-2.5 hidden'>
            <Dropdown
              className='flex-1 w-55!'
              menuClassName='w-[400px] max-h-[70vh] overflow-y-auto rounded-lg shadow-lg'
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
              <Button
                type='button'
                text='Deposit cash'
                onClick={() => handleModalOpen('deposit')}
                className='shrink-0 w-fit! lg:flex! hidden!'
              />
              <button
                type='button'
                aria-label='Notifications'
                className='shrink-0 text-black'
              >
                <HugeiconsIcon icon={Notification03Icon} size={22} />
              </button>
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
                <HugeiconsIcon
                  icon={Menu01FreeIcons}
                  size={20}
                  className='text-black'
                />
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
                <HugeiconsIcon
                  icon={Menu01FreeIcons}
                  size={20}
                  className='text-black'
                />
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
