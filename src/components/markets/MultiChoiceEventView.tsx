import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, ChartLineData02Icon } from '@hugeicons/core-free-icons'
import { useOddsFormat } from '../../hooks/useOddsFormat'
import TradePanel from './TradePanel'
import MarketInfoTabs from './MarketInfoTabs'
import { useMarketChart } from '../../data_layer/markets'
import EventOutcomesChart from './EventOutcomesChart'
import ModalComponent from '../globals/ModalComponent'
import {
  categoryIcon,
  chanceLabel,
  eventMarketLabels,
  MARKET_STATUS_LABELS,
} from '../../utils/marketDisplay'
import { formatNairaCompact } from '../../utils/functions'
import type { UiEvent, UiMarket, UiOutcome } from '../../types/market.types'

const formatEndDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

/** One choice: name + volume, chance, Buy Yes / Buy No. */
const ChoiceRow = ({
  market,
  label,
  selected,
  selectedOutcomeId,
  onSelect,
}: {
  market: UiMarket
  label: string
  selected: boolean
  selectedOutcomeId?: string
  onSelect: (market: UiMarket, outcome?: UiOutcome) => void
}) => {
  const { priceLabel } = useOddsFormat()
  const open = market.status === 'open'
  const winner = market.resolvedOutcomeId
    ? market.outcomes.find((o) => o.id === market.resolvedOutcomeId)
    : undefined
  // Long shots read faded, as on Polymarket.
  const longShot = (market.yes?.price ?? 0) < 0.01
  const sides = [
    {
      outcome: market.yes,
      solid: 'bg-success text-white',
      soft: 'bg-market-success text-success hover:bg-success hover:text-white',
    },
    {
      outcome: market.no,
      solid: 'bg-error text-white',
      soft: 'bg-market-error text-error hover:bg-error hover:text-white',
    },
  ]

  return (
    <div
      role='button'
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onSelect(market)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect(market)
      }}
      className={`grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 rounded-lg border-b border-border/60 px-3 py-4 transition-colors md:grid-cols-[minmax(0,1fr)_120px_minmax(0,320px)] ${
        selected ? 'bg-hover' : 'hover:bg-hover/50'
      } ${open ? '' : 'opacity-70'}`}
    >
      <div className='flex min-w-0 flex-col gap-0.5'>
        <span className='truncate text-base font-semibold text-black'>{label}</span>
        <span className='text-xs text-neutral-10'>
          {formatNairaCompact(market.volume)} Vol.
        </span>
      </div>

      <span
        className={`text-right text-2xl font-bold tabular-nums md:text-center md:text-3xl ${
          longShot ? 'text-neutral-10/70' : 'text-black'
        }`}
      >
        {chanceLabel(market.yes)}
      </span>

      <div className='col-span-2 grid grid-cols-2 gap-2 md:col-span-1'>
        {open ? (
          sides.map(({ outcome, solid, soft }) =>
            outcome ? (
              <button
                key={outcome.id}
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(market, outcome)
                }}
                className={`cursor-pointer truncate rounded-lg px-2 py-3 text-sm font-semibold transition-colors ${
                  selected && selectedOutcomeId === outcome.id ? solid : soft
                }`}
              >
                Buy {outcome.label} {priceLabel(market, outcome)}
              </button>
            ) : null,
          )
        ) : (
          <span className='col-span-2 rounded-lg bg-hover/60 py-3 text-center text-sm font-semibold text-neutral-10'>
            {winner
              ? `Resolved · ${winner.label}`
              : (MARKET_STATUS_LABELS[market.status] ?? market.status)}
          </span>
        )}
      </div>
    </div>
  )
}

/** The selected choice's Rules and Recent Trades, below the list. */
const SelectedMarketInfo = ({
  market,
  outcomeId,
}: {
  market: UiMarket
  outcomeId?: string
}) => {
  // Same history the market page reads its trades from ('1w' is the range the
  // event chart loads, so the Yes side is usually already cached).
  const { data: chart } = useMarketChart(market.id, outcomeId, '1w')
  return <MarketInfoTabs rules={market.rules} trades={chart?.trades} />
}

interface MultiChoiceEventViewProps {
  event: UiEvent
  /** Start on this choice (opened from one market's link). */
  initialMarketId?: string
  initialOutcomeId?: string
}

/**
 * Polymarket's event view for an event made of many Yes/No markets
 * ("How many Fed rate cuts in 2026?"): chart of the leaders, one row per
 * choice, the order panel for the selected one, and its rules. Used by the
 * event page and by each of its markets' pages.
 */
const MultiChoiceEventView = ({
  event,
  initialMarketId,
  initialOutcomeId,
}: MultiChoiceEventViewProps) => {
  // Open choices first, each group in the event's own order.
  const markets = useMemo(
    () => [
      ...event.markets.filter((m) => m.status === 'open'),
      ...event.markets.filter((m) => m.status !== 'open'),
    ],
    [event],
  )
  const labels = useMemo(() => eventMarketLabels(markets), [markets])
  const [pick, setPick] = useState<{ marketId?: string; outcomeId?: string }>({
    marketId: initialMarketId,
    outcomeId: initialOutcomeId,
  })
  const [sheetOpen, setSheetOpen] = useState(false)

  const selectedMarket =
    markets.find((m) => m.id === pick.marketId) ?? markets[0]
  const selectedOutcome =
    selectedMarket?.outcomes.find((o) => o.id === pick.outcomeId) ??
    selectedMarket?.yes

  const select = (market: UiMarket, outcome?: UiOutcome) => {
    setPick({ marketId: market.id, outcomeId: outcome?.id ?? market.yes?.id })
    // Phones have no side panel: picking a side opens the ticket.
    if (outcome && !isDesktop()) setSheetOpen(true)
  }

  const volume = event.markets.reduce((sum, m) => sum + (m.volume || 0), 0)
  const endDate = formatEndDate(event.closeTime || markets[0]?.closeTime)

  const panel = selectedMarket && (
    <TradePanel
      market={selectedMarket}
      selectedOutcome={selectedOutcome}
      onSelectOutcome={(o) =>
        setPick({ marketId: selectedMarket.id, outcomeId: o.id })
      }
    />
  )

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]'>
      <div className='flex min-w-0 flex-col gap-5'>
        <div className='flex items-start gap-3'>
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt=''
              className='h-14 w-14 shrink-0 rounded-lg object-cover md:h-16 md:w-16'
            />
          ) : (
            <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-border/30 text-2xl'>
              {categoryIcon(event.category)}
            </div>
          )}
          <div className='flex min-w-0 flex-col gap-1'>
            <span className='text-sm text-neutral-10'>{event.category}</span>
            <h1 className='text-xl leading-tight font-bold text-black md:text-3xl'>
              {event.title}
            </h1>
          </div>
        </div>

        <EventOutcomesChart markets={markets} labels={labels} />

        <div className='flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/60 pb-3 text-sm text-neutral-10'>
          <span className='flex items-center gap-1.5 font-semibold text-black'>
            <HugeiconsIcon icon={ChartLineData02Icon} size={16} />
            {formatNairaCompact(volume)} Vol.
          </span>
          {endDate && (
            <span className='flex items-center gap-1.5'>
              <HugeiconsIcon icon={Calendar03Icon} size={16} />
              {endDate}
            </span>
          )}
          <span>{markets.length} markets</span>
        </div>

        <div className='-mt-3 flex flex-col'>
          {markets.map((m) => (
            <ChoiceRow
              key={m.id}
              market={m}
              label={labels.get(m.id) ?? m.title}
              selected={m.id === selectedMarket?.id}
              selectedOutcomeId={selectedOutcome?.id}
              onSelect={select}
            />
          ))}
        </div>

        {selectedMarket && (
          <SelectedMarketInfo
            key={selectedMarket.id}
            market={selectedMarket}
            outcomeId={selectedOutcome?.id}
          />
        )}
      </div>

      <aside className='hidden lg:sticky lg:top-24 lg:flex lg:flex-col lg:self-start'>
        {panel}
      </aside>

      <ModalComponent
        open={sheetOpen}
        handleClose={() => setSheetOpen(false)}
        title={labels.get(selectedMarket?.id ?? '') ?? event.title}
        className='max-w-md'
      >
        {panel}
      </ModalComponent>
    </div>
  )
}

export default MultiChoiceEventView
