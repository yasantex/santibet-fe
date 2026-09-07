import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Bookmark02Icon } from '@hugeicons/core-free-icons'
import MarketCard from '../../components/markets/MarketCard'
import { fetchMarketById } from '../../data_layer/markets'
import { useFavorites } from '../../hooks/useFavorites'
import { marketHref } from '../../utils/marketDisplay'
import { showWarningToast } from '../../utils/toastUtils'
import type { UiMarket, UiOutcome } from '../../types/market.types'

const AccountFavorites = () => {
  const navigate = useNavigate()
  const { favorites, isFavorite, toggle: toggleFavorite } = useFavorites()
  const [activeCategory, setActiveCategory] = useState('All')
  const [checkingId, setCheckingId] = useState<string | null>(null)

  const categories = useMemo(() => {
    const set = new Set<string>()
    favorites.forEach((m) => m.category && set.add(m.category))
    return ['All', ...Array.from(set).sort()]
  }, [favorites])

  const filtered = useMemo(
    () =>
      activeCategory === 'All'
        ? favorites
        : favorites.filter(
            (m) => m.category.toLowerCase() === activeCategory.toLowerCase(),
          ),
    [favorites, activeCategory],
  )

  const goToMarket = async (market: UiMarket, outcome?: UiOutcome) => {
    if (checkingId) return
    setCheckingId(market.id)
    try {
      const fresh = await fetchMarketById(market.id, market.eventId)
      if (fresh.status !== 'open') {
        showWarningToast('This market is closed')
        return
      }
      navigate(marketHref(fresh, outcome?.id))
    } catch {
      showWarningToast('This market is closed')
    } finally {
      setCheckingId(null)
    }
  }

  return (
    <div className='flex flex-col gap-5'>
      <h1 className='text-lg font-bold text-black md:text-2xl'>
        My Favorites
      </h1>

      {categories.length > 1 && (
        <div className='hide-scroll-bar flex items-center gap-2 overflow-x-auto'>
          {categories.map((c) => (
            <button
              key={c}
              type='button'
              onClick={() => setActiveCategory(c)}
              className={`shrink-0 rounded-full border cursor-pointer px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeCategory === c
                  ? 'border-brand-green bg-brand-green/10 text-black'
                  : 'border-border bg-card text-black/60 hover:text-black'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {filtered.length ? (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          {filtered.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              isSaved={isFavorite(market.id)}
              onSave={toggleFavorite}
              onSelect={(m) => goToMarket(m)}
              onSelectOutcome={(m, o) => goToMarket(m, o)}
            />
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center gap-3 rounded-2xl bg-card py-20 text-center'>
          <HugeiconsIcon
            icon={Bookmark02Icon}
            size={28}
            className='text-neutral-10'
          />
          <p className='text-sm text-neutral-10'>
            {favorites.length
              ? `No saved events in ${activeCategory}.`
              : 'No saved events yet'}
          </p>
        </div>
      )}
    </div>
  )
}

export default AccountFavorites
