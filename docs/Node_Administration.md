# Proxmox VE API — Node Administration

This document covers the administrative endpoints available for individual cluster nodes under `/nodes/{node}`. These include hardware management, disk operations, network configuration, system services, and more.

## Hardware & Capabilities
```
GET /nodes/{node}/hardware/pci
```
List the node's PCI devices (vendor, device, IOMMU group), for example to choose a passthrough device.

```
GET /nodes/{node}/hardware/usb
```
List the node's USB devices.

`GET /nodes/{node}/hardware` itself only lists these two device classes.

```
GET /nodes/{node}/capabilities/qemu/cpu
GET /nodes/{node}/capabilities/qemu/machines
```
List the CPU models and machine types QEMU supports on the node.

## Disk Management
```
GET /nodes/{node}/disks/list
```
List local disks with size, model, serial, usage, and health status.

### Smartmontools (SMART)
```
GET /nodes/{node}/disks/smart
```
Get SMART health data for a disk; pass the device as `disk` (e.g., `disk=/dev/sda`).

### Disk Initialization
```
POST /nodes/{node}/disks/initgpt
```
Initialize a disk with a GPT partition table.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `disk` | string | Block device (e.g., `/dev/sdb`) |
| `uuid` | string | UUID for the GPT table (optional) |

```
PUT /nodes/{node}/disks/wipedisk
```
Wipe a disk or partition. Root only.

### Directory Storage
```
POST /nodes/{node}/disks/directory
```
Create a filesystem on an unused disk, mount it under `/mnt/pve/<name>`, and optionally add it as directory storage.

### LVM
```
POST /nodes/{node}/disks/lvm
POST /nodes/{node}/disks/lvmthin
```
Create an LVM volume group or LVM-thin pool on a disk.

### ZFS
```
POST /nodes/{node}/disks/zfs
```
Create a ZFS pool.

**Parameters:** `devices` (string, comma-separated block devices), `name` (string), `raidlevel` (string: `single`, `mirror`, `raid10`, `raidz`, `raidz2`, `raidz3`, `draid`, `draid2`, `draid3`), `ashift` (integer), `compression` (string), `add_storage` (boolean)

## Network Interfaces
```
GET /nodes/{node}/network
```
List all network interfaces and their configuration.

```
GET /nodes/{node}/network/{iface}
```
Get details for a specific interface (e.g., `vmbr0`, `bond0`, `eth0`).

```
POST /nodes/{node}/network
```
Create a new network interface (bridge, bond, VLAN, or alias). Changes are staged until applied.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | `bridge`, `bond`, `eth`, `alias`, `vlan`, `OVSBridge`, ... |
| `iface` | string | Interface name |
| `cidr` | string | IPv4 address in CIDR notation (or `address` plus `netmask`) |
| `gateway` | string | Gateway address |
| `autostart` | boolean | Start at boot |
| `bridge_ports` | string | For bridge: member interfaces |
| `bond_mode` | string | For bond: `802.3ad`, `active-backup`, `balance-rr`, `balance-xor`, `broadcast`, `balance-tlb`, `balance-alb` |
| `slaves` | string | For bond: member interfaces |

```
PUT /nodes/{node}/network/{iface}
```
Update interface configuration.

```
DELETE /nodes/{node}/network/{iface}
```
Remove an interface.

```
PUT /nodes/{node}/network
```
Apply the pending network configuration changes.

```
DELETE /nodes/{node}/network
```
Revert the pending network configuration changes.

## Certificates
```
GET /nodes/{node}/certificates/info
```
Get information about the node's certificates.

```
POST /nodes/{node}/certificates/custom
DELETE /nodes/{node}/certificates/custom
```
Upload or remove a custom certificate chain and key.

```
POST /nodes/{node}/certificates/acme/certificate
PUT /nodes/{node}/certificates/acme/certificate
DELETE /nodes/{node}/certificates/acme/certificate
```
Order, renew, or revoke the node's ACME certificate.

## System Logs
```
GET /nodes/{node}/journal
```
Read systemd journal entries.

**Parameters:** `since` (integer, Unix epoch), `until` (integer, Unix epoch), `lastentries` (integer, last N entries), `startcursor` and `endcursor` (strings, journal cursors). Recent releases also accept filters such as `service` (syslog identifier glob), `unit`, and `priority`.

```
GET /nodes/{node}/syslog
```
Read the system log.

**Parameters:** `start` (integer, line offset), `limit` (integer), `since` and `until` (date-time strings), `service` (string)

## DNS
```
GET /nodes/{node}/dns
```
View DNS configuration for the node.

```
PUT /nodes/{node}/dns
```
Update DNS servers (`dns1` to `dns3`) and the search domain.

## Time
```
GET /nodes/{node}/time
```
Get the current system time and time zone.

```
PUT /nodes/{node}/time
```
Set the time zone.

## System Configuration
```
GET /nodes/{node}/config
```
View node configuration options.

```
PUT /nodes/{node}/config
```
Update node configuration options (description, ACME domains, Wake-on-LAN settings, and so on).

## APT & Package Management
```
GET /nodes/{node}/apt/update
```
List available package updates.

```
POST /nodes/{node}/apt/update
```
Refresh the APT package index.

```
GET /nodes/{node}/apt/repositories
```
List configured APT repositories.

```
PUT /nodes/{node}/apt/repositories
POST /nodes/{node}/apt/repositories
```
Add a standard repository, or enable or disable an existing one.

```
GET /nodes/{node}/apt/changelog
```
View a package changelog.

## Execute Commands
```
POST /nodes/{node}/execute
```
Execute multiple node-relative Proxmox API requests in order (root only). This is a batched API endpoint, not arbitrary shell execution.

**Security note:** This endpoint is restricted to `root@pam`; no role or ACL grants it.

## Subscription
```
GET /nodes/{node}/subscription
```
View subscription status.

```
PUT /nodes/{node}/subscription
```
Set the subscription key.

```
POST /nodes/{node}/subscription
```
Refresh the subscription information from the server.

```
DELETE /nodes/{node}/subscription
```
Remove the subscription key.

## Node Shutdown & Reboot
```
POST /nodes/{node}/status
```
Reboot or shut down the node: `command=reboot` or `command=shutdown`. After a shutdown the node stays off until it is powered on out of band.

## Wake-on-LAN
```
POST /nodes/{node}/wakeonlan
```
Send a Wake-on-LAN packet to power on a node (configure its MAC address with the node's `wakeonlan` option).

## Netstat
```
GET /nodes/{node}/netstat
```
Read the network interface counters of the node's VM tap devices.

## Shells and Consoles
```
POST /nodes/{node}/termproxy
POST /nodes/{node}/vncshell
POST /nodes/{node}/spiceshell
```
Create an xterm.js, VNC, or SPICE shell proxy on the node.

## Permissions
| Endpoint | Required Permission |
|----------|-------------------|
| PCI devices | `Sys.Audit` or `Sys.Modify` on `/` |
| USB devices | `Sys.Modify` on `/` |
| Disk list | `Sys.Audit` on `/` or `/nodes/{node}` |
| SMART data | `Sys.Audit` on `/` |
| Disk changes (GPT, LVM, ZFS, directory) | `Sys.Modify` on `/`; also `Datastore.Allocate` on `/storage` with `add_storage` |
| Disk wipe | Root only |
| Network list | None beyond authentication |
| Network interface details | `Sys.Audit` on `/nodes/{node}` |
| Network changes | `Sys.Modify` on `/nodes/{node}` |
| Certificate info, subscription status | None beyond authentication |
| Certificate changes, subscription changes | `Sys.Modify` on `/nodes/{node}` |
| Journal, syslog | `Sys.Syslog` on `/nodes/{node}` |
| DNS, time (read) | `Sys.Audit` on `/nodes/{node}` |
| DNS, time (change) | `Sys.Modify` on `/nodes/{node}` |
| Node configuration | `Sys.Audit` (read) or `Sys.Modify` (change) on `/` |
| APT updates, repository changes, changelogs | `Sys.Modify` on `/nodes/{node}` |
| APT repository list | `Sys.Audit` on `/nodes/{node}` |
| Execute | Root only (`root@pam`); no role or ACL grants it |
| Shutdown, reboot, Wake-on-LAN | `Sys.PowerMgmt` on `/nodes/{node}` |
| Shells and consoles | `Sys.Console` on `/nodes/{node}` |

## Common Workflows

### View Disk Health via SMART
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  "https://node:8006/api2/json/nodes/pve1/disks/smart?disk=/dev/sda"
```

### Create a ZFS Pool
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "devices=/dev/sdb,/dev/sdc&name=tank&raidlevel=mirror&ashift=12" \
  https://node:8006/api2/json/nodes/pve1/disks/zfs
```

### Create a Linux Bridge
```bash
curl -X POST -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  -d "type=bridge&iface=vmbr1&cidr=192.168.100.1/24&autostart=1&bridge_ports=enp2s0" \
  https://node:8006/api2/json/nodes/pve1/network
curl -X PUT -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  https://node:8006/api2/json/nodes/pve1/network
```

### Read the Last 100 Journal Entries
```bash
curl -H 'Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID' \
  "https://node:8006/api2/json/nodes/pve1/journal?lastentries=100"
```
