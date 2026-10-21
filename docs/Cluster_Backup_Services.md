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
| `id` | string | Backup job ID (generated when omitted) |
| `node` | string | Only run the job on this node |
| `storage` | string | Target storage ID |
| `mode` | string | Backup mode: `snapshot`, `suspend`, `stop` |
| `schedule` | string | Schedule as a systemd calendar event (e.g., `02:00` or `sat 03:00`) |
| `vmid` | string | VM/CT IDs to back up (comma-separated) |
| `compress` | string | Compression: `0`, `1`, `gzip`, `lzo`, `zstd` |
| `dumpdir` | string | Custom dump directory (root only) |
| `prune-backups` | string | Retention: `keep-last=N`, `keep-hourly=N`, `keep-daily=N`, `keep-weekly=N`, `keep-monthly=N` |
| `enabled` | boolean | Enable or disable the job |
| `exclude-path` | string | Paths to exclude |
| `performance` | string | Performance tuning parameters |
| `notes-template` | string | Template for backup notes |
| `all` | boolean | Include all VMs/CTs |
| `pool` | string | Back up all guests in a pool |

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
GET /cluster/backup-info/not-backed-up
```
List guests that no backup job covers.

### Running and Restoring Backups
A one-off backup runs on a node:
```
POST /nodes/{node}/vzdump
```
Restoring creates the guest again from a backup archive:
```
POST /nodes/{node}/qemu
POST /nodes/{node}/lxc
```
Pass the backup volume as `archive` (QEMU) or as `ostemplate` with `restore=1` (LXC).

## Job Management
```
GET /cluster/jobs
```
Index of job-related endpoints.

```
GET /cluster/jobs/realm-sync
GET /cluster/jobs/realm-sync/{id}
```
List or read realm-sync jobs (also `POST`, `PUT`, and `DELETE` on `/cluster/jobs/realm-sync/{id}`).

```
GET /cluster/jobs/schedule-analyze
```
Preview the next run times of a schedule (`schedule`, `iterations`, `starttime`).

## Metrics
```
GET /cluster/metrics/server
```
List the configured external metric servers.

```
POST /cluster/metrics/server/{id}
```
Add an external metric server (InfluxDB, Graphite, or OpenTelemetry).

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `server` | string | Metrics server address |
| `port` | integer | Server port |
| `type` | string | `influxdb`, `graphite`, `opentelemetry` |
| `influxdbproto` | string | InfluxDB transport: `udp`, `http`, `https` |
| `organization` | string | InfluxDB organization |
| `bucket` | string | InfluxDB bucket |
| `token` | string | InfluxDB authentication token |
| `mtu` | integer | MTU for metrics sent over UDP |
| `timeout` | integer | Graphite TCP socket timeout |
| `disable` | boolean | Disable this metric server |

```
GET /cluster/metrics/server/{id}
PUT /cluster/metrics/server/{id}
DELETE /cluster/metrics/server/{id}
```
Read, update, or remove a metric server configuration.

```
GET /cluster/metrics/export
```
Export the current cluster metrics.

## ACME (Automatic Certificate Management)
```
GET /cluster/acme
```
Index of ACME endpoints.

### ACME Accounts
```
GET /cluster/acme/account
POST /cluster/acme/account
```
List ACME accounts, or register a new one (root only).

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Account name (default: `default`) |
| `contact` | string | Contact email addresses |
| `directory` | string | ACME directory URL (default: `https://acme-v02.api.letsencrypt.org/directory`) |
| `tos_url` | string | URL of the CA's terms of service (see `GET /cluster/acme/meta`); setting it indicates agreement |

### ACME Plugins
```
GET /cluster/acme/plugins
```
List ACME plugins (DNS challenge providers).

```
POST /cluster/acme/plugins
```
Add an ACME plugin.

**Parameters:** `id` (string), `type` (string: `dns` or `standalone`), `api` (string, DNS provider), `data` (string, base64-encoded provider settings)

```
DELETE /cluster/acme/plugins/{id}
```
Remove an ACME plugin.

### Node Certificates from ACME
Certificates are ordered per node:
```
POST /nodes/{node}/certificates/acme/certificate
```
Order a new certificate from the ACME CA.

```
PUT /nodes/{node}/certificates/acme/certificate
```
Renew the existing certificate.

```
DELETE /nodes/{node}/certificates/acme/certificate
```
Revoke the certificate.

```
GET /nodes/{node}/certificates/info
```
View the node's certificate details.

## Notifications
```
GET /cluster/notifications
```
Index of notification endpoints, matchers, and targets.

### Notification Endpoints
```
GET /cluster/notifications/endpoints
```
Index of endpoint types.

```
POST /cluster/notifications/endpoints/sendmail
POST /cluster/notifications/endpoints/smtp
POST /cluster/notifications/endpoints/gotify
POST /cluster/notifications/endpoints/webhook
```
Create a notification endpoint of that type. Each type has `GET`, `PUT`, and `DELETE` on `/cluster/notifications/endpoints/<type>/{name}`.

**Parameters (examples):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Endpoint name |
| `mailto` | array | Email recipients (sendmail, smtp) |
| `server` | string | Server URL (gotify) |
| `token` | string | Secret token (gotify) |
| `url` | string | Server URL (webhook) |
| `method` | string | HTTP method: `post`, `put`, `get` (webhook) |
| `comment` | string | Description |

### Notification Matchers
```
GET /cluster/notifications/matchers
```
List notification matchers.

```
POST /cluster/notifications/matchers
```
Create a notification matcher.

**Parameters:** `name` (string), `match-field` (array), `match-severity` (array), `match-calendar` (array), `mode` (string: `all` or `any`), `invert-match` (boolean), `target` (array)

## Bulk Actions
```
POST /cluster/bulk-action/guest/start
POST /cluster/bulk-action/guest/shutdown
POST /cluster/bulk-action/guest/suspend
POST /cluster/bulk-action/guest/migrate
```
Start, shut down, suspend, or migrate many guests at once.

**Parameters:** `vms` (array of VMIDs; all guests when omitted), `max-workers` (integer), and action-specific options such as the shutdown `timeout` or the migration `target`.

## Resource Mapping
```
GET /cluster/mapping
```
Index of PCI, USB, and directory mappings.

```
POST /cluster/mapping/pci
POST /cluster/mapping/usb
POST /cluster/mapping/dir
```
Create a mapping.

**Parameters:** `id` (string), `map` (array of per-node mappings), `description` (string)

## Permissions
- `Sys.Audit` on `/` — reading backup jobs, the not-backed-up report, metric servers, and the metrics export
- `Sys.Modify` on `/` — backup jobs, metric servers, and ACME plugins
- Root only — registering ACME accounts, and the `tmpdir`, `dumpdir`, and `script` options of backup jobs
- `Sys.Modify` on `/nodes/{node}` — ordering, renewing, or revoking a node's ACME certificate
- `Mapping.Modify` on `/mapping/notifications` — notification endpoints and matchers; creating endpoints also needs `Sys.Audit` and `Sys.Modify` on `/` (or `Sys.AccessNetwork` on `/`)
- `Mapping.Modify` on `/mapping/pci`, `/mapping/usb`, or `/mapping/dir` — resource mappings
- Running a backup (`POST /nodes/{node}/vzdump`) needs `VM.Backup` on each guest and `Datastore.AllocateSpace` on the backup storage

## Common Workflows

### Create a Backup Job
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  --data-urlencode "id=nightly-backup" --data-urlencode "storage=backup-store" \
  --data-urlencode "schedule=02:00" --data-urlencode "mode=snapshot" \
  --data-urlencode "compress=zstd" --data-urlencode "all=1" \
  --data-urlencode "prune-backups=keep-last=7" \
  https://node:8006/api2/json/cluster/backup
```

### Add a Metrics Server (InfluxDB)
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "type=influxdb&server=influxdb.local&port=8089" \
  https://node:8006/api2/json/cluster/metrics/server/influxdb-main
```

### Add a Webhook Notification Endpoint
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  --data-urlencode "name=alert-webhook" --data-urlencode "method=post" \
  --data-urlencode "url=https://hooks.example.com/proxmox" --data-urlencode "comment=Alert webhook" \
  https://node:8006/api2/json/cluster/notifications/endpoints/webhook
```
