// Feature-flagged Ollama detection for the CLI.
// Enable with EMDASH_OLLAMA=1 (default off until verified end-to-end).

export const OLLAMA_FEATURE_ENABLED =
  process.env.EMDASH_OLLAMA === '1' || process.env.EMDASH_OLLAMA === 'true'

export async function detectOllama(
  baseUrl = 'http://127.0.0.1:11434',
): Promise<{ available: boolean; models: string[]; error?: string }> {
  if (!OLLAMA_FEATURE_ENABLED) {
    return { available: false, models: [], error: 'feature disabled' }
  }
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return { available: false, models: [], error: `HTTP ${res.status}` }
    const data = (await res.json()) as { models?: Array<{ name: string }> }
    return { available: true, models: (data.models ?? []).map((m) => m.name) }
  } catch (e) {
    return { available: false, models: [], error: (e as Error).message }
  }
}
