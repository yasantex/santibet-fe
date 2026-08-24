import { useState } from "react"
import { useSantiBetQuery } from "../data_layer/utils"
import type { BaseApiResponse } from "../types/types"
import { useDebounce } from 'use-debounce'


export interface Banks {
  name: string
  code: string
}

export type BanksResponse = BaseApiResponse & {
  data: Banks[]
}
export const useBankOptions = () => {
  const [search, setSearch] = useState<string>('')
  const [debouncedSearch] = useDebounce(search, 1000)

  const { data, isLoading, refetch } = useSantiBetQuery<BanksResponse>({
    path: '/wallet/banks',
    params: {
      search: debouncedSearch,
    },
  })

  return {
    banksData: data?.data,
    isLoading,
    refetch,
    debouncedSearch,
    search,
    setSearchBanks: setSearch,
  }
}