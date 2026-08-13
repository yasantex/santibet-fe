import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons'
import type { SearchResult } from '../utils/constants'
import { HugeiconsIcon } from '@hugeicons/react'

type SearchResultsListProps = {
  results: SearchResult[]
  onSelect?: (result: SearchResult) => void
  emptyLabel?: string
}

const ChangeIndicator = ({
  change,
  direction,
}: {
  change: number | null
  direction: SearchResult['direction']
}) => {
  if (change === null) {
    return <span className='text-sm text-neutral-30'>--</span>
  }

  const color = direction === 'up' ? 'text-brand-green' : 'text-red-500'

  return (
    <span className={`flex items-center gap-0.5 text-sm font-medium ${color}`}>
      {direction === 'up' ? (
        <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
      ) : (
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
      )}
      {change}
    </span>
  )
}

const SearchResultsList = ({
  results,
  onSelect,
  emptyLabel = 'No results found',
}: SearchResultsListProps) => {
  if (results.length === 0) {
    return (
      <div className='py-10 text-center text-sm text-neutral-30'>
        {emptyLabel}
      </div>
    )
  }

  return (
    <ul className='flex flex-col'>
      {results.map((result) => (
        <li key={result.id}>
          <button
            type='button'
            onClick={() => onSelect?.(result)}
            className='flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-hover'
          >
            <span
              className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold'
              style={{
                backgroundColor: result.iconBg,
                color: result.iconTextColor ?? '#111827',
              }}
            >
              {result.iconLabel}
            </span>

            <span className='flex min-w-0 flex-1 flex-col'>
              <span className='truncate text-sm font-medium text-black'>
                {result.title}
              </span>
              <span className='truncate text-xs text-neutral-10'>
                {result.subtitle}
              </span>
            </span>

            <span className='flex shrink-0 flex-col items-end gap-0.5'>
              <span className='text-sm font-semibold text-black'>
                {result.percentage}%
              </span>
              <ChangeIndicator
                change={result.change}
                direction={result.direction}
              />
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export default SearchResultsList
