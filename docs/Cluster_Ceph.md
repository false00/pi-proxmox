# Proxmox VE API — Ceph Storage Cluster

This document covers the API endpoints for managing integrated Ceph storage clusters within Proxmox VE.

## Base Paths
```
/cluster/ceph
/nodes/{node}/ceph
```

Cluster-wide status and flags live under `/cluster/ceph`. Configuration, monitors, OSDs, pools, and CRUSH data are managed through a node, under `/nodes/{node}/ceph`.

## Ceph Status & Overview
```
GET /cluster/ceph/status
```
Returns overall Ceph cluster health, monitor status, OSD status, and storage utilization.

```
GET /cluster/ceph/metadata
```
Returns metadata about the Ceph daemons (versions, hosts) in the cluster.

## Ceph Configuration
```
GET /nodes/{node}/ceph/cfg/raw
```
Retrieve the Ceph configuration file.

```
GET /nodes/{node}/ceph/cfg/db
```
Retrieve the Ceph configuration database.

## Ceph Flags
```
GET /cluster/ceph/flags
```
View current Ceph cluster flags (e.g., `noout`, `norecover`, `pause`).

```
PUT /cluster/ceph/flags
```
Set or unset several Ceph cluster flags at once.

```
GET /cluster/ceph/flags/{flag}
PUT /cluster/ceph/flags/{flag}
```
Read, set, or clear a single flag.

## Monitor (MON) Management
```
GET /nodes/{node}/ceph/mon
```
List all Ceph monitors.

```
POST /nodes/{node}/ceph/mon/{monid}
```
Create a Ceph monitor on the node; the first monitor also gets a manager.

**Parameters:** `monid` (string, optional; defaults to the node name), `mon-address` (IP addresses in Ceph's public network, optional; overrides autodetection)

```
DELETE /nodes/{node}/ceph/mon/{monid}
```
Remove a Ceph monitor. Proxmox refuses to remove the last monitor.

## OSD Management
```
GET /nodes/{node}/ceph/osd
```
List the OSD tree with status, weight, and utilization.

```
POST /nodes/{node}/ceph/osd
```
Create a new OSD on the node. Root only.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `dev` | string | Block device path (e.g., `/dev/sdb`) |
| `wal_dev` | string | WAL device (optional) |
| `db_dev` | string | DB device (optional) |
| `crush-device-class` | string | CRUSH device class (optional) |
| `encrypted` | boolean | Enable encryption (optional) |

```
DELETE /nodes/{node}/ceph/osd/{osdid}
```
Destroy an OSD. Root only. `cleanup=1` also removes the underlying logical volumes and leftover journal partitions; without it they are left intact for inspection.

### OSD Scrub
```
POST /nodes/{node}/ceph/osd/{osdid}/scrub
```
Trigger a scrub on an OSD (`deep=1` for a deep scrub).

### OSD In/Out
```
POST /nodes/{node}/ceph/osd/{osdid}/in
POST /nodes/{node}/ceph/osd/{osdid}/out
```
Mark an OSD in or out of the cluster.

## Pool Management
```
GET /nodes/{node}/ceph/pool
```
List all Ceph pools with their settings and usage.

```
POST /nodes/{node}/ceph/pool
```
Create a new pool.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Pool name |
| `pg_num` | integer | Placement group count |
| `size` | integer | Number of replicas |
| `min_size` | integer | Minimum replicas for I/O |
| `crush_rule` | string | CRUSH rule name |
| `add_storages` | boolean | Configure VM and CT storage using the new pool |

```
GET /nodes/{node}/ceph/pool/{name}
PUT /nodes/{node}/ceph/pool/{name}
```
Read or change pool settings.

```
DELETE /nodes/{node}/ceph/pool/{name}
```
Remove a pool.

## CRUSH Map and Rules
```
GET /nodes/{node}/ceph/crush
GET /nodes/{node}/ceph/rules
```
View the CRUSH map and the CRUSH rules.

## Permissions
- `Sys.Audit` or `Datastore.Audit` on `/` — reading Ceph status, configuration, monitors, OSDs, pools, and CRUSH data
- `Sys.Audit` on `/` — reading Ceph flags
- `Sys.Modify` on `/` — monitor, pool, flag, and OSD in/out/scrub changes
- Root only — creating and destroying OSDs

## Common Workflows

### Get Ceph Health
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/cluster/ceph/status
```

### Create a New OSD (root only)
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "dev=/dev/sdb" \
  https://node:8006/api2/json/nodes/pve1/ceph/osd
```

### Create a Pool
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "name=ssd-pool&pg_num=128&size=3" \
  https://node:8006/api2/json/nodes/pve1/ceph/pool
```
