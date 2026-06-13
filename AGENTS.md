# `@false00/pi-proxmox`

Proxmox VE automation tools for the Pi coding agent. Manage VMs (QEMU/KVM), LXC containers, storage, cluster operations, backups, firewalls, and task tracking through the Proxmox REST API.

## Project structure

- `dist/` — compiled JavaScript output (entry: `dist/index.js`)
- `dist/tools/` — individual tool implementations (vm, lxc, node, storage, cluster, backup, firewall, etc.)
- `dist/proxmox-client.js` — Proxmox REST API client with token auth and ticket auth
- `dist/tool-runtime.js` — shared helpers (`execOnNode`, `safeExecute`, `emitProgress`, `throwIfAborted`)
- `tests/` — test suites organized by domain (`auth.test.mjs`, `vm-agent.test.mjs`, `lxc.test.mjs`, etc.)
- Source is JavaScript compiled directly to `dist/` (no separate `src/` directory)

## Key conventions

- **Default export** in `dist/index.js` — the extension function registered with Pi
- **Tool naming** — all tools prefixed `proxmox_` (e.g. `proxmox_vm_list`, `proxmox_lxc_create`)
- **Config priority** — `.env` file > constructor params > env vars > defaults
- **Auth** — API token auth (recommended) with password/ticket fallback for /execute endpoint
- **Error handling** — tools return standardized error categories: `validation`, `authentication`, `not_found`, `timeout`, `network`, `server_error`, `unknown`

## Documentation rules

- **Documentation must always match code.** When adding/changing a tool parameter, default value, output format, or behavior, update all of:
  1. The tool's `description` string in `dist/tools/<tool>.js`
  2. `README.md` — the tools table and any relevant prose
  3. `AGENTS.md` — if the change affects how an agent should interact with the package

- **Verify before finishing.** After any code change, grep for stale references:
  - Old default values
  - Wrong file paths
  - Outdated parameter names or descriptions

- **Tool descriptions are agent-facing documentation.** The `description` field on each tool is what the LLM sees. Keep them accurate and concise.

- **Tests are required for every change.** When adding a new tool, endpoint, feature, or changing behavior, write a test that:
  1. Exercises the new or changed functionality against a live Proxmox host
  2. Verifies both success and error paths
  3. Creates any necessary test resources (VMs, containers, etc.) and **cleans them up** after
  4. Place test files in `tests/` as `<domain>.test.mjs` and run with `npm run test:<domain>` or `node tests/<domain>.test.mjs`
  5. Keep the test file in the repo — it serves as documentation and a regression suite

## Project quirks

- **`dist/` is committed** — Changes are made directly to the `.js` files in `dist/`. There is no `src/` or separate build step.
- **No `tsconfig.json`** — No TypeScript source files exist; the project is pure JavaScript.
- **`execOnNode` shared helper** — `proxmox_node_execute` delegates to `execOnNode(client, node, commands, onUpdate)` in `tool-runtime.js`, which sends batch API calls to the `/nodes/{node}/execute` endpoint with API token → ticket auth fallback. When adding new exec functionality, use this helper instead of duplicating the fallback logic.
- **No LXC shell exec** — There is no API-based mechanism to execute shell commands inside LXC containers. The QEMU Guest Agent tools provide this for VMs only.
- **VM agent command splitting** — `proxmox_vm_agent_exec` splits the `command` string on whitespace into an array. This is required because the Proxmox API's `agent/exec` endpoint expects `path` and `arg[]` as separate form parameters; sending them as a single string crashes `pve-api-daemon` (status 596). The tool's `client.post()` uses `flatMap` in `#fetch` to expand array values into repeated form params (e.g., `command=ps&command=aux`).
- **VM agent exec-status is GET** — `/qemu/{vmid}/agent/exec-status` is a read-only endpoint and must be called with GET, not POST. The same applies to all other read-only agent endpoints (`info`, `file-read`, `get-host-name`, `get-osinfo`, `get-time`, `get-users`, `get-vcpus`).

## Commit & publish policy

- **Never commit without explicit user approval.** Wait for the user to say "commit" or "stage and commit". Do not commit automatically.
- **Never push or publish without explicit user approval.**

### Publishing workflow

When the user asks to publish:

**Critical: never skip npm versions.** Every number in the sequence must be published. If a publish attempt fails (e.g. 2FA), do NOT bump again — fix the issue and publish the same version. If new changes are added after a failed publish, use `npm version` only once right before the successful publish.

1. **Check the current npm version** in `package.json` — this is the next number to publish.
2. **Check all published versions** on npm:
   ```
   npm view @false00/pi-proxmox versions --json
   ```
3. **If the version in `package.json` is already published**, bump it now with `npm version patch` (only once).
4. **Dry-run first:** `npm pack --dry-run` to verify the package contents include `dist/`, `AGENTS.md`, `README.md`, `LICENSE`
5. **Publish with `--ignore-scripts`:**
   ```
   npm publish --ignore-scripts
   ```
6. If 2FA is enabled, npm will prompt for browser authentication before completing.
7. **Push the version commit and tag** to GitHub:
   ```
   git push origin master --tags
   ```
8. **Follow semver** when deciding the bump type:
   - Patch (`0.1.x → 0.1.y`) for bug fixes and minor doc changes
   - Minor (`0.1.x → 0.2.0`) for new tools or behavioral changes
   - Major (`0.1.x → 1.0.0`) for breaking changes
