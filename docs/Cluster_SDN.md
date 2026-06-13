# Proxmox VE API — Software Defined Networking (SDN)

This document covers the API endpoints for managing Software Defined Networking in a Proxmox VE cluster, including zones, VNets, subnets, controllers, and IPAM.

## Base Path
```
/cluster/sdn
```

## SDN Status
```
GET /cluster/sdn
```
Returns the overall SDN status and configuration index.

## Zones
SDN zones define the connectivity backend (VLAN, VXLAN, QinQ, EVPN, Simple).

```
GET /cluster/sdn/zones
```
List all configured SDN zones.

```
GET /cluster/sdn/zones/{zone}
```
Get details of a specific zone.

```
POST /cluster/sdn/zones
```
Create a new SDN zone.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `zone` | string | Zone identifier |
| `type` | string | Zone type: `vlan`, `vxlan`, `qinq`, `evpn`, `simple` |
| `nodes` | string | Comma-separated list of nodes |
| `peer` | string | EVPN peer address (for evpn type) |
| `mtu` | integer | MTU for the zone |
| `bridge` | string | Bridge to attach (for simple type) |

```
PUT /cluster/sdn/zones/{zone}
```
Update zone configuration.

```
DELETE /cluster/sdn/zones/{zone}
```
Remove an SDN zone.

## VNets (Virtual Networks)
```
GET /cluster/sdn/vnets
```
List all virtual networks.

```
GET /cluster/sdn/vnets/{vnet}
```
Get details of a specific VNet.

```
POST /cluster/sdn/vnets
```
Create a new VNet.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `vnet` | string | VNet identifier |
| `zone` | string | Associated zone |
| `tag` | integer | VLAN tag |
| `alias` | string | Human-readable name |

```
PUT /cluster/sdn/vnets/{vnet}
```
Update VNet configuration.

```
DELETE /cluster/sdn/vnets/{vnet}
```
Delete a virtual network.

## Subnets
```
GET /cluster/sdn/vnets/{vnet}/subnets
```
List subnets within a VNet.

```
POST /cluster/sdn/vnets/{vnet}/subnets
```
Add a subnet to a VNet.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `subnet` | string | CIDR notation (e.g., `10.0.1.0/24`) |
| `gateway` | string | Gateway address |
| `dhcp_range_start` | string | DHCP range start |
| `dhcp_range_end` | string | DHCP range end |
| `snat` | boolean | Enable SNAT |

```
DELETE /cluster/sdn/vnets/{vnet}/subnets/{subnet}
```
Remove a subnet.

## Controllers
```
GET /cluster/sdn/controllers
```
List SDN controllers (e.g., BGP EVPN controllers).

```
POST /cluster/sdn/controllers
```
Add a controller.

**Parameters:** `controller` (string), `type` (string), `host` (string), `port` (integer), `asn` (integer), `bgp_multihop` (integer)

```
DELETE /cluster/sdn/controllers/{controller}
```
Remove a controller.

## IPAM
```
GET /cluster/sdn/ipam
```
List IPAM configurations.

```
POST /cluster/sdn/ipam
```
Configure IPAM (e.g., `pveipam` or external).

```
DELETE /cluster/sdn/ipam/{ipam}
```
Remove IPAM configuration.

## DNS
```
GET /cluster/sdn/dns
```
List DNS configurations for SDN.

```
POST /cluster/sdn/dns
```
Configure SDN DNS integration.

## Permissions
- `SDN.Allocate` and `SDN.Use` — Required for SDN management
- `Sys.Audit` on `/` — Required for reading SDN configuration

## Common Workflows

### Create a VXLAN Zone
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "zone=overlay&type=vxlan&nodes=pve1,pve2" \
  https://node:8006/api2/json/cluster/sdn/zones
```

### Create a VNet on a Zone
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "vnet=net100&zone=overlay&tag=100" \
  https://node:8006/api2/json/cluster/sdn/vnets
```

### Add a Subnet
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "subnet=10.0.100.0/24&gateway=10.0.100.1" \
  https://node:8006/api2/json/cluster/sdn/vnets/net100/subnets
```
