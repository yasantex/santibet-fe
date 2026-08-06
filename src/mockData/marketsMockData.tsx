import { useEffect, useState } from "react"
import type { DashboardData, FeaturedMarket, HotTopic, Market } from "../types/market.types"
import type { MarketCategory } from "../utils/constants"


export const mockFeaturedMarket: FeaturedMarket = {
  id: 'featured-1',
  question: 'Will the presidential election be decided by December 2026?',
  category: 'Politics',
  yesPercent: 72,
  noPercent: 28,
  volume: '2.4M',
  changePercent: 11,
  chartData: [
    { value: 58 },
    { value: 64 },
    { value: 60 },
    { value: 68 },
    { value: 66 },
    { value: 74 },
    { value: 70 },
    { value: 78 },
    { value: 76 },
    { value: 82 },
  ],
}

export const mockHotTopics: HotTopic[] = [
  {
    id: 'hot-1',
    question: 'Naira strengthens past ₦1,400/$?',
    percent: 34,
  },
  {
    id: 'hot-2',
    question: 'CBN cuts interest rates this quarter?',
    percent: 61,
  },
  {
    id: 'hot-3',
    question: 'Bitcoin closes above $150k?',
    percent: 48,
  },
  {
    id: 'hot-4',
    question: 'Afrobeats wins a Grammy in 2026?',
    percent: 19,
  },
  {
    id: 'hot-5',
    question: 'Nigeria qualifies for 2026 World Cup?',
    percent: 55,
  },
]

export const mockMarkets: Market[] = [
  {
    id: 'market-1',
    question: 'Will Nigeria qualify for the 2026 World Cup?',
    category: 'Sports',
    yesPercent: 72,
    noPercent: 28,
    volume: '2.4M',
  },
  {
    id: 'market-2',
    question: 'Will the Naira strengthen past ₦1,400/$ by Q4?',
    category: 'Politics',
    yesPercent: 72,
    noPercent: 28,
    volume: '2.4M',
  },
  {
    id: 'market-3',
    question: 'Will Bitcoin close above $150k this year?',
    category: 'Crypto',
    yesPercent: 72,
    noPercent: 28,
    volume: '2.4M',
  },
  {
    id: 'market-4',
    question: 'Will the CBN cut interest rates this quarter?',
    category: 'Politics',
    yesPercent: 72,
    noPercent: 28,
    volume: '2.4M',
  },
  {
    id: 'market-5',
    question: 'Will Afrobeats win a Grammy in 2026?',
    category: 'Entertainment',
    yesPercent: 72,
    noPercent: 28,
    volume: '2.4M',
  },
  {
    id: 'market-6',
    question: 'Will Tinubu approve the new tax bill by August?',
    category: 'Politics',
    yesPercent: 72,
    noPercent: 28,
    volume: '2.4M',
  },
  {
    id: 'market-7',
    question: 'Will Davido release an album in 2026?',
    category: 'Entertainment',
    yesPercent: 72,
    noPercent: 28,
    volume: '2.4M',
  },
  {
    id: 'market-8',
    question: 'Will fuel prices drop below ₦900/L?',
    category: 'Politics',
    yesPercent: 72,
    noPercent: 28,
    volume: '2.4M',
  },
  {
    id: 'market-9',
    question: 'Will the Super Eagles win AFCON 2027?',
    category: 'Sports',
    yesPercent: 72,
    noPercent: 28,
    volume: '2.4M',
  },
  {
    id: 'market-10',
    question: 'Will Ethereum flip $6,000 in 2026?',
    category: 'Crypto',
    yesPercent: 72,
    noPercent: 28,
    volume: '2.4M',
  },
  {
    id: 'market-11',
    question: 'Will inflation fall below 20% by year end?',
    category: 'Politics',
    yesPercent: 72,
    noPercent: 28,
    volume: '2.4M',
  },
  {
    id: 'market-12',
    question: 'Will Burna Boy headline Coachella again?',
    category: 'Entertainment',
    yesPercent: 72,
    noPercent: 28,
    volume: '2.4M',
  },
]

const FAKE_DELAY_MS = 600

export const useMockDashboardData = (category: MarketCategory) => {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      const filteredMarkets =
        category === 'All'
          ? mockMarkets
          : mockMarkets.filter((m) => m.category === category)

      setData({
        featured: mockFeaturedMarket,
        hotTopics: mockHotTopics,
        markets: filteredMarkets,
      })
      setIsLoading(false)
    }, FAKE_DELAY_MS)

    return () => clearTimeout(timer)
  }, [category])

  return { data, isLoading }
}