# @false00/pi-proxmox

[![npm version](https://img.shields.io/npm/v/@false00/pi-proxmox.svg)](https://www.npmjs.com/package/@false00/pi-proxmox)
[![license](https://img.shields.io/npm/l/@false00/pi-proxmox.svg)](LICENSE)
[![CI](https://github.com/false00/pi-proxmox/actions/workflows/ci.yml/badge.svg)](https://github.com/false00/pi-proxmox/actions/workflows/ci.yml)

Production-focused Proxmox VE automation for the Pi coding agent.

`@false00/pi-proxmox` exposes **142 Pi tools** for managing Proxmox clusters: VMs, LXC containers, storage, cluster state, firewall rules, backups, HA, replication, access control, task tracking, and universal raw API access through the Proxmox REST API.

| Resource | Link |
|---|---|
| npm | [`@false00/pi-proxmox`](https://www.npmjs.com/package/@false00/pi-proxmox) |
| GitHub | [github.com/false00/pi-proxmox](https://github.com/false00/pi-proxmox) |
| License | [MIT](LICENSE) |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |
| Security policy | [SECURITY.md](SECURITY.md) |
| Compatibility notes | [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) |
| Examples | [docs/EXAMPLES.md](docs/EXAMPLES.md) |
| Permissions guide | [docs/PERMISSIONS.md](docs/PERMISSIONS.md) |
| Troubleshooting | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) |
| Contributing guide | [CONTRIBUTING.md](CONTRIBUTING.md) |

## Why this package

This package is designed for people who want Pi to operate real Proxmox infrastructure without hand-writing API calls.

What makes it useful:

- **Broad coverage** — 142 tools spanning VM, LXC, storage, cluster, firewall, backup, HA, replication, task workflows, and universal raw API access
- **Consistent wrapper strategy** — dedicated tools for common workflows, universal raw tools for edge cases, with parameters that intentionally stay close to the Proxmox API where practical
- **Agent-friendly responses** — structured JSON output for read/list/status tools, plus progress streaming for long-running operations
- **Operational safety** — destructive actions are explicit, task-based operations return UPIDs, and tool failures surface as real Pi tool errors
- **Live-tested behavior** — the repo includes integration tests against a real Proxmox host, including VM/LXC lifecycle tests, package checks, raw API coverage tests, and runtime-behavior tests
- **Pi-native packaging** — installable as a Pi package through npm and loadable directly via `pi install` or `pi -e`

## What you get

Tool coverage by area:

| Area | Tool count |
|---|---:|
| Virtual machines | 23 |
| VM guest agent | 13 |
| LXC containers | 21 |
| Nodes | 18 |
| Storage + pools | 11 |
| Cluster | 9 |
| Backup | 3 |
| Firewall | 11 |
| Access control | 16 |
| High availability | 7 |
| Replication | 5 |
| Tasks | 3 |
| Universal raw API coverage | 2 |
| **Total** | **142** |

### Official API coverage audit

Against the official Proxmox VE API viewer at `https://pve.proxmox.com/pve-docs/api-viewer/`, the API surface audited on **2026-06-17** exposed:

- **444 routes**
- **675 route/method combinations**
- top-level namespaces: `access`, `cluster`, `nodes`, `pools`, `storage`, and `version`
- standard REST methods: `GET`, `POST`, `PUT`, and `DELETE`

This package covers the common day-to-day workflows with dedicated `proxmox_*` tools and covers the rest of the official API surface with two universal escape hatches:

- `proxmox_api_call` — generic GET/POST/PUT/DELETE access to any Proxmox API path under `/api2/json`
- `proxmox_api_upload_file` — generic multipart upload access for upload-style endpoints

## Design philosophy

This package is intentionally a **thin-but-usable Proxmox wrapper** for Pi.

That means:

- dedicated tools are added for common operational workflows
- raw universal tools exist so official API reach does not depend on hundreds of niche one-off wrappers
- parameter names and many flag conventions stay close to upstream Proxmox behavior when practical
- the package prefers predictable behavior and maintainability over hiding every Proxmox detail behind a custom abstraction layer

## Stability guarantees

This repository aims to provide a stable automation surface for Pi users.

Current guarantees:

- published tool names are treated as stable once released
- destructive operations are explicit in tool naming and documentation
- dedicated tools stay close to upstream Proxmox semantics where practical
- universal raw tools are the compatibility layer for long-tail official endpoints
- `proxmox_node_execute` prefers official `args` command objects and still accepts legacy `body` as a compatibility alias

## Install

Install into Pi as a package:

```bash
pi install npm:@false00/pi-proxmox
```

Use it for a single run without changing your settings:

```bash
pi -e npm:@false00/pi-proxmox
```

For local development from this repository:

```bash
pi -e .
```

## Quick start

After installing, ask Pi to operate your Proxmox cluster in plain English:

```text
List all VMs on pve1
Create a Debian container with 2GB RAM on pve1
Show cluster status
Resize disk scsi0 on VM 101 by +20G
Check recent tasks on pve1
```

Pi will call tools like `proxmox_vm_list`, `proxmox_lxc_create`, `proxmox_cluster_status`, and `proxmox_task_list` behind the scenes.

## Top tasks and example prompts

Common things users ask Pi to do with this package:

```text
List all VMs on pve1
Show running containers on pve1
Create a Debian LXC with 2 GB RAM on pve1
Clone VM 900 to a new VM 101 named web-01
Take a snapshot of VM 101 named pre-update
Roll back VM 101 to snapshot pre-update
Upload an ISO to local storage on pve1
Show failed tasks on pve1
Check cluster quorum and node health
Run hostname inside VM 118 through the guest agent
```

## Choosing dedicated tools vs raw tools

Use the package in this order:

1. **Dedicated `proxmox_*` tools first** for common workflows like VM lifecycle, LXC lifecycle, storage, firewall, HA, replication, and backups
2. Use **`proxmox_api_call`** when the official API supports something that does not yet have a dedicated tool
3. Use **`proxmox_api_upload_file`** for multipart upload endpoints such as storage uploads

This keeps everyday usage ergonomic while still preserving full official API reach.

## Operational docs

For day-to-day use and troubleshooting, see:

- [docs/EXAMPLES.md](docs/EXAMPLES.md)
- [docs/PERMISSIONS.md](docs/PERMISSIONS.md)
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## Trust, safety, and operating model

This is a **full-access infrastructure package**. Like any Pi extension, it can perform real changes in your environment if Pi is allowed to call its tools.

Important expectations:

- The package **does not shell into LXC containers**; Proxmox does not expose a comparable API for that
- VM in-guest command execution is only available through the **QEMU Guest Agent** tools
- Destructive operations such as delete, stop, reboot, rollback, firewall changes, and ACL updates are exposed as explicit tools
- Long-running operations return Proxmox task identifiers or agent PIDs so Pi can continue tracking them
- Runtime failures are thrown back to Pi as **proper tool errors**, not fake success payloads
- In the verified test environment, `/nodes/{node}/execute` required password/ticket fallback even though normal token-based API calls succeeded
- `/nodes/{node}/execute` is a real Proxmox endpoint for batching node-relative API requests; it does **not** provide arbitrary shell execution on the host

If you are evaluating the package for production use, review:

- [SECURITY.md](SECURITY.md)
- [AGENTS.md](AGENTS.md)
- [CHANGELOG.md](CHANGELOG.md)
- [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md)
- [tests/](tests/) for behavioral coverage
- [docs/](docs/) for the bundled Proxmox API reference material used by the project

## Configuration

### Requirements

- Node.js 22+
- A Pi runtime with extension support
- A reachable Proxmox VE cluster over HTTPS

### Connection settings

Create `~/.config/pi-proxmox/.env`:

```env
# --- Connection ---
PROXMOX_HOST=192.168.1.100
PROXMOX_PORT=8006
PROXMOX_VERIFY_SSL=false

# --- API Token (recommended) ---
PROXMOX_TOKEN_ID=root@pam!automation
PROXMOX_TOKEN_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# --- Password fallback (optional; mainly used when /execute rejects API-token auth) ---
PROXMOX_USERNAME=root@pam
PROXMOX_PASSWORD=yourpassword

# --- Timeouts ---
PROXMOX_TIMEOUT_MS=30000
PROXMOX_TOOL_TIMEOUT_MS=30000
```

Values in `~/.config/pi-proxmox/.env` take precedence over environment variables.

### Recommended token setup

> **Create an admin token with privilege separation disabled** if you want the full toolset to work.
>
> **Web UI:** Go to **Datacenter → Permissions → API Tokens**, click **Add**, select your user (for example `root@pam`), enter a token name (for example `automation`), and **uncheck _Privilege Separation_**.
>
> **CLI:**
>
> ```bash
> pveum user token add root@pam automation --privsep=0
> ```
>
> Without `--privsep=0` or with privilege separation left enabled in the UI, the token can appear to work while silently returning empty results for resources like VMs, containers, or storage.

### Token format

`PROXMOX_TOKEN_ID` uses the format:

```text
USER@REALM!TOKENNAME
```

Examples:

- `root@pam!automation`
- `john@pve!ops-bot`

Store the `.env` file with restricted permissions when possible:

```bash
chmod 600 ~/.config/pi-proxmox/.env
```

### Environment variables

| Variable | Purpose |
|---|---|
| `PROXMOX_HOST` | Proxmox server hostname or IP |
| `PROXMOX_PORT` | HTTPS port, default `8006` |
| `PROXMOX_TOKEN_ID` | Token ID such as `root@pam!automation` |
| `PROXMOX_TOKEN_SECRET` | Token secret UUID |
| `PROXMOX_USERNAME` | Username for password-based auth fallback |
| `PROXMOX_PASSWORD` | Password for password-based auth fallback, mainly for `/nodes/{node}/execute` |
| `PROXMOX_VERIFY_SSL` | Verify TLS certificates, `true` or `false` |
| `PROXMOX_TIMEOUT_MS` | Per-request API timeout in milliseconds |
| `PROXMOX_TOOL_TIMEOUT_MS` | Total Pi tool execution timeout in milliseconds |

### Configuration priority

1. `~/.config/pi-proxmox/.env`
2. Constructor options when embedding the client directly
3. Environment variables
4. Built-in defaults

## Runtime behavior

### Output model

- List, status, config, and inspection tools return **JSON text** for Pi to consume
- Long-running tools can stream **progress updates** into Pi via `onUpdate(...)`
- Many asynchronous Proxmox operations return a **task UPID**
- Guest-agent execution returns a **PID** that can be checked with `proxmox_vm_agent_exec_status`

### Error model

Tool failures are thrown back to Pi as proper tool errors. The error message body is JSON with fields such as:

- `error`
- `category`
- `guidance`
- `retryable`
- `endpoint`
- `method`
- `httpStatus`

Standard error categories:

| Category | Meaning |
|---|---|
| `validation` | Invalid tool parameters |
| `authentication` | Bad credentials, missing privileges, or expired auth |
| `not_found` | Requested VM, container, storage, or path does not exist |
| `timeout` | Request or tool runtime timed out |
| `network` | Connection failure to the Proxmox host |
| `server_error` | Proxmox returned a server-side failure |
| `unknown` | Unexpected error outside the known categories |

Errors in `timeout`, `network`, and `server_error` categories are marked retryable.

## Tool catalog

### Virtual Machines (QEMU/KVM)

| Tool | Description |
|---|---|
| `proxmox_vm_list` | List all VMs on a node |
| `proxmox_vm_status` | Get detailed VM status and config |
| `proxmox_vm_config` | Get VM configuration |
| `proxmox_vm_start` | Start a VM |
| `proxmox_vm_stop` | Force-stop a VM |
| `proxmox_vm_shutdown` | Graceful ACPI shutdown |
| `proxmox_vm_reset` | Hard-reset a VM |
| `proxmox_vm_resume` | Resume a suspended VM |
| `proxmox_vm_suspend` | Suspend a VM |
| `proxmox_vm_reboot` | Reboot a VM |
| `proxmox_vm_create` | Create a new VM |
| `proxmox_vm_delete` | Delete a VM |
| `proxmox_vm_update_config` | Update VM configuration |
| `proxmox_vm_template` | Convert a stopped VM to a template |
| `proxmox_vm_move_disk` | Move a VM disk to another storage |
| `proxmox_vm_pending_changes` | List pending config changes |
| `proxmox_vm_snapshot` | Snapshot a VM |
| `proxmox_vm_snapshot_list` | List VM snapshots |
| `proxmox_vm_snapshot_rollback` | Roll back to a VM snapshot |
| `proxmox_vm_snapshot_delete` | Delete a VM snapshot |
| `proxmox_vm_clone` | Clone a VM or template |
| `proxmox_vm_migrate` | Migrate a VM to another node |
| `proxmox_vm_resize_disk` | Resize a VM disk |

### VM QEMU Guest Agent

| Tool | Description |
|---|---|
| `proxmox_vm_agent_exec` | Execute a command inside a VM |
| `proxmox_vm_agent_exec_status` | Get execution status and output by PID |
| `proxmox_vm_agent_ping` | Ping the guest agent |
| `proxmox_vm_agent_info` | Get guest-agent version and supported commands |
| `proxmox_vm_agent_get_host_name` | Get VM hostname |
| `proxmox_vm_agent_get_network_interfaces` | Get VM network interfaces |
| `proxmox_vm_agent_get_osinfo` | Get VM OS information |
| `proxmox_vm_agent_get_time` | Get VM system time |
| `proxmox_vm_agent_get_users` | List logged-in users |
| `proxmox_vm_agent_get_vcpus` | Get VCPU info |
| `proxmox_vm_agent_file_read` | Read a file from a VM |
| `proxmox_vm_agent_file_write` | Write a file to a VM |
| `proxmox_vm_agent_set_user_password` | Set a user's password inside a VM |

### LXC Containers

| Tool | Description |
|---|---|
| `proxmox_lxc_list` | List containers on a node |
| `proxmox_lxc_status` | Get container status and config |
| `proxmox_lxc_start` | Start a container |
| `proxmox_lxc_stop` | Stop a container |
| `proxmox_lxc_shutdown` | Shut down a container |
| `proxmox_lxc_reset` | Hard-reset a container |
| `proxmox_lxc_resume` | Resume a suspended container |
| `proxmox_lxc_suspend` | Suspend a container |
| `proxmox_lxc_reboot` | Reboot a container |
| `proxmox_lxc_create` | Create a container from template |
| `proxmox_lxc_delete` | Delete a container |
| `proxmox_lxc_update_config` | Update container configuration |
| `proxmox_lxc_template` | Convert a stopped container to a template |
| `proxmox_lxc_template_list` | List cached LXC templates |
| `proxmox_lxc_resize` | Resize a mount point |
| `proxmox_lxc_pending_changes` | List pending config changes |
| `proxmox_lxc_snapshot` | Snapshot a container |
| `proxmox_lxc_snapshot_list` | List container snapshots |
| `proxmox_lxc_snapshot_rollback` | Roll back to a container snapshot |
| `proxmox_lxc_snapshot_delete` | Delete a container snapshot |
| `proxmox_lxc_migrate` | Migrate a container |

### Nodes

| Tool | Description |
|---|---|
| `proxmox_node_list` | List cluster nodes |
| `proxmox_node_status` | Get detailed node status |
| `proxmox_node_config` | Get node configuration |
| `proxmox_node_services` | List services on a node |
| `proxmox_node_service_status` | Get detailed service status |
| `proxmox_node_service_start` | Start a service |
| `proxmox_node_service_stop` | Stop a service |
| `proxmox_node_service_restart` | Restart a service |
| `proxmox_node_journal` | Read systemd journal |
| `proxmox_node_dns` | Get DNS configuration |
| `proxmox_node_time` | Get system time and timezone |
| `proxmox_node_hardware` | List hardware devices |
| `proxmox_node_network_list` | List network interfaces |
| `proxmox_node_execute` | Batch relative node API calls via `/execute` |
| `proxmox_node_reboot` | Reboot the node |
| `proxmox_node_stop` | Power off the node |
| `proxmox_node_apt_update` | Refresh the APT package index |
| `proxmox_node_subscription` | Get subscription status |

### Storage and pools

| Tool | Description |
|---|---|
| `proxmox_storage_list` | List storage backends on a node |
| `proxmox_storage_content` | List content on a storage backend |
| `proxmox_storage_create` | Create a storage backend |
| `proxmox_storage_detail` | Get storage details |
| `proxmox_storage_delete` | Delete a storage backend |
| `proxmox_storage_scan` | Scan for available storage resources |
| `proxmox_storage_upload` | Download from URL and upload to Proxmox storage |
| `proxmox_storage_remove_volume` | Remove a storage volume |
| `proxmox_pool_list` | List resource pools |
| `proxmox_pool_create` | Create a resource pool |
| `proxmox_pool_delete` | Delete a resource pool |

### Cluster

| Tool | Description |
|---|---|
| `proxmox_cluster_status` | Get cluster quorum and status |
| `proxmox_cluster_resources` | List cluster resources |
| `proxmox_cluster_next_id` | Get the next available VM or CT ID |
| `proxmox_cluster_version` | Get Proxmox version information |
| `proxmox_cluster_log` | Get the cluster log |
| `proxmox_cluster_options` | Get cluster options |
| `proxmox_cluster_update_options` | Update cluster options |
| `proxmox_cluster_config` | Get cluster join configuration |
| `proxmox_check_permissions` | Probe current token permissions |

### Backup

| Tool | Description |
|---|---|
| `proxmox_backup_list` | List backup jobs |
| `proxmox_backup_create` | Create a backup job |
| `proxmox_backup_delete` | Delete a backup job |

### Firewall

| Tool | Description |
|---|---|
| `proxmox_firewall_rules` | List firewall rules |
| `proxmox_firewall_rule_add` | Add a firewall rule |
| `proxmox_firewall_rules_delete` | Delete a firewall rule |
| `proxmox_firewall_options` | Get firewall options |
| `proxmox_firewall_options_update` | Update firewall options |
| `proxmox_firewall_aliases` | List firewall aliases |
| `proxmox_firewall_alias_create` | Create a firewall alias |
| `proxmox_firewall_alias_delete` | Delete a firewall alias |
| `proxmox_firewall_ipset_list` | List IPSets |
| `proxmox_firewall_ipset_create` | Create an IPSet |
| `proxmox_firewall_ipset_delete` | Delete an IPSet |

### Access control

| Tool | Description |
|---|---|
| `proxmox_user_list` | List users |
| `proxmox_user_create` | Create a user |
| `proxmox_user_detail` | Get user details |
| `proxmox_user_delete` | Delete a user |
| `proxmox_group_list` | List groups |
| `proxmox_group_create` | Create a group |
| `proxmox_group_delete` | Delete a group |
| `proxmox_role_list` | List roles |
| `proxmox_role_create` | Create a role |
| `proxmox_role_delete` | Delete a role |
| `proxmox_acl_list` | List ACL entries |
| `proxmox_acl_update` | Add or remove ACL entries |
| `proxmox_token_list` | List API tokens for a user |
| `proxmox_token_create` | Create an API token |
| `proxmox_token_delete` | Delete an API token |
| `proxmox_domain_list` | List authentication domains |

### High availability

| Tool | Description |
|---|---|
| `proxmox_ha_status` | Get HA status |
| `proxmox_ha_resources_list` | List HA resources |
| `proxmox_ha_resource_create` | Add a resource to HA |
| `proxmox_ha_resource_delete` | Remove a resource from HA |
| `proxmox_ha_groups_list` | List HA groups |
| `proxmox_ha_group_create` | Create an HA group |
| `proxmox_ha_group_delete` | Delete an HA group |

### Replication

| Tool | Description |
|---|---|
| `proxmox_replication_list` | List replication jobs |
| `proxmox_replication_create` | Create a replication job |
| `proxmox_replication_delete` | Delete a replication job |
| `proxmox_replication_run` | Trigger replication sync |
| `proxmox_replication_log` | Get replication job log |

### Tasks

| Tool | Description |
|---|---|
| `proxmox_task_list` | List recent tasks |
| `proxmox_task_status` | Get task status by UPID |
| `proxmox_task_log` | Get task log output |

### Universal API coverage

| Tool | Description |
|---|---|
| `proxmox_api_call` | Call any official GET/POST/PUT/DELETE endpoint under `/api2/json` |
| `proxmox_api_upload_file` | Upload a local file to any multipart Proxmox upload endpoint |

## Pagination notes

Several tools accept optional `start` and `limit` parameters. These map directly to Proxmox pagination or time-window query parameters.

| Tool | Endpoint | `start` semantics |
|---|---|---|
| `proxmox_task_list` | `/nodes/{node}/tasks` | integer offset |
| `proxmox_task_log` | `/nodes/{node}/tasks/{upid}/log` | integer offset |
| `proxmox_node_journal` | `/nodes/{node}/journal` | Unix timestamp |

For journal queries, `start` and `end` are epoch timestamps, not row offsets.

## Repository layout

```text
dist/                     Runtime extension code committed directly to the repo
  index.js                Pi extension entrypoint
  proxmox-client.js       REST client and auth logic
  tool-runtime.js         Shared tool execution helpers
  tools/                  Domain tool definitions

docs/                     Bundled Proxmox API reference material and operator docs

tests/                    Live integration, smoke, and runtime-behavior tests

scripts/                  Audit and maintenance helpers
.github/                  CI workflow, issue templates, and repo automation

README.md                 User-facing package documentation
AGENTS.md                 Agent/maintainer guidance
CONTRIBUTING.md           Contributor workflow
SECURITY.md               Security and disclosure policy
CHANGELOG.md              Release history
```

## Compatibility

Verified directly from this repository:

| Component | Verified value |
|---|---|
| Pi runtime | `0.79.6` |
| Proxmox VE release | `9.2` |
| Proxmox VE version | `9.2.3` |
| Node.js | `>=22` |

See [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) for the maintained compatibility notes.

## Development

```bash
npm ci
npm test
npm run test:auth
npm run test:pagination
npm run test:vm-agent
npm run test:execute
npm run test:lxc
npm run test:vm
npm run test:upload
npm run test:runtime
npm run test:raw-api
npm run test:package
npm run test:security
npm run test:ci
npm run audit:official-api
```

### Test philosophy

This project prefers **real integration coverage** over mock-heavy tests.

- API/auth behavior is tested against a real Proxmox host
- VM and LXC lifecycle tests create resources and clean them up
- Runtime tests verify Pi-specific behavior such as progress streaming, thrown tool errors, and tool timeout handling
- Raw API tests verify the universal coverage tools against official GET/POST/PUT/DELETE and upload-style endpoints
- Package tests verify repository metadata and published-package structure
- The official API audit script fetches the Proxmox API viewer and reports the current upstream route and method counts

### CI security gates

GitHub Actions uses immutable action SHAs, `npm ci` for reproducible installs, runs `npm audit --audit-level=high` as part of `npm run test:ci`, performs GitHub dependency review on pull requests, and runs scheduled CodeQL analysis for the JavaScript codebase.

## Publishing

```bash
npm pack --dry-run
npm publish --ignore-scripts
```

Publishing guidance, versioning rules, and release discipline live in [AGENTS.md](AGENTS.md).

## Support and feedback

The repository includes issue templates for:

- bug reports
- feature requests
- compatibility reports

When reporting problems, include the package version, Pi version, Proxmox version, tool name, and auth mode if possible.

## See also

- [AGENTS.md](AGENTS.md) — maintainer and agent instructions
- [CHANGELOG.md](CHANGELOG.md) — release history
- [CONTRIBUTING.md](CONTRIBUTING.md) — contributor workflow
- [SECURITY.md](SECURITY.md) — security policy and disclosure instructions
- [docs/API_COVERAGE_AUDIT.md](docs/API_COVERAGE_AUDIT.md) — official API audit and coverage approach
- [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) — verified environment notes
- [docs/EXAMPLES.md](docs/EXAMPLES.md) — copyable usage examples
- [docs/PERMISSIONS.md](docs/PERMISSIONS.md) — auth and token guidance
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) — common failure modes and fixes
- [docs/](docs/) — bundled Proxmox reference material

## License

MIT — see [LICENSE](LICENSE).
