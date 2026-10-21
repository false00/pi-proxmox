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
Access cluster-wide log entries. **Parameters:** `max` (integer, maximum number of entries).

```
GET /cluster/options
```
View cluster-wide configuration options (e.g., `fencing`, `ha`, `console`, `keyboard`, `language`, `email_from`).

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
Index of the node's sub-resources.

### Node Status
```
GET /nodes/{node}/status
```
Real-time status including CPU, memory, swap, root filesystem, uptime, kernel version, and Proxmox version.

## Resource Pools

### List Pools
```
GET /pools
```
Returns all resource pools, or one pool's configuration with `poolid`.

### Create Pool
```
POST /pools
```
**Parameters:** `poolid` (string), `comment` (string).

### Get Pool
```
GET /pools/{poolid}
```
Returns pool details including member VMs, CTs, and storage (deprecated; use `GET /pools` with `poolid`).

### Update Pool
```
PUT /pools/{poolid}
```
Add or remove members (`vms`, `storage`, with `delete=1` to remove) and update the comment (deprecated; use `PUT /pools` with `poolid`).

### Delete Pool
```
DELETE /pools/{poolid}
```
Delete an empty pool (deprecated; use `DELETE /pools` with `poolid`).

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
GET /cluster/config/join
```
Returns the information a new node needs to join this cluster.

## Permissions
| Endpoint | Required Permission |
|----------|-------------------|
| Cluster status, join information | `Sys.Audit` on `/` |
| Cluster resources | None beyond authentication; lists only what you can audit |
| Cluster log | None beyond authentication; all entries need `Sys.Syslog` on `/` |
| Cluster options | `Sys.Audit` (read, full output) or `Sys.Modify` (change) on `/` |
| Node list | None beyond authentication |
| Node status | `Sys.Audit` on `/nodes/{node}` |
| Pool details | `Pool.Audit` on `/pool/{poolid}` |
| Pool create, update, delete | `Pool.Allocate` on `/pool/{poolid}` |
| Version | None beyond authentication |

## Common Workflows

### List All Nodes with Status
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/nodes
```

### Get Cluster Quorum Status
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/cluster/status
```

### Check Proxmox Version
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/version
```

### Get Next Available VM ID
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/cluster/nextid
```

### Create a Resource Pool
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "poolid=production&comment=Production VMs" \
  https://node:8006/api2/json/pools
```
