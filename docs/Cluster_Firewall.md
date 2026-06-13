# Proxmox VE API — Firewall Management

This document covers the API endpoints for managing firewall rules at the cluster, node, VM, and container levels in Proxmox VE.

## Overview
Proxmox VE firewall operates at multiple levels:
- **Cluster level** — Global firewall rules applying to all nodes
- **Node level** — Per-physical-host firewall rules
- **VM/CT level** — Per-virtual-machine or per-container firewall rules

Rules are evaluated from most specific (VM/CT) to least specific (cluster).

## Base Paths
| Level | Path |
|-------|------|
| Cluster | `/cluster/firewall` |
| Node | `/nodes/{node}/firewall` |
| VM | `/nodes/{node}/qemu/{vmid}/firewall` |
| CT | `/nodes/{node}/lxc/{vmid}/firewall` |

## Firewall Rules
```
GET {level}/rules
```
List all firewall rules at the specified level.

```
POST {level}/rules
```
Create a new firewall rule.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Rule type: `in`, `out` |
| `action` | string | `ACCEPT`, `DROP`, `REJECT` |
| `source` | string | Source IP/CIDR |
| `dest` | string | Destination IP/CIDR |
| `dport` | string | Destination port(s) |
| `sport` | string | Source port(s) |
| `proto` | string | Protocol: `tcp`, `udp`, `icmp` |
| `iface` | string | Network interface |
| `log` | string | Log level: `emerg`, `alert`, `crit`, `err`, `warn`, `notice`, `info`, `debug`, `nolog` |
| `enable` | integer | `1` to enable, `0` to disable |
| `comment` | string | Rule description |

```
PUT {level}/rules/{pos}
```
Update a rule at position `pos`.

```
DELETE {level}/rules/{pos}
```
Delete a firewall rule.

```
PUT {level}/rules/{pos}/enable
POST {level}/rules/{pos}/toggle
```
Enable/disable or toggle a firewall rule.

## Firewall Aliases
```
GET {level}/aliases
```
List firewall aliases (named IP/CIDR mappings).

```
POST {level}/aliases
```
Create an alias.

**Parameters:** `name` (string), `cidr` (string), `comment` (string)

```
PUT {level}/aliases/{name}
DELETE {level}/aliases/{name}
```
Update or delete an alias.

## IPSet Management
```
GET {level}/ipset
```
List all IPSets.

```
POST {level}/ipset
```
Create an IPSet.

**Parameters:** `name` (string), `comment` (string)

```
DELETE {level}/ipset/{name}
```
Delete an IPSet.

### IPSet Entries
```
GET {level}/ipset/{name}
```
List CIDR entries in an IPSet.

```
POST {level}/ipset/{name}
```
Add a CIDR entry.

**Parameters:** `cidr` (string), `comment` (string), `nomatch` (boolean)

```
DELETE {level}/ipset/{name}/{cidr}
```
Remove an entry from an IPSet.

## Security Groups
```
GET /cluster/firewall/groups
```
List firewall security groups.

```
POST /cluster/firewall/groups
```
Create a security group.

**Parameters:** `group` (string), `comment` (string)

```
GET /cluster/firewall/groups/{group}
PUT /cluster/firewall/groups/{group}
DELETE /cluster/firewall/groups/{group}
```
Read, update, or delete a security group.

### Group Rules
```
GET /cluster/firewall/groups/{group}/rules
POST /cluster/firewall/groups/{group}/rules
PUT /cluster/firewall/groups/{group}/rules/{pos}
DELETE /cluster/firewall/groups/{group}/rules/{pos}
```
Manage rules within a security group (same parameters as firewall rules).

## Firewall Options
```
GET {level}/options
```
View firewall options at the specified level.

```
PUT {level}/options
```
Update firewall options.

**Options:**
| Option | Type | Description |
|--------|------|-------------|
| `enable` | integer | Enable/disable firewall |
| `policy_in` | string | Default input policy: `ACCEPT`, `DROP`, `REJECT` |
| `policy_out` | string | Default output policy |
| `log_level_in` | string | Log level for input |
| `log_level_out` | string | Log level for output |
| `nf_conntrack_allow` | string | Connection tracking allow rules |
| `smurf_log_level` | string | Log level for smurf attack detection |
| `tcp_flags_log_level` | string | Log level for TCP flag filtering |
| `dhcp` | boolean | Allow DHCP |
| `ndp` | boolean | Allow NDP (for IPv6) |

## Node-specific Firewall
```
GET /nodes/{node}/firewall/rules
GET /nodes/{node}/firewall/aliases
GET /nodes/{node}/firewall/ipset
GET /nodes/{node}/firewall/options
```
Node-level firewall uses the same sub-paths as cluster firewall.

## VM/CT Firewall
```
GET /nodes/{node}/qemu/{vmid}/firewall/rules
GET /nodes/{node}/lxc/{vmid}/firewall/rules
GET /nodes/{node}/qemu/{vmid}/firewall/aliases
GET /nodes/{node}/lxc/{vmid}/firewall/aliases
GET /nodes/{node}/qemu/{vmid}/firewall/options
GET /nodes/{node}/lxc/{vmid}/firewall/options
```
VM and CT firewall follows the same pattern.

### VM/CT Log
```
GET /nodes/{node}/qemu/{vmid}/firewall/log
GET /nodes/{node}/lxc/{vmid}/firewall/log
```
View firewall log for a specific VM or container.

### VM/CT REF (Refcount/Status)
```
GET /nodes/{node}/qemu/{vmid}/firewall/refs
GET /nodes/{node}/lxc/{vmid}/firewall/refs
```
Get references/groups applied to the VM or container.

## Permissions
- `Sys.Audit` on `/` — Read firewall rules
- `Sys.Modify` on `/` — Modify firewall rules
- `VM.Audit` on VM path — Read VM firewall
- `VM.Config` on VM path — Modify VM firewall

## Common Workflows

### Add a Cluster-level Accept Rule
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "action=ACCEPT&source=10.0.0.0/8&dest=10.0.0.0/8&proto=tcp&dport=80,443&enable=1&comment=Allow internal HTTP" \
  https://node:8006/api2/json/cluster/firewall/rules
```

### Create an Alias
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "name=mgmt_net&cidr=10.0.0.0/24&comment=Management network" \
  https://node:8006/api2/json/cluster/firewall/aliases
```

### Add a VM-level Firewall Rule
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "action=DROP&source=0.0.0.0/0&dport=22&proto=tcp&enable=1" \
  https://node:8006/api2/json/nodes/pve1/qemu/100/firewall/rules
```

### Enable Cluster Firewall
```bash
curl -X PUT -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "enable=1&policy_in=DROP&policy_out=ACCEPT" \
  https://node:8006/api2/json/cluster/firewall/options
```
