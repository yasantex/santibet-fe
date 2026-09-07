import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'

const SearchInput = ({
  searchTerm,
  handleChange,
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
}) => {
  return (
    <div
      className={`flex w-full items-center gap-2.5  rounded-[10px] border border-glass bg-glass px-2.5
    focus-within:outline  focus-within:outline-brand-green focus-within:border-transparent focus-within:outline-border-2!
    ${containerClassName}`}
    >
      {showIcon && <HugeiconsIcon icon={Search01Icon} size={18} className=' text-black'/>}

      <input
        type='text'
        value={searchTerm}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className='h-11! w-full py-1! text-sm font-medium text-black outline-none placeholder:text-placeholder'
      />
    </div>
  )
}

export default SearchInput
