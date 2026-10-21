# Proxmox VE API — Firewall Management

This document covers the API endpoints for managing firewall rules at the cluster, node, VM, and container levels in Proxmox VE.

## Overview
Proxmox VE firewall operates at multiple levels:
- **Cluster level** — Cluster-wide rules, aliases, IPSets, security groups, and the master `enable` switch
- **Node level** — Per-physical-host rules and options
- **VM/CT level** — Per-virtual-machine or per-container rules, aliases, IPSets, and options

Each level has its own rules and options. Nothing is filtered until the firewall is enabled in the cluster-level options. Guest rules also need the firewall enabled in the guest's options and on each network device (`firewall=1`).

## Base Paths
| Level | Path | Sub-resources |
|-------|------|---------------|
| Cluster | `/cluster/firewall` | `rules`, `aliases`, `ipset`, `groups`, `options`, `macros`, `refs` |
| Node | `/nodes/{node}/firewall` | `rules`, `options`, `log` |
| VM | `/nodes/{node}/qemu/{vmid}/firewall` | `rules`, `aliases`, `ipset`, `options`, `log`, `refs` |
| CT | `/nodes/{node}/lxc/{vmid}/firewall` | `rules`, `aliases`, `ipset`, `options`, `log`, `refs` |

Nodes have no aliases or IPSets of their own; node rules use the cluster-level ones.

## Firewall Rules
```
GET {level}/rules
```
List all firewall rules at the specified level.

```
POST {level}/rules
```
Create a new firewall rule. Proxmox inserts it at the top of the list (position 0) and creates it disabled unless `enable=1` is passed.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Rule type (required): `in`, `out`, `forward`, or `group` |
| `action` | string | `ACCEPT`, `DROP`, `REJECT`, or a security group name for `type=group` (required) |
| `source` | string | Source IP/CIDR, alias, or `+ipset` |
| `dest` | string | Destination IP/CIDR, alias, or `+ipset` |
| `dport` | string | Destination port(s) |
| `sport` | string | Source port(s) |
| `proto` | string | Protocol: `tcp`, `udp`, `icmp` |
| `iface` | string | Network interface |
| `macro` | string | Predefined macro (see `GET /cluster/firewall/macros`) |
| `log` | string | Log level: `emerg`, `alert`, `crit`, `err`, `warning`, `notice`, `info`, `debug`, `nolog` |
| `enable` | integer | `1` to enable, `0` to disable |
| `comment` | string | Rule description |

```
GET {level}/rules/{pos}
PUT {level}/rules/{pos}
```
Read or modify the rule at position `pos`; `enable=1`/`enable=0` turns it on or off, and `moveto` moves it.

```
DELETE {level}/rules/{pos}
```
Delete a firewall rule.

## Firewall Aliases
Cluster, VM, and CT levels only.
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
GET {level}/aliases/{name}
PUT {level}/aliases/{name}
DELETE {level}/aliases/{name}
```
Read, update, or delete an alias.

## IPSet Management
Cluster, VM, and CT levels only.
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
GET {level}/ipset/{name}/{cidr}
PUT {level}/ipset/{name}/{cidr}
DELETE {level}/ipset/{name}/{cidr}
```
Read, update, or remove an IPSet entry.

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
DELETE /cluster/firewall/groups/{group}
```
Delete a security group.

### Group Rules
```
GET /cluster/firewall/groups/{group}
POST /cluster/firewall/groups/{group}
```
List the group's rules, or add a rule to it (same parameters as firewall rules).

```
GET /cluster/firewall/groups/{group}/{pos}
PUT /cluster/firewall/groups/{group}/{pos}
DELETE /cluster/firewall/groups/{group}/{pos}
```
Read, modify, or delete a group rule.

## Firewall Options
```
GET {level}/options
```
View firewall options at the specified level.

```
PUT {level}/options
```
Update firewall options. Each level accepts a different set; Proxmox rejects options that do not apply to the level.

**Common options:**
| Option | Type | Levels | Description |
|--------|------|--------|-------------|
| `enable` | integer | all | Enable/disable the firewall |
| `policy_in` | string | cluster, VM, CT | Default input policy: `ACCEPT`, `DROP`, `REJECT` |
| `policy_out` | string | cluster, VM, CT | Default output policy |
| `log_level_in` | string | node, VM, CT | Log level for input |
| `log_level_out` | string | node, VM, CT | Log level for output |
| `nf_conntrack_allow_invalid` | boolean | node | Allow invalid packets on connection tracking |
| `smurf_log_level` | string | node | Log level for smurf attack detection |
| `tcp_flags_log_level` | string | node | Log level for TCP flag filtering |
| `dhcp` | boolean | VM, CT | Allow DHCP |
| `ndp` | boolean | node, VM, CT | Allow NDP (for IPv6) |

## Firewall Log
```
GET /nodes/{node}/firewall/log
GET /nodes/{node}/qemu/{vmid}/firewall/log
GET /nodes/{node}/lxc/{vmid}/firewall/log
```
View the firewall log of a node, VM, or container.

## References
```
GET /cluster/firewall/refs
GET /nodes/{node}/qemu/{vmid}/firewall/refs
GET /nodes/{node}/lxc/{vmid}/firewall/refs
```
List the IPSets and aliases that rules at that level can reference.

## Permissions
- `Sys.Audit` on `/` — read cluster-level firewall configuration
- `Sys.Modify` on `/` — modify cluster-level firewall configuration
- `Sys.Audit` on `/nodes/{node}` — read node-level firewall configuration
- `Sys.Modify` on `/nodes/{node}` — modify node-level firewall configuration
- `VM.Audit` on `/vms/{vmid}` — read VM or CT firewall configuration
- `VM.Config.Network` on `/vms/{vmid}` — modify VM or CT firewall configuration

## Common Workflows

### Add a Cluster-level Accept Rule
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "type=in&action=ACCEPT&source=10.0.0.0/8&dest=10.0.0.0/8&proto=tcp&dport=80,443&enable=1&comment=Allow internal HTTP" \
  https://node:8006/api2/json/cluster/firewall/rules
```

### Create an Alias
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "name=mgmt_net&cidr=10.0.0.0/24&comment=Management network" \
  https://node:8006/api2/json/cluster/firewall/aliases
```

### Add a VM-level Firewall Rule
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "type=in&action=DROP&source=0.0.0.0/0&dport=22&proto=tcp&enable=1" \
  https://node:8006/api2/json/nodes/pve1/qemu/100/firewall/rules
```

### Enable Cluster Firewall
```bash
curl -X PUT -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "enable=1&policy_in=DROP&policy_out=ACCEPT" \
  https://node:8006/api2/json/cluster/firewall/options
```
