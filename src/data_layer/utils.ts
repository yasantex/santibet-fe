import { useQuery } from '@tanstack/react-query'
import {
  type UseQueryOptions,
  useMutation,
  type UseMutationOptions,
  type QueryKey,
  type MutationFunction,
  type MutationKey,
} from '@tanstack/react-query'
import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { Cookies, useCookies } from 'react-cookie'

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>

type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T

interface QueryProps<TData> {
  path: string
  headers?: Record<string, string>
  enabled?: boolean
  queryOptions?: Omit<
    UseQueryOptions<TData, Error, TData>,
    'queryKey' | 'queryFn'
  >
  queryKey?: QueryKey
  params?: QueryParams
  onSuccess?: (data: TData) => void
  responseType?: 'json' | 'blob' | 'document' | 'formdata' | 'stream' | 'text'
}

interface MutationProps<TData, TVariables> {
  path: string
  method?: HttpMethod
  headers?: Record<string, string>
  mutationOptions?: Omit<
    UseMutationOptions<TData, Error, TVariables, unknown>,
    'mutationFn'
  >
  mutationFn?: MutationFunction<TData, TVariables> | undefined
  params?: QueryParams
  mutationKey?: MutationKey
  responseType?: 'json' | 'blob' | 'document' | 'formdata' | 'stream' | 'text'
}

type HttpMethod = 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * Returns the queryKey for a react-query request. The key is obtained by splitting the url into fragments
 * @param url - API endpoint
 * @param params - optional query parameters
 * @returns array - queryKey
 */
export const getReactQueryKey = (url: string, params?: QueryParams) => {
  return [...url.split('/').filter((fragment) => fragment), params || {}]
}
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASE_URL || '',
  timeout: 180000,
})
apiClient.defaults.withCredentials = true

const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  secure: true,
  maxAge: 60 * 60 * 24 * 7,
}

const refreshAuthToken = async () => {
  const response = await apiClient.post(
    '/auth/refresh',
    {},
    { withCredentials: true },
  )
  return response.data as {
    accessToken: string
    refreshToken?: string
    expiresIn: number
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
    ) {
      originalRequest._retry = true
      try {
        const refreshData = await refreshAuthToken()
        if (refreshData?.accessToken) {
          const cookies = new Cookies()
          cookies.set('token', refreshData.accessToken, COOKIE_OPTIONS)

          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${refreshData.accessToken}`,
          }

          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)
/**
 * Helper function to append query params to URL.
 */
const buildQueryParams = <T extends Record<string, unknown>>(
  params: T = {} as T,
): string => {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => Boolean(value)),
  ) as Record<keyof T, Truthy<T[keyof T]>>

  const queryString = new URLSearchParams(
    filteredParams as Record<string, string>,
  ).toString()
  return queryString ? `?${queryString}` : ''
}

export const useSantiBetQuery = <TData = unknown>({
  path,
  headers = {},
  queryOptions,
  enabled,
  queryKey,
  params = {},
  onSuccess,
  responseType = 'json',
}: QueryProps<TData>) => {
  const [cookies] = useCookies(['token'])

  const _headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(cookies?.token ? { Authorization: `Bearer ${cookies.token}` } : {}),
    ...headers,
    // api_token: cookies?.aToken || '',
  }
  const url = `${path}${buildQueryParams(params)}`
  const fetchData = async () => {
    const config: AxiosRequestConfig = {
      url,
      method: 'GET',
      headers: _headers,
      responseType: responseType || 'json',
    }
    const response = await apiClient.request<TData>(config)
    return response.data
  }

  const queryResult = useQuery<TData, Error>({
    queryKey: queryKey || [path, params],
    queryFn: fetchData,
    ...(queryOptions || {}),
    enabled: !!cookies?.token && enabled,
  })

  // onSuccess callback have been deprecated in the react-query v5 that we are using, let's manually create it, If onSuccess handler is provided, invoke it when the query succeeds
  if (queryResult.isSuccess && onSuccess) {
    onSuccess(queryResult.data!)
  }

  return queryResult
}

export const useSantiBetMutation = <TData = unknown, TVariables = unknown>({
  path,
  method = 'POST',
  headers = {},
  mutationOptions,
  mutationFn,
  params = {},
  responseType = 'json',
  mutationKey,
}: MutationProps<TData, TVariables>) => {
  const [cookies] = useCookies(['token'])
  const _headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(cookies?.token ? { Authorization: `Bearer ${cookies.token}` } : {}),
    ...headers,
  }
  const url = `${path}${buildQueryParams(params)}`
  const sendData = async (variables: TVariables) => {
    const config: AxiosRequestConfig = {
      url,
      method,
      headers: _headers,
      data: variables,
      responseType: responseType || 'json',
      withCredentials: true,
    }
    const response = await apiClient.request<TData>(config)
    return response.data
  }

  return useMutation<TData, Error, TVariables>({
    mutationKey: mutationKey || getReactQueryKey(path, params),
    mutationFn: mutationFn || sendData,
    ...mutationOptions,
  })
}

export const useSantiBetInfiniteQuery = <TData = unknown>({
  path,
  headers = {},
  queryOptions,
  enabled,
  queryKey,
  params = {},
  onSuccess,
  responseType = 'json',
}: QueryProps<TData>) => {
  const [cookies] = useCookies(['token'])
  const _headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(cookies?.token ? { Authorization: `Bearer ${cookies.token}` } : {}),
    ...headers,
    api_token: cookies?.token || '',
  }
  const url = `${path}${buildQueryParams(params)}`
  const fetchData = async () => {
    const config: AxiosRequestConfig = {
      url,
      method: 'GET',
      headers: _headers,
      responseType: responseType || 'json',
    }
    const response = await apiClient.request<TData>(config)
    return response.data
  }

  const queryResult = useQuery<TData, Error>({
    queryKey: queryKey || [path, params],
    queryFn: fetchData,
    ...(queryOptions || {}),
    enabled: !!cookies?.token && enabled,
  })

  // onSuccess callback have been deprecated in the react-query v5 that we are using, let's manually create it, If onSuccess handler is provided, invoke it when the query succeeds
  if (queryResult.isSuccess && onSuccess) {
    onSuccess(queryResult.data!)
  }

  return queryResult
}
