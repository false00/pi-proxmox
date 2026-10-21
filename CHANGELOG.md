# Changelog

All notable changes to `@false00/pi-proxmox` are documented here.

The format is intentionally simple and human-readable.

## Unreleased

### Breaking changes
- Raised the declared Node.js floor from `>=22.0.0` to `>=22.19.0`, the minimum that the `undici` 8.x runtime dependency already required.
- Removed `proxmox_lxc_reset`, leaving 141 tools. Proxmox has no container reset (`POST /nodes/{node}/lxc/{vmid}/status/reset` does not exist), so every call failed. Use `proxmox_lxc_reboot` for a clean restart, or `proxmox_lxc_stop` and then `proxmox_lxc_start`.
- Replaced parameters that Proxmox never accepted with the official ones:
  - `proxmox_node_journal`: `since` and `until` (Unix epoch seconds), `lastentries`, `startcursor`, `endcursor`, and `service` replace `start`, `end`, `limit`, and the relative-time `since` string.
  - `proxmox_replication_create`: takes `vmid`, `target`, and optional `jobnum`, `schedule`, `rate` (a number, MB/s), `comment`, and `disable`; `node` and `enabled` were removed.
  - `proxmox_replication_delete`: takes `id` and optional `keep` and `force`; `node` was removed.
  - `proxmox_cluster_update_options`: `email_from` replaces `email`.
  - `proxmox_group_create`: `members` was removed; Proxmox sets group membership on users.
  - `proxmox_vm_update_config`: `pool` was removed; pool membership is not a VM config option.
  - `proxmox_lxc_migrate`: `force` was removed; containers have no such migration option.
  - `proxmox_firewall_rule_add`: `type` is now required, as Proxmox requires it; the ignored `pos` parameter was removed.
  - `proxmox_storage_scan`: `type` now selects `GET /nodes/{node}/scan/{type}` (`nfs`, `cifs`, `iscsi`, `lvm`, `lvmthin`, `zfs`) together with `server`, `portal`, or `vg`; it used to send `type` as an unknown query parameter, and `ceph` was never a scan type.
  - `proxmox_node_hardware`: returns the PCI (default) or USB device list, selected with `type`, instead of the hardware-type index.
- Firewall alias and IPSet tools reject node-level scopes with a validation error, because Proxmox has no node-level aliases or IPSets; guest scopes without `node` are rejected too.

### Fixed
- Verified every dedicated tool's endpoint against the official API viewer and corrected the ones the API does not have:
  - `proxmox_node_reboot`: `POST /nodes/{node}/reboot` → `POST /nodes/{node}/status` with `command=reboot`.
  - `proxmox_node_stop`: `POST /nodes/{node}/stop` → `POST /nodes/{node}/status` with `command=shutdown`.
  - `proxmox_replication_create`: `POST /nodes/{node}/replication` → `POST /cluster/replication` with `id=<vmid>-<jobnum>` and `type=local`.
  - `proxmox_replication_delete`: `DELETE /nodes/{node}/replication/{id}` → `DELETE /cluster/replication/{id}`.
  - `proxmox_replication_run`: `POST /nodes/{node}/replication/{id}/run` → `POST /nodes/{node}/replication/{id}/schedule_now`.
  - `proxmox_token_create`: `POST /access/users/{userid}/token` → `POST /access/users/{userid}/token/{tokenid}`; it now sends `privsep=1` unless told otherwise, and accepts `expire`.
  - `proxmox_vm_agent_get_network_interfaces`: `GET …/agent/get-network-interfaces` → `GET …/agent/network-get-interfaces`.
- Tools that returned a bare directory index now read the data they describe: `proxmox_ha_status` (`/cluster/ha/status/current`), `proxmox_cluster_config` (`/cluster/config/join`), `proxmox_node_service_status` (`/nodes/{node}/services/{service}/state`), and `proxmox_node_hardware` (`/nodes/{node}/hardware/pci` or `/usb`).
- `proxmox_lxc_resize` sends the official `disk` parameter (it sent `mp`); `proxmox_lxc_create` sends `ssh-public-keys` unencoded (it sent an unknown, URL-encoded `ssh_public_keys`); `proxmox_vm_agent_file_write` sends `encode=0`, so its documented base64 content is no longer encoded a second time; `proxmox_backup_list` reads the official `enabled` field, so disabled jobs are no longer reported as enabled.
- Corrected tool descriptions: `proxmox_vm_suspend` pauses the VM in memory (not to disk); `proxmox_vm_agent_file_read` returns decoded content; backup schedules are systemd calendar events, not cron; `proxmox_storage_upload` content types are `iso`, `vztmpl`, and `import`; `proxmox_firewall_rule_add` notes that Proxmox inserts new rules at the top and creates them disabled unless `enable=1`; `proxmox_task_list` notes that Proxmox lists finished tasks unless `source` is set; task `limit` defaults; HA group tools note the Proxmox VE 9 deprecation; the `proxmox_role_create` example no longer uses the non-existent `VM.Config` privilege.
- Bundled reference docs in `docs/`: corrected about 100 endpoint paths and methods the API does not have (Ceph, ACME, metrics, notifications, replication, firewall groups, TFA, password, node power, disks, network, guest-agent methods, and more), wrong parameter names, and wrong permission rows: journal and syslog need `Sys.Syslog`; realm and TFA rows now match the API; rows that used the non-existent `VM.Config` privilege name the actual `VM.Config.*`, `VM.Allocate`, `VM.Migrate`, `VM.Console`, or `VM.GuestAgent.*` privileges. `docs/PERMISSIONS.md` covers the corrected tools.
- The MCP bridge reports the package version from `package.json` instead of a hard-coded `1.0.2`.

### Added
- Added a stdio MCP bridge that exposes the existing `proxmox_*` tool surface to VS Code and other MCP clients, with non-live protocol and schema coverage.
- Offline endpoint conformance tests (`npm run test:endpoints`, part of `npm run test:ci`): every dedicated tool runs against a recording client, and each request's path, method, and parameters, plus every endpoint named in the docs and tool descriptions, are checked against `tests/fixtures/pve-api-snapshot.json`, a snapshot of the official API viewer schema. `npm run update:api-snapshot` refreshes it.
- `proxmox_acl_update` accepts `tokens`, so a privilege-separated token can get its own ACL entry; `proxmox_lxc_create` accepts `pool`; `proxmox_task_list` accepts `source`.

### Changed
- LXC template listing now reads `vztmpl` content from a selectable storage backend instead of using the obsolete node template endpoint.
- Updated pinned GitHub Actions and grouped CodeQL updates so its initialization and analysis steps stay on the same version.
- Stabilized the protected package CI check name and expanded CI to cover the MCP bridge.
- Updated the pinned GitHub Actions to `actions/setup-node` 7.1.0 and `github/codeql-action` 4.39.1, still pinned to full commit SHAs.

### Security
- Updated `@earendil-works/pi-coding-agent`, `undici`, `typebox`, `brace-expansion`, and `protobufjs` to patched versions that pass the repository audit gate.
- Setup guidance now recommends a dedicated non-root user, a privilege-separated API token, and narrowly scoped ACLs (starting read-only) instead of a `root@pam` token with privilege separation disabled. `docs/PERMISSIONS.md` maps each tool to the privilege and path Proxmox checks.
- The password fallback is now documented as optional and discouraged: `/nodes/{node}/execute` is root-only, so leaving the fallback unset makes `proxmox_node_execute` fail closed. Runtime hints, error guidance, tool descriptions, and the auto-created `.env` template no longer point to root tokens or to disabling privilege separation.
- Resolved every open Dependabot alert and `npm audit` finding (the alerts were 1 critical, 7 high, 12 moderate, and 3 low): `@modelcontextprotocol/sdk` 1.32.1 and `undici` 8.12.3 (runtime dependencies), plus the transitive `proxy-addr` 2.0.8, `fast-uri` 3.1.9, `hono` 4.13.13, `ip-address` 10.7.4, and `qs` 6.16.1. No npm `overrides` are used.
- Updated the `@earendil-works/pi-coding-agent` development dependency from 0.84.1 to 1.3.0 (and `typebox` to 1.4.2). Pi 0.84.1 pins the vulnerable `undici` 8.9.0 and `brace-expansion` 5.0.9 in its `package.json` and `npm-shrinkwrap.json`; instead of forcing other versions into it with npm `overrides`, the upgrade brings Pi's own patched pins (`undici` 8.10.2, `brace-expansion` 5.0.12). Pi's 1.x breaking changes do not touch the extension contract this package uses (`pi.registerTool()` with `name`, `label`, `description`, TypeBox `parameters`, and `execute(toolCallId, params, signal, onUpdate, ctx)`), so no runtime code changed, and the peer dependency stays `"*"` as Pi's package guidance requires.
- `proxmox_storage_upload` downloaded external URLs with the Proxmox connection's TLS settings, so with the default `PROXMOX_VERIFY_SSL=false` it skipped certificate verification for arbitrary download hosts. External downloads now always verify TLS, and `SECURITY.md` documents what `PROXMOX_VERIFY_SSL` covers.
- `scripts/audit-official-api.mjs` parses the API viewer schema as JSON instead of evaluating the downloaded JavaScript in a `vm` context.

## 1.0.2 - 2026-07-16

### Added
- Scheduled CodeQL scanning for the JavaScript codebase.

### Changed
- Updated `undici` to `^8.7.0` and `typebox` to `^1.3.6`.
- Hardened GitHub Actions with immutable action SHAs, `npm ci`, dependency review, and stricter repository security settings.

## 1.0.1 - 2026-06-23

### Changed
- Updated `undici` from `^8.4.1` to `^8.5.0` to resolve npm audit advisories affecting the package dependency.

## 1.0.0 - 2026-06-17

### Added
- Universal API coverage tools:
  - `proxmox_api_call`
  - `proxmox_api_upload_file`
- Official API coverage audit documentation in `docs/API_COVERAGE_AUDIT.md`
- Compatibility notes in `docs/COMPATIBILITY.md`
- Usage examples in `docs/EXAMPLES.md`
- Permissions guide in `docs/PERMISSIONS.md`
- Troubleshooting guide in `docs/TROUBLESHOOTING.md`
- Official API audit script: `npm run audit:official-api`
- Raw API integration coverage in `tests/raw-api.test.mjs`
- Non-live smoke coverage in `tests/smoke.test.mjs`
- GitHub CI workflow and repository issue / PR templates

### Changed
- Package guidance now explicitly describes the project as a curated Proxmox tool suite plus universal raw API escape hatches
- Documentation now includes adoption-focused guidance, tested environment notes, tool-selection guidance, stability guarantees, and operational docs
- Runtime code now uses the Pi-preferred `typebox` package name in imports
- `/nodes/{node}/execute` guidance now matches the official API more closely: batched node-relative API requests, not arbitrary shell execution; official `args` is preferred while legacy `body` remains supported
- Declared Node.js support was tightened from `>=20` to `>=22` to match actual CI/runtime compatibility with the current dependency set

## 0.2.0 - 2026-06-17

### Added
- `CONTRIBUTING.md`
- `SECURITY.md`
- `dist/index.d.ts`
- `tests/runtime.test.mjs`
- `tests/package.test.mjs`

### Changed
- Package metadata hardened for Pi package trust and discoverability
- README rewritten to better explain scope, trust model, runtime behavior, and development workflow
- AGENTS guide upgraded into a maintainer operating manual
- Tool runtime now throws proper Pi tool errors instead of returning fake success payloads on failure
- Tool progress updates now use Pi-compatible partial update payloads
- `PROXMOX_TOOL_TIMEOUT_MS` is now enforced in the shared tool runtime

## 0.1.16 - 2026-06-13

- Last pre-hardening release before the trust, runtime, and package-structure improvements introduced in 0.2.x.
