# Proxmox VE API — Ceph Storage Cluster

This document covers the API endpoints for managing integrated Ceph storage clusters within Proxmox VE.

## Base Path
```
/cluster/ceph
```

## Ceph Status & Overview
```
GET /cluster/ceph/status
```
Returns overall Ceph cluster health, mon status, OSD status, and storage utilization.

## Ceph Configuration
```
GET /cluster/ceph/config
```
Retrieve the current Ceph configuration.

```
PUT /cluster/ceph/config
```
Update Ceph configuration parameters.

## Ceph Flags
```
GET /cluster/ceph/flags
```
View current Ceph cluster flags (e.g., `noout`, `norecover`, `pause`).

```
PUT /cluster/ceph/flags
```
Set or unset Ceph cluster flags.

## Monitor (MON) Management
```
GET /cluster/ceph/mon
```
List all Ceph monitor nodes.

```
POST /cluster/ceph/mon
```
Create a new Ceph monitor on a node.

**Parameters:** `node` (string), `monaddr` (IP address, optional)

```
DELETE /cluster/ceph/mon/{mon-id}
```
Remove a Ceph monitor.

## OSD Management
```
GET /cluster/ceph/osd
```
List all OSDs with their status, weight, and utilization.

```
POST /cluster/ceph/osd
```
Create a new OSD.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `dev` | string | Device path (e.g., `/dev/sdb`) |
| `node` | string | Node to create OSD on |
| `wal_dev` | string | WAL device (optional) |
| `db_dev` | string | DB device (optional) |

```
PUT /cluster/ceph/osd/{osdid}
```
Modify OSD parameters (e.g., `crush_weight`, `reweight`).

```
DELETE /cluster/ceph/osd/{osdid}
```
Remove an OSD from the cluster.

### OSD Flags
```
GET /cluster/ceph/osd/{osdid}/flags
```
View flags set on a specific OSD.

```
PUT /cluster/ceph/osd/{osdid}/flags
```
Set flags on a specific OSD (e.g., `noout`, `noscrub`).

### OSD Scrub
```
PUT /cluster/ceph/osd/{osdid}/scrub
```
Trigger manual scrub on an OSD.

### OSD In/Out
```
POST /cluster/ceph/osd/{osdid}/in
POST /cluster/ceph/osd/{osdid}/out
```
Mark an OSD in or out of the cluster.

## Pool (RBD) Management
```
GET /cluster/ceph/pool
```
List all Ceph pools with their PG counts, replication size, and usage.

```
POST /cluster/ceph/pool
```
Create a new RBD pool.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `poolname` | string | Pool name |
| `pg_num` | integer | Placement group count |
| `size` | integer | Replication factor |
| `crush_ruleset` | integer | CRUSH ruleset ID |

```
PUT /cluster/ceph/pool/{poolname}
```
Modify pool parameters.

```
DELETE /cluster/ceph/pool/{poolname}
```
Remove a pool.

## CRUSH Rules
```
GET /cluster/ceph/crush
```
View CRUSH map rules and hierarchy.

## Permissions
- `Sys.Modify` on `/` — Required for Ceph management operations
- `Sys.Audit` on `/` — Required for reading Ceph status and configuration

## Common Workflows

### Get Ceph Health
```bash
curl -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  https://node:8006/api2/json/cluster/ceph/status
```

### Create a New OSD
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "dev=/dev/sdb&node=pve1" \
  https://node:8006/api2/json/cluster/ceph/osd
```

### Create a Pool
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "poolname=ssd-pool&pg_num=128&size=3" \
  https://node:8006/api2/json/cluster/ceph/pool
```
