#!/usr/bin/env bun
/**
 * Emdash agent bridge (typed JSON protocol).
 *
 * Input (stdin, one JSON object):
 *   { "prompt": string, "workspace": string, "model"?: string }
 * or argv: prompt [workspace]
 *
 * Output (stdout, one JSON object):
 *   { "ok": true, "text": string } | { "ok": false, "error": string }
 */
import { run } from '../sdk/src/run'
import { bundledAgents } from '../cli/src/agents/bundled-agents.generated'

async function readInput(): Promise<{ prompt: string; workspace: string; model?: string }> {
  if (process.argv[2]) {
    return { prompt: process.argv[2], workspace: process.argv[3] ?? process.cwd(), model: process.env.EMDASH_OLLAMA_MODEL }
  }
  const chunks: Buffer[] = []
  for await (const c of process.stdin) chunks.push(c as Buffer)
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  const parsed = raw ? JSON.parse(raw) : {}
  return {
    prompt: String(parsed.prompt ?? ''),
    workspace: String(parsed.workspace ?? process.cwd()),
    model: parsed.model ?? process.env.EMDASH_OLLAMA_MODEL,
  }
}

function out(obj: unknown) {
  process.stdout.write(JSON.stringify(obj) + '\n')
}

const input = await readInput()
if (!input.prompt) {
  out({ ok: false, error: 'missing prompt' })
  process.exit(2)
}

const byok = {
  id: 'emdash-ollama',
  revision: 1,
  name: 'Ollama',
  provider: 'openai-compatible' as const,
  model: input.model ?? 'llama3.1',
  baseUrl: 'http://127.0.0.1:11434/v1',
  credentialRef: 'env:OLLAMA_API_KEY',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  apiKey: 'ollama',
}

const allDefs = Object.values(bundledAgents)
const agentDef = bundledAgents['base-chat'] ?? allDefs[0]

let collected = ''
try {
  const result = await run({
    agent: agentDef as any,
    agentDefinitions: allDefs as any,
    prompt: input.prompt,
    cwd: input.workspace,
    byok: byok as any,
    handleStreamChunk: (c: any) => {
      if (typeof c === 'string') collected += c
    },
    handleEvent: (e: any) => {
      if (e?.type === 'assistant_message' && typeof e?.content === 'string') collected += e.content
    },
  } as any)
  const text = collected || (typeof result === 'string' ? result : '')
  if (!text.trim()) {
    out({ ok: false, error: 'agent returned an empty response' })
    process.exit(1)
  }
  out({ ok: true, text })
} catch (e) {
  out({ ok: false, error: (e as Error).message })
  process.exit(1)
}
