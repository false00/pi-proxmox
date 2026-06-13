# Proxmox VE API Authentication

Proxmox VE uses two primary methods for authenticating API requests. All API calls require authentication and are made over HTTPS on port 8006.

## Base URL
```
https://your.server:8006/api2/json/
```

## 1. Ticket Cookie Authentication
A ticket is a signed random text value containing the user and creation time. Tickets are signed by a cluster-wide rotating auth key.

### Getting a Ticket
```
POST /access/ticket
```

**Request:**
```bash
curl -k -d 'username=root@pam' --data-urlencode 'password=your_password' \
  https://10.0.0.1:8006/api2/json/access/ticket
```

**Response:**
```json
{
  "data": {
    "CSRFPreventionToken": "4EEC61E2:lwk7od06fa1+DcPUwBTXCcndyAY",
    "ticket": "PVE:root@pam:4EEC61E2::rsKoApxDTLYPn6H3NNT6iP2mv...",
    "username": "root@pam"
  }
}
```

### Using the Ticket
Pass the ticket as a cookie header named `PVEAuthCookie`:
```bash
curl -k -b "PVEAuthCookie=PVE:root@pam:4EEC61E2::..." \
  https://10.0.0.1:8006/api2/json/nodes
```

### Ticket Lifetime & Refresh
Tickets have a **2-hour lifetime**. To refresh, pass the old ticket as the password:
```bash
curl -k -d 'username=root@pam' --data-urlencode 'password=PVE:root@pam:4EEC61E2::...' \
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
curl -k -d 'username=root@pam' --data-urlencode "password@$HOME/.pve-pass-file" \
  https://10.0.0.1:8006/api2/json/access/ticket
```
Or store the full auth header in a file with restricted permissions:
```bash
# Store in file accessible only by your user
echo "Authorization: PVEAPIToken=root@pam!token=UUID" > ~/.pve-auth-header
chmod 600 ~/.pve-auth-header
# Use with curl -H
curl -k -H @~/.pve-auth-header https://...
```

## 2. API Token Authentication (Recommended)
API tokens provide stateless access without tickets or CSRF tokens. They can have separate permissions and expiration dates, and can be revoked independently.

### Creating a Token
```bash
# Create with full user privileges
pveum user token add root@pam automation --privsep=0

# Create with privilege separation (restricted)
pveum user token add root@pam read-only-token --privsep=1

# Create with expiration
pveum user token add root@pam limited-token --expire 2025-12-31
```

### Token Format
```
Token ID: USER@REALM!TOKENID
Token Secret: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Using a Token
Pass the token in the `Authorization` header:
```bash
curl -H 'Authorization: PVEAPIToken=root@pam!automation=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' \
  https://10.0.0.1:8006/api2/json/nodes
```

API tokens **do not** require a `CSRFPreventionToken` header for write operations.

### Token Management
```bash
# List all tokens for a user
pveum user token list root@pam

# Show token info
pveum user token info root@pam automation

# Regenerate token secret
pveum user token secret root@pam automation

# Revoke/delete a token
pveum user token delete root@pam automation
```

## 3. Authentication Comparison

| Feature | Ticket | API Token |
|---------|--------|-----------|
| Lifetime | 2 hours | Permanent (until revoked) |
| CSRF Token Required | Yes (write ops) | No |
| Login Step Required | Yes | No |
| Privilege Separation | No | Yes (via --privsep) |
| Recommended For | Browser sessions, Web UI | Scripts, automation, third-party |

## Step-by-step Example: Create an LXC Container

### Using Ticket Auth
```bash
# 1. Get ticket and save cookie
curl -k -d 'username=root@pam' --data-urlencode 'password=your_password' \
  https://node:8006/api2/json/access/ticket | \
  jq -r '.data.ticket' | sed 's/^/PVEAuthCookie=/' > cookie

# 2. Get CSRF token
curl -k -d 'username=root@pam' --data-urlencode 'password=your_password' \
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
curl -k -H 'Authorization: PVEAPIToken=root@pam!automation=UUID' -X POST \
  --data-urlencode net0="name=myct,bridge=vmbr0" \
  --data-urlencode ostemplate="local:vztmpl/debian-12-standard_12.0-1_amd64.tar.gz" \
  --data vmid=601 \
  https://node:8006/api2/json/nodes/targetnode/lxc
```
