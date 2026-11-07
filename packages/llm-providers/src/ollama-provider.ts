import { createOpenAICompatible } from './openai-compatible/openai-compatible-provider'

/**
 * Create an OpenAI-compatible provider pointed at a local Ollama instance.
 *
 * Ollama exposes an OpenAI-compatible endpoint at `${baseURL}/v1`. No API key
 * is required. Tool-calling support depends on the selected model.
 */
export function createOllamaProvider(options?: { baseURL?: string; name?: string }) {
  const baseURL = (options?.baseURL ?? 'http://127.0.0.1:11434').replace(/\/+$/, '')
  return createOpenAICompatible({
    name: options?.name ?? 'ollama',
    baseURL: `${baseURL}/v1`,
  })
}

export const OLLAMA_DEFAULT_BASE_URL = 'http://127.0.0.1:11434'
