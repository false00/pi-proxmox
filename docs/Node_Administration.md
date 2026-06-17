# Proxmox VE API — Node Administration

This document covers the administrative endpoints available for individual cluster nodes under `/nodes/{node}`. These include hardware management, disk operations, network configuration, system services, and more.

## Hardware & Capabilities
```
GET /nodes/{node}/hardware
```
List hardware components detected on the node (CPU, memory, PCI devices, USB devices).

```
GET /nodes/{node}/capabilities
```
Get node capabilities and supported features (e.g., QEMU/KVM support, storage backends).

## Disk Management
```
GET /nodes/{node}/disks
```
List all physical disks attached to the node.

```
GET /nodes/{node}/disks/list
```
Detailed listing of block devices with size, model, serial, and health status.

### Smartmontools (SMART)
```
GET /nodes/{node}/disks/smart/{disk}
```
Get SMART health data for a specific disk (e.g., `/dev/sda`).

### Disk Initialization
```
POST /nodes/{node}/disks/init
```
Initialize a disk for use with a specific filesystem (ZFS, LVM, BTRFS, ext4, xfs).

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `disk` | string | Device path (e.g., `/dev/sdb`) |
| `filesystem` | string | `zfs`, `ext4`, `xfs`, `btrfs` |
| `uuid` | string | Partition UUID (optional) |

### Directory Storage
```
POST /nodes/{node}/disks/directory
```
Create a directory storage on a mounted filesystem.

### LVM
```
POST /nodes/{node}/disks/lvm
POST /nodes/{node}/disks/lvmthin
```
Create LVM or LVM-thin storage on a disk.

### ZFS
```
POST /nodes/{node}/disks/zfs
```
Create a ZFS pool on a disk.

**Parameters:** `disk` (string, array), `name` (string), `ashift` (integer), `compression` (string), `raidlevel` (string: `single`, `mirror`, `raid10`, `raidz`, `raidz2`, `raidz3`)

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
Create a new network interface (bridge, bond, VLAN, or physical).

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | `bridge`, `bond`, `alias`, `vlan` |
| `iface` | string | Interface name |
| `address` | string | IP address/CIDR |
| `gateway` | string | Gateway address |
| `autostart` | boolean | Start at boot |
| `bridge_ports` | string | For bridge: slave interfaces |
| `bond_mode` | string | For bond: `802.3ad`, `active-backup`, `balance-rr`, `balance-xor`, `broadcast`, `balance-tlb`, `balance-alb` |
| `bond_slaves` | string | For bond: slave interfaces |

```
PUT /nodes/{node}/network/{iface}
```
Update interface configuration.

```
DELETE /nodes/{node}/network/{iface}
```
Remove a virtual interface.

```
PUT /nodes/{node}/network/revert
```
Revert pending network changes.

```
POST /nodes/{node}/network/reload
```
Apply pending network configuration changes.

## Certificates
```
GET /nodes/{node}/certificates
```
List SSL certificates and certificate information for the node.

```
GET /nodes/{node}/certificates/{cert}
```
Get certificate details.

```
POST /nodes/{node}/certificates/{cert}/renew
```
Renew a certificate.

```
GET /nodes/{node}/certificates/info
```
Get certificate information summary.

## System Logs
```
GET /nodes/{node}/journal
```
Read systemd journal entries.

**Parameters:** `start` (timestamp), `end` (timestamp), `since` (string: `-1h`, `-1d`), `service` (string), `limit` (integer)

```
GET /nodes/{node}/syslog
```
Read traditional syslog file.

**Parameters:** `start` (integer), `limit` (integer)

## DNS
```
GET /nodes/{node}/dns
```
View DNS configuration for the node.

```
PUT /nodes/{node}/dns
```
Update DNS servers and search domain.

## Time Synchronization
```
GET /nodes/{node}/time
```
Get current system time and timezone configuration.

```
PUT /nodes/{node}/time
```
Set system time or timezone.

## System Configuration
```
GET /nodes/{node}/config
```
View node configuration file.

```
PUT /nodes/{node}/config
```
Update node configuration parameters.

## APT & Package Management
```
GET /nodes/{node}/apt
```
List available APT repositories and package update counts.

```
GET /nodes/{node}/apt/repositories
```
List configured APT repositories.

```
PUT /nodes/{node}/apt/repositories
```
Update APT repository configuration.

```
GET /nodes/{node}/apt/changelog
```
View package changelog.

```
POST /nodes/{node}/apt/update
```
Refresh APT package index.

## Execute Commands
```
POST /nodes/{node}/execute
```
Execute multiple node-relative Proxmox API requests in order (requires root privileges). This is a batched API endpoint, not arbitrary shell execution.

**Security note:** This endpoint requires high privileges and should be used with caution.

## Subscription
```
GET /nodes/{node}/subscription
```
View subscription status.

```
PUT /nodes/{node}/subscription
```
Set or update subscription key.

```
POST /nodes/{node}/subscription/set
```
Set subscription key.

```
DELETE /nodes/{node}/subscription
```
Remove subscription key.

## Node Stop & Reboot
```
POST /nodes/{node}/stop
```
Stop the node (requires power management or IPMI).

```
POST /nodes/{node}/reboot
```
Reboot the node.

## Wake-on-LAN
```
GET /nodes/{node}/wakeonlan
```
List WOL configuration.

```
POST /nodes/{node}/wakeonlan
```
Send WOL magic packet to wake a node.

## Netstat
```
GET /nodes/{node}/netstat
```
Get network socket statistics from the node.

## SPICE Proxy
```
GET /nodes/{node}/spiceproxy
```
Get SPICE proxy ticket for remote console access.

## Terminal/Console
```
GET /nodes/{node}/term
```
Get VNC terminal proxy configuration.

## Permissions
| Endpoint | Required Permission |
|----------|-------------------|
| Hardware, capabilities | `Sys.Audit` on `/nodes/{node}` |
| Disks, network | `Sys.Modify` on `/nodes/{node}` |
| Certificates, subscription | `Sys.Modify` on `/` |
| Journal, syslog | `Sys.Audit` on `/nodes/{node}` |
| Execute | `Sys.Console` on `/nodes/{node}` |
| Stop, reboot | `Sys.PowerMgmt` on `/nodes/{node}` |

## Common Workflows

### View Disk Health via SMART
```bash
curl -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  https://node:8006/api2/json/nodes/pve1/disks/smart/sda
```

### Create a ZFS Pool
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "disk=/dev/sdb&disk=/dev/sdc&name=tank&raidlevel=mirror&ashift=12" \
  https://node:8006/api2/json/nodes/pve1/disks/zfs
```

### Create a Linux Bridge
```bash
curl -X POST -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  -d "type=bridge&iface=vmbr1&address=192.168.100.1/24&autostart=1&bridge_ports=enp2s0" \
  https://node:8006/api2/json/nodes/pve1/network
```

### Read Recent Journal Entries
```bash
curl -H "Authorization: PVEAPIToken=root@pam!token=UUID" \
  "https://node:8006/api2/json/nodes/pve1/journal?since=-1h&limit=100"
```
