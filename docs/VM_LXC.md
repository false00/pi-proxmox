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

**Returns:** Array with `vmid`, `name`, `status`, `cpu`, `cpus`, `mem`, `maxmem`, `disk`, `maxdisk`, `uptime`, `tags`, `template`, `lock`, and I/O counters.

### Container Status
```
GET /nodes/{node}/lxc/{vmid}/status/current
```
Get real-time container status including CPU usage, memory, swap, network, and disk I/O.

`GET /nodes/{node}/lxc/{vmid}/status` itself only lists the status sub-endpoints.

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
POST /nodes/{node}/lxc/{vmid}/status/suspend
POST /nodes/{node}/lxc/{vmid}/status/resume
POST /nodes/{node}/lxc/{vmid}/status/reboot
```
Control container power state. Containers have no hard reset like QEMU's `status/reset`; stop and start the container instead.

### Update Configuration
```
PUT /nodes/{node}/lxc/{vmid}/config
```
Modify container configuration (CPU, memory, network, mount points, options). Settings that only apply at creation, such as `ostemplate`, `password`, and `ssh-public-keys`, cannot be changed here.

### Delete Container
```
DELETE /nodes/{node}/lxc/{vmid}
```
Remove a container. **Parameters:** `purge` (boolean) — also remove it from related configuration such as backup jobs, replication jobs, and HA; `destroy-unreferenced-disks` (boolean); `force` (boolean, destroy even if running).

### Migrate Container
```
POST /nodes/{node}/lxc/{vmid}/migrate
```
Migrate container to another node. Running containers cannot be live-migrated; use `restart=1` for a restart migration.

**Parameters:** `target` (string), `restart` (boolean), `timeout` (integer, shutdown timeout for restart migration), `target-storage` (string), `online` (boolean), `bwlimit` (integer).

## Snapshots

### List Snapshots
```
GET /nodes/{node}/lxc/{vmid}/snapshot
```

### Create Snapshot
```
POST /nodes/{node}/lxc/{vmid}/snapshot
```
**Parameters:** `snapname` (string), `description` (string).

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
GET /nodes/{node}/storage/{storage}/content?content=vztmpl
```
List cached LXC templates from a node storage backend.

**Returns:** Storage content records for volumes of type `vztmpl`.

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
**Parameters:** `disk` (string, `rootfs` or a mount point such as `mp0`), `size` (string, e.g., `+5G`; shrinking is not supported).

```
POST /nodes/{node}/lxc/{vmid}/move_volume
```
Move a volume to different storage or to another container.
**Parameters:** `volume` (string), `storage` (string), `target-vmid` (integer), `delete` (boolean), `digest` (string).

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

## Console
```
POST /nodes/{node}/lxc/{vmid}/vncproxy
POST /nodes/{node}/lxc/{vmid}/termproxy
POST /nodes/{node}/lxc/{vmid}/spiceproxy
```
Create proxy tickets for container console access (VNC, xterm.js, or SPICE).

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
| Create | `VM.Allocate` on `/vms/{vmid}` or on the pool given as `pool`; `Datastore.AllocateSpace` on the storage |
| Modify configuration | The `VM.Config.*` privilege for each setting changed (`VM.Config.CPU`, `VM.Config.Memory`, `VM.Config.Network`, `VM.Config.Disk`, `VM.Config.Options`) on `/vms/{vmid}` |
| Delete | `VM.Allocate` on `/vms/{vmid}` |
| Power operations | `VM.PowerMgmt` on `/vms/{vmid}` |
| Migrate | `VM.Migrate` on `/vms/{vmid}` |
| Snapshot management | `VM.Snapshot` on `/vms/{vmid}` (rollback: or `VM.Snapshot.Rollback`) |
| Convert to template | `VM.Allocate` on `/vms/{vmid}` |
| Resize, move volumes | `VM.Config.Disk` on `/vms/{vmid}` (moving also needs `Datastore.AllocateSpace` on the target storage) |
| Firewall | `VM.Audit` (read) or `VM.Config.Network` (change) on `/vms/{vmid}` |
| Console | `VM.Console` on `/vms/{vmid}` |

## Common Workflows

### Create and Start a Container
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  --data-urlencode "vmid=300" --data-urlencode "hostname=web-ct" \
  --data-urlencode "ostemplate=local:vztmpl/debian-12-standard_12.0-1_amd64.tar.gz" \
  --data-urlencode "rootfs=local-lvm:8" --data-urlencode "memory=2048" --data-urlencode "swap=512" \
  --data-urlencode "cores=2" --data-urlencode "net0=name=eth0,bridge=vmbr0,ip=dhcp" \
  --data-urlencode "ssh-public-keys@$HOME/.ssh/id_ed25519.pub" --data-urlencode "start=1" \
  https://node:8006/api2/json/nodes/pve1/lxc
```

### Take a Snapshot
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "snapname=pre-upgrade&description=Before package upgrade" \
  https://node:8006/api2/json/nodes/pve1/lxc/300/snapshot
```

### Migrate Container
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "target=pve2&restart=1" \
  https://node:8006/api2/json/nodes/pve1/lxc/300/migrate
```

### Resize Container Rootfs
```bash
curl -X PUT -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "disk=rootfs&size=+10G" \
  https://node:8006/api2/json/nodes/pve1/lxc/300/resize
```

### Enable Nesting (Docker Inside LXC)
```bash
curl -X PUT -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "features=nesting=1" \
  https://node:8006/api2/json/nodes/pve1/lxc/300/config
```
