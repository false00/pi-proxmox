# Proxmox VE API — High Availability (HA)

This document covers the High Availability endpoints for managing HA resources, rules, groups, and failover behavior in a Proxmox VE cluster.

## Base Path
```
/cluster/ha
```

## HA Status
```
GET /cluster/ha/status/current
```
Returns the current HA status: quorum, the active manager (master), each node's local resource manager (LRM), and every HA service.

```
GET /cluster/ha/status/manager_status
```
Returns the full HA manager status, including LRM details.

`GET /cluster/ha/status` itself is only a directory index of these endpoints.

## HA Resources
```
GET /cluster/ha/resources
```
Lists all resources managed by the HA stack with their configured state.

### Get Resource
```
GET /cluster/ha/resources/{sid}
```
Returns the configuration of a specific HA-managed resource identified by its SID (e.g., `vm:100`).

### Create Resource
```
POST /cluster/ha/resources
```
Register a VM or CT for HA management.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sid` | string | Resource ID (e.g., `vm:100`, `ct:200`) |
| `state` | string | Requested state: `started`, `stopped`, `enabled`, `disabled`, `ignored` |
| `comment` | string | Optional description |
| `max_restart` | integer | Max restart attempts on the same node after a failed start |
| `max_relocate` | integer | Max relocate attempts |
| `failback` | boolean | Move the resource back to the highest-priority node when it returns (Proxmox VE 9) |
| `group` | string | HA group to assign this resource to (deprecated in Proxmox VE 9) |

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

## HA Rules (Proxmox VE 9)
```
GET /cluster/ha/rules
POST /cluster/ha/rules
```
List or create HA rules. Rule types are `node-affinity` (which nodes a resource prefers) and `resource-affinity` (which resources run together or apart).

```
GET /cluster/ha/rules/{rule}
PUT /cluster/ha/rules/{rule}
DELETE /cluster/ha/rules/{rule}
```
Read, update, or delete a rule.

## HA Groups (deprecated)
HA groups are deprecated in Proxmox VE 9 in favor of node-affinity rules; existing groups are migrated to rules once every node runs Proxmox VE 9.

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

## Permissions
- `Sys.Audit` on `/` — reading HA status, resources, rules, and groups
- `Sys.Console` on `/` — creating, updating, and deleting HA resources, rules, and groups

## Common Workflows

### Register a VM for HA
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "sid=vm:100&state=started" \
  https://node:8006/api2/json/cluster/ha/resources
```

### Create an HA Group with Node Preference (before Proxmox VE 9)
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "group=production&nodes=pve1,pve2,pve3&nofailback=1" \
  https://node:8006/api2/json/cluster/ha/groups
```

### Check HA Failover Status
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/cluster/ha/status/current
```
