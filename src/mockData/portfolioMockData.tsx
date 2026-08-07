import { useEffect, useState } from 'react'
import type { PortfolioData } from '../types/portfolio.types'

const mockPortfolioData: PortfolioData = {
  stats: {
    portfolioValue: 142300,
    totalPnl: 18200,
    openPositionsCount: 2,
  },
  positions: [
    {
      id: 'pos-1',
      status: 'open',
      question: 'Will the presidential election be decided by December 2026?',
      side: 'yes',
      yesPercent: 72,
      noPercent: 28,
      staked: 10000,
      value: 13900,
    },
    {
      id: 'pos-2',
      status: 'open',
      question: 'Will the Naira strengthen past ₦1,400/$ by Q4?',
      side: 'no',
      yesPercent: 72,
      noPercent: 28,
      staked: 5000,
      value: 4200,
    },
    {
      id: 'pos-3',
      status: 'settled',
      question: 'Will Bitcoin close above $100k in 2025?',
      side: 'yes',
      yesPercent: 100,
      noPercent: 0,
      staked: 8000,
      value: 15600,
    },
  ],
}

const FAKE_DELAY_MS = 500

export const useMockPortfolioData = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<PortfolioData | null>(null)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setData(mockPortfolioData)
      setIsLoading(false)
    }, FAKE_DELAY_MS)

    return () => clearTimeout(timer)
  }, [])

  return { data, isLoading }
}