# Proxmox VE API Authentication

Proxmox VE uses two primary methods for authenticating API requests. All API calls require authentication and are made over HTTPS on port 8006.

## Base URL
```
https://your.server:8006/api2/json/
```

## 1. Ticket Cookie Authentication
A ticket is a signed random text value containing the user and creation time. Tickets are signed by a cluster-wide rotating auth key.

Ticket authentication needs the user's password. For automation, prefer API tokens (section 2). The examples below use the placeholder `USER@REALM`; use a dedicated user rather than `root@pam`. A `root@pam` ticket is only required for endpoints the API viewer lists as **Root only**, such as `POST /nodes/{node}/execute`.

### Getting a Ticket
```
POST /access/ticket
```

**Request:**
```bash
curl -k -d 'username=USER@REALM' --data-urlencode 'password=your_password' \
  https://10.0.0.1:8006/api2/json/access/ticket
```

**Response:**
```json
{
  "data": {
    "CSRFPreventionToken": "4EEC61E2:lwk7od06fa1+DcPUwBTXCcndyAY",
    "ticket": "PVE:USER@REALM:4EEC61E2::rsKoApxDTLYPn6H3NNT6iP2mv...",
    "username": "USER@REALM"
  }
}
```

### Using the Ticket
Pass the ticket as a cookie header named `PVEAuthCookie`:
```bash
curl -k -b "PVEAuthCookie=PVE:USER@REALM:4EEC61E2::..." \
  https://10.0.0.1:8006/api2/json/nodes
```

### Ticket Lifetime & Refresh
Tickets have a **2-hour lifetime**. To refresh, pass the old ticket as the password:
```bash
curl -k -d 'username=USER@REALM' --data-urlencode 'password=PVE:USER@REALM:4EEC61E2::...' \
  https://10.0.0.1:8006/api2/json/access/ticket
```

### CSRF Protection
Any write operation (POST, PUT, DELETE) using ticket auth **must** include the `CSRFPreventionToken` header:
```bash
curl -X DELETE -b "PVEAuthCookie=..." \
  -H "CSRFPreventionToken: 4EEC61E2:lwk7od06fa1+DcPUwBTXCcndyAY" \
  https://10.0.0.1:8006/api2/json/nodes/pve1/qemu/100
```

### Password Security
For production, avoid passing credentials on the command line. Use a password file:
```bash
curl -k -d 'username=USER@REALM' --data-urlencode "password@$HOME/.pve-pass-file" \
  https://10.0.0.1:8006/api2/json/access/ticket
```
Or store the full auth header in a file with restricted permissions:
```bash
# Store in file accessible only by your user
echo 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' > ~/.pve-auth-header
chmod 600 ~/.pve-auth-header
# Use with curl -H
curl -k -H @~/.pve-auth-header https://...
```

## 2. API Token Authentication (Recommended)
API tokens provide stateless access without tickets or CSRF tokens. They can have separate permissions and expiration dates, and can be revoked without disabling the user.

Tokens come in two types:

- **Privilege separated** (`--privsep 1`, the default): the token needs its own ACL entries, and its effective permissions are the **intersection** of the user's and the token's permissions. The token can never have a permission its user lacks.
- **Full privileges** (`--privsep 0`): the token has exactly its user's permissions. Proxmox recommends disabling privilege separation only when an integration genuinely needs the user's full permissions.

For automation such as `@false00/pi-proxmox`, use a dedicated non-root user and a privilege-separated token, and grant each role to both the user and the token on the narrowest path that works. Avoid `root@pam` tokens. See [PERMISSIONS.md](PERMISSIONS.md) for permission tiers and the privileges each tool needs.

### Creating a Token
```bash
# Dedicated non-root user (no password is set; the token is its credential)
pveum user add pi-proxmox@pve --comment "pi-proxmox automation"

# Privilege-separated token (the default, set explicitly)
pveum user token add pi-proxmox@pve automation --privsep 1

# Scope access with a resource pool, then grant the role to the user AND the token
pveum pool add pi-proxmox --comment "Managed by pi-proxmox"
pveum pool modify pi-proxmox --vms 101,102 --storage local-lvm
pveum acl modify /pool/pi-proxmox --roles PVEAuditor --users pi-proxmox@pve
pveum acl modify /pool/pi-proxmox --roles PVEAuditor --tokens 'pi-proxmox@pve!automation'

# Optional: a token that expires (Unix epoch seconds), here in 90 days
pveum user token add pi-proxmox@pve short-lived --privsep 1 --expire "$(date -d '+90 days' +%s)"
```

The token value is only shown once, when the token is created. It cannot be retrieved again later.

### Token Format
```
Token ID: USER@REALM!TOKENID
Token Secret: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Using a Token
Pass the token in the `Authorization` header:
```bash
curl -H 'Authorization: PVEAPIToken=pi-proxmox@pve!automation=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' \
  https://10.0.0.1:8006/api2/json/nodes
```

API tokens **do not** require a `CSRFPreventionToken` header for write operations.

### Token Management
```bash
# List all tokens for a user
pveum user token list pi-proxmox@pve

# Show a token's effective permissions
pveum user token permissions pi-proxmox@pve automation

# Regenerate the token secret (the previous secret stops working)
pveum user token modify pi-proxmox@pve automation --regenerate 1

# Revoke/delete a token
pveum user token delete pi-proxmox@pve automation
```

## 3. Authentication Comparison

| Feature | Ticket | API Token |
|---------|--------|-----------|
| Lifetime | 2 hours | Until revoked or expired (`--expire`) |
| CSRF Token Required | Yes (write ops) | No |
| Login Step Required | Yes | No |
| Privilege Separation | No | Yes (`--privsep`, enabled by default) |
| Recommended For | Browser sessions, Web UI | Scripts, automation, third-party |

## Step-by-step Example: Create an LXC Container

### Using Ticket Auth
```bash
# 1. Get ticket and save cookie
curl -k -d 'username=USER@REALM' --data-urlencode 'password=your_password' \
  https://node:8006/api2/json/access/ticket | \
  jq -r '.data.ticket' | sed 's/^/PVEAuthCookie=/' > cookie

# 2. Get CSRF token
curl -k -d 'username=USER@REALM' --data-urlencode 'password=your_password' \
  https://node:8006/api2/json/access/ticket | \
  jq -r '.data.CSRFPreventionToken' | sed 's/^/CSRFPreventionToken:/' > csrftoken

# 3. Create container
curl -k --cookie "$(<cookie)" --header "$(<csrftoken)" -X POST \
  --data-urlencode net0="name=myct,bridge=vmbr0" \
  --data-urlencode ostemplate="local:vztmpl/debian-12-standard_12.0-1_amd64.tar.gz" \
  --data vmid=601 \
  https://node:8006/api2/json/nodes/targetnode/lxc
```

### Using API Token
```bash
curl -k -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' -X POST \
  --data-urlencode net0="name=myct,bridge=vmbr0" \
  --data-urlencode ostemplate="local:vztmpl/debian-12-standard_12.0-1_amd64.tar.gz" \
  --data vmid=601 \
  https://node:8006/api2/json/nodes/targetnode/lxc
```
