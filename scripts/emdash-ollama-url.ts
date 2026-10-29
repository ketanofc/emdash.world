// Pure helpers for Ollama URL handling (no I/O).
export function normalizeBaseUrl(input: string | undefined): string {
  const raw = (input ?? 'http://127.0.0.1:11434').trim()
  return raw.replace(/\/+$/, '')
}

export function tagsUrl(baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}/api/tags`
}

export function openAiModelsUrl(baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}/v1/models`
}

export function isLocalhostUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.hostname === '127.0.0.1' || u.hostname === 'localhost' || u.hostname === '::1'
  } catch {
    return false
  }
}
