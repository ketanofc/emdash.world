#!/usr/bin/env bun
/**
 * Emdash development bootstrap.
 *
 * Loads safe defaults from .env.example (dev-only, no secrets) into process.env,
 * then launches the CLI dev server. Existing env vars are never overwritten.
 *
 * Usage: bun scripts/dev-bootstrap.ts
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dir, '..')
const envFile = resolve(root, '.env.example')

if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

// Sensible dev fallbacks for vars .env.example leaves blank.
if (!process.env.NEXT_PUBLIC_CB_ENVIRONMENT) process.env.NEXT_PUBLIC_CB_ENVIRONMENT = 'dev'

const result = spawnSync('bun', ['run', 'dev'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

process.exit(result.status ?? 0)
