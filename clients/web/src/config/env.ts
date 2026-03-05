const defaultMediaServerUrl = 'http://localhost:8080'

function normalizeBaseUrl (value: string): string {
  try {
    const url = new URL(value)
    return url.toString().replace(/\/$/, '')
  } catch {
    return defaultMediaServerUrl
  }
}

export function getMediaServerUrl (): string {
  const configured = import.meta.env.VITE_MEDIA_SERVER_URL
  return normalizeBaseUrl(configured ?? defaultMediaServerUrl)
}
