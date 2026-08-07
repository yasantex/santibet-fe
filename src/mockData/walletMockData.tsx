import { useEffect, useState } from 'react'
import type { WalletData } from '../types/wallet.types'

const mockWalletData: WalletData = {
  balance: {
    amount: 124500,
    changeAmount: 2940,
    changePercent: 2.4,
  },
  activity: [
    {
      id: 'act-1',
      type: 'deposit',
      title: 'Deposit',
      subtitle: 'Bank transfer · Today',
      amount: 50000,
    },
    {
      id: 'act-2',
      type: 'bet',
      title: 'Bet Placed',
      subtitle: 'Presidential Election · Today',
      amount: -10000,
    },
    {
      id: 'act-3',
      type: 'payout',
      title: 'Payout',
      subtitle: 'World Cup Qualifier · Yesterday',
      amount: 18200,
    },
    {
      id: 'act-4',
      type: 'withdrawal',
      title: 'Withdrawal',
      subtitle: 'Bank transfer · 2 days ago',
      amount: -20000,
    },
    {
      id: 'act-5',
      type: 'bet',
      title: 'Bet Placed',
      subtitle: 'Naira/USD Rate · 3 days ago',
      amount: -5000,
    },
  ],
}

const FAKE_DELAY_MS = 500

export const useMockWalletData = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<WalletData | null>(null)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setData(mockWalletData)
      setIsLoading(false)
    }, FAKE_DELAY_MS)

    return () => clearTimeout(timer)
  }, [])

  return { data, isLoading }
}