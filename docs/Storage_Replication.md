# Proxmox VE API — Storage Replication

This document covers the ZFS storage replication endpoints used to synchronize VM and CT data between cluster nodes for high availability and disaster recovery.

## Overview
Proxmox VE replication uses ZFS snapshots to periodically synchronize VM/CT data from a source node to one or more target nodes. This enables near-instant failover with minimal data loss.

## Base Paths
```
/nodes/{node}/replication
/datacenter/replication
```

## List Replication Jobs
```
GET /datacenter/replication
```
List all configured replication jobs across the cluster.

```
GET /nodes/{node}/replication
```
List replication jobs for a specific node.

## Get Replication Job
```
GET /datacenter/replication/{id}
GET /nodes/{node}/replication/{id}
```
Get details of a specific replication job.

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Replication job ID |
| `type` | string | Job type |
| `source` | string | Source node |
| `target` | string | Target node |
| `vmid` | integer | VM/CT ID being replicated |
| `schedule` | string | Cron schedule |
| `rate` | string | Bandwidth limit |
| `enabled` | boolean | Whether job is active |
| `last_sync` | string | Last successful sync time |
| `last_try` | string | Last sync attempt time |
| `last_state` | string | Last sync state |
| `comment` | string | Description |

## Create Replication Job
```
POST /nodes/{node}/replication
```
Create a new replication job for a VM/CT.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Replication job ID (auto-generated if omitted) |
| `type` | string | Replication type |
| `target` | string | Target node |
| `vmid` | integer | VM/CT ID to replicate |
| `schedule` | string | Cron schedule (e.g., `*/15 * * * *` for every 15 min) |
| `rate` | string | Bandwidth limit (e.g., `100MB`) |
| `enabled` | boolean | Enable/disable the job |
| `comment` | string | Description |

## Update Replication Job
```
PUT /nodes/{node}/replication/{id}
```
Modify a replication job's parameters.

## Delete Replication Job
```
DELETE /nodes/{node}/replication/{id}
```
Remove a replication job.

## Trigger Manual Sync
```
POST /nodes/{node}/replication/{id}/run
```
Trigger an immediate replication sync for a specific job.

```
POST /nodes/{node}/replication/run
```
Run all pending replication jobs on a node.

## Replication Status
```
GET /nodes/{node}/replication/{id}/log
```
Get the log of a specific replication job.

```
GET /datacenter/replication/{id}/log
```
Get the cluster-level replication log.

## Schedule Format
Replication uses standard cron schedule format:

| Interval | Expression |
|----------|------------|
| Every 5 minutes | `*/5 * * * *` |
| Every 15 minutes | `*/15 * * * *` |
| Every hour | `0 * * * *` |
| Every 6 hours | `0 */6 * * *` |
| Daily at midnight | `0 0 * * *` |

## Permissions
- `Datastore.AllocateSpace` on the storage path — Required for creating replication jobs
- `Sys.Audit` on `/nodes/{node}` — Required for reading replication status
- `Sys.Modify` on `/nodes/{node}` — Required for managing replication jobs

## Common Workflows

### Create a Replication Job (Every 15 Minutes)
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "vmid=100&target=pve2&schedule=*/15 * * * *&rate=50MB&comment=Primary VM replication" \
  https://node:8006/api2/json/nodes/pve1/replication
```

### Trigger Immediate Replication
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  https://node:8006/api2/json/nodes/pve1/replication/100-0/run
```

### Check Replication Status
```bash
curl -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  https://node:8006/api2/json/datacenter/replication
```

### View Replication Log
```bash
curl -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  https://node:8006/api2/json/nodes/pve1/replication/100-0/log
```

### Delete a Replication Job
```bash
curl -X DELETE -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  https://node:8006/api2/json/nodes/pve1/replication/100-0
```
