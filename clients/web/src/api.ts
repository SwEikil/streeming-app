import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export const api = axios.create({
  baseURL: API_URL
})

const TOKEN_KEY = 'streeming_access_token'
const REFRESH_KEY = 'streeming_refresh_token'

export function getApiBaseUrl (): string {
  return API_URL
}

export function getWsBaseUrl (): string {
  const url = new URL(API_URL)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.origin
}

export function setAuthToken (token: string | null): void {
  if (token != null) {
    localStorage.setItem(TOKEN_KEY, token)
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    localStorage.removeItem(TOKEN_KEY)
    delete api.defaults.headers.common.Authorization
  }
}

export function getStoredToken (): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setRefreshToken (token: string | null): void {
  if (token != null) {
    localStorage.setItem(REFRESH_KEY, token)
  } else {
    localStorage.removeItem(REFRESH_KEY)
  }
}

export function getRefreshToken (): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function clearAuth (): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  delete api.defaults.headers.common.Authorization
}

const storedToken = getStoredToken()
if (storedToken != null) {
  api.defaults.headers.common.Authorization = `Bearer ${storedToken}`
}

let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken (): Promise<string | null> {
  if (refreshInFlight != null) return await refreshInFlight

  refreshInFlight = (async () => {
    const refresh = getRefreshToken()
    if (refresh == null) return null
    try {
      const res = await axios.post<{ accessToken: string, refreshToken: string }>(
        `${API_URL}/auth/refresh`,
        { refreshToken: refresh }
      )
      const { accessToken, refreshToken: newRefresh } = res.data
      setAuthToken(accessToken)
      setRefreshToken(newRefresh)
      return accessToken
    } catch {
      clearAuth()
      return null
    } finally {
      refreshInFlight = null
    }
  })()

  return await refreshInFlight
}

type RetryRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const axiosError = error as AxiosError
    const original = axiosError.config as RetryRequestConfig | undefined
    const skipRefreshUrls = ['/auth/login', '/auth/register', '/auth/refresh']
    const shouldSkipRefresh = skipRefreshUrls.some(url => original?.url?.includes(url))
    if (
      axiosError.response?.status === 401 &&
      original != null &&
      !original._retry &&
      !shouldSkipRefresh
    ) {
      original._retry = true
      const accessToken = await refreshAccessToken()
      if (accessToken != null) {
          original.headers.Authorization = `Bearer ${accessToken}`
          return await api(original)
      }
    }
    return await Promise.reject(error)
  }
)
