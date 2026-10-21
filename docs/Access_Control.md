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
| `keys` | string | Keys for two-factor authentication (Yubico) |

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
**Parameters:** `groupid` (string), `comment` (string). Groups have no member list of their own: add users to a group through the user's `groups` parameter (`POST /access/users`, or `PUT /access/users/{userid}` with `append=1`).

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
| `path` | string | Resource path (e.g., `/`, `/vms/100`, `/storage/local`, `/pool/dev`) |
| `roles` | string | Comma-separated role IDs |
| `users` | string | Comma-separated user IDs |
| `groups` | string | Comma-separated group IDs |
| `tokens` | string | Comma-separated API token IDs (e.g., `pi-proxmox@pve!automation`) |
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

### List TFA Entries
```
GET /access/tfa
```
Lists the TFA entries of all users the caller may see, or only the caller's own.

### TFA Types of a User
```
GET /access/users/{userid}/tfa
```
Get the TFA types configured for a user (personal and realm-enforced).

### Manage a User's TFA Entries
```
GET /access/tfa/{userid}
POST /access/tfa/{userid}
```
List a user's TFA entries, or add one (`type`: `totp`, `u2f`, `webauthn`, `recovery`, or `yubico`).

```
GET /access/tfa/{userid}/{id}
PUT /access/tfa/{userid}/{id}
DELETE /access/tfa/{userid}/{id}
```
Read, update, or remove a single TFA entry.

```
PUT /access/users/{userid}/unlock-tfa
```
Unlock a user's TFA authentication, for example after it was locked by too many failed attempts.

## Password Management
```
PUT /access/password
```
**Parameters:** `userid` (string), `password` (string, new password), `confirmation-password` (string, the current password of the user performing the change).

## API Tokens
```
GET /access/users/{userid}/token
GET /access/users/{userid}/token/{tokenid}
POST /access/users/{userid}/token/{tokenid}
PUT /access/users/{userid}/token/{tokenid}
DELETE /access/users/{userid}/token/{tokenid}
```
Token management for individual users. `POST` creates the token and returns its secret once, in the `value` field. See [API_Authentication](API_Authentication.md) for token usage.

Tokens are created with privilege separation by default (`privsep=1`): a privilege-separated token needs its own ACL entries (the `tokens` parameter of `PUT /access/acl`), and its effective permissions are the intersection of its user's and its own. Grant roles to both the user and the token, on the narrowest path that works. See [PERMISSIONS](PERMISSIONS.md) for the setup this package recommends.

## OpenID Connect
```
GET /access/openid
```
OpenID Connect configuration.

## Permissions Summary
| Endpoint | Required Permission |
|----------|-------------------|
| User create/delete | `Realm.AllocateUser` on `/access/realm/<realm>` and `User.Modify` for the user's groups (`/access/groups/<group>`, or `/access/groups`) |
| User read/update | `User.Modify` (read: or `Sys.Audit`) for the user's groups |
| Group create/update/delete | `Group.Allocate` on `/access/groups` |
| Role create/update/delete | `Sys.Modify` on `/access` |
| ACL management | `Permissions.Modify` on the target path (or `Datastore.Allocate`, `VM.Allocate`, `Pool.Allocate` for `/storage/...`, `/vms/...`, `/pool/...`) |
| API tokens | Own user: always allowed; others: `User.Modify` for the user's groups |
| Realm list (`GET /access/domains`) | None; the list is public because the login screen needs it |
| Realm configuration read | `Realm.Allocate` or `Sys.Audit` on `/access/realm` |
| Realm create/update/delete | `Realm.Allocate` on `/access/realm` |
| Realm sync | `Realm.AllocateUser` on `/access/realm/<realm>` and `User.Modify` on `/access/groups` |
| TFA entries | Own user: always allowed; others: `User.Modify` for the user's groups (read: or `Sys.Audit`) |
| TFA unlock | `User.Modify` for the user's groups |
| Password change | Self: always allowed; others: `Realm.AllocateUser` on the user's realm and `User.Modify` for the user's groups |
