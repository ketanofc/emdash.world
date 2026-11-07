import { describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'

describe('agent-bridge protocol', () => {
  test('returns JSON with ok field', () => {
    const r = spawnSync('bun', ['scripts/agent-bridge.ts'], {
      input: JSON.stringify({ prompt: '' }),
      encoding: 'utf8',
      timeout: 30000,
    })
    const lines = (r.stdout || '').trim().split('\n')
    const last = lines[lines.length - 1]
    let parsed: any
    try { parsed = JSON.parse(last) } catch { parsed = null }
    expect(parsed).not.toBeNull()
    expect(typeof parsed.ok).toBe('boolean')
  }, 30000)
})
