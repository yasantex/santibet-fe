import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCookies } from 'react-cookie'
import { apiClient } from './utils'
import type { WithdrawalChargesQuote } from '../types/wallet.types'

/**
 * The fee and statutory charges on a withdrawal of `amountKobo` (`POST
 * /wallet/withdrawal-quote`). Read-only: no balance check, no reservation.
 * The endpoint allows 60 calls per 15 minutes, so callers debounce the amount
 * and this never polls. Pass null until there's an amount worth pricing.
 */
export const useWithdrawalQuote = (amountKobo: string | null) => {
  const [cookies] = useCookies(['token'])
  const token = cookies?.token as string | undefined
  return useQuery<WithdrawalChargesQuote>({
    queryKey: ['withdrawal-quote', amountKobo],
    enabled: !!token && amountKobo != null,
    queryFn: async () => {
      const res = await apiClient.post<WithdrawalChargesQuote>(
        '/wallet/withdrawal-quote',
        { amount: amountKobo },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      return res.data
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  })
}
