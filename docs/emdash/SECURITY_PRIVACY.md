# Emdash – Security & Privacy (Local-First Contract)

## Network policy (local-only mode)
- No source code or prompts leave the machine.
- All hosted calls (analytics, model gateway, ads) are disabled by default in local-only mode.
- Optional remote features are opt-in and documented per request.

## Secrets
- `.env*`, `*.pem`, `*.key`, credentials files excluded from context discovery.
- Credentials stored only if user opts in; use OS keychain where available.

## Filesystem & terminal
- Access scoped to selected project directory where practical.
- Destructive commands (rm -rf, git reset --hard, etc.) require explicit confirmation.
- Arbitrary shell execution not exposed over any HTTP endpoint.

## Local API hardening
- Any local server binds to 127.0.0.1 only.
- Origin checks / token auth to prevent cross-site access.
- Timeouts and cancellation on all model calls.

## Model-generated tool args
- Validate against zod schemas before execution.
- Reject path traversal, command injection, out-of-project writes.

## Verification
- Network capture test in CI to assert zero remote calls in local-only mode.
- Do not claim "fully private" until tests pass.
