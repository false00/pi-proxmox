# Proxmox VE API — High Availability (HA)

This document covers the High Availability endpoints for managing HA groups, resources, and failover behavior in a Proxmox VE cluster.

## Base Path
```
/cluster/ha
```

## HA Status
```
GET /cluster/ha/status
```
Returns the current HA status of the cluster, including quorum state and manager status.

## HA Resources
```
GET /cluster/ha/resources
```
Lists all resources managed by the HA stack with their current state (started, stopped, migrating, error, etc.).

### Get Resource
```
GET /cluster/ha/resources/{sid}
```
Returns detailed status for a specific HA-managed resource identified by its SID (e.g., `vm:100`).

### Create Resource
```
POST /cluster/ha/resources
```
Register a VM or CT for HA management.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sid` | string | Resource ID (e.g., `vm:100`, `ct:200`) |
| `state` | string | Desired state: `started`, `stopped`, `disabled` |
| `comment` | string | Optional description |
| `max_restart` | integer | Max restart attempts within `max_restart_age` window |
| `max_relocate` | integer | Max relocate attempts |
| `group` | string | HA group to assign this resource to |

### Update Resource
```
PUT /cluster/ha/resources/{sid}
```
Modify an HA resource's configuration.

### Delete Resource
```
DELETE /cluster/ha/resources/{sid}
```
Remove a resource from HA management.

## HA Groups
```
GET /cluster/ha/groups
```
List all configured HA groups.

### Get Group
```
GET /cluster/ha/groups/{group}
```
Returns configuration details for a specific HA group.

### Create Group
```
POST /cluster/ha/groups
```
Define a new HA group.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `group` | string | Group identifier |
| `nodes` | string | Ordered list of nodes (comma-separated), e.g. `node1,node2,node3` |
| `nofailback` | boolean | Disable automatic failback to preferred nodes |
| `restricted` | boolean | Restrict resources to only nodes in this group |
| `comment` | string | Optional description |

### Update Group
```
PUT /cluster/ha/groups/{group}
```
Modify HA group configuration.

### Delete Group
```
DELETE /cluster/ha/groups/{group}
```
Remove a HA group.

## HA Managers
```
GET /cluster/ha/managers
```
Get status of the HA manager(s) in the cluster.

## Permissions
- `Sys.Modify` on `/` — Required for creating/updating/deleting HA resources and groups
- `Sys.Audit` on `/` — Required for reading HA status and configuration

## Common Workflows

### Register a VM for HA
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "sid=vm:100&state=started&group=production" \
  https://node:8006/api2/json/cluster/ha/resources
```

### Create an HA Group with Node Preference
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "group=production&nodes=pve1,pve2,pve3&nofailback=1" \
  https://node:8006/api2/json/cluster/ha/groups
```

### Check HA Failover Status
```bash
curl -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  https://node:8006/api2/json/cluster/ha/status
```
