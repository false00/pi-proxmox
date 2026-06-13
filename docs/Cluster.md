# Proxmox VE API — Cluster & Node Management

This document covers the core cluster-level endpoints for managing nodes, resource pools, version information, and cluster-wide configuration.

## Base Paths
```
/cluster
/nodes
/pools
/version
```

## Cluster Status
```
GET /cluster/status
```
Returns cluster membership, quorum state, and node connectivity information.

```
GET /cluster/resources
```
Aggregated view of all cluster resources (VMs, CTs, nodes, storage) with type, status, and usage metrics.

```
GET /cluster/log
```
Access cluster-wide log entries. **Parameters:** `start` (int), `limit` (int), `since` (timestamp).

```
GET /cluster/options
```
View cluster-wide configuration options (e.g., `fence`, `ha`, `console`, `keyboard`, `language`, `email`).

```
PUT /cluster/options
```
Update cluster options.

## Node Management

### List Nodes
```
GET /nodes
```
Returns all nodes in the cluster with their status, CPU, memory, uptime, and load.

### Get Node
```
GET /nodes/{node}
```
Details for a specific node.

### Node Status
```
GET /nodes/{node}/status
```
Real-time status including CPU, memory, swap, disk, uptime, kernel version, and Proxmox version.

## Resource Pools

### List Pools
```
GET /pools
```
Returns all resource pools.

### Create Pool
```
POST /pools
```
**Parameters:** `poolid` (string), `comment` (string).

### Get Pool
```
GET /pools/{poolid}
```
Returns pool details including member VMs, CTs, and storage.

### Update Pool
```
PUT /pools/{poolid}
```
Add/remove members and update comments.

### Delete Pool
```
DELETE /pools/{poolid}
```

## Version
```
GET /version
```
Returns Proxmox VE version, release number, and repository ID.

## Next ID
```
GET /cluster/nextid
```
Returns the next available VM/CT ID. **Parameter:** `vmid` (integer, optional — check if a specific ID is available).

## Cluster Configuration
```
GET /cluster/config
```
Returns cluster join configuration.

## Permissions
| Endpoint | Required Permission |
|----------|-------------------|
| Cluster status, resources, log | `Sys.Audit` on `/` |
| Cluster options | `Sys.Modify` on `/` |
| Node list, status | `Sys.Audit` on `/nodes/{node}` |
| Pool CRUD | `Pool.Allocate` on `/pool/{poolid}` |
| Version | None (public) |

## Common Workflows

### List All Nodes with Status
```bash
curl -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  https://node:8006/api2/json/nodes
```

### Get Cluster Quorum Status
```bash
curl -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  https://node:8006/api2/json/cluster/status
```

### Check Proxmox Version
```bash
curl -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  https://node:8006/api2/json/version
```

### Get Next Available VM ID
```bash
curl -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  https://node:8006/api2/json/cluster/nextid
```

### Create a Resource Pool
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "poolid=production&comment=Production VMs" \
  https://node:8006/api2/json/pools
```
