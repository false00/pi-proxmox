# Permissions and authentication

This document explains how to give `@false00/pi-proxmox` only the Proxmox access it needs.

The package is a full-access toolset: its 141 tools include destructive operations and access-control changes, and the tools do not limit themselves. What Pi can actually do is bounded by the Proxmox permissions of the credentials you configure, so grant only what your workflows need.

## Recommended setup

- a dedicated, non-root Proxmox user, for example `pi-proxmox@pve`
- an API token for that user **with privilege separation enabled** (the Proxmox default)
- roles granted on the narrowest path that works, such as a resource pool (`/pool/<name>`) or specific `/vms/<vmid>` and `/storage/<storage>` paths, instead of `/`
- a read-only role first, adding privileges only when a workflow needs them
- no password fallback: leave `PROXMOX_USERNAME` and `PROXMOX_PASSWORD` unset

Avoid `root@pam` tokens and tokens with privilege separation disabled. A token without privilege separation carries every permission of its user, and for `root@pam` that is almost everything on the cluster.

## How privilege separation works

Proxmox API tokens come in two types:

- **Separated privileges** (the default): the token needs its own ACL entries, and its effective permissions are the **intersection** of the user's permissions and the token's permissions. A privilege-separated token can never have a permission its user lacks.
- **Full privileges**: the token has exactly its user's permissions. Proxmox recommends disabling privilege separation only when an integration genuinely needs the user's full permissions. This package does not.

Because of the intersection, grant every role **to both the user and the token**. A grant on only one of them gives the token nothing on that path.

Missing grants often look like empty results rather than errors: listing endpoints such as `/nodes/{node}/qemu` and `/nodes/{node}/lxc` silently leave out guests the caller cannot audit.

## Step 1: create the user, token, and pool

Run these as an administrator on any cluster node. The web UI has the same objects under **Datacenter → Permissions**; keep **Privilege Separation** checked when you add the token.

```bash
# Dedicated non-root user. No password is set; the API token is its credential.
pveum user add pi-proxmox@pve --comment "pi-proxmox automation"

# API token with privilege separation enabled (the default, set explicitly).
pveum user token add pi-proxmox@pve automation --privsep 1 --comment "pi-proxmox"

# Resource pool that holds only the guests and storage Pi may use (use your own IDs).
pveum pool add pi-proxmox --comment "Managed by pi-proxmox"
pveum pool modify pi-proxmox --vms 101,102 --storage local-lvm
```

`pveum user token add` prints the token secret once; it cannot be retrieved later. Put it in `PROXMOX_TOKEN_SECRET` and set `PROXMOX_TOKEN_ID=pi-proxmox@pve!automation`.

Consider an expiry so abandoned automation stops working, for example `--expire "$(date -d '+90 days' +%s)"` (Unix epoch seconds).

## Step 2: grant a tier

Start with tier 1. Each later tier adds to the earlier ones. Check what a role contains with `pveum role list` before granting it.

### Tier 1: read-only (start here)

```bash
pveum acl modify /pool/pi-proxmox --roles PVEAuditor --users pi-proxmox@pve
pveum acl modify /pool/pi-proxmox --roles PVEAuditor --tokens 'pi-proxmox@pve!automation'
```

`PVEAuditor` is the built-in read-only role. Granted on the pool, it lets Pi list and inspect the pool's guests and storage: VM and container lists, status, configuration, pending changes, snapshot lists, and storage content.

Node and cluster read tools check other paths:

- `Sys.Audit` on `/nodes/<node>`: node status, services, DNS, time, and node-level firewall reads
- `Sys.Audit` on `/`: cluster status, cluster join information, node config, backup jobs, HA status and lists, PCI device lists, and cluster-level firewall reads

To allow those reads without exposing every guest and storage, add `PVEAuditor` on the node, and on `/` without propagation:

```bash
pveum acl modify /nodes/pve1 --roles PVEAuditor --users pi-proxmox@pve
pveum acl modify /nodes/pve1 --roles PVEAuditor --tokens 'pi-proxmox@pve!automation'
pveum acl modify / --roles PVEAuditor --propagate 0 --users pi-proxmox@pve
pveum acl modify / --roles PVEAuditor --propagate 0 --tokens 'pi-proxmox@pve!automation'
```

### Tier 2: guest operator

A custom role for VM and container power management and snapshots, scoped to the pool:

```bash
pveum role add PiProxmoxOperator --privs "VM.Audit VM.PowerMgmt VM.Snapshot VM.Snapshot.Rollback"
pveum acl modify /pool/pi-proxmox --roles PiProxmoxOperator --users pi-proxmox@pve
pveum acl modify /pool/pi-proxmox --roles PiProxmoxOperator --tokens 'pi-proxmox@pve!automation'
```

This covers start, stop, shutdown, reboot, reset, suspend, resume, and snapshot create, delete, and rollback for guests in the pool. Custom role names must not start with `PVE`, which is reserved for built-in roles.

Extend the role only with privileges from the [tool privilege map](#tool-privilege-map) that a workflow needs, for example read-only guest-agent queries:

```bash
pveum role modify PiProxmoxOperator --append 1 --privs "VM.GuestAgent.Audit"
```

### Tier 3: provisioning and infrastructure changes (only if needed)

Creating, cloning, reconfiguring, migrating, and deleting guests needs considerably more. To keep that inside the pool, the built-in `PVEVMAdmin` ("fully administer VMs") and `PVEDatastoreUser` ("allocate backup space and view storage", which includes the `Datastore.AllocateSpace` that disk creation needs) roles fit, or build a narrower custom role from the [tool privilege map](#tool-privilege-map):

```bash
pveum acl modify /pool/pi-proxmox --roles PVEVMAdmin,PVEDatastoreUser --users pi-proxmox@pve
pveum acl modify /pool/pi-proxmox --roles PVEVMAdmin,PVEDatastoreUser --tokens 'pi-proxmox@pve!automation'
```

Notes:

- Pass `pool=pi-proxmox` to `proxmox_vm_create`, `proxmox_vm_clone`, and `proxmox_lxc_create` so Proxmox checks `VM.Allocate` on the pool and adds the new guest to it.
- Guests with network devices also need `SDN.Use` on the bridge or VNet they use (path `/sdn/zones/<zone>/<vnet>`; plain Linux bridges such as `vmbr0` belong to the `localnetwork` zone). The built-in `PVESDNUser` role provides it:

  ```bash
  pveum acl modify /sdn/zones/localnetwork/vmbr0 --roles PVESDNUser --users pi-proxmox@pve
  pveum acl modify /sdn/zones/localnetwork/vmbr0 --roles PVESDNUser --tokens 'pi-proxmox@pve!automation'
  ```

- Privileged containers (`unprivileged=0`) also need `Sys.Modify` on `/`. New containers are unprivileged by default.

Node, storage-definition, cluster, firewall, HA, and backup-job changes need host-level privileges such as `Sys.Modify`, `Sys.PowerMgmt`, `Sys.Console`, or `Datastore.Allocate`, often on `/`. Broad roles such as `PVEAdmin` and `Administrator` on `/` cover most or all of the toolset. Reserve them for people who truly need them, preferably on a separate token used only for that work.

### Tier 4: access control (reserve)

The user, group, role, ACL, and token tools change who can do what, potentially including the token's own access: `Permissions.Modify` edits ACLs on the paths it covers, `Sys.Modify` on `/access` edits role definitions (including roles the token already holds), and `User.Modify` manages users and their tokens in the groups it covers. Keep these privileges off the token Pi uses day to day, and grant them only to people who truly need them, on a separate token.

## Root-only operations

Proxmox restricts some operations to the `root@pam` user. No role or ACL grants them to the dedicated user or its token.

- `proxmox_node_execute`: `POST /nodes/{node}/execute` is listed as **Root only** in the API viewer ("Execute multiple commands in order, root only."). In the verified test environment it rejected the configured API token even though ordinary token-based calls succeeded, so the package retries it with a password ticket when the password fallback is configured. It is the only tool that uses that retry.
- `proxmox_vm_migrate` with `force=1`: the API documents `force` as "Only root may use this option".
- `proxmox_api_call` and `proxmox_api_upload_file` requests to endpoints the API viewer lists as **Root only** (for example cluster join and cluster configuration changes, ACME account management, Ceph OSD creation and removal, disk wiping, and volume copies) or that use root-only parameters (for example the `tmpdir`, `dumpdir`, and `script` options of backup jobs). The package does not retry these with the password fallback.

Recommended: leave the password fallback unset so `proxmox_node_execute` fails closed with a permission error, like the other root-only operations above. Everything it batches is a node-relative API request; run the requests individually with the dedicated tools or `proxmox_api_call` under the least-privilege token instead.

## Password fallback (optional, discouraged)

The package reads `PROXMOX_USERNAME` and `PROXMOX_PASSWORD` in two cases:

1. **No API token configured:** it logs in with them and uses the resulting ticket for every request.
2. **`proxmox_node_execute`:** when `/nodes/{node}/execute` rejects the API token with a permission error, it retries that request once with a password ticket.

Because `/nodes/{node}/execute` is root-only, the retry only helps with `root@pam` credentials: the Linux root password of the node, which is an unconfined administrator login. `PROXMOX_USERNAME` defaults to `root@pam` when unset (kept for backward compatibility), so setting only `PROXMOX_PASSWORD` configures root credentials.

Recommendations:

- Leave both unset. `proxmox_node_execute` then fails closed instead of reaching for root.
- Do not run in password-only mode. If you must, use a dedicated non-root user with its own password, never `root@pam`.
- If you deliberately need `proxmox_node_execute`, keep the root fallback out of your everyday configuration and isolate it in a separate, deliberately chosen one, for example a separate OS account whose `~/.config/pi-proxmox/.env` holds it (the package reads that file from the current user's home directory), used only for the sessions and lab clusters that need it.
- Never commit these credentials, and restrict the file with `chmod 600`.

## Checking effective permissions

```bash
pveum user permissions pi-proxmox@pve
pveum user token permissions pi-proxmox@pve automation
pveum user token permissions pi-proxmox@pve automation --path /pool/pi-proxmox
```

From Pi, `proxmox_check_permissions` probes a few common read paths. Probes outside the scope you granted are expected to be denied.

## Common failure patterns

### Authentication works, but VM or CT lists are empty

Likely cause:

- the token or its user has no grant on a path that covers those guests (a privilege-separated token gets the intersection of both)
- the guests are not in the pool you granted

Fix:

- grant the role to both the user and the token on the narrowest path that covers the guests, or add the guests to the pool
- do not switch to a `root@pam` token or disable privilege separation

### A tool fails with `Permission check failed`

Likely cause:

- the token, or its user, lacks the privilege that endpoint checks on that path

Fix:

- find the tool in the [tool privilege map](#tool-privilege-map) and grant the missing privilege through a role, to both the user and the token, on the narrowest path that works

### `proxmox_node_execute` fails while other tools work

Likely cause:

- `/nodes/{node}/execute` is root-only and rejected the API token; this is expected with the recommended setup

Fix:

- run the batched requests individually with dedicated tools or `proxmox_api_call`
- configure the `root@pam` password fallback only if you accept the risks above, in an isolated configuration

### Guest agent tools fail

Likely cause:

- QEMU guest agent not enabled in the VM config
- guest agent package not installed inside the VM
- the token lacks the `VM.GuestAgent.*` privilege the tool needs

## Tool privilege map

Privileges and paths come from the Permissions section of each endpoint in the official API viewer at `https://pve.proxmox.com/pve-docs/api-viewer/`. Privileges checked on `/vms/<vmid>` or `/storage/<storage>` can also be granted on a pool that contains the object, and any privilege can be granted on a parent path with propagation (the default).

### Read and inspect

| Tools | Privilege | Path |
|---|---|---|
| `proxmox_vm_list`, `proxmox_lxc_list` | lists only guests with `VM.Audit` | `/vms/<vmid>` |
| `proxmox_vm_status`, `proxmox_vm_config`, `proxmox_vm_pending_changes`, `proxmox_vm_snapshot_list`, `proxmox_lxc_status`, `proxmox_lxc_pending_changes`, `proxmox_lxc_snapshot_list` | `VM.Audit` | `/vms/<vmid>` |
| `proxmox_storage_list`, `proxmox_storage_content`, `proxmox_lxc_template_list` | `Datastore.Audit` or `Datastore.AllocateSpace` | `/storage/<storage>` |
| `proxmox_pool_list` | lists only pools with `Pool.Audit` | `/pool/<pool>` |
| `proxmox_replication_list`, `proxmox_replication_log` | `VM.Audit` (log: or `Sys.Audit` on `/nodes/<node>`) | `/vms/<vmid>` |
| `proxmox_node_status`, `proxmox_node_services`, `proxmox_node_service_status`, `proxmox_node_dns`, `proxmox_node_time` | `Sys.Audit` | `/nodes/<node>` |
| `proxmox_node_journal` | `Sys.Syslog` | `/nodes/<node>` |
| `proxmox_node_config`, `proxmox_cluster_status`, `proxmox_cluster_config`, `proxmox_backup_list`, `proxmox_ha_status`, `proxmox_ha_resources_list`, `proxmox_ha_groups_list` | `Sys.Audit` | `/` |
| `proxmox_node_hardware` | `Sys.Audit` or `Sys.Modify` for PCI devices (the default); `Sys.Modify` for USB devices | `/` |
| `proxmox_cluster_options`, `proxmox_cluster_log` | none; full output needs `Sys.Audit` (options) or `Sys.Syslog` (log) | `/` |
| `proxmox_task_list`, `proxmox_task_status`, `proxmox_task_log` | none for the caller's own tasks; `Sys.Audit` for other tasks | `/nodes/<node>` |
| `proxmox_node_list`, `proxmox_cluster_resources`, `proxmox_cluster_next_id`, `proxmox_cluster_version`, `proxmox_node_subscription`, `proxmox_node_network_list`, `proxmox_role_list`, `proxmox_domain_list` | none beyond authentication | — |

### Firewall

Read tools: `proxmox_firewall_rules`, `proxmox_firewall_options`, `proxmox_firewall_aliases`, `proxmox_firewall_ipset_list`.
Change tools: `proxmox_firewall_rule_add`, `proxmox_firewall_rules_delete`, `proxmox_firewall_options_update`, `proxmox_firewall_alias_create`, `proxmox_firewall_alias_delete`, `proxmox_firewall_ipset_create`, `proxmox_firewall_ipset_delete`.

| Level | Read | Change |
|---|---|---|
| cluster | `Sys.Audit` on `/` | `Sys.Modify` on `/` |
| node | `Sys.Audit` on `/nodes/<node>` | `Sys.Modify` on `/nodes/<node>` |
| VM or container | `VM.Audit` on `/vms/<vmid>` | `VM.Config.Network` on `/vms/<vmid>` |

### Guest operations

| Tools | Privilege | Path |
|---|---|---|
| `proxmox_vm_start`, `proxmox_vm_stop`, `proxmox_vm_shutdown`, `proxmox_vm_reset`, `proxmox_vm_reboot`, `proxmox_vm_suspend`, `proxmox_vm_resume`, `proxmox_lxc_start`, `proxmox_lxc_stop`, `proxmox_lxc_shutdown`, `proxmox_lxc_reboot`, `proxmox_lxc_suspend`, `proxmox_lxc_resume` | `VM.PowerMgmt` | `/vms/<vmid>` |
| `proxmox_vm_snapshot`, `proxmox_vm_snapshot_delete`, `proxmox_lxc_snapshot`, `proxmox_lxc_snapshot_delete` | `VM.Snapshot` | `/vms/<vmid>` |
| `proxmox_vm_snapshot_rollback`, `proxmox_lxc_snapshot_rollback` | `VM.Snapshot` or `VM.Snapshot.Rollback` | `/vms/<vmid>` |
| `proxmox_vm_agent_ping`, `proxmox_vm_agent_info`, `proxmox_vm_agent_get_*` | `VM.GuestAgent.Audit` | `/vms/<vmid>` |
| `proxmox_vm_agent_file_read` | `VM.GuestAgent.FileRead` | `/vms/<vmid>` |
| `proxmox_vm_agent_file_write` | `VM.GuestAgent.FileWrite` | `/vms/<vmid>` |
| `proxmox_vm_agent_exec`, `proxmox_vm_agent_exec_status`, `proxmox_vm_agent_set_user_password` | `VM.GuestAgent.Unrestricted` (arbitrary guest-agent commands; also satisfies the other guest-agent checks) | `/vms/<vmid>` |

### Provisioning and guest changes

| Tools | Privileges |
|---|---|
| `proxmox_vm_create` | `VM.Allocate` on `/vms/<vmid>` or `/pool/<pool>`; `Datastore.AllocateSpace` on each storage used; `SDN.Use` on each bridge or VLAN used |
| `proxmox_vm_clone` | `VM.Clone` on the source `/vms/<vmid>`; `VM.Allocate` on `/vms/<newid>` or `/pool/<pool>`; `Datastore.AllocateSpace` on each storage used; `SDN.Use` on each bridge used |
| `proxmox_lxc_create` | `VM.Allocate` on `/vms/<vmid>` or `/pool/<pool>`; `Datastore.AllocateSpace` on the storage; privileged containers also `Sys.Modify` on `/` |
| `proxmox_vm_delete`, `proxmox_lxc_delete`, `proxmox_vm_template`, `proxmox_lxc_template` | `VM.Allocate` on `/vms/<vmid>` |
| `proxmox_vm_update_config`, `proxmox_lxc_update_config` | the matching `VM.Config.*` privilege for the settings changed (for example `VM.Config.CPU`, `VM.Config.Memory`, `VM.Config.Network`, `VM.Config.Options`) on `/vms/<vmid>` |
| `proxmox_vm_resize_disk`, `proxmox_lxc_resize` | `VM.Config.Disk` on `/vms/<vmid>` |
| `proxmox_vm_move_disk` | `VM.Config.Disk` on `/vms/<vmid>`; `Datastore.AllocateSpace` on the target storage |
| `proxmox_vm_migrate`, `proxmox_lxc_migrate` | `VM.Migrate` on `/vms/<vmid>` (`force` on VM migration is root-only) |
| `proxmox_replication_create`, `proxmox_replication_delete`, `proxmox_replication_run` | `VM.Replicate` on `/vms/<vmid>` |

### Storage and pools

| Tools | Privilege | Path |
|---|---|---|
| `proxmox_storage_upload`, `proxmox_api_upload_file` (storage upload) | `Datastore.AllocateTemplate` | `/storage/<storage>` |
| `proxmox_storage_remove_volume` | `Datastore.Allocate` (or `Datastore.AllocateSpace` for backup volumes when you have `VM.Backup` on the guest) | `/storage/<storage>` |
| `proxmox_storage_detail` | `Datastore.Allocate` | `/storage/<storage>` |
| `proxmox_storage_create`, `proxmox_storage_delete` | `Datastore.Allocate` | `/storage` |
| `proxmox_storage_scan` | `Datastore.Allocate` for a scan; listing the scan types (no `type`) needs none | `/storage` |
| `proxmox_pool_create`, `proxmox_pool_delete` | `Pool.Allocate` | `/pool/<pool>` |

### Nodes and cluster

| Tools | Privilege | Path |
|---|---|---|
| `proxmox_node_service_start`, `proxmox_node_service_stop`, `proxmox_node_service_restart`, `proxmox_node_apt_update` | `Sys.Modify` | `/nodes/<node>` |
| `proxmox_node_reboot`, `proxmox_node_stop` | `Sys.PowerMgmt` | `/nodes/<node>` |
| `proxmox_cluster_update_options`, `proxmox_backup_create`, `proxmox_backup_delete` | `Sys.Modify` | `/` |
| `proxmox_ha_resource_create`, `proxmox_ha_resource_delete`, `proxmox_ha_group_create`, `proxmox_ha_group_delete` | `Sys.Console` | `/` |
| `proxmox_node_execute` | **Root only** (`root@pam`); no role grants it | — |

### Access control (reserve)

| Tools | Privilege | Path |
|---|---|---|
| `proxmox_user_list`, `proxmox_group_list`, `proxmox_acl_list` | none; results are limited to entries you can manage | — |
| `proxmox_user_detail` | `User.Modify` or `Sys.Audit` for the user's groups | `/access/groups` or `/access/groups/<group>` |
| `proxmox_user_create`, `proxmox_user_delete` | `Realm.AllocateUser` on the user's realm, and `User.Modify` for its groups | `/access/realm/<realm>`, `/access/groups` or `/access/groups/<group>` |
| `proxmox_group_create`, `proxmox_group_delete` | `Group.Allocate` | `/access/groups` |
| `proxmox_role_create`, `proxmox_role_delete` | `Sys.Modify` | `/access` |
| `proxmox_acl_update` | `Permissions.Modify`, or for `/storage/...`, `/vms/...`, and `/pool/...` paths `Datastore.Allocate`, `VM.Allocate`, or `Pool.Allocate`; without `Permissions.Modify`, only subsets of your own privileges can be delegated | the target path |
| `proxmox_token_list`, `proxmox_token_create`, `proxmox_token_delete` | none for the caller's own user; other users need `User.Modify` for their groups | `/access/groups` or `/access/groups/<group>` |

### Universal tools

| Tools | Privilege |
|---|---|
| `proxmox_api_call`, `proxmox_api_upload_file` | whatever the target endpoint lists under Permissions in the API viewer |

## Security guidance

- prefer a dedicated automation user and privilege-separated token over personal or `root@pam` credentials
- grant roles on the narrowest path that works and review them with `pveum user token permissions`
- avoid storing secrets in the repository
- use restricted permissions on local `.env` files
- test destructive operations on non-critical workloads first
