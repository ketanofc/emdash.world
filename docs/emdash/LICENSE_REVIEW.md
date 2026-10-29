# Emdash – License and Redistribution Review

## Observed declarations
- Root `LICENSE`: Apache-2.0, copyright 2025 Freebuff, Inc.
- `NOTICE`: "Codebuff, Copyright 2025 Codebuff".
- `freebuff/README.md`: claims MIT for the Freebuff CLI subset.
- `freebuff/package.json`: private, no license field.

## Assessment
The repository's primary license is Apache-2.0 (root). The MIT claim in `freebuff/README.md`
conflicts with it and appears to be an error or subset-specific claim. Apache-2.0 Section 4
requires retaining the NOTICE and copyright notices. Trademarks "Freebuff"/"Codebuff" are not
granted for reuse; Emdash must use its own branding.

## Decision required (user approval)
1. Confirm whether Emdash is distributed under Apache-2.0 (recommended, matches root) or a
   different license for original Emdash code.
2. Confirm whether the Freebuff/Codebuff upstream attribution must be retained (yes under Apache-2.0).
3. Confirm whether any MIT-licensed third-party code is included and under what terms.

## Third-party license audit (spot check)
- `@ai-sdk/*`: Apache-2.0
- `react`, `react-dom`: MIT
- `zod`: MIT
- `tauri`: MIT/Apache-2.0
- `bun`: MIT

## Action taken
- No license headers changed. Attribution retained. License ambiguity documented, not resolved
  unilaterally.
