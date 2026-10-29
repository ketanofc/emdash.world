import { describe, expect, test } from 'bun:test'
import {
  normalizeBaseUrl,
  tagsUrl,
  openAiModelsUrl,
  isLocalhostUrl,
} from './emdash-ollama-url'

describe('emdash ollama url helpers', () => {
  test('normalizeBaseUrl trims trailing slashes', () => {
    expect(normalizeBaseUrl('http://localhost:11434///')).toBe('http://localhost:11434')
  })
  test('normalizeBaseUrl defaults', () => {
    expect(normalizeBaseUrl(undefined)).toBe('http://127.0.0.1:11434')
  })
  test('tagsUrl', () => {
    expect(tagsUrl('http://localhost:11434/')).toBe('http://localhost:11434/api/tags')
  })
  test('openAiModelsUrl', () => {
    expect(openAiModelsUrl('http://localhost:11434')).toBe('http://localhost:11434/v1/models')
  })
  test('isLocalhostUrl', () => {
    expect(isLocalhostUrl('http://127.0.0.1:11434')).toBe(true)
    expect(isLocalhostUrl('http://example.com')).toBe(false)
  })
})
