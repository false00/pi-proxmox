# @false00/pi-proxmox

> Proxmox VE automation for the [Pi](https://github.com/badlogic/pi-mono) coding agent. Manage VMs, LXC containers, storage, cluster infrastructure, firewall rules, backups, and task tracking through the Proxmox REST API.

| | |
|---|---|
| npm | [`@false00/pi-proxmox`](https://www.npmjs.com/package/@false00/pi-proxmox) |
| GitHub | [github.com/false00/pi-proxmox](https://github.com/false00/pi-proxmox) |

## Quick start

```bash
pi install npm:@false00/pi-proxmox
```

Then just ask Pi to manage your infrastructure:

```
> List all VMs on pve1
> Create a new container with 2GB RAM on pve1
> Show cluster status
```

Pi will use `proxmox_vm_list`, `proxmox_lxc_create`, `proxmox_cluster_status`, and the rest of the tool suite to interact with your Proxmox cluster. All authentication is handled through the configured API token or credentials.

## Tools

### Virtual Machines (QEMU/KVM)

| Tool | Description |
|------|-------------|
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
| `proxmox_vm_snapshot` | Snapshot a VM (optionally with RAM) |
| `proxmox_vm_snapshot_list` | List VM snapshots |
| `proxmox_vm_snapshot_rollback` | Rollback to a VM snapshot |
| `proxmox_vm_snapshot_delete` | Delete a VM snapshot |
| `proxmox_vm_clone` | Clone a VM or template |
| `proxmox_vm_migrate` | Live-migrate a VM to another node |
| `proxmox_vm_resize_disk` | Resize a VM disk (e.g., +10G) |

### VM QEMU Guest Agent

| Tool | Description |
|------|-------------|
| `proxmox_vm_agent_exec` | Execute a command inside a VM (returns PID) |
| `proxmox_vm_agent_exec_status` | Check execution status/output of a PID |
| `proxmox_vm_agent_ping` | Ping the QEMU guest agent |
| `proxmox_vm_agent_info` | Get agent version and supported commands |
| `proxmox_vm_agent_get_host_name` | Get VM hostname |
| `proxmox_vm_agent_get_network_interfaces` | Get VM network interfaces |
| `proxmox_vm_agent_get_osinfo` | Get VM OS information |
| `proxmox_vm_agent_get_time` | Get VM system time |
| `proxmox_vm_agent_get_users` | List logged-in users inside VM |
| `proxmox_vm_agent_get_vcpus` | Get VM VCPU info |
| `proxmox_vm_agent_file_read` | Read a file from a VM (base64) |
| `proxmox_vm_agent_file_write` | Write a file to a VM (base64) |
| `proxmox_vm_agent_set_user_password` | Set a user's password in a VM |

### LXC Containers

| Tool | Description |
|------|-------------|
| `proxmox_lxc_list` | List containers on a node |
| `proxmox_lxc_status` | Get container status and config |
| `proxmox_lxc_start` | Start a container |
| `proxmox_lxc_stop` | Stop a container |
| `proxmox_lxc_shutdown` | Shutdown a container |
| `proxmox_lxc_reset` | Hard-reset a container |
| `proxmox_lxc_resume` | Resume a suspended container |
| `proxmox_lxc_suspend` | Suspend a container |
| `proxmox_lxc_reboot` | Reboot a container |
| `proxmox_lxc_create` | Create a container from template |
| `proxmox_lxc_delete` | Delete a container |
| `proxmox_lxc_update_config` | Update container configuration |
| `proxmox_lxc_template` | Convert a stopped container to a template |
| `proxmox_lxc_template_list` | List cached LXC templates |
| `proxmox_lxc_resize` | Resize a container mount point |
| `proxmox_lxc_pending_changes` | List pending config changes |
| `proxmox_lxc_snapshot` | Snapshot a container |
| `proxmox_lxc_snapshot_list` | List container snapshots |
| `proxmox_lxc_snapshot_rollback` | Rollback to a container snapshot |
| `proxmox_lxc_snapshot_delete` | Delete a container snapshot |
| `proxmox_lxc_migrate` | Migrate a container to another node |

### Nodes

| Tool | Description |
|------|-------------|
| `proxmox_node_list` | List all cluster nodes |
| `proxmox_node_status` | Get detailed node status |
| `proxmox_node_config` | Get node configuration |
| `proxmox_node_services` | List services on a node |
| `proxmox_node_service_status` | Get detailed service status |
| `proxmox_node_service_start` | Start a service |
| `proxmox_node_service_stop` | Stop a service |
| `proxmox_node_service_restart` | Restart a service |
| `proxmox_node_journal` | Read systemd journal |
| `proxmox_node_dns` | Get DNS configuration |
| `proxmox_node_time` | Get system time/timezone |
| `proxmox_node_hardware` | List hardware devices |
| `proxmox_node_network_list` | List network interfaces |
| `proxmox_node_execute` | Execute batch API calls on a node via /execute |
| `proxmox_node_reboot` | Reboot the node |
| `proxmox_node_stop` | Stop (power off) the node |
| `proxmox_node_apt_update` | Refresh APT package index |
| `proxmox_node_subscription` | Get subscription status |

### Storage

| Tool | Description |
|------|-------------|
| `proxmox_storage_list` | List storage backends on a node |
| `proxmox_storage_content` | List content on a storage |
| `proxmox_storage_create` | Create a storage backend |
| `proxmox_storage_detail` | Get storage details |
| `proxmox_storage_delete` | Delete a storage backend |
| `proxmox_storage_scan` | Scan for available storage resources |
| `proxmox_storage_remove_volume` | Remove a volume from storage |
| `proxmox_pool_list` | List resource pools |
| `proxmox_pool_create` | Create a resource pool |
| `proxmox_pool_delete` | Delete a resource pool |

### Cluster

| Tool | Description |
|------|-------------|
| `proxmox_cluster_status` | Get cluster quorum and status |
| `proxmox_cluster_resources` | List all cluster resources |
| `proxmox_cluster_next_id` | Get the next available VM ID |
| `proxmox_cluster_version` | Get Proxmox version |
| `proxmox_cluster_log` | Get cluster log |
| `proxmox_cluster_options` | Get cluster options |
| `proxmox_cluster_update_options` | Update cluster options |
| `proxmox_cluster_config` | Get cluster join config |
| `proxmox_check_permissions` | Probe token permissions |

### Backup

| Tool | Description |
|------|-------------|
| `proxmox_backup_list` | List backup jobs |
| `proxmox_backup_create` | Create a backup job |
| `proxmox_backup_delete` | Delete a backup job |

### Firewall

| Tool | Description |
|------|-------------|
| `proxmox_firewall_rules` | List firewall rules (cluster/node/vm/lxc) |
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

### Access Control

| Tool | Description |
|------|-------------|
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
| `proxmox_acl_update` | Update ACL (add/remove) |
| `proxmox_token_list` | List API tokens for a user |
| `proxmox_token_create` | Create an API token |
| `proxmox_token_delete` | Delete an API token |
| `proxmox_domain_list` | List authentication domains |

### High Availability

| Tool | Description |
|------|-------------|
| `proxmox_ha_status` | Get HA status |
| `proxmox_ha_resources_list` | List HA resources |
| `proxmox_ha_resource_create` | Add a resource to HA |
| `proxmox_ha_resource_delete` | Remove a resource from HA |
| `proxmox_ha_groups_list` | List HA groups |
| `proxmox_ha_group_create` | Create an HA group |
| `proxmox_ha_group_delete` | Delete an HA group |

### Storage Replication

| Tool | Description |
|------|-------------|
| `proxmox_replication_list` | List replication jobs |
| `proxmox_replication_create` | Create a replication job |
| `proxmox_replication_delete` | Delete a replication job |
| `proxmox_replication_run` | Trigger a replication sync |
| `proxmox_replication_log` | Get replication job log |

### Tasks

| Tool | Description |
|------|-------------|
| `proxmox_task_list` | List recent tasks |
| `proxmox_task_status` | Get task status by UPID |
| `proxmox_task_log` | Get task log output |

All tools that return structured data (list, status, config) output JSON. Tools that trigger asynchronous operations (create, start, shutdown, clone, migrate) return the task UPID for tracking progress via `proxmox_task_status` and `proxmox_task_log`.

The VM QEMU Guest Agent tools (`proxmox_vm_agent_exec*`) provide command execution inside VMs. The `command` parameter is split on whitespace into individual arguments before being sent to the QEMU Guest Agent's `guest-exec` API (which expects `path` + `arg[]` as separate values). Use `proxmox_vm_agent_exec_status` via the returned PID to check completion and get output.

For LXC containers, there is no API-based shell exec mechanism — use the QEMU Agent in VMs or configure SSH access at the host level.

## Install

Install into Pi as a package:

```bash
pi install npm:@false00/pi-proxmox
```

Or load it for a single run:

```bash
pi -e npm:@false00/pi-proxmox
```

For local development from this repo:

```bash
pi -e .
```

## Pagination

Several tools accept optional `start` (offset) and `limit` parameters for pagination. These map directly to Proxmox's `start` and `limit` query parameters on supported endpoints:

| Tool | Endpoint | `start` type |
|------|----------|-------------|
| `proxmox_task_list` | `/nodes/{node}/tasks` | integer offset |
| `proxmox_task_log` | `/nodes/{node}/tasks/{upid}/log` | integer offset |
| `proxmox_node_journal` | `/nodes/{node}/journal` | timestamp (Unix epoch) |

The `start` parameter on journal endpoints is a Unix timestamp, not a row offset. Pass `start` and `end` as epoch seconds to set the time window. Not all Proxmox versions support pagination parameters on every endpoint — unsupported parameters return a 400 error from the API (the tools are designed to let the LLM try, and errors are surfaced clearly).

## Configuration

### Required

- Node.js 20+
- A Pi runtime that supports extensions
- Access to a Proxmox VE cluster reachable over HTTPS

### Connection

Create `~/.config/pi-proxmox/.env`:

```env
# --- Connection ---
PROXMOX_HOST=192.168.1.100
PROXMOX_PORT=8006
PROXMOX_VERIFY_SSL=false

# --- API Token (recommended) ---
PROXMOX_TOKEN_ID=root@pam!automation
PROXMOX_TOKEN_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# --- Password fallback (used by /execute endpoint when API tokens lack permission) ---
PROXMOX_USERNAME=root@pam
PROXMOX_PASSWORD=yourpassword

# --- Timeout ---
PROXMOX_TIMEOUT_MS=30000
```

> **Create an admin token** (required to run all tools): API tokens must be created with **full privileges** to access VMs, containers, storage, cluster status, and all other endpoints.
>
> **Web UI:** Go to **Datacenter > Permissions > API Tokens**, click **Add**, select your user (e.g. `root@pam`), enter a Token ID (e.g. `automation`), and **make sure "Privilege Separation" is unchecked** ❗️ This checkbox is ON by default — you MUST uncheck it or the token will silently return empty results for VMs, containers, storage, and other resources. Copy the displayed Token ID and Secret.
>
> **CLI (recommended):** `pveum user token add root@pam automation --privsep=0`  
> The `--privsep=0` flag is critical — it disables privilege separation and gives the token full admin access. Without it (or with `--privsep=1`), the token will silently return empty results for VMs, containers, storage, and other resources.
>
> **Token ID format:** `USER@REALM!TOKENNAME` — for example `root@pam!automation` or `john@pve!my-token-01`. The parts are the Proxmox username (`root`), realm (`pam` for PAM users), and your chosen token name. Token names can contain letters, numbers, and hyphens (no spaces or underscores). The full string with both `@` and `!` goes into `PROXMOX_TOKEN_ID` in your `.env`.
>
> Store the `.env` with restricted permissions: `chmod 600 ~/.config/pi-proxmox/.env`

Values in `~/.config/pi-proxmox/.env` take precedence over environment variables.

### Environment variables

**Connection**

| Variable | Purpose |
|----------|---------|
| `PROXMOX_HOST` | Proxmox server hostname or IP |
| `PROXMOX_PORT` | HTTPS port (default: 8006) |
| `PROXMOX_TOKEN_ID` | Token ID (e.g., `root@pam!automation`) |
| `PROXMOX_TOKEN_SECRET` | Token secret UUID |
| `PROXMOX_USERNAME` | Proxmox username (e.g., `root@pam`) |
| `PROXMOX_PASSWORD` | Password (used when no API token is set) |
| `PROXMOX_VERIFY_SSL` | Verify TLS certificate (`true`/`false`, default: `false`) |

**Timeouts**

| Variable | Purpose |
|----------|---------|
| `PROXMOX_TIMEOUT_MS` | API request timeout (default: 30000) |
| `PROXMOX_TOOL_TIMEOUT_MS` | Tool execution timeout (default: 30000) |

### Configuration priority

1. `~/.config/pi-proxmox/.env` file (highest)
2. Constructor parameters (when embedding the client directly)
3. Environment variables
4. Default values

## Error handling

Tools return errors with standardized categories to help Pi respond appropriately:

| Category | Meaning |
|----------|---------|
| `validation` | Invalid parameters — check parameter types and values |
| `authentication` | Bad credentials or expired token — verify `.env` file |
| `not_found` | Resource doesn't exist — check IDs and paths |
| `timeout` | Request timed out — node may be busy; increase `PROXMOX_TIMEOUT_MS` |
| `network` | Cannot connect to host — verify `PROXMOX_HOST` and network |
| `server_error` | Proxmox node error — check node status |
| `unknown` | Unexpected error — see message for details |

Errors with category `timeout`, `server_error`, or `network` are marked retryable.

## Development

```bash
npm install
npm test              # run all test suites
npm run test:auth     # auth & connection
npm run test:pagination
npm run test:vm-agent # VM agent exec, file-read, etc.
npm run test:execute   # batch API execute
npm run test:lxc      # LXC container lifecycle
```

Test suites live in `tests/` and run against a live Proxmox host configured via the `.env` file. Each suite creates and cleans up its own resources.

### Publishing

```bash
npm version patch && npm pack --dry-run && npm publish --ignore-scripts
```

The `dist/` directory is the source of truth (no TS source files). Publish with `--ignore-scripts`.

If 2FA is enabled, npm will prompt you to authenticate in the browser before publishing.

The package manifest in `package.json` exposes the compiled extension entrypoint via `pi.extensions`, which lets Pi load the package root directly after install.

## See also

- [AGENTS.md](AGENTS.md) — Agent-facing tool usage reference
- [docs/](docs/) — Full Proxmox VE API reference covering all 398+ API endpoints

## License

MIT — Copyright (c) 2026 false00 & contributors.
