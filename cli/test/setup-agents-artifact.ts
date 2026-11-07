// Preload: ensure the generated bundled-agents module exists. Rebuild only if
// missing so test startup stays fast.
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const generated = resolve(import.meta.dir, './bundled-agents.generated.ts')
if (!existsSync(generated)) {
  spawnSync('bun', ['run', 'scripts/prebuild-agents.ts'], {
    cwd: resolve(import.meta.dir, '..'),
    stdio: 'inherit',
  })
}
