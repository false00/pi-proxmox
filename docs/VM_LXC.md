# Proxmox VE API — LXC Containers

This document covers the API endpoints for managing Linux Containers (LXC) in Proxmox VE.

## Base Path
```
/nodes/{node}/lxc
```

## Listing & Status

### List Containers
```
GET /nodes/{node}/lxc
```
List all containers on a node.

**Returns:** Array with `vmid`, `name`, `status`, `cpu`, `mem`, `disk`, `uptime`, `swap`, `cgroup-mode`, `lock`.

### Container Status
```
GET /nodes/{node}/lxc/{vmid}/status/current
```
Get real-time container status including CPU usage, memory, swap, network, and disk I/O.

```
GET /nodes/{node}/lxc/{vmid}/status
```
Alias for `status/current`.

### Container Configuration
```
GET /nodes/{node}/lxc/{vmid}/config
```
Get the full container configuration including CPU, memory, mount points, network, and features.

## Lifecycle Management

### Create Container
```
POST /nodes/{node}/lxc
```
Create a new LXC container.

**Key Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `vmid` | integer | Unique container ID |
| `hostname` | string | Container hostname |
| `ostemplate` | string | Template: `local:vztmpl/debian-12-standard_12.0-1_amd64.tar.gz` |
| `storage` | string | Storage location for rootfs |
| `rootfs` | string | Root filesystem, e.g., `local-lvm:8` (8 GB) |
| `memory` | integer | RAM in MB |
| `swap` | integer | Swap in MB |
| `cores` | integer | CPU cores |
| `cpulimit` | number | CPU usage limit (0-1) |
| `cpuunits` | integer | CPU weight for fair scheduling |
| `net0` | string | Network: `name=eth0,bridge=vmbr0,ip=dhcp` |
| `nameserver` | string | DNS server |
| `searchdomain` | string | DNS search domain |
| `password` | string | Root password |
| `ssh-public-keys` | string | SSH public keys |
| `pool` | string | Resource pool |
| `onboot` | boolean | Start on node boot |
| `protection` | boolean | Protection from removal |
| `start` | boolean | Start after creation |
| `template` | boolean | Mark as template |
| `unprivileged` | boolean | Run unprivileged (default: true) |
| `features` | string | Comma-separated: `fuse=1`, `keyctl=1`, `mount=cifs;nfs`, `nesting=1`, `nfs=1` |
| `tags` | string | Comma-separated tags |
| `description` | string | Description |

### Status Actions
```
POST /nodes/{node}/lxc/{vmid}/status/start
POST /nodes/{node}/lxc/{vmid}/status/stop
POST /nodes/{node}/lxc/{vmid}/status/shutdown
POST /nodes/{node}/lxc/{vmid}/status/reset
POST /nodes/{node}/lxc/{vmid}/status/suspend
POST /nodes/{node}/lxc/{vmid}/status/resume
POST /nodes/{node}/lxc/{vmid}/status/reboot
```
Control container power state.

### Update Configuration
```
PUT /nodes/{node}/lxc/{vmid}/config
```
Modify container configuration. All creation parameters can be updated.

### Delete Container
```
DELETE /nodes/{node}/lxc/{vmid}
```
Remove a container. **Parameters:** `purge` (boolean) — remove from backup jobs; `destroy-unreferenced-disks` (boolean).

### Migrate Container
```
POST /nodes/{node}/lxc/{vmid}/migrate
```
Migrate container to another node.

**Parameters:** `target` (string), `online` (boolean, live migration), `restart` (boolean), `force` (boolean).

## Snapshots

### List Snapshots
```
GET /nodes/{node}/lxc/{vmid}/snapshot
```

### Create Snapshot
```
POST /nodes/{node}/lxc/{vmid}/snapshot
```
**Parameters:** `snapname` (string), `description` (string), `remove` (string, comma-separated to exclude).

### Rollback
```
POST /nodes/{node}/lxc/{vmid}/snapshot/{snapname}/rollback
```

### Delete Snapshot
```
DELETE /nodes/{node}/lxc/{vmid}/snapshot/{snapname}
```

## Templates

### List Available Templates
```
GET /nodes/{node}/lxc/templates
```
List all cached LXC templates on the node.

**Returns:** Array with `template` (path), `size`, `digest`, `download_url`.

See [ISO_Template_Management](ISO_Template_Management.md) for detailed template management and download instructions.

### Convert to Template
```
POST /nodes/{node}/lxc/{vmid}/template
```
Convert a stopped container to a template.

## Mount Points & Storage
```
PUT /nodes/{node}/lxc/{vmid}/resize
```
Resize a mount point.
**Parameters:** `mp` (string, mount point ID like `mp0`), `size` (string, e.g., `+5G`).

```
POST /nodes/{node}/lxc/{vmid}/move_volume
```
Move a volume to different storage.
**Parameters:** `volume` (string), `storage` (string), `delete` (boolean), `digest` (string).

## Container Firewall
```
GET /nodes/{node}/lxc/{vmid}/firewall/rules
POST /nodes/{node}/lxc/{vmid}/firewall/rules
PUT /nodes/{node}/lxc/{vmid}/firewall/rules/{pos}
DELETE /nodes/{node}/lxc/{vmid}/firewall/rules/{pos}
GET /nodes/{node}/lxc/{vmid}/firewall/aliases
POST /nodes/{node}/lxc/{vmid}/firewall/aliases
GET /nodes/{node}/lxc/{vmid}/firewall/options
PUT /nodes/{node}/lxc/{vmid}/firewall/options
GET /nodes/{node}/lxc/{vmid}/firewall/log
GET /nodes/{node}/lxc/{vmid}/firewall/refs
```
Per-container firewall rules, aliases, and options. See [Cluster_Firewall](Cluster_Firewall.md) for parameter details.

## VNC Console
```
GET /nodes/{node}/lxc/{vmid}/vncproxy
POST /nodes/{node}/lxc/{vmid}/spiceproxy
```
Get proxy tickets for container console access.

## Monitoring
```
GET /nodes/{node}/lxc/{vmid}/rrddata
```
Get historical performance data (see [Node_Monitoring](Node_Monitoring.md)).

## Pending Changes
```
GET /nodes/{node}/lxc/{vmid}/pending
```
View pending configuration changes (applied on next restart).

## Permissions
| Action | Required Permission |
|--------|-------------------|
| List, status, config | `VM.Audit` on `/vms/{vmid}` |
| Create, modify, delete | `VM.Config` on `/vms/{vmid}` |
| Power operations | `VM.PowerMgmt` on `/vms/{vmid}` |
| Migrate | `VM.Config` + `VM.Clone` |
| Snapshot management | `VM.Snapshot` on `/vms/{vmid}` |
| Templates | `VM.Config` on `/vms/{vmid}` |
| Firewall | `VM.Config` on `/vms/{vmid}` |

## Common Workflows

### Create and Start a Container
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "vmid=300&hostname=web-ct&ostemplate=local:vztmpl/debian-12-standard_12.0-1_amd64.tar.gz&storage=local-lvm&rootfs=local-lvm:8&memory=2048&swap=512&cores=2&net0=name=eth0,bridge=vmbr0,ip=dhcp&password=secret123&start=1" \
  https://node:8006/api2/json/nodes/pve1/lxc
```

### Take a Snapshot
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "snapname=pre-upgrade&description=Before package upgrade" \
  https://node:8006/api2/json/nodes/pve1/lxc/300/snapshot
```

### Migrate Container
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "target=pve2&restart=1" \
  https://node:8006/api2/json/nodes/pve1/lxc/300/migrate
```

### Resize Container Rootfs
```bash
curl -X PUT -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "mp=mp0&size=+10G" \
  https://node:8006/api2/json/nodes/pve1/lxc/300/resize
```

### Enable Nesting (Docker Inside LXC)
```bash
curl -X PUT -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "features=nesting=1" \
  https://node:8006/api2/json/nodes/pve1/lxc/300/config
```
