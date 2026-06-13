# Proxmox VE API Overview

General architecture, conventions, and tooling for the Proxmox VE REST API.

## Architecture
- **REST-like:** Resource-oriented architecture (ROA) — endpoints map to resources (nodes, VMs, storage) rather than actions.
- **JSON Format:** All data is exchanged in JSON. Alternative formats: `extjs` (ExtJS-compatible wrapper), `html`, `text`.
- **JSON Schema:** Every endpoint is formally defined using JSON Schema for automatic parameter validation and documentation generation.
- **HTTPS Only:** The API is served exclusively over HTTPS on port `8006`.
- **Stateless Design:** Each request must include authentication context; no server-side session state is maintained (except ticket caching).

## Base URL
```
https://<host>:8006/api2/json/<resource_path>
```

## API Stability
Proxmox aims for API compatibility within a major release version. Breaking changes (endpoint removal, parameter removal, type changes) are reserved for major version bumps. Additions of new endpoints, parameters, or return properties are not considered breaking.

## Root Resource Index
```
GET /api2/json/
```
Returns the root resource index showing all top-level resource categories:
- `version` — API and software version
- `cluster` — Cluster management
- `nodes` — Physical node management
- `storage` — Storage backends
- `access` — Authentication and authorization
- `pools` — Resource pools

## Response Codes & Error Handling
| Code | Meaning |
|------|---------|
| `200 OK` | Success with response body |
| `400 Bad Request` | Invalid parameters |
| `401 Unauthorized` | Authentication failed (missing/expired ticket) |
| `403 Forbidden` | Authenticated but insufficient permissions |
| `404 Not Found` | Resource not found |
| `500 Internal Server Error` | Server-side error |

Error responses return JSON with a `message` field describing the issue and `status` field with the HTTP code.

## Data Formats
The API can return data in four formats, specified by the format component in the URL (`/api2/<format>/`):
- `json` — Standard JSON
- `extjs` — JSON wrapped in `{ data: ..., success: true/false }` for ExtJS compatibility
- `html` — HTML formatted (useful for debugging)
- `text` — Plain text (useful for scripting)

## pvesh CLI
The `pvesh` command-line tool exposes the entire REST API from the shell when run as root on a Proxmox node. It auto-handles authentication and proxies requests to other cluster members via SSH.

**Examples:**
```bash
pvesh get /version
pvesh get /cluster/status
pvesh get /access/users
pvesh create /access/users --userid operator@pve
pvesh delete /access/users/operator@pve
pvesh create /nodes/pve1/lxc -vmid 100 -hostname test --storage local \
  --ostemplate local:vztmpl/debian-12-standard_12.0-1_amd64.tar.gz \
  --memory 512
pvesh create /nodes/pve1/lxc/100/status/start
```

## API Client Libraries
### Official
- **Perl:** `libpve-apiclient-perl` (official, maintained by Proxmox)

### Community
| Language | Library |
|----------|---------|
| Python | proxmoxer, Proxmoxia, pmxc |
| PowerShell | cv4pve-api-powershell |
| Ruby | proxmox-ruby |
| NodeJS | cv4pve-api-javascript, proxmox npm |
| C# | cv4pve-api-dotnet, ProxmoxSharp |
| PHP | cv4pve-api-php, ProxmoxVE PHP |
| Java | cv4pve-api-java, PVE4J |
| Go | proxmox-api-go, go-proxmox |
| Terraform | terraform-provider-proxmox |
| Packer | packer-plugin-proxmox |

## Key Conventions
- **PUT** is used for updates (full resource replacement)
- **POST** is used for creation and actions
- **DELETE** is used for removal
- Parameters are passed via URL query string or `x-www-form-urlencoded` body
- Write operations using ticket auth require `CSRFPreventionToken` header
- API tokens are recommended over ticket auth for automation
