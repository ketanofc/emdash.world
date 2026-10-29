# Emdash Desktop Prototype

Tauri 2 shell (not yet built in this environment because the Rust toolchain is unavailable).

## Prerequisites
- Rust toolchain (rustup) + cargo
- Node.js 22+ / Bun
- Tauri CLI: `cargo install tauri-cli` or `npm i -g @tauri-apps/cli`

## Build
```bash
cd desktop
npm install
npm run tauri dev
```

## Status
- Scaffold only. Agent bridge and Ollama integration are planned.
- The CLI remains independently usable.
