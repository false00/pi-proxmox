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
| `type` | string | Zone type: `simple`, `vlan`, `qinq`, `vxlan`, `evpn`, `faucet` |
| `nodes` | string | Comma-separated list of nodes |
| `peers` | string | Peer addresses, usually the node IPs (for vxlan type) |
| `controller` | string | EVPN controller (for evpn type) |
| `mtu` | integer | MTU for the zone |
| `bridge` | string | Bridge whose VLANs the zone manages (for vlan and qinq types) |

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
| `dhcp-range` | array | DHCP ranges, each `start-address=<ip>,end-address=<ip>` |
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

**Parameters:** `controller` (string), `type` (string: `evpn`, `bgp`, `isis`, `faucet`), `peers` (string, peer addresses), `asn` (integer), `ebgp-multihop` (integer)

```
DELETE /cluster/sdn/controllers/{controller}
```
Remove a controller.

## IPAM
```
GET /cluster/sdn/ipams
```
List IPAM plugin configurations.

```
POST /cluster/sdn/ipams
```
Add an IPAM plugin configuration (`pve`, `netbox`, or `phpipam`).

```
GET /cluster/sdn/ipams/{ipam}
PUT /cluster/sdn/ipams/{ipam}
DELETE /cluster/sdn/ipams/{ipam}
```
Read, update, or remove an IPAM configuration.

```
GET /cluster/sdn/ipams/{ipam}/status
```
List the IP addresses the IPAM plugin has allocated.

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
- `SDN.Audit` (or `SDN.Allocate`) on the object's path under `/sdn` (for example `/sdn/zones/<zone>`, `/sdn/zones/<zone>/<vnet>`, `/sdn/ipams/<ipam>`) — reading SDN configuration; lists only show objects you can audit
- `SDN.Allocate` on the object's path under `/sdn` — creating, changing, or deleting zones, VNets, subnets, controllers, IPAMs, and DNS plugins, and applying the configuration (`PUT /cluster/sdn`)
- `SDN.Use` on `/sdn/zones/<zone>/<vnet>` — attaching guests to a VNet or bridge

## Common Workflows

### Create a VXLAN Zone
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "zone=overlay&type=vxlan&nodes=pve1,pve2" \
  https://node:8006/api2/json/cluster/sdn/zones
```

### Create a VNet on a Zone
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "vnet=net100&zone=overlay&tag=100" \
  https://node:8006/api2/json/cluster/sdn/vnets
```

### Add a Subnet
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "subnet=10.0.100.0/24&gateway=10.0.100.1" \
  https://node:8006/api2/json/cluster/sdn/vnets/net100/subnets
```
