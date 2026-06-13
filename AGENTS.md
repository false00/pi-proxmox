# `@false00/pi-proxmox`

Proxmox VE automation tools for the Pi coding agent. Manage VMs (QEMU/KVM), LXC containers, storage, cluster operations, backups, firewalls, and task tracking through the Proxmox REST API.

## Project structure

- `dist/` — compiled JavaScript output (entry: `dist/index.js`)
- `dist/tools/` — individual tool implementations (vm, lxc, node, storage, cluster, backup, firewall, etc.)
- `dist/proxmox-client.js` — Proxmox REST API client with token auth, ticket auth, and SSH fallback
- `dist/tool-runtime.js` — shared helpers (`execOnNode`, `safeExecute`, `emitProgress`, `throwIfAborted`)
- Source is JavaScript compiled directly to `dist/` (no separate `src/` directory)

## Key conventions

- **Default export** in `dist/index.js` — the extension function registered with Pi
- **Tool naming** — all tools prefixed `proxmox_` (e.g. `proxmox_vm_list`, `proxmox_lxc_create`)
- **Config priority** — `.env` file > constructor params > env vars > defaults
- **Auth** — API token auth (recommended) with password/ticket fallback; SSH for exec tools
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

## Project quirks

- **`dist/` is committed** — Changes are made directly to the `.js` files in `dist/`. There is no `src/` or separate build step.
- **No `tsconfig.json`** — No TypeScript source files exist; the project is pure JavaScript.
- **SSH dependency** — `proxmox_lxc_exec` and `proxmox_node_execute` require SSH access to the Proxmox host because the API has no native shell exec endpoint for LXC containers. See SSH section in README for setup.
- **`execOnNode` shared helper** — Both exec tools delegate to `execOnNode(client, node, command, onUpdate)` in `tool-runtime.js`, which tries API → ticket auth → SSH. When adding new exec functionality, use this helper instead of duplicating the fallback logic.

## Commit & publish policy

- **Never commit without explicit user approval.** Wait for the user to say "commit" or "stage and commit". Do not commit automatically.
- **Never push or publish without explicit user approval.**

### Publishing workflow

When the user asks to publish:

1. **Check the current npm version** in `package.json`
2. **Check the latest git tag** — should match `v{version}` format
3. **Verify the git tag matches the npm version.** If version was bumped, the tag must also be updated. If they don't match, create the tag:
   ```
   git tag v{version}
   ```
4. **Dry-run first:** `npm pack --dry-run` to verify the package contents include `dist/`, `AGENTS.md`, `README.md`, `LICENSE`
5. **Use `npm version patch|minor|major` to bump version** — this updates `package.json` and creates a matching git tag in one step. Do NOT edit `package.json` manually.
6. **Publish with `--ignore-scripts`:**
   ```
   npm publish --ignore-scripts
   ```
7. If 2FA is enabled, npm will prompt for browser authentication before completing.
8. **Increment the package version** if the scope of changes warrants it. Follow semver:
   - Patch (`0.1.15 → 0.1.16`) for bug fixes and minor doc changes
   - Minor (`0.1.15 → 0.2.0`) for new tools or behavioral changes
   - Major (`0.1.15 → 1.0.0`) for breaking changes
