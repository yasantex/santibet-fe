import { useState } from 'react'
import { Icon } from '../components/globals/Icon'
import logo from '../assets/logoGreen.jpeg'
import { Link, useNavigate } from 'react-router'
import Dropdown from '../components/globals/Dropdown'
import SearchInput from '../components/globals/SearchInput'
import Deposit from '../components/appModals/Deposit'
import { useModalControl } from '../hooks/useModalControl'
import {
  categoryLinks,
  mockSearchResults,
  moreNavLinks,
  primaryNavLinks,
  type SearchResult,
} from '../utils/constants'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  Award01Icon,
  Menu01Icon,
  Notification03Icon,
} from '@hugeicons/core-free-icons'
import SearchResultsList from '../data_layer/SearchResultsList'
import MobileSearchOverlay from '../mobile/MobileSearchOverlay'
import MobileBottomNav from '../mobile/MobileBottomNav'
import { Button } from '../components/globals/Button'
import { useAppSelector } from '../utils/hooks'

const CategoryRow = () => (
  <div className='hide-scroll-bar flex items-center gap-6 overflow-x-auto border-b border-border px-4 py-3 text-sm font-medium text-neutral-40 md:px-6'>
    {categoryLinks.map((category) => (
      <a
        key={category.label}
        href={category.href}
        className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap ${
          category.isTrending ? 'font-semibold text-black' : 'hover:text-black'
        }`}
      >
        {category.isTrending && <Icon svg='grid' height={16} width={16} />}
        {category.label}
      </a>
    ))}
  </div>
)

const Header = () => {
  const navigate = useNavigate()
  const { modal, modalOpen, handleModalOpen, handleModalClose } =
    useModalControl()
  const { user } = useAppSelector((state) => state.user)

  const [searchTerm, setSearchTerm] = useState('')
  const [activeMobileTab, setActiveMobileTab] = useState<
    'browse' | 'live' | 'search' | 'social'
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
    <header className='sticky top-0 z-50 bg-white'>
      <div className='flex items-center justify-between gap-6 px-6 py-3'>
        <Link to='/'>
          <img src={logo} alt='Santibet' className='h-15 w-full' />
        </Link>
        <nav className='lg:flex items-center gap-6 text-sm font-semibold hidden'>
          {primaryNavLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className='flex items-center gap-1.5'
            >
              {link.label}
              {typeof link.badge === 'number' && (
                <span className='text-error'>{link.badge}</span>
              )}
            </a>
          ))}

          <Dropdown
            align='start'
            menuClassName='min-w-[180px] rounded-lg shadow-lg py-2'
            menu={({ close }) => (
              <div className='flex flex-col'>
                {moreNavLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={close}
                    className='px-4 py-2 text-sm font-medium hover:bg-neutral-2'
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          >
            <span className='flex cursor-pointer items-center gap-1'>
              MORE
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
            </span>
          </Dropdown>
        </nav>
        <main className='ml-auto lg:flex items-center gap-2.5 hidden'>
          <Dropdown
            className='ml-auto flex-1 w-80!'
            menuClassName='w-full max-h-[70vh] overflow-y-auto rounded-lg shadow-lg'
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
              placeholder='Trade on anything'
            />
          </Dropdown>

          {user && (
            <>
              <button type='button' aria-label='Rewards' className='shrink-0'>
                <HugeiconsIcon icon={Award01Icon} size={22} />
              </button>
              <button
                type='button'
                aria-label='Notifications'
                className='shrink-0'
              >
                <HugeiconsIcon icon={Notification03Icon} size={22} />
              </button>
              <button type='button' aria-label='Menu' className='shrink-0'>
                <HugeiconsIcon icon={Menu01Icon} size={22} />
              </button>
            </>
          )}
        </main>

        {user ? (
          <Button
            type='button'
            text='Deposit cash'
            onClick={() => handleModalOpen('deposit')}
          />
        ) : (
          <div className='flex items-center gap-4'>
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
