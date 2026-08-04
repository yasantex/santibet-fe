import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'

const SearchInput = ({
  searchTerm,
  handleChange,
  placeholder,
  containerClassName,
  showIcon = true,
}: {
  searchTerm: string
  placeholder: string
  showIcon?: boolean
  containerClassName?: string
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  return (
    <div
      className={`flex w-full items-center gap-2.5 rounded-full border border-border px-2.5
    focus-within:outline  focus-within:outline-brand-green focus-within:border-transparent
    ${containerClassName}`}
    >
      {showIcon && <HugeiconsIcon icon={Search01Icon} size={18} />}

      <input
        type='text'
        value={searchTerm}
        onChange={handleChange}
        placeholder={placeholder}
        className='h-11! w-full py-1! text-sm font-medium text-black outline-none placeholder:text-neutral-10!'
      />
    </div>
  )
}

export default SearchInput
