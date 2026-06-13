# Proxmox VE API — QEMU Virtual Machines

This document covers the API endpoints for managing KVM/QEMU virtual machines in Proxmox VE.

## Base Path
```
/nodes/{node}/qemu
```

## Listing & Status

### List VMs
```
GET /nodes/{node}/qemu
```
List all VMs on a node.

**Returns:** Array with `vmid`, `name`, `status`, `cpu`, `mem`, `disk`, `uptime`, `cgroup-mode`, `pid`, `template`.

### VM Status
```
GET /nodes/{node}/qemu/{vmid}/status/current
```
Get real-time VM status including CPU usage, memory ballooning, disk I/O, network throughput, and running state.

```
GET /nodes/{node}/qemu/{vmid}/status
```
Alias for `status/current`.

### VM Configuration
```
GET /nodes/{node}/qemu/{vmid}/config
```
Get the full VM configuration including CPU, memory, network devices, disks, boot order, and BIOS settings.

## Lifecycle Management

### Create VM
```
POST /nodes/{node}/qemu
```
Create a new virtual machine.

**Key Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `vmid` | integer | Unique VM ID |
| `name` | string | Hostname |
| `cores` | integer | Number of CPU cores |
| `sockets` | integer | Number of CPU sockets |
| `memory` | integer | RAM in MB |
| `ostype` | string | Guest OS type: `wxp`, `w2k`, `w2k3`, `w2k8`, `wvista`, `win7`, `win8`, `win10`, `win11`, `l24`, `l26` (Linux 2.4/2.6+), `solaris`, `other` |
| `net0` | string | Network device: `virtio=MAC,bridge=vmbr0` |
| `scsihw` | string | SCSI controller: `lsi`, `virtio-scsi-single`, `megasas`, `pvscsi` |
| `ide2` | string | CDROM: `none`, `media=cdrom`, `file=local:iso/...iso` |
| `boot` | string | Boot order: `order=scsi0;net0` |
| `agent` | integer | Enable QEMU Agent: `1` = enabled |
| `pool` | string | Resource pool |
| `template` | boolean | Mark as template |
| `onboot` | boolean | Start VM on node boot |
| `protection` | boolean | Enable protection from remove/disk-reindex |
| `start` | boolean | Start VM after creation |
| `tags` | string | Comma-separated tags |
| `description` | string | VM description |

### VM Status Actions
```
POST /nodes/{node}/qemu/{vmid}/status/start
POST /nodes/{node}/qemu/{vmid}/status/stop
POST /nodes/{node}/qemu/{vmid}/status/shutdown
POST /nodes/{node}/qemu/{vmid}/status/reset
POST /nodes/{node}/qemu/{vmid}/status/suspend
POST /nodes/{node}/qemu/{vmid}/status/resume
POST /nodes/{node}/qemu/{vmid}/status/reboot
```
Control VM power state. `shutdown` sends ACPI signal (graceful); `stop` is hard power-off.

### Update VM Configuration
```
PUT /nodes/{node}/qemu/{vmid}/config
```
Modify VM configuration. All creation parameters can be updated.

### Delete VM
```
DELETE /nodes/{node}/qemu/{vmid}
```
Remove a VM. **Parameters:** `purge` (boolean) — also remove from backup jobs; `destroy-unreferenced-disks` (boolean) — remove disks not referenced in config.

### Migrate VM
```
POST /nodes/{node}/qemu/{vmid}/migrate
```
Migrate VM to another node.

**Parameters:** `target` (string), `online` (boolean, live migration), `with-local-disks` (boolean), `force` (boolean).

```
POST /nodes/{node}/qemu/{vmid}/migrateall
```
Migrate all VMs from a node.

## Snapshots

### List Snapshots
```
GET /nodes/{node}/qemu/{vmid}/snapshot
```
List all snapshots for the VM.

### Create Snapshot
```
POST /nodes/{node}/qemu/{vmid}/snapshot
```
**Parameters:** `snapname` (string), `description` (string), `vmstate` (boolean, include RAM state).

### Rollback
```
POST /nodes/{node}/qemu/{vmid}/snapshot/{snapname}/rollback
```
Revert VM to snapshot state.

### Delete Snapshot
```
DELETE /nodes/{node}/qemu/{vmid}/snapshot/{snapname}
```

### Get Snapshot Configuration
```
GET /nodes/{node}/qemu/{vmid}/snapshot/{snapname}/config
```

## Clone & Template

### Clone VM
```
POST /nodes/{node}/qemu/{vmid}/clone
```
Clone a VM or template.

**Parameters:** `newid` (integer), `name` (string), `target` (string, target node), `full` (boolean, full clone vs linked clone), `format` (string: `raw`, `qcow2`, `vmdk`), `snapname` (string, snapshot to clone from), `pool` (string).

### Template Conversion
```
POST /nodes/{node}/qemu/{vmid}/template
```
Convert VM to template (must be stopped).

### Move Disk
```
POST /nodes/{node}/qemu/{vmid}/move_disk
```
Move a disk to different storage.

**Parameters:** `disk` (string), `storage` (string), `format` (string), `delete` (boolean).

### Resize Disk
```
PUT /nodes/{node}/qemu/{vmid}/resize
```
Resize a disk. **Parameters:** `disk` (string), `size` (string, e.g., `+10G`).

## QEMU Guest Agent
```
POST /nodes/{node}/qemu/{vmid}/agent/exec
POST /nodes/{node}/qemu/{vmid}/agent/exec-status
POST /nodes/{node}/qemu/{vmid}/agent/file-read
POST /nodes/{node}/qemu/{vmid}/agent/file-write
POST /nodes/{node}/qemu/{vmid}/agent/fsfreeze-freeze
POST /nodes/{node}/qemu/{vmid}/agent/fsfreeze-status
POST /nodes/{node}/qemu/{vmid}/agent/fsfreeze-thaw
POST /nodes/{node}/qemu/{vmid}/agent/get-fsinfo
POST /nodes/{node}/qemu/{vmid}/agent/get-host-name
POST /nodes/{node}/qemu/{vmid}/agent/get-network-interfaces
POST /nodes/{node}/qemu/{vmid}/agent/get-osinfo
POST /nodes/{node}/qemu/{vmid}/agent/get-time
POST /nodes/{node}/qemu/{vmid}/agent/get-users
POST /nodes/{node}/qemu/{vmid}/agent/get-vcpus
POST /nodes/{node}/qemu/{vmid}/agent/info
POST /nodes/{node}/qemu/{vmid}/agent/ping
POST /nodes/{node}/qemu/{vmid}/agent/set-user-password
POST /nodes/{node}/qemu/{vmid}/agent/shutdown
POST /nodes/{node}/qemu/{vmid}/agent/suspend
POST /nodes/{node}/qemu/{vmid}/agent/suspend-disk
POST /nodes/{node}/qemu/{vmid}/agent/suspend-ram
```
Execute QEMU Guest Agent commands (requires `agent: 1` in VM config).

## VM Firewall
```
GET /nodes/{node}/qemu/{vmid}/firewall/rules
POST /nodes/{node}/qemu/{vmid}/firewall/rules
PUT /nodes/{node}/qemu/{vmid}/firewall/rules/{pos}
DELETE /nodes/{node}/qemu/{vmid}/firewall/rules/{pos}
GET /nodes/{node}/qemu/{vmid}/firewall/aliases
POST /nodes/{node}/qemu/{vmid}/firewall/aliases
GET /nodes/{node}/qemu/{vmid}/firewall/options
PUT /nodes/{node}/qemu/{vmid}/firewall/options
GET /nodes/{node}/qemu/{vmid}/firewall/log
GET /nodes/{node}/qemu/{vmid}/firewall/refs
```
Per-VM firewall rules, aliases, and options. See [Cluster_Firewall](Cluster_Firewall.md) for parameter details.

## VNC Console
```
GET /nodes/{node}/qemu/{vmid}/vncproxy
```
Get VNC proxy ticket for console access.

```
POST /nodes/{node}/qemu/{vmid}/spiceproxy
```
Get SPICE proxy ticket.

## Monitoring
```
GET /nodes/{node}/qemu/{vmid}/rrddata
```
Get historical performance data (see [Node_Monitoring](Node_Monitoring.md)).

## Pending Changes
```
GET /nodes/{node}/qemu/{vmid}/pending
```
View pending configuration changes (applied on next reboot).

## Permissions
| Action | Required Permission |
|--------|-------------------|
| List, status, config | `VM.Audit` on `/vms/{vmid}` |
| Create, modify, delete | `VM.Config` on `/vms/{vmid}` |
| Power operations | `VM.PowerMgmt` on `/vms/{vmid}` |
| Clone, migrate, template | `VM.Config` + `VM.Clone` |
| Snapshot management | `VM.Snapshot` on `/vms/{vmid}` |
| Firewall | `VM.Config` on `/vms/{vmid}` |
| QEMU Agent | `VM.Config` on `/vms/{vmid}` |

## Common Workflows

### Create and Start a VM
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "vmid=200&name=web-server&cores=4&memory=8192&net0=virtio,bridge=vmbr0&ostype=l26&ide2=local:iso/ubuntu-24.04.iso,media=cdrom&boot=order=ide2;scsi0&scsihw=virtio-scsi-single&start=1" \
  https://node:8006/api2/json/nodes/pve1/qemu
```

### Take a Snapshot
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "snapname=pre-update&description=Before kernel update&vmstate=1" \
  https://node:8006/api2/json/nodes/pve1/qemu/200/snapshot
```

### Clone a VM
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "newid=201&name=web-server-clone&full=1&target=pve2" \
  https://node:8006/api2/json/nodes/pve1/qemu/200/clone
```

### Live Migrate a VM
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "target=pve2&online=1" \
  https://node:8006/api2/json/nodes/pve1/qemu/200/migrate
```

### Resize a Disk
```bash
curl -X PUT -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "disk=scsi0&size=+20G" \
  https://node:8006/api2/json/nodes/pve1/qemu/200/resize
```

### Run Command via QEMU Agent
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "command=uptime" \
  https://node:8006/api2/json/nodes/pve1/qemu/200/agent/exec
```
