# Proxmox VE API — Node Resource Management

This document details the management endpoints available for individual cluster nodes (`/nodes/{node}`). These cover virtualization resources, storage, replication, SDN, and services on specific hardware.

## Node Operations

### List Nodes
```
GET /nodes
```
List all cluster nodes with status, CPU, memory, and uptime.

### Get Node
```
GET /nodes/{node}
```
Get details for a specific node.

### Node Status
```
GET /nodes/{node}/status
```
Real-time performance metrics (CPU, memory, disk, uptime, kernel, load).

## Virtualization Resources

### QEMU Virtual Machines
```
GET /nodes/{node}/qemu
POST /nodes/{node}/qemu
GET /nodes/{node}/qemu/{vmid}/config
GET /nodes/{node}/qemu/{vmid}/status/current
POST /nodes/{node}/qemu/{vmid}/status/start
POST /nodes/{node}/qemu/{vmid}/status/stop
POST /nodes/{node}/qemu/{vmid}/status/shutdown
DELETE /nodes/{node}/qemu/{vmid}
POST /nodes/{node}/qemu/{vmid}/migrate
POST /nodes/{node}/qemu/{vmid}/clone
POST /nodes/{node}/qemu/{vmid}/snapshot
```
See [VM_QEMU](VM_QEMU.md) for complete VM management reference.

### LXC Containers
```
GET /nodes/{node}/lxc
POST /nodes/{node}/lxc
GET /nodes/{node}/lxc/{vmid}/config
GET /nodes/{node}/lxc/{vmid}/status/current
POST /nodes/{node}/lxc/{vmid}/status/start
POST /nodes/{node}/lxc/{vmid}/status/stop
DELETE /nodes/{node}/lxc/{vmid}
POST /nodes/{node}/lxc/{vmid}/migrate
POST /nodes/{node}/lxc/{vmid}/snapshot
GET /nodes/{node}/lxc/templates
```
See [VM_LXC](VM_LXC.md) for complete container management reference.

## Storage
```
GET /nodes/{node}/storage
GET /nodes/{node}/storage/{storage}/content
GET /nodes/{node}/storage/{storage}/status
POST /nodes/{node}/storage/{storage}/upload
```
See [Storage](Storage.md) for storage management, [ISO_Template_Management](ISO_Template_Management.md) for upload details.

## Replication
```
GET /nodes/{node}/replication
POST /nodes/{node}/replication
POST /nodes/{node}/replication/{id}/run
DELETE /nodes/{node}/replication/{id}
```
See [Storage_Replication](Storage_Replication.md) for replication management.

## SDN (Per-Node)
```
GET /nodes/{node}/sdn
```
Local SDN configuration for the node's role in the cluster SDN framework.

## Node Administration
The following areas are covered in detail in [Node_Administration](Node_Administration.md):
- Hardware inventory, capabilities
- Disk management (ZFS, LVM, SMART)
- Network interfaces, bridges, bonds
- Certificates, subscription
- System logs, journal, DNS, time
- APT package management
- Command execution, node stop/reboot, WOL

## Node Monitoring
Covered in detail in [Node_Monitoring](Node_Monitoring.md):
- RRD historical data
- Real-time metrics
- Services management
- Task tracking and logs

## Permissions
Access to `/nodes/{node}` resources requires `Sys.Audit` (read) or `Sys.Modify` (write) on the node path. VM/CT-specific operations require `VM.*` permissions on the respective VM/CT paths.
