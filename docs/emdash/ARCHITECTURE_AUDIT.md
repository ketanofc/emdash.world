# Emdash – Repository Audit Report

**Source repository:** https://github.com/CodebuffAI/freebuff (cloned at commit `29efd07e2`)
**Audit date:** 2026-10-29
**Auditor:** OpenCode agent (Milestone 1)

## 1. Summary

Freebuff is a TypeScript/Bun monorepo. It is a **terminal (TUI) coding agent**, not a desktop
application. There is **no desktop shell** (no Tauri/Electron/Tauri 2) in the repository, so the
Emdash desktop requirement (Section 3 of the product spec) must be built from scratch. The
recommended path per spec is **Tauri 2 + React + TypeScript**, evaluated against a small
prototype before committing.

The core agent engine (file discovery, patching, tool execution, multi-step agents) is mature and
reusable. Local AI (Ollama) is **not** integrated; all inference goes through Freebuff's hosted
gateway. Reusing the `openai-compatible` provider shim is the lowest-risk way to add Ollama
(OpenAI-compatible endpoint at `http://localhost:11434/v1`).

## 2. Package boundaries

| Path | Purpose |
|------|---------|
| `cli/` | OpenTUI + React terminal client, commands, hooks, local UX |
| `sdk/` | `@codebuff/sdk` – public SDK used by CLI and external users |
| `common/` | Shared types, tools, schemas, utilities, analytics, env |
| `agents/` | Public agent definitions (YAML/TS) |
| `packages/agent-runtime/` | Agent runtime, tool handling, stream parsing, patching |
| `packages/code-map/` | Source parsing / symbol extraction helpers |
| `packages/llm-providers/` | Provider shims (`openai-compatible` only) |
| `freebuff/` | Freebuff CLI build/release files and e2e tests |
| `evals/` | Buffbench evaluation harness |
| `scripts/` | tmux helpers, release scripts |

Workspaces are declared in the root `package.json`. Runtime is **Bun 1.3.14** (`.bun-version`).

## 3. Existing features (verified by inspection)

- Multi-agent orchestration with specialized agents (context gathering, planning, editing, review).
- Project-aware file discovery and ignore rules (`.codebuffignore`, gitignore).
- Patch validation and diff generation (agent-runtime).
- Terminal command execution with approval flow.
- Conversation history persistence (local config dir).
- Streaming responses in the TUI.
- Authentication against Freebuff/Codebuff hosted accounts (optional in product, but currently central).
- Freebuff-mode build (`FREEBUFF_MODE=true`) producing a free-only binary.

## 4. Missing for Emdash (gaps)

1. **Desktop shell** – none exists. Must be added (Tauri 2 recommended).
2. **Local model runtime** – no Ollama (or any local) provider. Only hosted gateway.
3. **Account-optional flow** – auth is currently expected; local-only mode must be made first-class.
4. **Network audit / privacy controls** – telemetry and hosted calls are on by default.
5. **Windows/Linux packaging** – only a single-file CLI binary; no installer/AppImage.
6. **Diff viewer / file explorer / terminal panel as desktop UI** – only TUI equivalents.
7. **Ollama model download progress, cancellation, resource recommendations** – not implemented.

## 5. License and redistribution

- Root `LICENSE`: Apache-2.0, copyright 2025 Freebuff, Inc.
- `NOTICE`: "Codebuff, Copyright 2025 Codebuff".
- `freebuff/README.md` claims MIT for the Freebuff CLI subset – **conflicting** with root Apache-2.0.
  Action: resolve license ambiguity before redistributing; keep NOTICE attribution.
- Trademarks: "Freebuff", "Codebuff" are not granted for reuse. Emdash must use its own name/logo.
- Some dependencies are `@ai-sdk/*` (Apache-2.0) and `@opentui/*`. Audit transitive licenses before shipping.
- `canvas` (node-canvas) has native deps; verify redistribution terms.

## 6. Dependencies (key)

- Runtime: Bun 1.3.14, Node types 22, TypeScript 5.5.4.
- UI: OpenTUI 0.3.4 + React 19.
- AI: `ai` 7.0.x, `@ai-sdk/provider` 2.0.3, `@ai-sdk/gateway` 4.0.x (pulls provider 4.0.x – version skew).
- Validation: zod 4.2.1.
- Native: `canvas`, `systeminformation`, `node-machine-id`.

## 7. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| No desktop shell in repo | High | Start Tauri 2 prototype; keep CLI as fallback |
| Hosted-only inference | High | Add Ollama via openai-compatible shim; gate remote calls |
| Auth central to flows | Medium | Make local mode first-class; store creds only if opt-in |
| Type errors from ai-sdk skew | Medium | Pin exact versions; resolve provider type aliases |
| Missing test infra (`setup-scm-loader.ts`) in public mirror | Medium | Tests may not run locally; document |
| Env validation requires many `NEXT_PUBLIC_*` vars | Medium | Provide `.env.example` with dev defaults |
| License/notice ambiguity (Apache vs MIT) | Medium | Legal review before redistribution |
| Trademark (Freebuff/Codebuff) | High | Full rebrand to Emdash; no borrowed assets |
| Ollama tool-calling reliability varies by model | Medium | Capability detection + graceful degradation |
| Windows bash dependency | Medium | Document Git for Windows; detect bash |

## 8. Environment verification (Milestone 1/2)

Attempted:
- `bun install` → succeeded (159 packages, 25.8s) with Bun 1.4.4.
- `bun freebuff/cli/build.ts 0.0.0-dev` → **failed** during TypeScript declaration bundling due to
  `@ai-sdk/provider` type skew (`SharedV4ProviderOptions` vs `ProviderMetadata`), pre-existing in snapshot.
- CLI dev server → **failed** env validation (missing `NEXT_PUBLIC_*` vars).
- CLI tests → **not runnable** (missing `test/setup-scm-loader.ts` referenced by `bunfig.toml`).

Conclusion: the public mirror is not buildable/testable as-is in this environment without the private
test scaffolding and exact Bun 1.3.14 toolchain. This is recorded as an unresolved issue rather than
hidden.

## 9. First milestone recommendation

1. Add `.env.example` with dev-safe defaults (no secrets).
2. Resolve ai-sdk provider version skew or add type shims so `tsc` passes.
3. Restore/replace missing test preload (`setup-scm-loader.ts`) or remove from bunfig.
4. Stand up a minimal Tauri 2 shell that shells out to the CLI binary (reuse engine).
5. Add Ollama detection + openai-compatible provider wiring behind a feature flag.
6. Rebrand user-facing strings from "Freebuff"/"Codebuff" to "Emdash".

Changed files in this milestone: documentation only + this report (see `docs/emdash/`).
