import { useEffect, useRef, useState } from 'react'
import { Button } from './Button'
import { HugeiconsIcon } from '@hugeicons/react'
import { FilterIcon, Cancel01Icon } from '@hugeicons/core-free-icons'

export interface FilterOption {
  label: string
  value: string
}

export interface FilterCategory {
  key: string
  label: string
  options: FilterOption[]
  multiple?: boolean
}

interface FilterComponentProps {
  categories: FilterCategory[]
  onApply?: (filters: Record<string, string[]>) => void
  onReset?: () => void
  buttonText?: string
  initialFilters?: Record<string, string[]>
}

const FilterComponent = ({
  categories,
  onApply,
  onReset,
  buttonText = 'Filter',
  initialFilters = {},
}: FilterComponentProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [draftFilters, setDraftFilters] =
    useState<Record<string, string[]>>(initialFilters)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDraftFilters(initialFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialFilters)])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setDraftFilters(initialFilters)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const totalSelected = Object.values(draftFilters).reduce(
    (sum, values) => sum + (values?.length || 0),
    0,
  )
  const appliedCount = Object.values(initialFilters).reduce(
    (sum, values) => sum + (values?.length || 0),
    0,
  )

  const toggleOption = (
    categoryKey: string,
    value: string,
    isMultiple: boolean,
  ) => {
    setDraftFilters((prev) => {
      const current = prev[categoryKey] || []
      const isSelected = current.includes(value)

      if (!isMultiple) {
        return { ...prev, [categoryKey]: isSelected ? [] : [value] }
      }

      return {
        ...prev,
        [categoryKey]: isSelected
          ? current.filter((v) => v !== value)
          : [...current, value],
      }
    })
  }

  const handleApply = () => {
    onApply?.(draftFilters)
    setIsOpen(false)
  }

  const handleReset = () => {
    setDraftFilters({})
    onReset?.()
    setIsOpen(false)
  }

  return (
    <div className='relative' ref={panelRef}>
      <button
        type='button'
        onClick={() => setIsOpen((prev) => !prev)}
        className='flex items-center gap-1.5 rounded-full hover:bg-hover cursor-pointer border border-border bg-card px-3.5 py-2 text-xs font-semibold text-black'
      >
        <HugeiconsIcon icon={FilterIcon} size={14} />
        {buttonText}
        {appliedCount > 0 && (
          <span className='flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] text-white'>
            {appliedCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className='absolute right-0 top-full z-50 mt-2 w-60 md:w-70 rounded-lg border border-border bg-white shadow-lg'>
          <div className='flex items-center justify-between border-b border-border px-4 py-3'>
            <span className='text-sm font-semibold text-black'>Filters</span>
            <button
              type='button'
              onClick={() => setIsOpen(false)}
              className='text-neutral-10'
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>
          </div>

          <div className='flex max-h-60 flex-col gap-4 overflow-y-auto px-4 py-3'>
            {categories.map((category) => {
              const isMultiple = category.multiple ?? true
              const selectedValues = draftFilters[category.key] || []

              return (
                <div key={category.key} className='flex flex-col gap-2'>
                  <span className='text-xs font-semibold text-neutral-10'>
                    {category.label}
                  </span>
                  <div className='flex flex-wrap gap-2'>
                    {category.options.map((option) => {
                      const isSelected = selectedValues.includes(option.value)
                      return (
                        <button
                          key={option.value}
                          type='button'
                          onClick={() =>
                            toggleOption(category.key, option.value, isMultiple)
                          }
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            isSelected
                              ? 'border-black bg-black text-white'
                              : 'border-border bg-white text-black'
                          }`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                    {category.options.length === 0 && (
                      <span className='text-xs text-neutral-10'>
                        No options available
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className='flex items-center justify-between gap-2 border-t border-border px-4 py-3'>
            <Button
              type='button'
              text={'Reset'}
              variation='plain'
              size='medium'
              onClick={handleReset}
            />
            <Button
              type='button'
              text={totalSelected > 0 ? `Apply (${totalSelected})` : 'Apply'}
              variation='primary'
              size='medium'
              onClick={handleApply}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterComponent
