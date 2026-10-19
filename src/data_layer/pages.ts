import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { apiClient } from './utils'
import type {
  ContentPage,
  ContentPageListResponse,
} from '../types/pages.types'

/**
 * Admin-managed content pages (terms, privacy, FAQ, contact, …). Public — no
 * session needed, so these go straight through `apiClient` rather than
 * `useSantiBetQuery`, which waits for a token. The API caches for 60s, so
 * there's no point re-reading more often than that.
 */

export const CONTENT_PAGES_KEY = ['pages']

const CACHE_FOR_A_MINUTE = { staleTime: 60_000 }

/** The page isn't published (or the endpoint isn't there yet) — don't retry. */
export const isPageNotFound = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 404

export const useContentPages = () =>
  useQuery({
    queryKey: CONTENT_PAGES_KEY,
    queryFn: async () =>
      (await apiClient.get<ContentPageListResponse>('/pages')).data.data,
    retry: (count, error) => !isPageNotFound(error) && count < 2,
    ...CACHE_FOR_A_MINUTE,
  })

export const useContentPage = (slug: string) =>
  useQuery({
    queryKey: [...CONTENT_PAGES_KEY, slug],
    queryFn: async () =>
      (await apiClient.get<ContentPage>(`/pages/${encodeURIComponent(slug)}`))
        .data,
    retry: (count, error) => !isPageNotFound(error) && count < 2,
    enabled: !!slug,
    ...CACHE_FOR_A_MINUTE,
  })
