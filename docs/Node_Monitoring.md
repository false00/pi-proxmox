# Proxmox VE API — Node Monitoring & Performance Metrics

This document covers the monitoring and performance data endpoints available per node, including RRD statistics, real-time metrics, and resource usage tracking.

## RRD (Round Robin Database) Statistics
Proxmox VE stores historical performance data in RRD files. These provide time-series data for CPU, memory, network, and disk I/O.

```
GET /nodes/{node}/rrd
```
Render node RRD statistics as a PNG graph (`ds` selects the data sources, plus `timeframe` and `cf`).

### RRD Data
```
GET /nodes/{node}/rrddata
```
Query historical RRD data for a node.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `timeframe` | string | Time range: `hour`, `day`, `week`, `month`, `year`, `decade` |
| `cf` | string | Consolidation function: `AVERAGE`, `MAX` |

**Returns:** Array of data points with timestamp, CPU usage, memory usage, network I/O, disk I/O, and load average.

### VM/CT RRD Data
```
GET /nodes/{node}/qemu/{vmid}/rrddata
GET /nodes/{node}/lxc/{vmid}/rrddata
```
Get historical performance data for a specific VM or container.

**Parameters:** `timeframe` (`hour`, `day`, `week`, `month`, `year`) and `cf`, as for node rrddata.

## Cluster Metrics Export
```
GET /cluster/metrics/export
```
Get the current metrics of every node and guest in the cluster, or only of the answering node with `local-only=1`; `history=1` also returns historic values.

## Node Status
```
GET /nodes/{node}/status
```
Get comprehensive real-time status for the node.

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `cpu` | number | CPU utilization (0.0 - 1.0) |
| `memory` | object | Memory usage info (total, used, free) |
| `swap` | object | Swap usage info |
| `disk` | object | Root filesystem usage |
| `uptime` | integer | System uptime in seconds |
| `kversion` | string | Kernel version |
| `loadavg` | array | Load averages (1, 5, 15 min) |
| `pveversion` | string | Proxmox VE version |
| `current-kernel` | object | Current kernel info |
| `boot-info` | object | Boot mode (UEFI/BIOS) |

## Node Services Status
```
GET /nodes/{node}/services
```
List all Proxmox-related services and their status (running, stopped, failed).

```
GET /nodes/{node}/services/{service}/state
POST /nodes/{node}/services/{service}/start
POST /nodes/{node}/services/{service}/stop
POST /nodes/{node}/services/{service}/restart
POST /nodes/{node}/services/{service}/reload
```
Manage individual systemd services (e.g., `pveproxy`, `pvestatd`, `pvedaemon`).

## Task Logs
```
GET /nodes/{node}/tasks
```
List recent and running tasks on the node.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `source` | string | Task source filter |
| `start` | integer | Start offset |
| `limit` | integer | Max entries |
| `errors` | boolean | Show only errors |
| `typefilter` | string | Filter by task type |
| `statusfilter` | string | Filter by status (`running`, `stopped`, `error`) |
| `since` | integer | Unix timestamp for window start |
| `until` | integer | Unix timestamp for window end |
| `vmid` | integer | Filter by VM/CT ID |

```
GET /nodes/{node}/tasks/{upid}/status
```
Get status of a specific task by its UPID.

```
GET /nodes/{node}/tasks/{upid}/log
```
Get the log output of a specific task.

**Parameters:** `start` (integer), `limit` (integer)

```
DELETE /nodes/{node}/tasks/{upid}
```
Stop a running task by its UPID.

## Version Info
```
GET /nodes/{node}/version
```
Get Proxmox VE version information for the node.

```
GET /version
```
Get version information at the cluster level.

## Permissions
| Endpoint | Required Permission |
|----------|-------------------|
| RRD data | `Sys.Audit` on `/nodes/{node}` (guests: `VM.Audit` on `/vms/{vmid}`) |
| Status | `Sys.Audit` on `/nodes/{node}` |
| Metrics export | `Sys.Audit` on `/` |
| Services | `Sys.Audit` to read, `Sys.Modify` to start/stop |
| Tasks | Own tasks: always; other users' tasks: `Sys.Audit` to read, `Sys.Modify` to stop, on `/nodes/{node}` |

## Common Workflows

### Get Real-time Node Status
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/nodes/pve1/status
```

### Get Historical CPU Data for the Last Day
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  "https://node:8006/api2/json/nodes/pve1/rrddata?timeframe=day&cf=AVERAGE"
```

### List Recent Failed Tasks
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  "https://node:8006/api2/json/nodes/pve1/tasks?errors=1&limit=50"
```

### Get Task Log by UPID
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/nodes/pve1/tasks/UPID:node:.../log
```

### Restart the pveproxy Service
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/nodes/pve1/services/pveproxy/restart
```
