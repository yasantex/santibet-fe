import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { type SearchResult } from '../utils/constants'
import SearchResultsList from '../data_layer/SearchResultsList'
import { useMarketSearch } from '../data_layer/markets'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import type { ModalProps } from '../components/globals/ModalComponent'

type MobileSearchOverlayProps = ModalProps & {
  onSelectResult?: (result: SearchResult) => void
}

const MobileSearchOverlay = ({
  open,
  handleClose,
  onSelectResult,
}: MobileSearchOverlayProps) => {
  const [searchTerm, setSearchTerm] = useState('')

  // Reset the query each time the overlay is opened fresh.
  useEffect(() => {
    if (open) setSearchTerm('')
  }, [open])

  const { results } = useMarketSearch(searchTerm)

  if (!open) return null

  return ReactDOM.createPortal(
    <div className='fixed inset-0 z-999 flex flex-col bg-white lg:hidden'>
      <div className='flex items-center gap-3 border-b border-border px-4 py-3'>
        <div className='flex flex-1 text-black items-center gap-2.5 rounded-full border border-border bg-form-bg px-3.5 py-2.5'>
          <HugeiconsIcon icon={Search01Icon} size={18} />
          <input
            autoFocus
            type='text'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='Search markets and profiles'
            className='w-full bg-transparent text-sm font-medium text-black placeholder:text-neutral-30 focus:outline-none'
          />
        </div>
        <button type='button' className='text-black' onClick={handleClose} aria-label='Close search'>
          <HugeiconsIcon icon={Cancel01Icon} size={22} />
        </button>
      </div>

      <div className='flex-1 overflow-y-auto'>
        <SearchResultsList results={results} onSelect={onSelectResult} />
      </div>
    </div>,
    document.body,
  )
}

export default MobileSearchOverlay
