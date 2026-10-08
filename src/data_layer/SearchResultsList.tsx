import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons'
import type { SearchResult, SearchSection } from '../utils/constants'
import { HugeiconsIcon } from '@hugeicons/react'

type SearchResultsListProps = {
  sections: SearchSection[]
  onSelect?: (result: SearchResult) => void
  emptyLabel?: string
  loading?: boolean
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

const ResultThumb = ({ result }: { result: SearchResult }) =>
  result.imageUrl ? (
    <img
      src={result.imageUrl}
      alt=''
      loading='lazy'
      className='h-9 w-9 shrink-0 rounded-lg object-cover'
    />
  ) : (
    <span
      className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold'
      style={{
        backgroundColor: result.iconBg,
        color: result.iconTextColor ?? '#111827',
      }}
    >
      {result.iconLabel}
    </span>
  )

const SearchResultsList = ({
  sections,
  onSelect,
  emptyLabel = 'No results found',
  loading = false,
}: SearchResultsListProps) => {
  if (loading) {
    return (
      <div className='py-10 text-center text-sm text-neutral-30'>
        Searching…
      </div>
    )
  }

  if (!sections.some((section) => section.results.length > 0)) {
    return (
      <div className='py-10 text-center text-sm text-neutral-30'>
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className='flex flex-col py-1'>
      {sections.map((section) =>
        section.results.length ? (
          <section key={section.title}>
            <h3 className='px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-10'>
              {section.title}
            </h3>
            <ul className='flex flex-col'>
              {section.results.map((result) => (
                <li key={result.id}>
                  <button
                    type='button'
                    onClick={() => onSelect?.(result)}
                    className='flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-hover'
                  >
                    <ResultThumb result={result} />

                    <span className='flex min-w-0 flex-1 flex-col'>
                      <span className='truncate text-sm font-medium text-black'>
                        {result.title}
                      </span>
                      {result.subtitle && (
                        <span className='truncate text-xs text-neutral-10'>
                          {result.subtitle}
                        </span>
                      )}
                    </span>

                    {result.percentage !== undefined && (
                      <span className='flex shrink-0 flex-col items-end gap-0.5'>
                        <span className='text-sm font-semibold text-black'>
                          {result.percentage}%
                        </span>
                        <ChangeIndicator
                          change={result.change ?? null}
                          direction={result.direction}
                        />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
    </div>
  )
}

export default SearchResultsList
