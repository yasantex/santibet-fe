export interface MarketOutcome {
  id: string
  code: string 
  label: string
  price: number 
  priceCents: number 
  tone: 'success' | 'error' | 'neutral'
}

interface MarketOutcomesListProps {
  title: string
  subtitle?: string 
  status: 'Open' | 'Closed'
  volumeLabel: string 
  leadingPercent: number
  outcomes: MarketOutcome[]
  selectedOutcomeId?: string
  onSelectOutcome: (outcome: MarketOutcome) => void
}

const toneClasses: Record<MarketOutcome['tone'], { bg: string; text: string }> = {
  success: { bg: 'bg-market-success', text: 'text-success' },
  error: { bg: 'bg-market-error', text: 'text-error' },
  neutral: { bg: 'bg-border/30', text: 'text-neutral-10' },
}


const MarketOutcomesList = ({
  title,
  subtitle,
  status,
  volumeLabel,
  leadingPercent,
  outcomes,
  selectedOutcomeId,
  onSelectOutcome,
}: MarketOutcomesListProps) => {
  return (
    <div className='rounded-lg bg-card p-4'>
      <div className='mb-3 flex items-start justify-between'>
        <div>
          <h3 className='text-sm font-bold text-black'>
            {title}
            {subtitle && (
              <span className='ml-1.5 font-medium text-neutral-10'>
                {subtitle}
              </span>
            )}
          </h3>
          <p className='mt-1 text-xs text-placeholder'>{volumeLabel}</p>
        </div>
        <div className='text-right'>
          <p
            className={`text-xs font-semibold ${
              status === 'Open' ? 'text-success' : 'text-neutral-10'
            }`}
          >
            {status}
          </p>
          <p className='text-sm font-bold text-black'>{leadingPercent}%</p>
        </div>
      </div>

      <div
        className={`grid gap-2 ${
          outcomes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
        }`}
      >
        {outcomes.map((outcome) => {
          const tone = toneClasses[outcome.tone]
          const isSelected = outcome.id === selectedOutcomeId

          return (
            <button
              key={outcome.id}
              type='button'
              onClick={() => onSelectOutcome(outcome)}
              className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-bold transition-opacity ${tone.bg} ${tone.text} ${
                isSelected ? 'opacity-100 ring-2 ring-inset ring-black/10' : 'opacity-90 hover:opacity-100'
              }`}
            >
              <span>{outcome.label}</span>
              <span>₦{outcome.price.toLocaleString('en-NG', { maximumFractionDigits: 4 })}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MarketOutcomesList
