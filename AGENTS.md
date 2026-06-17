# `@false00/pi-proxmox` maintainer guide

This file is the operating manual for agents and maintainers working on `@false00/pi-proxmox`.

## Mission

Keep this package reliable, transparent, and safe for real infrastructure work.

The package exists to give the Pi coding agent high-coverage Proxmox VE tooling with predictable runtime behavior, accurate documentation, and conservative release practices.

## Repository map

- `dist/` — source of truth for runtime code; there is no separate `src/` tree
- `dist/index.js` — default-exported Pi extension entrypoint
- `dist/tools/` — domain-specific tool definitions
- `dist/proxmox-client.js` — REST client, auth, request plumbing, upload support
- `dist/tool-runtime.js` — shared execution helpers such as `safeExecute`, `emitProgress`, and `execOnNode`
- `tests/` — live integration tests plus Pi-runtime behavior tests
- `docs/` — bundled Proxmox documentation and API reference material
- `.github/` — CI workflow, issue templates, PR template, dependency automation, and code ownership hints
- `README.md` — user-facing package documentation
- `CONTRIBUTING.md` — contributor workflow
- `SECURITY.md` — security and disclosure policy

## Project facts

- The project is **pure JavaScript**.
- `dist/` is **committed directly**.
- There is **no build step** and no `tsconfig.json`.
- The package is intended for **Pi package installation via npm**.
- The entrypoint must remain registered in `package.json` under `pi.extensions`.
- Full official API reach is provided by a combination of dedicated tools plus the universal `proxmox_api_call` and `proxmox_api_upload_file` tools.

## Pi package conventions

Follow current Pi package guidance:

- Keep the `pi-package` keyword in `package.json`.
- Preserve `pi.extensions` so Pi can load the package root directly.
- Use the Pi-preferred `typebox` package name consistently in runtime imports.
- If package metadata changes, make sure `npm pack --dry-run` still includes the expected runtime files and top-level docs.
- Tool failures must be **thrown** from `execute()` so Pi marks them as `isError: true`.
- Partial updates must use the standard Pi `onUpdate({ content: [...] })` shape.

## Coding standards

- Prefer small, explicit helpers over clever abstractions.
- Preserve stable tool names; all tools must remain prefixed with `proxmox_`.
- Keep tool descriptions concise and agent-readable.
- Do not silently broaden behavior of destructive tools.
- Favor compatibility with the Proxmox REST API over speculative convenience wrappers.
- Never fabricate URLs, API paths, or Proxmox response behavior.

## Runtime guarantees

Maintain these behavioral guarantees:

- Read/list/status tools return JSON text content Pi can consume.
- Long-running tools may emit progress updates while running.
- Runtime failures surface as proper Pi tool errors with standardized categories:
  - `validation`
  - `authentication`
  - `not_found`
  - `timeout`
  - `network`
  - `server_error`
  - `unknown`
- `proxmox_node_execute` must continue to use `execOnNode(...)` and preserve API-token → ticket-auth fallback behavior.
- `/nodes/{node}/execute` is for batching node-relative Proxmox API requests; do not describe it as arbitrary shell execution.
- Do not remove the `/execute` fallback path unless it has been re-verified against a live Proxmox environment; in the currently verified environment, the fallback path is still needed.

## Known Proxmox-specific constraints

- There is **no API-based shell exec for LXC containers** in this package.
- VM guest execution depends on the **QEMU Guest Agent**.
- `proxmox_vm_agent_exec` must continue splitting the `command` string on whitespace into an array because the Proxmox endpoint expects `path` plus repeated `arg[]` form values.
- `/qemu/{vmid}/agent/exec-status` and other read-only agent endpoints must remain **GET** requests.

## Documentation policy

Documentation must match code.

Whenever you change a tool parameter, default value, output format, or runtime behavior, update all affected docs:

1. The tool `description` in `dist/tools/<domain>.js`
2. `README.md`
3. `AGENTS.md` if the change affects maintainer or agent expectations
4. `CONTRIBUTING.md` or `SECURITY.md` if contributor or trust processes changed

Before finishing, grep for stale references:

- old parameter names
- old defaults
- outdated auth guidance
- outdated timeout behavior
- removed or renamed files

## Testing policy

Every code change should be backed by tests appropriate to the behavior being touched.

Current suites:

- `tests/smoke.test.mjs` — extension import and tool-surface smoke checks without live Proxmox access
- `tests/auth.test.mjs` — auth and basic connectivity
- `tests/pagination.test.mjs` — pagination behavior
- `tests/vm-agent.test.mjs` — VM guest-agent behavior
- `tests/execute.test.mjs` — `/execute` endpoint behavior
- `tests/lxc.test.mjs` — LXC lifecycle
- `tests/vm.test.mjs` — VM lifecycle
- `tests/upload.test.mjs` — storage upload and cleanup
- `tests/runtime.test.mjs` — Pi runtime behavior, progress, thrown errors, tool timeout
- `tests/raw-api.test.mjs` — universal raw API coverage against official GET/POST/PUT/DELETE and upload-style endpoints
- `tests/package.test.mjs` — package metadata and trust-signal structure
- `scripts/audit-official-api.mjs` — live audit against the official Proxmox API viewer schema

Expectations:

- Live integration tests must create and clean up their own resources.
- New features should include both success-path and failure-path coverage.
- User-facing packaging or documentation changes should have at least one structural or metadata check when feasible.
- Run `npm test` before considering work complete.
- Run `npm run test:smoke` for a fast non-live sanity check.
- Run `npm run audit:official-api` when changing official-coverage claims or raw API coverage behavior.

## Security and trust posture

Treat this package as infrastructure automation software, not a toy integration.

- Do not weaken auth handling for convenience.
- Do not log secrets in code, tests, or documentation.
- Prefer explicit errors over silent fallback unless a documented fallback already exists.
- Keep destructive operations obvious in tool naming and docs.
- If a behavior is uncertain, say so and inspect the code or docs instead of guessing.

## Release discipline

- Never commit without explicit user approval.
- Never push or publish without explicit user approval.
- Do not skip npm versions.
- Dry-run with `npm pack --dry-run` before publish.
- Publish with `npm publish --ignore-scripts`.
- Push tags only after a successful publish when the user has asked for release work.

## Release checklist

When asked to prepare a release:

1. Run `npm test`
2. Run `npm run test:smoke`
3. Run `npm run test:raw-api`
4. Run `npm run test:package`
5. Run `npm run audit:official-api`
6. Run `npm pack --dry-run`
7. Verify `package.json` metadata is current
8. Verify README and AGENTS reflect the shipped behavior
9. Check whether the current version is already published before bumping
10. Only commit, tag, push, or publish with explicit user approval

## Proxmox provisioning guideline

When creating a VM or LXC container in Proxmox, always use the public SSH key stored in `~/.ssh/proxmox_provision.pub` for provisioning purposes.
