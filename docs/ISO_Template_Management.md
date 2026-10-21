# ISO and Template Management

This document covers how to upload ISO files and manage LXC container templates via the Proxmox VE API.

## Uploading ISO Files

### Endpoint
```
POST /nodes/{node}/storage/{storage}/upload
```

### Requirements
- **Content-type:** Must be sent as `multipart/form-data`.
- **Auth:** API tokens work; the caller needs `Datastore.AllocateTemplate` on `/storage/{storage}`. This package's `proxmox_storage_upload` and `proxmox_api_upload_file` upload with the configured API token. Ticket authentication (`PVEAuthCookie` plus the `CSRFPreventionToken` header) also works.
- **Supported content types:** `iso` (ISO images), `vztmpl` (LXC templates), `backup` (vma/vzdump backups), `snippets` (config snippets), `import` (disk images).

### Example
```bash
curl -k -L -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -F "file=@/path/to/ubuntu-24.04-desktop.iso" \
  -F "content=iso" \
  -F "filename=ubuntu-24.04-desktop.iso" \
  https://node:8006/api2/json/nodes/pve1/storage/local/upload
```

### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | file | The file to upload |
| `content` | string | Content type: `iso`, `vztmpl`, `backup`, `snippets`, `import` |
| `filename` | string | Override filename (optional) |
| `checksum` | string | File checksum (optional) |
| `checksum-algorithm` | string | `sha256` (default), `sha1`, `md5` |

## LXC Template Management

### List Available Templates
```
GET /nodes/{node}/storage/{storage}/content?content=vztmpl
```
Returns cached LXC template volume records from the selected storage backend.

### Downloading Templates

#### Using pveam CLI (Recommended)
The `pveam` tool fetches templates from the Proxmox repository:
```bash
# List available templates in repository
pveam available

# List templates for a specific storage
pveam available local

# Download a template
pveam download local debian-12-standard_12.0-1_amd64.tar.gz

# List locally cached templates
pveam list local
```

#### Using the API
Templates can be listed and then used for container creation, but downloading new templates from external URLs typically requires `pveam` on the host. Once downloaded to `/var/lib/vz/template/cache/`, the template appears in the API listing.

### Using Templates for Container Creation
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "vmid=300&hostname=mycontainer&ostemplate=local:vztmpl/debian-12-standard_12.0-1_amd64.tar.gz&storage=local-lvm&memory=512&net0=name=eth0,bridge=vmbr0,ip=dhcp" \
  https://node:8006/api2/json/nodes/pve1/lxc
```

### Convert Container to Template
```
POST /nodes/{node}/lxc/{vmid}/template
```
Converts a stopped container into a template that can be used for cloning.

## Template Storage Locations
Templates and ISOs are stored in content-specific directories:
- ISOs: `/var/lib/vz/template/iso/`
- LXC templates: `/var/lib/vz/template/cache/`
- VZDump backups: `/var/lib/vz/dump/`
- Snippets: `/var/lib/vz/snippets/`

These paths correspond to the `local` storage's content types.
