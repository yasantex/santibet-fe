import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import {
  ArrowDown01Icon,
  MultiplicationSignIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ErrorText } from './ReusedText'
import classNames from 'classnames'
import { Checkbox } from './Checkbox'

export type OptionItem = {
  label: string
  value: string | number
}

export type CustomSelectorProps = {
  placeholder?: string
  placeholderIcon?: string
  options: OptionItem[]
  value: string | number | (string | number)[] | null
  onChange: (value: any) => void
  multiple?: boolean
  enableSearch?: boolean
  label?: string
  hasLabel?: boolean
  containerClassName?: string
  searchPlaceholder?: string
  hasCheckIcon?: boolean
  disabled?: boolean
  onSearchChange?: (searchTerm: string) => void
  searchByLabel?: boolean
  optional?: boolean
  subTitle?: string
  errors?: string
}

const CustomSelector: React.FC<CustomSelectorProps> = ({
  placeholder = 'Select',
  options = [],
  value = null,
  onChange = () => {},
  multiple = false,
  enableSearch = false,
  label,
  hasLabel = false,
  containerClassName,
  searchPlaceholder = 'Search',
  hasCheckIcon = false,
  disabled = false,
  onSearchChange,
  searchByLabel = false,
  optional = false,
  subTitle,
  errors = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<{
    top?: number
    bottom?: number
    left: number
    width: number
  } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredOptions =
    enableSearch && searchTerm
      ? options.filter((opt) =>
          searchByLabel
            ? String(opt.label).toLowerCase().includes(searchTerm.toLowerCase())
            : String(opt.value)
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
        )
      : options

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value
    setSearchTerm(newSearchTerm)
    if (onSearchChange) onSearchChange(newSearchTerm)
  }

  const handleOptionSelect = (selectedOption: OptionItem) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      const isSelected = currentValues.includes(selectedOption.value)
      const updatedValues = isSelected
        ? currentValues.filter((v) => v !== selectedOption.value)
        : [...currentValues, selectedOption.value]
      onChange(updatedValues)
    } else {
      onChange(selectedOption.value)
      setIsOpen(false)
      setSearchTerm('')
    }
  }

  const computePosition = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const dropdownHeight = 160
    const spaceBelow = viewportHeight - rect.bottom

    if (spaceBelow < dropdownHeight) {
      setDropdownPosition({
        bottom: viewportHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
      })
    } else {
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
  }

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return
    computePosition()
    window.addEventListener('scroll', computePosition, true)
    window.addEventListener('resize', computePosition)
    return () => {
      window.removeEventListener('scroll', computePosition, true)
      window.removeEventListener('resize', computePosition)
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const renderSelected = () => {
    if (multiple) {
      if (!Array.isArray(value) || value.length === 0)
        return (
          <div className='font-normal text-placeholder text-sm'>
            {placeholder}
          </div>
        )
      const selectedOptions = options.filter(
        (opt) => Array.isArray(value) && value.includes(opt.value),
      )
      return (
        <div className='flex flex-wrap gap-2'>
          {selectedOptions.map((opt) => (
            <div
              key={opt.value}
              className='flex items-center gap-1.5 bg-hover px-2 py-1 rounded'
              onClick={(e) => e.stopPropagation()}
            >
              <span className='text-sm font-bold text-neutral-10'>{opt.label}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const updatedValues = Array.isArray(value)
                    ? value.filter((v) => v !== opt.value)
                    : []
                  onChange(updatedValues)
                }}
                className='hover:opacity-50'
              >
                <HugeiconsIcon icon={MultiplicationSignIcon} size={16} />
              </button>
            </div>
          ))}
        </div>
      )
    } else {
      const selected = options.find((opt) => opt.value === value)
      return selected?.label ? (
        <div className='font-bold text-neutral-10! text-sm'>{selected.label}</div>
      ) : (
        <div className='font-normal text-placeholder text-sm'>
          {placeholder}
        </div>
      )
    }
  }

  const isOptionSelected = (optValue: string | number) => {
    if (multiple) return Array.isArray(value) && value.includes(optValue)
    return value === optValue
  }

  const dropdownPortal =
    isOpen && dropdownPosition
      ? ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              zIndex: 9999,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              ...(dropdownPosition.top !== undefined
                ? { top: dropdownPosition.top }
                : { bottom: dropdownPosition.bottom }),
              maxHeight: 160,
              overflowY: 'auto',
              background: 'var(--color-background)',
              border: '0.5px solid var(--color-border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            {enableSearch && (
              <div className='flex items-center justify-center my-2.5 h-12 px-2.5 w-full'>
                <div className='flex items-center w-full h-10 gap-2.5 px-3 py-2 border-[0.5px] border-border bg-hover!'>
                  <HugeiconsIcon icon={Search01Icon} size={16} />
                  <input
                    type='text'
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={searchPlaceholder}
                    className='w-full py-1! h-10! placeholder:text-placeholder! placeholder:font-normal text-xs font-medium text-black focus:outline-none focus:border-border'
                  />
                </div>
              </div>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleOptionSelect(option)}
                  className={`flex items-center gap-2 text-black text-sm px-3! py-2.5! cursor-pointer hover:bg-hover ${
                    isOptionSelected(option.value) ? 'bg-hover' : ''
                  }`}
                >
                  {(multiple || hasCheckIcon) && (
                    <Checkbox
                      checkStatus={isOptionSelected(option.value)}
                      handleChange={() => handleOptionSelect(option)}
                    />
                  )}
                  <span className='text-xs font-medium text-neutral-10'>
                    {option.label}
                  </span>
                </div>
              ))
            ) : (
              <div className='text-black font-medium text-center text-sm px-3! py-2!'>
                No results found
              </div>
            )}
          </div>,
          document.body,
        )
      : null

  return (
    <div
      className={`flex flex-col relative w-full h-full ${containerClassName}`}
      ref={containerRef}
    >
      <div className='flex items-center gap-1'>
        {hasLabel && <h2 className='text-sm text-neutral-10'>{label}</h2>}
        {optional && (
          <span className='text-neutral-10 text-xs'>- (Optional)</span>
        )}
      </div>
      {subTitle && (
        <span className='text-sm mt-2 text-neutral-10 font-medium'>
          {subTitle}
        </span>
      )}

      <button
        className={classNames(
          'flex justify-between text-black  focus-within:border-brand-green focus-within:border-2 rounded items-center px-3! py-2.5 bg-transparent border border-border cursor-pointer w-full transition-all duration-300',
          multiple ? 'min-h-11!' : 'h-11!',
          hasLabel && 'mt-2',
          errors ? 'border-error!' : 'border-border',
          disabled && 'bg-gray-100! cursor-not-allowed opacity-60',
        )}
        type='button'
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            if (!isOpen) computePosition()
            setIsOpen((prev) => !prev)
          }
        }}
      >
        <span className='font-medium text-neutral-10 text-sm'>
          {renderSelected()}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={14}
          className={`transform transition-transform ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {errors && <ErrorText text={errors} />}
      {dropdownPortal}
    </div>
  )
}

export default CustomSelector
