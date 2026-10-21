# Proxmox VE API — Storage Replication

This document covers the storage replication endpoints used to synchronize VM and CT data between cluster nodes for high availability and disaster recovery.

## Overview
Proxmox VE replication uses ZFS snapshots to periodically synchronize a guest's local volumes from the node it runs on to one or more target nodes. This allows fast failover with minimal data loss.

Jobs are defined cluster-wide. Each job ID has the form `<vmid>-<jobnum>`, for example `100-0`; the guest's current node is always the source.

## Base Paths
```
/cluster/replication
/nodes/{node}/replication
```

## List Replication Jobs
```
GET /cluster/replication
```
List all configured replication jobs across the cluster.

```
GET /nodes/{node}/replication
```
List the status of the replication jobs on a specific node (`guest` filters by VM/CT ID).

## Get Replication Job
```
GET /cluster/replication/{id}
```
Read a job's configuration.

```
GET /nodes/{node}/replication/{id}/status
```
Read the job's current replication state on the node.

## Create Replication Job
```
POST /cluster/replication
```
Create a new replication job for a VM/CT.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Job ID `<vmid>-<jobnum>`, e.g. `100-0` (required) |
| `type` | string | Job type; always `local` (required) |
| `target` | string | Target node (required) |
| `schedule` | string | Schedule as a systemd calendar event (default `*/15`, every 15 minutes) |
| `rate` | number | Rate limit in megabytes per second |
| `disable` | boolean | Create the job disabled |
| `comment` | string | Description |

## Update Replication Job
```
PUT /cluster/replication/{id}
```
Modify a replication job's schedule, rate limit, comment, or `disable` flag.

## Delete Replication Job
```
DELETE /cluster/replication/{id}
```
Mark a replication job for removal. The job removes its replication snapshots and, unless `keep=1`, the replicated volumes on the target, then deletes itself. `force=1` removes only the job configuration, without cleanup.

## Run a Job Now
```
POST /nodes/{node}/replication/{id}/schedule_now
```
Schedule the job to run as soon as possible on its source node.

## Replication Log
```
GET /nodes/{node}/replication/{id}/log
```
Get the log of a specific replication job.

## Schedule Format
Replication schedules use Proxmox VE calendar events, a subset of systemd calendar events:

| Interval | Expression |
|----------|------------|
| Every 5 minutes | `*/5` |
| Every 15 minutes (default) | `*/15` |
| Every day at 12:05 | `12:05` |
| Weekdays at 21:30 | `mon..fri 21:30` |

## Permissions
- `VM.Audit` on `/vms/<vmid>` — reading job configuration and status (lists only show jobs for guests you can audit)
- `VM.Audit` on `/vms/<vmid>`, or `Sys.Audit` on `/nodes/<node>` — reading a job's log
- `VM.Replicate` on `/vms/<vmid>` — creating, updating, deleting, and running jobs

## Common Workflows

### Create a Replication Job (Every 15 Minutes)
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  --data-urlencode "id=100-0" --data-urlencode "type=local" --data-urlencode "target=pve2" \
  --data-urlencode "schedule=*/15" --data-urlencode "rate=50" \
  --data-urlencode "comment=Primary VM replication" \
  https://node:8006/api2/json/cluster/replication
```

### Run a Replication Job Now
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/nodes/pve1/replication/100-0/schedule_now
```

### Check Replication Status
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/nodes/pve1/replication
```

### View Replication Log
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/nodes/pve1/replication/100-0/log
```

### Delete a Replication Job
```bash
curl -X DELETE -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/cluster/replication/100-0
```
