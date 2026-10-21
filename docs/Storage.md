# Proxmox VE API — Storage Management

This document covers the API endpoints for managing storage backends, storage content, and storage-related operations.

## Base Path
```
/storage
```

## Storage Backends

### List Storage
```
GET /storage
```
Returns all configured storage backends with their type and configuration.

```
GET /nodes/{node}/storage
```
List the storage available on a specific node, with status and capacity (`active`, `used`, `avail`, `total`).

### Get Storage
```
GET /storage/{storageid}
```
Get the configuration of a specific storage backend.

**Returns:** `storage` (ID), `type` (backend type), `content` (content types), `shared`, `disable`, `nodes`, and the type-specific options.

```
GET /nodes/{node}/storage/{storage}/status
```
Get the status and capacity of a storage backend on a node.

### Create Storage
```
POST /storage
```
Add a new storage backend.

**Parameters (common):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `storage` | string | Storage ID |
| `type` | string | Backend type: `dir`, `nfs`, `cifs`, `lvm`, `lvmthin`, `zfspool`, `zfs` (ZFS over iSCSI), `rbd`, `cephfs`, `btrfs`, `pbs`, `iscsi`, `iscsidirect`, `esxi` |
| `content` | string | Comma-separated: `images`, `iso`, `vztmpl`, `backup`, `snippets`, `rootdir` |
| `nodes` | string | Comma-separated node list |
| `disable` | boolean | Disable storage |
| `prune-backups` | string | Backup retention, e.g. `keep-last=3,keep-weekly=4` |
| `shared` | boolean | Shared storage |
| `path` | string | Filesystem path (for dir) |
| `server` | string | Server address (for NFS/CIFS/PBS) |
| `export` | string | Export path (for NFS) |
| `pool` | string | ZFS pool (zfspool) or RBD pool (rbd) |
| `monhost` | string | Monitor hosts (for external Ceph clusters) |
| `datastore` | string | PBS datastore |
| `username` | string | Username (PBS, CIFS) or RBD ID |
| `password` | string | Password (PBS, CIFS) |
| `fingerprint` | string | TLS fingerprint (for PBS) |

### Update Storage
```
PUT /storage/{storageid}
```
Modify storage configuration.

### Delete Storage
```
DELETE /storage/{storageid}
```
Remove a storage backend.

## Storage Content

### List Content
```
GET /nodes/{node}/storage/{storage}/content
```
List content stored on a storage backend. Returns volumes with: `volid`, `format`, `size`, `used`, `content` (type), `notes`, `ctime`.

**Parameters:** `content` (string, filter by type).

### Delete Content
```
DELETE /nodes/{node}/storage/{storage}/content/{volid}
```
Remove a volume from storage.

## Storage Status
```
GET /nodes/{node}/storage/{storage}/status
```
Get real-time storage usage statistics (used, available, total).

## File Upload
```
POST /nodes/{node}/storage/{storage}/upload
```
Upload ISOs, templates, backups, or snippets. See [ISO_Template_Management](ISO_Template_Management.md) for details.

## Directory Storage Scan
```
GET /nodes/{node}/scan
```
Scan for available storage resources (iSCSI targets, ZFS pools, LVM groups, NFS exports, Ceph, etc.).

## Resource Pools

### List Pools
```
GET /pools
```

### Create Pool
```
POST /pools
```
**Parameters:** `poolid` (string), `comment` (string).

### Get Pool
```
GET /pools/{poolid}
```
Returns pool members (VMs, CTs, storage).

### Update Pool
```
PUT /pools/{poolid}
```
**Parameters:** Add or remove members via `vms` (comma-separated), `storage` (comma-separated), `comment`.

### Delete Pool
```
DELETE /pools/{poolid}
```

## Supported Storage Types

| Type | Description | Shared | Content Types |
|------|-------------|--------|---------------|
| `dir` | Directory | No | all |
| `nfs` | Network File System | Yes | all |
| `cifs` | SMB/CIFS share | Yes | all |
| `lvm` | LVM volume group | No | images, rootdir |
| `lvmthin` | LVM thin pool | No | images, rootdir |
| `zfs` | ZFS pool | No* | all |
| `zfspool` | ZFS pool (external) | No* | all |
| `rbd` | Ceph RBD | Yes | images, rootdir |
| `cephfs` | CephFS | Yes | iso, vztmpl, backup, snippets |
| `pbs` | Proxmox Backup Server | Yes | backup |
| `iscsi` | iSCSI (LIO target) | Yes | images |
| `iscsidirect` | iSCSI (direct) | No | images |
| `btrfs` | BTRFS | No | all |
| `glusterfs` | GlusterFS | Yes | all |

\* ZFS can be shared via ZFS over iSCSI or replication.

## Permissions
| Action | Required Permission |
|--------|-------------------|
| List storage | `Datastore.Audit` on `/storage/{storage}` |
| Create/modify storage | `Datastore.Allocate` on `/storage` |
| Delete storage | `Datastore.Allocate` on `/storage` |
| Content operations | `Datastore.Audit` (read), `Datastore.AllocateSpace` (write) |
| Pool management | `Pool.Allocate` on `/pool/{poolid}` |

## Common Workflows

### Add an NFS Storage
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "storage=nfs-backup&type=nfs&server=10.0.0.50&export=/srv/backup&content=backup&nodes=pve1,pve2&shared=1" \
  https://node:8006/api2/json/storage
```

### List Content on Storage
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/nodes/pve1/storage/local/content
```

### Create a Resource Pool
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "poolid=production&comment=Production workloads" \
  https://node:8006/api2/json/pools
```

### Delete a Volume
```bash
curl -X DELETE -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/nodes/pve1/storage/local-lvm/content/local-lvm:vm-100-disk-0
```
