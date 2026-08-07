import { useState } from 'react'
import logo from '../assets/Santibet Logo (white).svg'
import logoDark from '../assets/Santibet Logo.svg'

import { Link, useNavigate } from 'react-router'
import Dropdown from '../components/globals/Dropdown'
import SearchInput from '../components/globals/SearchInput'
import Deposit from '../components/appModals/Deposit'
import { useModalControl } from '../hooks/useModalControl'
import {
  mockSearchResults,
  primaryNavLinks,
  profileMenuItems,
  type SearchResult,
} from '../utils/constants'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Award01Icon,
  Menu01FreeIcons,
  Notification03Icon,
} from '@hugeicons/core-free-icons'
import SearchResultsList from '../data_layer/SearchResultsList'
import MobileSearchOverlay from '../mobile/MobileSearchOverlay'
import MobileBottomNav from '../mobile/MobileBottomNav'
import { Button } from '../components/globals/Button'
import { useAppSelector } from '../utils/hooks'
import { FormSwitch } from '../components/globals/FormSwitch'
import { useTheme } from '../hooks/useTheme'
import useLogout from '../hooks/useLogout'
import { ProfileAvatar } from '../components/globals/ReusedText'

const CategoryRow = () => (
  <div className='hide-scroll-bar  lg:hidden flex items-center gap-6 overflow-x-auto px-4  text-sm font-medium text-neutral-10 md:px-6'>
    {primaryNavLinks.map((link) => (
      <a
        key={link.label}
        href={link.href}
        className='flex items-center gap-1.5'
      >
        {link.label}
      </a>
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
  const [activeMobileTab, setActiveMobileTab] = useState<
    'browse' | 'trending' | 'search' | 'social'
  >('browse')

  const filteredResults: SearchResult[] = searchTerm
    ? mockSearchResults.filter((r) =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : mockSearchResults

  const handleSelectResult = (result: SearchResult) => {
    handleModalOpen('mobileSearch')

    navigate(result.href)
  }

  return (
    <header className='sticky top-0 z-50 px-3 md:px-6 bg-white border-b border-border shadow-md py-2.5'>
      <div className='flex items-center justify-between! gap-5 w-full mb-2.5'>
        <div className='flex items-center gap-5 w-full'>
          <Link to='/'>
            <img src={isDark ? logoDark : logo} alt='Santibet' />
          </Link>
          <nav className='lg:flex items-center gap-5 text-sm font-semibold hidden'>
            {primaryNavLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className='flex items-center gap-1.5 text-neutral-10'
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className='flex items-center justify-end gap-5 w-full'>
          {user && (
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

              <button
                type='button'
                aria-label='Rewards'
                className='shrink-0 text-black'
              >
                <HugeiconsIcon icon={Award01Icon} size={22} />
              </button>
              <button
                type='button'
                aria-label='Notifications'
                className='shrink-0  text-black'
              >
                <HugeiconsIcon icon={Notification03Icon} size={22} />
              </button>
            </main>
          )}

          {user ? (
            <div className='flex items-center gap-2.5'>
              <FormSwitch
                checked={isDark}
                onChange={toggleTheme}
                onLabel='Dark'
                offLabel='Light'
                className='md:flex! hidden!'
                labelClassName='font-semibold text-neutral-10'
              />
              <Button
                type='button'
                text='Deposit cash'
                onClick={() => handleModalOpen('deposit')}
                className='shrink-0 w-fit!'
              />
              <Dropdown
                align='end'
                className='w-full'
                menuClassName='shadow-sm w-[300px] mt-2.5! px-2 rounded-lg!'
                menu={({ close }) => (
                  <div className='flex text-sm flex-col gap-1 p-2'>
                    <div className='flex items-center gap-2.5'>
                      <ProfileAvatar
                        firstName={user?.name ?? ''}
                        lastName={user?.name ?? ''}
                        imageUrl={null}
                        className='dark:bg-[#e4e5e3]!'
                      />
                      <div className='flex flex-col gap-1'>
                        <p className='font-semibold text-xs text-black'>
                          {user?.name ?? ''}
                        </p>
                        <p className='text-neutral-10 text-xs font-medium'>
                          {user?.phone ?? ''}
                        </p>
                      </div>
                    </div>

                    {profileMenuItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => item.action(navigate, close)}
                        className='flex gap-2.5 text-black items-center p-2 cursor-pointer'
                      >
                        <HugeiconsIcon icon={item.icon} size={20} />
                        <p className='text-sm text-black font-medium'>
                          {item.label}
                        </p>
                      </div>
                    ))}

                    <p
                      onClick={() => {
                        close()
                        logout()
                      }}
                      className='text-sm text-error font-medium mt-2 cursor-pointer'
                    >
                      Log Out
                    </p>
                  </div>
                )}
              >
                <HugeiconsIcon icon={Menu01FreeIcons} size={20} className='text-black' />
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
            </div>
          )}
        </div>
      </div>
      <CategoryRow />

      <MobileBottomNav
        activeTab={activeMobileTab}
        onNavigate={(tab) => setActiveMobileTab(tab)}
        onOpenDeposit={() => handleModalOpen('deposit')}
        onOpenSearch={() => {
          setActiveMobileTab('search')
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
