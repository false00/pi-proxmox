# Proxmox VE API — Access Control

This document covers all endpoints related to identity management, authentication domains, permissions, and multi-factor authentication.

## Base Path
```
/access
```

## Users

### List Users
```
GET /access/users
```
Returns all users. **Parameters:** `full` (boolean, include group/keys info).

### Get User
```
GET /access/users/{userid}
```
Get details for a specific user (e.g., `root@pam`, `admin@pve`).

### Create User
```
POST /access/users
```
**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userid` | string | Full user ID: `user@realm` |
| `password` | string | Password (omit for token-only accounts) |
| `comment` | string | Description |
| `email` | string | Email address |
| `enable` | integer | `1` = enabled, `0` = disabled |
| `expire` | integer | Expiration timestamp |
| `firstname` | string | First name |
| `lastname` | string | Last name |
| `groups` | string | Comma-separated group list |
| `keys` | string | SSH public keys |

### Update User
```
PUT /access/users/{userid}
```
Modify user properties.

### Delete User
```
DELETE /access/users/{userid}
```
Remove a user account.

## Groups

### List Groups
```
GET /access/groups
```

### Create Group
```
POST /access/groups
```
**Parameters:** `groupid` (string), `comment` (string), `members` (string, comma-separated user IDs).

### Get/Update/Delete Group
```
GET /access/groups/{groupid}
PUT /access/groups/{groupid}
DELETE /access/groups/{groupid}
```

## Roles

### List Roles
```
GET /access/roles
```
Returns all defined roles with their privileges. Built-in roles include:
- `Administrator` — All privileges
- `PVEAuditor` — Read-only access
- `PVEAdmin` — Admin without Sys.Modify
- `PVEDatastoreAdmin` — Storage administration
- `PVEDatastoreUser` — Storage user
- `PVEPoolAdmin` — Pool administration
- `PVETemplateUser` — Template user
- `PVEUserAdmin` — User administration
- `PVEVMAdmin` — VM administration
- `PVEVMUser` — VM user

### Create Role
```
POST /access/roles
```
**Parameters:** `roleid` (string), `privs` (string, comma-separated privilege list).

### Get/Update/Delete Role
```
GET /access/roles/{roleid}
PUT /access/roles/{roleid}
DELETE /access/roles/{roleid}
```

## ACL (Access Control Lists)

### List ACL
```
GET /access/acl
```
Returns all ACL entries with path, user/group, and role assignments.

### Update ACL
```
PUT /access/acl
```
Modify ACL entries.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | Resource path (e.g., `/`, `/vms/100`, `/storage/local`) |
| `roles` | string | Comma-separated role IDs |
| `users` | string | Comma-separated user IDs |
| `groups` | string | Comma-separated group IDs |
| `propagate` | boolean | Propagate to child paths |
| `delete` | boolean | Remove the ACL entry instead of adding |

### Permissions Query
```
GET /access/permissions
```
Check what permissions the current user has.

## Authentication Domains

### List Domains
```
GET /access/domains
```
Returns configured authentication realms/domains:
- `pam` — Linux PAM (local system users)
- `pve` — Proxmox VE internal authentication
- Custom LDAP/AD/OpenID realms

### Get Domain
```
GET /access/domains/{realm}
```
Get configuration for a specific realm.

### Sync Domain
```
POST /access/domains/{realm}/sync
```
Synchronize users from an LDAP/AD domain.

## Multi-Factor Authentication (TFA)

### TFA Configuration
```
GET /access/tfa
```
Returns the TFA (Two-Factor Authentication) configuration for users.

### TFA User Configuration
```
GET /access/users/{userid}/tfa
```
Get TFA methods configured for a specific user.

```
POST /access/users/{userid}/tfa
```
Add a TFA method for a user (TOTP, U2F, YubiKey).

```
DELETE /access/users/{userid}/tfa/{id}
```
Remove a TFA method.

## Password Management
```
POST /access/password
```
**Parameters:** `userid` (string), `password` (string, new password).

## API Tokens
```
GET /access/users/{userid}/token
POST /access/users/{userid}/token
GET /access/users/{userid}/token/{tokenid}
PUT /access/users/{userid}/token/{tokenid}
DELETE /access/users/{userid}/token/{tokenid}
```
Token management for individual users. See [API_Authentication](API_Authentication.md) for token usage.

## OpenID Connect
```
GET /access/openid
```
OpenID Connect configuration.

## Permissions Summary
| Endpoint | Required Permission |
|----------|-------------------|
| User CRUD | `User.Modify` on `/access` |
| Group CRUD | `User.Modify` on `/access` |
| Role CRUD | `Permissions.Modify` on `/access` |
| ACL management | `Permissions.Modify` on the target path |
| Domain config | `Sys.Audit` (read), `Sys.Modify` (write) |
| TFA management | `User.Modify` on `/access` |
| Password change | Self: always allowed; others: `User.Modify` |
