import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar02Icon,
} from '@hugeicons/core-free-icons'
import { ErrorText } from './ReusedText'
import '../../../public/dateinput.css'
interface CustomDatePickerProps {
  value?: Date | string | null
  onChange: (date: string | null) => void
  placeholder?: string
  containerClassName?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  label?: string
  errors?: string
}

type CalendarView = 'month' | 'year' | 'decade' | 'century'

const formatToISODate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getCalendarPosition = (rect: DOMRect) => {
  const viewportWidth = window.innerWidth
  const targetWidth = Math.max(rect.width, 360)
  const width = Math.min(targetWidth, viewportWidth - 16)
  const left = Math.min(
    Math.max(rect.right - width, 8),
    viewportWidth - width - 8,
  )

  return { left, width }
}

const DateInput: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  containerClassName = '',
  minDate,
  maxDate,
  disabled = false,
  label,
  errors = '',
}) => {
  const selectedDate = value
    ? typeof value === 'string'
      ? (() => {
          const [y, m, d] = value.split('T')[0].split('-').map(Number)
          return new Date(y, m - 1, d)
        })()
      : value
    : null

  const [isOpen, setIsOpen] = useState(false)
  const [calendarPosition, setCalendarPosition] = useState<{
    top?: number
    bottom?: number
    left: number
    width: number
  } | null>(null)
  const [view, setView] = useState<CalendarView>('month')
  const containerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reposition on scroll or resize while open
  useEffect(() => {
    if (!isOpen) return
    const updatePosition = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const calendarHeight = 320
      const spaceBelow = viewportHeight - rect.bottom
      const { left, width } = getCalendarPosition(rect)

      if (spaceBelow < calendarHeight) {
        setCalendarPosition({
          bottom: viewportHeight - rect.top + 4,
          left,
          width,
        })
      } else {
        setCalendarPosition({
          top: rect.bottom + 4,
          left,
          width,
        })
      }
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (disabled) return
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const calendarHeight = 320
      const spaceBelow = viewportHeight - rect.bottom
      const { left, width } = getCalendarPosition(rect)

      if (spaceBelow < calendarHeight) {
        setCalendarPosition({
          bottom: viewportHeight - rect.top + 4,
          left,
          width,
        })
      } else {
        setCalendarPosition({
          top: rect.bottom + 4,
          left,
          width,
        })
      }
    }
    setIsOpen((prev) => !prev)
  }

  const handleDateChange = (
    date: Date | Date[] | [Date | null, Date | null] | null,
  ) => {
    if (date instanceof Date) {
      onChange(formatToISODate(date))
      setIsOpen(false)
      setView('month')
    } else if (Array.isArray(date) && date[0] instanceof Date) {
      onChange(formatToISODate(date[0]))
      setIsOpen(false)
      setView('month')
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return placeholder
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleMonthClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setView('year')
  }

  const handleYearClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setView('decade')
  }

  const calendarPortal =
    isOpen && calendarPosition
      ? ReactDOM.createPortal(
          <div
            ref={calendarRef}
            style={{
              position: 'fixed',
              zIndex: 9999,
              left: calendarPosition.left,
              ...(calendarPosition.top !== undefined
                ? { top: calendarPosition.top }
                : { bottom: calendarPosition.bottom }),
              width: calendarPosition.width,
              maxWidth: '400px',
              boxSizing: 'border-box',
              background: 'var(--color-background)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              borderRadius: 8,
            }}
          >
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              minDate={minDate}
              maxDate={maxDate}
              locale='en-US'
              prev2Label={null}
              next2Label={null}
              prevLabel={<HugeiconsIcon icon={ArrowLeft01Icon} size={14} />}
              nextLabel={<HugeiconsIcon icon={ArrowRight01Icon} size={14} />}
              view={view}
              onViewChange={({ view }) => setView(view)}
              navigationLabel={({ date, view }) => {
                if (view === 'month') {
                  return (
                    <div className='flex items-center gap-2'>
                      <div
                        onClick={handleMonthClick}
                        className='flex items-center gap-2 hover:bg-hover px-2 py-1 transition-colors cursor-pointer'
                      >
                        <span className='text-base font-semibold text-neutral-10'>
                          {date.toLocaleDateString('en-US', { month: 'long' })}
                        </span>
                        <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
                      </div>
                      <div
                        onClick={handleYearClick}
                        className='flex items-center gap-2 hover:bg-hover px-2 py-1 transition-colors cursor-pointer'
                      >
                        <span className='text-base font-semibold text-neutral-10'>
                          {date.getFullYear()}
                        </span>
                        <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
                      </div>
                    </div>
                  )
                }
                if (view === 'year') {
                  return (
                    <span className='text-base font-semibold text-black'>
                      {date.getFullYear()}
                    </span>
                  )
                }
                if (view === 'decade') {
                  const startYear = Math.floor(date.getFullYear() / 10) * 10
                  return (
                    <span className='text-base font-semibold text-black'>
                      {startYear} – {startYear + 9}
                    </span>
                  )
                }
                return null
              }}
              formatShortWeekday={(locale, date) =>
                ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
              }
            />
          </div>,
          document.body,
        )
      : null

  return (
    <div
      className={`flex flex-col gap-2.5 relative ${containerClassName}`}
      ref={containerRef}
    >
      <main className='flex flex-col'>
        {label && <p className='text-sm text-neutral-10'>{label}</p>}
        <button
          type='button'
          onClick={handleToggle}
          disabled={disabled}
          className='w-full px-4 mt-2 rounded py-2.5 h-11 text-left text-sm border border-border bg-transparent! focus-within:border-brand-green focus-within:border-2 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <span
            className={
              selectedDate
                ? 'text-neutral-10 text-sm font-medium block min-w-0 truncate'
                : 'text-placeholder font-normal block min-w-0 truncate'
            }
          >
            {formatDate(selectedDate)}
          </span>
          <HugeiconsIcon icon={Calendar02Icon} size={18} className='text-black' />
        </button>
        {errors && <ErrorText text={errors} />}
      </main>

      {calendarPortal}
    </div>
  )
}

export default DateInput
