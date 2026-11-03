import { HugeiconsIcon } from '@hugeicons/react'
import { SlidersHorizontalIcon } from '@hugeicons/core-free-icons'
import Dropdown from '../globals/Dropdown'
import { useOddsFormat } from '../../hooks/useOddsFormat'
import type { OddsFormat } from '../../utils/marketDisplay'

const OPTIONS: { value: OddsFormat; label: string; example: string }[] = [
  { value: 'percent', label: 'Percentage', example: '58%' },
  { value: 'odds', label: 'Odds', example: '×1.73' },
]

/** Toolbar icon for switching how outcome prices read: chance or odds. */
const OddsFormatMenu = () => {
  const { format, setFormat } = useOddsFormat()
  return (
    <Dropdown
      align='end'
      menuClassName='w-52 rounded-lg py-1'
      menu={({ close }) => (
        <div className='flex flex-col'>
          <p className='px-3 pt-1.5 pb-1 text-xs font-medium text-neutral-10'>
            Odds format
          </p>
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type='button'
              aria-pressed={format === opt.value}
              onClick={() => {
                setFormat(opt.value)
                close()
              }}
              className={`flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-hover ${
                format === opt.value
                  ? 'font-semibold text-black'
                  : 'text-neutral-10'
              }`}
            >
              <span>
                {opt.label}
                <span className='ml-1.5 text-xs font-normal text-neutral-10'>
                  {opt.example}
                </span>
              </span>
              {format === opt.value && (
                <span className='h-2 w-2 shrink-0 rounded-full bg-brand-green' />
              )}
            </button>
          ))}
        </div>
      )}
    >
      <div
        aria-label='Odds format'
        className='rounded-full bg-card p-2 text-neutral-10 hover:text-black'
      >
        <HugeiconsIcon icon={SlidersHorizontalIcon} size={18} />
      </div>
    </Dropdown>
  )
}

export default OddsFormatMenu
