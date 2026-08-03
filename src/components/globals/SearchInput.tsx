import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

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
      className={`flex items-center gap-2.5 px-2.5  bg-form-bg! ${containerClassName}`}
    >
      {showIcon && <HugeiconsIcon icon={Search01Icon} size={18} />}
      <input
        type='text'
        value={searchTerm}
        onChange={handleChange}
        placeholder={placeholder}
        className='w-full py-1! h-11! text-sm font-medium focus:outline-none text-black  placeholder:text-neutral-10!'
      />
    </div>
  )
}

export default SearchInput
