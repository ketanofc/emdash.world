import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import './styles.css'

type Mode = 'beginner' | 'builder'
type Msg = { role: 'user' | 'assistant'; text: string }

const SUGGESTED = ['Build a website', 'Fix a bug', 'Explain code']

export default function App() {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('emdash.mode') as Mode) || 'beginner')
  const [messages, setMessages] = useState<Msg[]>(() => {
    try { return JSON.parse(localStorage.getItem('emdash.messages') || '[]') } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [workspace, setWorkspace] = useState<string | null>(null)
  const [ollama, setOllama] = useState<{ available: boolean; models: string[]; error?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [aborter, setAborter] = useState<AbortController | null>(null)
  const [filePath, setFilePath] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [newContent, setNewContent] = useState('')
  const [fileStatus, setFileStatus] = useState('')

  function simpleDiff(a: string, b: string): string {
    const la = a.split('\n')
    const lb = b.split('\n')
    const out: string[] = []
    const n = Math.max(la.length, lb.length)
    for (let i = 0; i < n; i++) {
      const x = la[i]
      const y = lb[i]
      if (x === y) out.push('  ' + (x ?? ''))
      else {
        if (x !== undefined) out.push('- ' + x)
        if (y !== undefined) out.push('+ ' + y)
      }
    }
    return out.join('\n')
  }

  useEffect(() => { localStorage.setItem('emdash.mode', mode) }, [mode])
  useEffect(() => { localStorage.setItem('emdash.messages', JSON.stringify(messages)) }, [messages])

  useEffect(() => {
    invoke<{ available: boolean; models: string[]; error?: string }>('detect_ollama')
      .then(setOllama)
      .catch((e) => setOllama({ available: false, models: [], error: String(e) }))
  }, [])

  async function pickWorkspace() {
    try {
      const dir = await invoke<string | null>('pick_workspace')
      if (dir) setWorkspace(dir)
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: `Workspace selection unavailable: ${e}` }])
    }
  }

  async function send(text: string) {
    const t = text.trim()
    if (!t) return
    setMessages((m) => [...m, { role: 'user', text: t }])
    setInput('')
    setBusy(true)
    const ac = new AbortController()
    setAborter(ac)
    try {
      const res = await invoke<string>('run_agent', { prompt: t, workspace })
      if (ac.signal.aborted) return
      setMessages((m) => [...m, { role: 'assistant', text: res }])
    } catch (e) {
      if (!ac.signal.aborted) setMessages((m) => [...m, { role: 'assistant', text: `Error: ${e}` }])
    } finally {
      setBusy(false)
      setAborter(null)
    }
  }

  function cancel() {
    aborter?.abort()
    setBusy(false)
    setAborter(null)
    setMessages((m) => [...m, { role: 'assistant', text: 'Cancelled.' }])
  }

  async function readFile() {
    if (!workspace || !filePath) return
    try {
      const c = await invoke<string>('read_workspace_file', { workspace, relativePath: filePath })
      setFileContent(c)
      setNewContent(c)
      setFileStatus('Loaded')
    } catch (e) {
      setFileStatus(`Read error: ${e}`)
    }
  }

  async function writeFile() {
    if (!workspace || !filePath) return
    if (!confirm(`Write changes to ${filePath}?`)) return
    try {
      await invoke('write_workspace_file', { workspace, relativePath: filePath, content: newContent })
      setFileContent(newContent)
      setFileStatus('Written (approved)')
    } catch (e) {
      setFileStatus(`Write error: ${e}`)
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Emdash</h2>
        <button className="btn" onClick={() => setMessages([])}>New Chat</button>
        <div className="card">
          <div className="muted">Workspace</div>
          <div>{workspace ?? 'No project selected'}</div>
          <button className="btn" style={{ marginTop: 8 }} onClick={pickWorkspace}>Select project</button>
        </div>
        <div className="card">
          <div className="muted">Model status</div>
          {ollama === null && <div>Checking…</div>}
          {ollama && !ollama.available && <div style={{ color: 'var(--danger)' }}>Ollama unavailable{ollama.error ? `: ${ollama.error}` : ''}</div>}
          {ollama && ollama.available && <div style={{ color: 'var(--success)' }}>Ollama ready ({ollama.models.length} models)</div>}
        </div>
        <div className="row">
          <button className={`btn ${mode === 'beginner' ? '' : ''}`} onClick={() => setMode('beginner')}>Beginner</button>
          <button className="btn" onClick={() => setMode('builder')}>Builder</button>
        </div>
      </aside>

      <section className="main">
        <div className="topbar">
          <strong>{mode === 'beginner' ? 'Beginner mode' : 'Builder mode'}</strong>
          <span className="muted">{workspace ?? 'No workspace'}</span>
        </div>
        <div className="chat">
          {messages.length === 0 && (
            <div className="card">
              <h3>What are we building today?</h3>
              <div className="row">
                {SUGGESTED.map((s) => (
                  <button key={s} className="btn" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className="card">
              <div className="muted">{m.role}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
            </div>
          ))}
          {busy && <div className="muted">Working…</div>}
        </div>
        <div className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want to build or fix…"
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(input) }}
          />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={() => send(input)} disabled={busy}>Send</button>
            {busy && <button className="btn danger" onClick={cancel}>Cancel</button>}
            <span className="muted">Ctrl/Cmd+Enter to send</span>
          </div>
        </div>
      </section>

      <aside className="panel">
        <h3>Context</h3>
        {mode === 'builder' ? (
          <>
            <div className="card">
              <div className="muted">Tool activity</div>
              <div className="muted">Shown when an agent run reports tool events.</div>
            </div>
            <div className="card">
              <div className="muted">File operations (workspace-scoped)</div>
              <input value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="relative/path.ts" style={{ width: '100%', marginTop: 4 }} />
              <div className="row" style={{ marginTop: 4 }}>
                <button className="btn" onClick={readFile}>Read</button>
              </div>
              {fileContent !== '' && (
                <>
                  <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} style={{ width: '100%', minHeight: 120, marginTop: 4 }} />
                  <details style={{ marginTop: 4 }}>
                    <summary className="muted">Preview diff</summary>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, maxHeight: 200, overflow: 'auto' }}>{simpleDiff(fileContent, newContent)}</pre>
                  </details>
                  <div className="row" style={{ marginTop: 4 }}>
                    <button className="btn" onClick={writeFile}>Apply (confirm)</button>
                    <span className="muted">{fileStatus}</span>
                  </div>
                </>
              )}
            </div>
            <div className="card">
              <div className="muted">Terminal / tests</div>
              <div className="muted">Output appears here.</div>
            </div>
          </>
        ) : (
          <div className="card">
            <div className="muted">Beginner mode hides advanced diagnostics. Switch to Builder for details.</div>
          </div>
        )}
      </aside>
    </div>
  )
}
