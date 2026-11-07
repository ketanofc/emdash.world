#!/usr/bin/env bun
/**
 * Emdash desktop host prototype (Bun, no Rust).
 * Serves the built desktop UI and proxies /api/run to scripts/agent-bridge.ts.
 * Usage: bun scripts/desktop-host.ts [port]
 */
import { serve } from 'bun'

const port = Number(process.argv[2] ?? 1421)
const root = new URL('../desktop/dist/', import.meta.url)

serve({
  port,
  async fetch(req) {
    const url = new URL(req.url)
    if (url.pathname === '/api/run' && req.method === 'POST') {
      const body = await req.json()
      const proc = Bun.spawn(['bun', 'scripts/agent-bridge.ts'], { stdin: 'pipe', stdout: 'pipe', stderr: 'pipe' })
      proc.stdin.write(JSON.stringify(body))
      proc.stdin.end()
      const out = await new Response(proc.stdout).text()
      const err = await new Response(proc.stderr).text()
      await proc.exited
      let parsed: any = null
      for (const line of out.trim().split('\n')) {
        try { parsed = JSON.parse(line) } catch {}
      }
      if (!parsed) return Response.json({ ok: false, error: err || 'no output' }, { status: 500 })
      return Response.json(parsed)
    }
    // static files
    let path = url.pathname === '/' ? '/index.html' : url.pathname
    const file = Bun.file(new URL('.' + path, root))
    if (await file.exists()) return new Response(file)
    return new Response('Not found', { status: 404 })
  },
})

console.log(`Emdash desktop host (prototype) listening on http://127.0.0.1:${port}`)
console.log('NOTE: This is a verification harness, not the Tauri desktop app.')
