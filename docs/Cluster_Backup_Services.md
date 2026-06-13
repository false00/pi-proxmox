# Proxmox VE API — Backup, Jobs, Metrics, ACME & Notifications

This document covers the cluster-level services for backups, job management, metrics collection, ACME certificates, and notifications.

## Backup & Restore

### Backup Jobs
```
GET /cluster/backup
```
List all configured backup jobs.

```
GET /cluster/backup/{id}
```
Get details of a specific backup job.

```
POST /cluster/backup
```
Create a new backup job.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Backup job ID |
| `node` | string | Node to run backup on |
| `storage` | string | Target storage ID |
| `mode` | string | Backup mode: `snapshot`, `suspend`, `stop` |
| `schedule` | string | Cron schedule expression |
| `vmid` | string | VM/CT IDs to backup (comma-separated) |
| `compress` | string | Compression: `lzo`, `gzip`, `zstd` |
| `dumpdir` | string | Custom dump directory |
| `prune-backups` | string | Retention: `keep-last=N`, `keep-hourly=N`, `keep-daily=N`, `keep-weekly=N`, `keep-monthly=N` |
| `enable` | integer | Enable/disable the job |
| `exclude-path` | string | Paths to exclude |
| `performance` | string | Performance tuning parameters |
| `notes-template` | string | Template for backup notes |
| `all` | boolean | Include all VMs/CTs |
| `pool` | string | Backup all VMs in a pool |

```
PUT /cluster/backup/{id}
```
Update a backup job configuration.

```
DELETE /cluster/backup/{id}
```
Remove a backup job.

### Backup Info
```
GET /cluster/backup-info
```
Get summary information about backup operations, including running jobs and recent results.

### Restore Operations
Restoring is performed per-VM/CT:
```
POST /nodes/{node}/qemu/{vmid}/status/start
POST /nodes/{node}/lxc/{vmid}/status/start
```
Backup restore is done via:
```
POST /nodes/{node}/qemu
POST /nodes/{node}/lxc
```
Using the backup file as `ostemplate` or via `pvesm` for manual extraction.

## Job Management
```
GET /cluster/jobs
```
List cluster jobs (backup, replication, migration tasks).

**Parameters:** `type` (string) — filter by job type: `backup`, `replication`, `migration`

```
GET /cluster/jobs/{id}
```
Get details of a specific job.

## Metrics
```
GET /cluster/metrics
```
Get cluster-wide metrics configuration.

```
POST /cluster/metrics
```
Configure metrics server (InfluxDB, Graphite).

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `server` | string | Metrics server address |
| `port` | integer | Server port |
| `protocol` | string | `influxdb`, `graphite` |
| `organization` | string | InfluxDB organization |
| `bucket` | string | InfluxDB bucket |
| `token` | string | InfluxDB authentication token |
| `mtu` | integer | MTU for metrics packets |
| `timeout` | integer | Connection timeout |
| `enable` | boolean | Enable/disable metrics export |

```
PUT /cluster/metrics/{id}
DELETE /cluster/metrics/{id}
```
Update or remove a metrics server configuration.

```
GET /cluster/metrics/config
```
View current metrics configuration.

## ACME (Automatic Certificate Management)
```
GET /cluster/acme
```
View ACME account and plugin configuration.

```
POST /cluster/acme
```
Configure ACME account.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `account` | string | ACME account URL (optional for new accounts) |
| `contact` | string | Contact email |
| `directory` | string | ACME directory URL (e.g., `https://acme-v02.api.letsencrypt.org/directory`) |
| `tos` | boolean | Agree to Terms of Service |

### ACME Plugins
```
GET /cluster/acme/plugins
```
List ACME plugins (DNS challenge providers).

```
POST /cluster/acme/plugins
```
Add an ACME plugin.

**Parameters:** `plugin` (string), `api` (string), `data` (string), `type` (string: `dns`)

```
DELETE /cluster/acme/plugins/{plugin}
```
Remove an ACME plugin.

### ACME Certificate Renewal
```
POST /cluster/acme/certificate/new
```
Order a new certificate from the ACME provider.

```
PUT /cluster/acme/certificate/renew
```
Renew existing certificate.

```
DELETE /cluster/acme/certificate
```
Revoke certificate.

```
GET /cluster/acme/certificate
```
View current ACME certificate details.

## Notifications
```
GET /cluster/notifications
```
List notification endpoints and configuration.

### Notification Endpoints
```
POST /cluster/notifications/endpoints
```
Create a notification endpoint (email, webhook, gotify, etc.).

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Endpoint name |
| `type` | string | `sendmail`, `gotify`, `webhook` |
| `mailto` | string | Email recipient (for sendmail) |
| `url` | string | Webhook URL |
| `token` | string | Gotify token |
| `comment` | string | Description |

### Notification Matchers
```
GET /cluster/notifications/matchers
```
List notification match rules.

```
POST /cluster/notifications/matchers
```
Create a notification match rule.

**Parameters:** `name` (string), `match-type` (string), `severity` (string), `target` (string), `endpoint` (string), `mode` (string: `any`, `all`)

## Bulk Actions
```
POST /cluster/bulk-action
```
Perform operations on multiple resources simultaneously.

**Parameters:** `action` (string), `ids` (string, comma-separated), additional action-specific parameters.

## Resource Mapping
```
GET /cluster/mapping
```
View PCI and USB device mappings for pass-through.

```
POST /cluster/mapping
```
Create a device mapping.

**Parameters:** `type` (string: `pci`, `usb`), `name` (string), `map` (array of node mappings)

## Permissions
- `Sys.Modify` on `/` — Required for creating/updating backups, ACME, metrics, notifications
- `Sys.Audit` on `/` — Required for reading configuration
- `Datastore.Allocate` on `/storage/{storage}` — Required for backup to specific storage

## Common Workflows

### Create a Backup Job
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "id=nightly-backup&storage=backup-store&schedule=0 2 * * *&mode=snapshot&compress=zstd&all=1&prune-backups=keep-last=7" \
  https://node:8006/api2/json/cluster/backup
```

### Set Up an ACME Account
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "contact=admin@example.com&directory=https://acme-v02.api.letsencrypt.org/directory&tos=1" \
  https://node:8006/api2/json/cluster/acme
```

### Add a Metrics Server (InfluxDB)
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "server=influxdb.local&port=8089&protocol=influxdb&organization=proxmox&bucket=pve-metrics&enable=1" \
  https://node:8006/api2/json/cluster/metrics
```

### Add a Webhook Notification Endpoint
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "name=alert-webhook&type=webhook&url=https://hooks.example.com/proxmox&comment=Alert webhook" \
  https://node:8006/api2/json/cluster/notifications/endpoints
```
