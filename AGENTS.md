# `@false00/pi-proxmox`

Proxmox VE automation tools for the Pi coding agent. Manage VMs (QEMU/KVM), LXC containers, storage, cluster operations, backups, firewalls, and task tracking through the Proxmox REST API.

## Project structure

- `dist/` — compiled JavaScript output (entry: `dist/index.js`)
- `dist/tools/` — individual tool implementations (vm, lxc, node, storage, cluster, backup, firewall, etc.)
- `dist/proxmox-client.js` — Proxmox REST API client with token auth, ticket auth, and SSH fallback
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
  3. `AGENTS.md` — the tool reference tables and workflow examples

- **Verify before finishing.** After any code change, grep for stale references:
  - Old default values
  - Wrong file paths
  - Outdated parameter names or descriptions

- **Tool descriptions are agent-facing documentation.** The `description` field on each tool is what the LLM sees. Keep them accurate and concise.

## Project quirks

- **`dist/` is committed** — Changes are made directly to the `.js` files in `dist/`. There is no `src/` or separate build step.
- **No `tsconfig.json`** — No TypeScript source files exist; the project is pure JavaScript.
- **SSH dependency** — `proxmox_lxc_exec` and `proxmox_node_execute` require SSH access to the Proxmox host because the API has no native shell exec endpoint for LXC containers. See SSH section in README for setup.

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

## Configuration

Create `~/.config/pi-proxmox/.env` with your connection details:

```env
# --- Connection ---
PROXMOX_HOST=192.168.1.100
PROXMOX_PORT=8006
PROXMOX_VERIFY_SSL=false

# --- API Token (recommended) ---
# Create one in the Proxmox web UI under: Datacenter > Permissions > API Tokens
# Or via CLI: pveum user token add root@pam automation --privsep=0
PROXMOX_TOKEN_ID=root@pam!automation
PROXMOX_TOKEN_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# --- Password fallback (also used by /execute endpoint when API tokens lack permission) ---
PROXMOX_USERNAME=root@pam
PROXMOX_PASSWORD=yourpassword

# --- SSH (for proxmox_lxc_exec and proxmox_node_execute) ---
# WHY: The Proxmox VE API has no native shell exec endpoint for LXC containers
#      (unlike VMs which have a QEMU Guest Agent). The /node/execute endpoint is
#      a batch API proxy, not a shell executor. So LXC exec and node execute
#      fall back to SSH when the API can't run the command.
#
# To add your public key to the Proxmox host (edit the IP):
#   Linux/macOS:    ssh-copy-id root@192.168.1.100
#   Windows (pwsh): type $env:USERPROFILE/.ssh/id_ed25519.pub | ssh root@192.168.1.100 "cat >> /root/.ssh/authorized_keys"
#   Windows (cmd):  type %USERPROFILE%\.ssh\id_ed25519.pub | ssh root@192.168.1.100 "cat >> /root/.ssh/authorized_keys"
#
# Path to SSH private key for connecting to the Proxmox host as root.
# If not set, defaults to trying ~/.ssh/id_ed25519 then ~/.ssh/id_rsa.
# Your public key must be in /root/.ssh/authorized_keys on the Proxmox host.
PROXMOX_SSH_KEY_PATH=

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

## Available Tools

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
| `proxmox_lxc_exec` | Execute a command inside a container (API-first, falls back to SSH via `pct exec`) |

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
| `proxmox_node_execute` | Execute arbitrary command on host node (API-first, falls back to SSH) |
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

## Error Handling

Tools use standardized error categories:
- **validation** — Invalid parameters
- **authentication** — Bad credentials/expired token
- **not_found** — Resource doesn't exist
- **timeout** — Request timed out (adjust PROXMOX_TIMEOUT_MS)
- **network** — Cannot connect to host
- **server_error** — Proxmox node error
- **unknown** — Unexpected error

## Common Workflows

**List VMs on a node:**
`proxmox_vm_list(node: "pve1")`

**Create a container:**
`proxmox_lxc_create(node: "pve1", vmid: 300, hostname: "web", ostemplate: "local:vztmpl/debian-12-standard_12.0-1_amd64.tar.gz", memory: 2048, start: 1)`

**Check cluster health:**
`proxmox_cluster_status()`

**Create nightly backup:**
`proxmox_backup_create(id: "nightly", node: "pve1", storage: "backup-nfs", schedule: "0 2 * * *", mode: "snapshot", compress: "zstd", "prune-backups": "keep-last=7", all: 1)`

## See Also

Documentation in `docs/` for the full Proxmox VE API reference and endpoint details.
