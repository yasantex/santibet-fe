import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import Dropdown from '../globals/Dropdown'
import { NO_LABELS, YES_LABELS } from '../../utils/marketDisplay'

/** Market image, or the title's first letter when there's none. */
export const MarketThumb = ({
  imageUrl,
  title,
}: {
  imageUrl?: string | null
  title: string
}) =>
  imageUrl ? (
    <img
      src={imageUrl}
      alt=''
      className='h-10 w-10 shrink-0 rounded-md object-cover md:h-11 md:w-11'
    />
  ) : (
    <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-hover text-sm font-bold text-neutral-10 md:h-11 md:w-11'>
      {title.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )

/** "Yes ₦73" pill under a market title, tinted by side. */
export const OutcomeChip = ({
  label,
  price,
}: {
  label: string
  price?: string
}) => {
  const l = label.trim().toLowerCase()
  const tone = YES_LABELS.includes(l)
    ? 'bg-market-success text-success'
    : NO_LABELS.includes(l)
      ? 'bg-market-error text-error'
      : 'bg-hover text-black'
  return (
    <span
      className={`max-w-40 truncate rounded px-1.5 py-0.5 text-xs font-semibold ${tone}`}
    >
      {label}
      {price && ` ${price}`}
    </span>
  )
}

export type MenuOption<T extends string> = { value: T; label: string }

/** Toolbar dropdown: an icon, the current choice, and a caret. */
export const ToolbarMenu = <T extends string>({
  icon,
  value,
  options,
  onChange,
}: {
  icon: ReactNode
  value: T
  options: MenuOption<T>[]
  onChange: (value: T) => void
}) => (
  <Dropdown
    align='end'
    menuClassName='w-44 rounded-lg py-1'
    menu={({ close }) => (
      <div className='flex flex-col'>
        {options.map((opt) => (
          <button
            key={opt.value}
            type='button'
            onClick={() => {
              onChange(opt.value)
              close()
            }}
            className={`px-3 py-2 text-left text-sm hover:bg-hover ${
              value === opt.value ? 'font-semibold text-black' : 'text-neutral-10'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    )}
  >
    <span className='flex h-11 cursor-pointer items-center gap-1.5 rounded-[10px] border border-border px-3 text-sm font-semibold whitespace-nowrap text-black hover:bg-hover'>
      {icon}
      {options.find((o) => o.value === value)?.label}
      <HugeiconsIcon icon={ArrowDown01Icon} size={14} className='text-neutral-10' />
    </span>
  </Dropdown>
)

/** Shared skeleton / empty / error states for the portfolio tables. */
export const TableState = ({
  loading,
  error,
  empty,
  rows = 4,
}: {
  loading?: boolean
  error?: string | null
  empty?: string | null
  rows?: number
}) => {
  if (loading)
    return (
      <div className='flex flex-col gap-2'>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className='h-16 animate-pulse rounded-xl bg-card' />
        ))}
      </div>
    )
  const text = error ?? empty
  return text ? (
    <p className='py-12 text-center text-sm text-placeholder'>{text}</p>
  ) : null
}
