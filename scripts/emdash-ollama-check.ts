#!/usr/bin/env bun
/**
 * Emdash – Ollama runtime detection probe.
 *
 * Run: bun scripts/emdash-ollama-check.ts [baseUrl]
 * Default baseUrl: http://127.0.0.1:11434
 *
 * Exit codes:
 *   0 – Ollama reachable
 *   1 – unreachable / error
 */

const baseUrl = (process.argv[2] ?? 'http://127.0.0.1:11434').replace(/\/$/, '')

async function main() {
  console.log(`Probing Ollama at ${baseUrl} ...`)
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) {
      console.error(`HTTP ${res.status} ${res.statusText}`)
      process.exit(1)
    }
    const data = (await res.json()) as { models?: Array<{ name: string; size?: number; details?: { family?: string } }> }
    const models = data.models ?? []
    console.log(`Ollama reachable. Installed models: ${models.length}`)
    for (const m of models) {
      const sizeMb = m.size ? (m.size / 1024 / 1024).toFixed(0) + ' MB' : 'unknown size'
      console.log(`  - ${m.name} (${sizeMb})`)
    }
    // OpenAI-compatible endpoint check
    try {
      const v1 = await fetch(`${baseUrl}/v1/models`, { signal: AbortSignal.timeout(5000) })
      console.log(`OpenAI-compatible /v1/models: ${v1.status} ${v1.statusText}`)
    } catch (e) {
      console.warn(`OpenAI-compatible endpoint not available: ${(e as Error).message}`)
    }
    process.exit(0)
  } catch (e) {
    console.error(`Ollama not reachable: ${(e as Error).message}`)
    console.error('Install from https://ollama.com and start the service, then re-run.')
    process.exit(1)
  }
}

main()
