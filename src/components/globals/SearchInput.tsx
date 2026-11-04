import { useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  MultiplicationSignIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons'

const SearchInput = ({
  searchTerm,
  handleChange,
  onClear,
  placeholder,
  containerClassName,
  showIcon = true,
  autoFocus = false,
}: {
  searchTerm: string
  placeholder: string
  showIcon?: boolean
  containerClassName?: string
  autoFocus?: boolean
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Called by the × button. Without it, the × sends `handleChange` an
   *  empty value, so every caller clears without extra wiring. */
  onClear?: () => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const clear = () => {
    if (onClear) onClear()
    else {
      const target = { value: '' } as HTMLInputElement
      handleChange({
        target,
        currentTarget: target,
      } as React.ChangeEvent<HTMLInputElement>)
    }
    // Keep typing straight away.
    inputRef.current?.focus()
  }

  return (
    <div
      className={`flex w-full items-center gap-2.5  rounded-[10px] border border-glass bg-glass px-2.5
    focus-within:outline  focus-within:outline-brand-green focus-within:border-transparent focus-within:outline-border-2!
    ${containerClassName}`}
    >
      {showIcon && <HugeiconsIcon icon={Search01Icon} size={18} className=' text-black'/>}

      <input
        ref={inputRef}
        type='text'
        value={searchTerm}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && searchTerm) {
            e.stopPropagation()
            clear()
          }
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className='h-11! w-full py-1! text-sm font-medium text-black outline-none placeholder:text-placeholder'
      />

      {/* Only once something's typed. */}
      {searchTerm.length > 0 && (
        <button
          type='button'
          aria-label='Clear search'
          // Keep focus in the input (so dropdowns tied to focus stay open).
          onMouseDown={(e) => e.preventDefault()}
          onClick={clear}
          className='flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-10 hover:bg-hover hover:text-black'
        >
          <HugeiconsIcon icon={MultiplicationSignIcon} size={14} />
        </button>
      )}
    </div>
  )
}

export default SearchInput
