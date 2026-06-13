# ISO and Template Management

This document covers how to upload ISO files and manage LXC container templates via the Proxmox VE API.

## Uploading ISO Files

### Endpoint
```
POST /nodes/{node}/storage/{storage}/upload
```

### Requirements
- **Content-type:** Must be sent as `multipart/form-data`.
- **Auth restriction:** This endpoint requires **session ticket authentication** (`PVEAuthCookie`). API tokens cannot be used for uploads due to how multipart form data is processed.
- **Supported content types:** `iso` (ISO images), `vztmpl` (LXC templates), `backup` (vma/vzdump backups), `snippets` (config snippets), `import` (disk images).

### Example
```bash
# 1. Get ticket
curl -k -d 'username=root@pam' --data-urlencode 'password=your_password' \
  https://node:8006/api2/json/access/ticket | \
  jq -r '.data.ticket' | sed 's/^/PVEAuthCookie=/' > cookie

# 2. Upload file
curl -k -L -b "$(<cookie)" \
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
GET /nodes/{node}/lxc/templates
```
Returns all cached LXC templates on the node. Each entry includes `template` (path), `size`, `digest`, and `download_url`.

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
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
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
